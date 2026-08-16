import { type NextRequest } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRelationshipNetworkMatchingEnabled } from '@/lib/feature-flags'
import {
  buildMatchDecision,
  type RelationshipCandidate,
  type LinkedInExportConnection,
} from '@/lib/enrichment/linkedin-export-matching'

type UploadRow = {
  id: string
}

type ExportConnectionRow = {
  id: string
  full_name: string
  company: string | null
  email: string | null
  profile_url: string | null
  position: string | null
}

type CandidateSeed = {
  id: string
  person_id: string | null
  score: number | null
  rationale: string | null
  metadata: Record<string, unknown> | null
}

type PersonRow = {
  id: string
  full_name: string
  current_title: string | null
  current_company: string | null
  linkedin_url: string | null
  work_email: string | null
}

type MatchRow = {
  id: string
  candidate_id: string
  export_connection_id: string
  match_tier: 'strong_overlap' | 'possible_overlap' | 'rejected'
  user_confirmed: boolean
  user_rejected: boolean
}

export async function GET(request: NextRequest) {
  if (!isRelationshipNetworkMatchingEnabled()) {
    return Response.json({ error: 'Relationship network matching is currently disabled.' }, { status: 403 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const uploadId = searchParams.get('upload_id')

  if (!companyId) {
    return Response.json({ error: 'company_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name, sector')
    .eq('id', companyId)
    .eq('user_id', userId)
    .maybeSingle()

  if (companyError || !company) {
    return Response.json({ error: 'Company not found.' }, { status: 404 })
  }

  let activeUploadId = uploadId
  if (!activeUploadId) {
    const { data: latestUpload } = await supabase
      .from('linkedin_connection_uploads' as never)
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'processed')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    activeUploadId = (latestUpload as unknown as UploadRow | null)?.id ?? null
  }

  if (!activeUploadId) {
    return Response.json({
      company: { id: company.id, name: company.name },
      upload_id: null,
      match_count: 0,
      likely_known: [],
      suggested_matches: [],
      confirmed_relationships: [],
      matches: [],
      message: 'No LinkedIn export upload found. Upload a LinkedIn connections CSV first.',
    })
  }

  const { data: exportConnections, error: exportError } = await supabase
    .from('linkedin_export_connections' as never)
    .select('id, full_name, company, email, profile_url, position')
    .eq('user_id', userId)
    .eq('upload_id', activeUploadId)

  if (exportError) {
    return Response.json({ error: 'Failed to read uploaded connections.' }, { status: 500 })
  }

  const connections = (exportConnections ?? []) as unknown as ExportConnectionRow[]

  const { data: candidateRows } = await supabase
    .from('company_people_candidates' as never)
    .select('id, person_id, metadata')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .in('status', ['suggested', 'saved'])

  const candidates = (candidateRows ?? []) as unknown as CandidateSeed[]

  const personIds = candidates.map((row) => row.person_id).filter((id): id is string => Boolean(id))
  const { data: peopleRows } = personIds.length > 0
    ? await supabase
      .from('people')
      .select('id, full_name, current_title, current_company, linkedin_url, work_email')
      .in('id', personIds)
    : { data: [] as unknown[] }

  const peopleMap = new Map((peopleRows as PersonRow[]).map((person) => [person.id, person]))

  for (const candidate of candidates) {
    const person = candidate.person_id ? peopleMap.get(candidate.person_id) : null
    if (!person) continue

    let bestDecision: ReturnType<typeof buildMatchDecision> | null = null
    let bestConnection: ExportConnectionRow | null = null

    for (const conn of connections) {
      const decision = buildMatchDecision(
        {
          fullName: conn.full_name,
          company: conn.company,
          email: conn.email,
          profileUrl: conn.profile_url,
        } as LinkedInExportConnection,
        {
          fullName: person.full_name,
          company: person.current_company,
          email: person.work_email,
          profileUrl: person.linkedin_url,
        } as RelationshipCandidate,
      )

      if (decision.tier === 'rejected') continue

      const tierRank = { strong_overlap: 2, possible_overlap: 1, rejected: 0 } as const
      if (!bestDecision || tierRank[decision.tier] > tierRank[bestDecision.tier]) {
        bestDecision = decision
        bestConnection = conn
      }
    }

    if (!bestDecision || !bestConnection) continue

    await supabase
      .from('company_people_connection_matches' as never)
      .upsert({
        user_id: userId,
        company_id: companyId,
        candidate_id: candidate.id,
        people_id: person.id,
        export_connection_id: bestConnection.id,
        match_method: bestDecision.method,
        match_tier: bestDecision.tier,
        rule_version: 'v1',
      } as never, { onConflict: 'user_id,company_id,export_connection_id,candidate_id' })
  }

  const { data: matchRows, error: matchesError } = await supabase
    .from('company_people_connection_matches' as never)
    .select('id, candidate_id, export_connection_id, match_tier, user_confirmed, user_rejected')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })

  if (matchesError) {
    return Response.json({ error: 'Failed to build match results.' }, { status: 500 })
  }

  const matches = (matchRows ?? []) as unknown as MatchRow[]

  const connectionMap = new Map(connections.map((conn) => [conn.id, conn]))

  const candidateMap = new Map<string, { id: string; name: string; title: string | null; source: string }>()
  for (const candidate of candidates) {
    const person = candidate.person_id ? peopleMap.get(candidate.person_id) : null
    const titleFromMeta = (candidate.metadata?.suggested_title as string | undefined) ?? null
    candidateMap.set(candidate.id, {
      id: candidate.id,
      name: person?.full_name ?? 'Unknown',
      title: person?.current_title ?? titleFromMeta,
      source: typeof candidate.metadata?.source_provider === 'string' ? candidate.metadata.source_provider : 'candidate',
    })
  }

  const normalized = matches
    .filter((row) => !row.user_rejected)
    .map((row) => {
      const candidate = candidateMap.get(row.candidate_id)
      const connection = connectionMap.get(row.export_connection_id)

      return {
        match_id: row.id,
        candidate_id: row.candidate_id,
        candidate_name: candidate?.name ?? 'Unknown',
        candidate_title: candidate?.title ?? null,
        candidate_source: candidate?.source ?? 'candidate',
        connection_name: connection?.full_name ?? 'Unknown',
        connection_company: connection?.company ?? null,
        connection_email: connection?.email ?? null,
        connection_profile_url: connection?.profile_url ?? null,
        confidence_tier: row.match_tier,
        user_confirmed: row.user_confirmed,
      }
    })

  const likelyKnown = normalized.filter((row) => !row.user_confirmed && row.confidence_tier === 'strong_overlap')
  const confirmed = normalized.filter((row) => row.user_confirmed)
  const suggested = normalized.filter((row) => !row.user_confirmed && row.confidence_tier === 'possible_overlap')

  return Response.json({
    company: { id: company.id, name: company.name },
    upload_id: activeUploadId,
    match_count: normalized.length,
    likely_known: likelyKnown,
    suggested_matches: suggested,
    confirmed_relationships: confirmed,
    matches: normalized,
  })
}

export async function POST(request: NextRequest) {
  if (!isRelationshipNetworkMatchingEnabled()) {
    return Response.json({ error: 'Relationship network matching is currently disabled.' }, { status: 403 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  let body: {
    match_id?: string
    confirm?: boolean
    profile_url_correction?: string
    imported_conn_id?: string
    company_id?: string
    consent_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const supabase = await createClient()

  if (body.match_id) {
    if (body.confirm !== true) {
      return Response.json({ error: 'Explicit confirmation is required to add a relationship.' }, { status: 400 })
    }

    const correctedProfileUrl = body.profile_url_correction?.trim() || null

    const { data: matchRow } = await supabase
      .from('company_people_connection_matches' as never)
      .select('id, company_id, export_connection_id')
      .eq('id', body.match_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!matchRow) {
      return Response.json({ error: 'Match not found.' }, { status: 404 })
    }

    if (correctedProfileUrl) {
      await supabase
        .from('linkedin_export_connections' as never)
        .update({
          profile_url: correctedProfileUrl,
        } as never)
        .eq('id', (matchRow as { export_connection_id: string }).export_connection_id)
        .eq('user_id', userId)
    }

    const { data: connection } = await supabase
      .from('linkedin_export_connections' as never)
      .select('full_name, position, company, email, profile_url')
      .eq('id', (matchRow as { export_connection_id: string }).export_connection_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!connection) {
      return Response.json({ error: 'Connection not found.' }, { status: 404 })
    }

    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        user_id: userId,
        company_id: (matchRow as { company_id: string }).company_id,
        name: (connection as { full_name: string }).full_name,
        title: (connection as { position: string | null }).position,
        firm: (connection as { company: string | null }).company,
        email: (connection as { email: string | null }).email,
        linkedin_url: correctedProfileUrl ?? (connection as { profile_url: string | null }).profile_url,
        channel: 'linkedin',
        status: 'active',
      })
      .select('id')
      .single()

    if (contactError || !contact) {
      Sentry.captureException(contactError ?? new Error('contact insert returned no row'), { extra: { route: 'linkedin-import/match', op: 'confirm-match', userId } })
      return Response.json({ error: 'Failed to create contact.' }, { status: 500 })
    }

    await supabase
      .from('company_people_connection_matches' as never)
      .update({
        user_confirmed: true,
        user_confirmed_at: new Date().toISOString(),
        user_rejected: false,
        user_rejected_at: null,
      } as never)
      .eq('id', body.match_id)
      .eq('user_id', userId)

    return Response.json({ ok: true, contact_id: contact.id })
  }

  // Backward compatible path for legacy linkedin_imported_connections flow.
  const { imported_conn_id, company_id, consent_id } = body
  if (!imported_conn_id || !company_id || !consent_id) {
    return Response.json({ error: 'match_id or legacy imported_conn_id/company_id/consent_id is required.' }, { status: 400 })
  }

  const { data: conn } = await supabase
    .from('linkedin_imported_connections')
    .select('id, full_name, headline, company_name, email, linkedin_url')
    .eq('id', imported_conn_id)
    .eq('user_id', userId)
    .eq('consent_id', consent_id)
    .maybeSingle()

  if (!conn) {
    return Response.json({ error: 'Connection not found.' }, { status: 404 })
  }

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .insert({
      user_id: userId,
      company_id,
      name: conn.full_name,
      title: conn.headline,
      firm: conn.company_name,
      email: conn.email,
      linkedin_url: conn.linkedin_url,
      channel: 'linkedin',
      status: 'active',
    })
    .select('id')
    .single()

  if (contactError || !contact) {
    Sentry.captureException(contactError ?? new Error('contact insert returned no row'), { extra: { route: 'linkedin-import/match', op: 'confirm-legacy', userId } })
    return Response.json({ error: 'Failed to create contact.' }, { status: 500 })
  }

  await supabase
    .from('linkedin_contact_matches')
    .upsert({
      user_id: userId,
      consent_id,
      imported_conn_id,
      company_id,
      contact_id: contact.id,
      match_reason: 'user_promoted',
      confidence: 'high',
      promoted_at: new Date().toISOString(),
    }, { onConflict: 'imported_conn_id,company_id' })

  return Response.json({ ok: true, contact_id: contact.id })
}

export async function PATCH(request: NextRequest) {
  if (!isRelationshipNetworkMatchingEnabled()) {
    return Response.json({ error: 'Relationship network matching is currently disabled.' }, { status: 403 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  let body: {
    match_id?: string
    profile_url_correction?: string
    imported_conn_id?: string
    company_id?: string
    consent_id?: string
  }

  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  const supabase = await createClient()

  if (body.match_id) {
    const correctedProfileUrl = body.profile_url_correction?.trim() || null

    const { data: matchRow } = await supabase
      .from('company_people_connection_matches' as never)
      .select('id, export_connection_id')
      .eq('id', body.match_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (!matchRow) {
      return Response.json({ error: 'Match not found.' }, { status: 404 })
    }

    if (correctedProfileUrl) {
      await supabase
        .from('linkedin_export_connections' as never)
        .update({
          profile_url: correctedProfileUrl,
        } as never)
        .eq('id', (matchRow as { export_connection_id: string }).export_connection_id)
        .eq('user_id', userId)
    }

    await supabase
      .from('company_people_connection_matches' as never)
      .update({
        user_rejected: true,
        user_rejected_at: new Date().toISOString(),
        user_confirmed: false,
        user_confirmed_at: null,
      } as never)
      .eq('id', body.match_id)
      .eq('user_id', userId)

    return Response.json({ ok: true })
  }

  const { imported_conn_id, company_id, consent_id } = body
  if (!imported_conn_id || !company_id || !consent_id) {
    return Response.json({ error: 'match_id or legacy imported_conn_id/company_id/consent_id is required.' }, { status: 400 })
  }

  await supabase
    .from('linkedin_contact_matches')
    .upsert({
      user_id: userId,
      consent_id,
      imported_conn_id,
      company_id,
      match_reason: 'user_dismissed',
      confidence: 'low',
      dismissed_at: new Date().toISOString(),
    }, { onConflict: 'imported_conn_id,company_id' })

  return Response.json({ ok: true })
}
