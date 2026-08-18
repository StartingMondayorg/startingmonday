/**
 * POST /api/linkedin-import/consent
 *
 * Step 1 of the LinkedIn contact import flow.
 * Records explicit user consent, parses the uploaded CSV export,
 * normalizes company names, and stages connections for matching.
 *
 * Request: multipart/form-data
 *   - file: LinkedIn Connections CSV export
 *   - method: 'data_export' | 'portability_api'
 *   - purpose: string (default: 'company_contact_match')
 *
 * Response: { consent_id, connection_count, preview: Connection[] }
 *
 * DELETE /api/linkedin-import/consent?consent_id=<uuid>
 * Revokes consent and deletes all imported data for that session.
 */

import { type NextRequest } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { isRelationshipNetworkMatchingEnabled } from '@/lib/feature-flags'
import { createHash } from 'crypto'
import { parseLinkedInExportCsv } from '@/lib/enrichment/linkedin-export-parser'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

type ParsedConnection = {
  full_name: string
  headline: string | null
  company_name: string | null
  company_name_normalized: string | null
  email: string | null
  connected_on: string | null
  linkedin_url: string | null
  source_row: Record<string, string>
}

function normalizeCompanyName(raw: string | null | undefined): string | null {
  if (!raw) return null
  return raw
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // strip punctuation
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b(inc|llc|ltd|corp|co|plc|gmbh|sa|sas|bv|ag|pty|limited|corporation|incorporated)\b/g, '')
    .trim()
}

function parseLinkedInConnectionsCsv(text: string): ParsedConnection[] {
  return parseLinkedInExportCsv(text).map((row) => ({
    full_name: row.fullName,
    headline: row.position,
    company_name: row.company,
    company_name_normalized: normalizeCompanyName(row.company),
    email: row.email,
    connected_on: row.connectedOn,
    linkedin_url: row.profileUrl,
    source_row: {
      full_name: row.fullName,
      email: row.email ?? '',
      company: row.company ?? '',
      position: row.position ?? '',
      connected_on: row.connectedOn ?? '',
      profile_url: row.profileUrl ?? '',
    },
  }))
}

type HybridUploadRecord = {
  id: string
}

type ConsentRecord = {
  id: string
}

export async function POST(request: NextRequest) {
  if (!isRelationshipNetworkMatchingEnabled()) {
    return Response.json({ error: 'Relationship network matching is currently disabled.' }, { status: 403 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return Response.json({ error: 'Expected multipart/form-data with a CSV file.' }, { status: 400 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return Response.json({ error: 'Could not parse form data.' }, { status: 400 })
  }

  const file = formData.get('file')
  const method = formData.get('method')
  const purpose = (formData.get('purpose') as string | null) ?? 'company_contact_match'

  if (!(file instanceof File)) {
    return Response.json({ error: 'No file uploaded.' }, { status: 400 })
  }
  if (method !== 'data_export' && method !== 'portability_api') {
    return Response.json({ error: 'method must be data_export or portability_api.' }, { status: 400 })
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: 'File too large. Maximum 5 MB.' }, { status: 413 })
  }
  if (!file.name.endsWith('.csv')) {
    return Response.json({ error: 'Only CSV files are accepted.' }, { status: 400 })
  }

  const text = await file.text()
  const connections = parseLinkedInConnectionsCsv(text)
  const hybridRows = parseLinkedInExportCsv(text)

  if (connections.length === 0) {
    return Response.json({
      error: 'No connections found. Make sure you uploaded the Connections.csv from your LinkedIn data export.',
    }, { status: 422 })
  }

  const ip = request.headers.get('x-forwarded-for') ?? request.headers.get('cf-connecting-ip') ?? ''
  const ua = request.headers.get('user-agent') ?? ''
  const ipHash = createHash('sha256').update(ip).digest('hex')
  const uaHash = createHash('sha256').update(ua).digest('hex')
  const fileSha256 = createHash('sha256').update(text).digest('hex')

  const supabase = await createClient()

  // Record consent first so the upload session can be managed and revoked as one unit.
  const { data: consent, error: consentError } = await supabase
    .from('linkedin_import_consents')
    .insert({
      user_id: userId,
      purpose,
      method,
      raw_file_name: file.name,
      connection_count: connections.length,
      ip_hash: ipHash,
      user_agent_hash: uaHash,
    })
    .select('id')
    .single()

  if (consentError || !consent) {
    return Response.json({ error: 'Failed to record consent.' }, { status: 500 })
  }

  const consentId = (consent as ConsentRecord).id

  let hybridUploadId: string | null = null
  if (hybridRows.length > 0) {
    const { data: upload, error: uploadError } = await supabase
      .from('linkedin_connection_uploads' as never)
      .insert({
        user_id: userId,
        consent_id: consentId,
        source: 'linkedin_export_csv',
        source_file_name: file.name,
        source_file_sha256: fileSha256,
        row_count: hybridRows.length,
        status: 'processing',
      } as never)
      .select('id')
      .single()

    if (!uploadError && upload) {
      hybridUploadId = (upload as unknown as HybridUploadRecord).id
    }
  }

  // Audit: consent given
  await supabase.from('linkedin_import_audit_events').insert({
    user_id: userId,
    consent_id: consentId,
    event_type: 'consent_given',
    event_data: { method, purpose, connection_count: connections.length },
  })

  // Batch-insert parsed connections
  const batchSize = 200
  let insertedCount = 0

  await supabase.from('linkedin_import_audit_events').insert({
    user_id: userId,
    consent_id: consentId,
    event_type: 'import_started',
    event_data: { connection_count: connections.length },
  })

  try {
    for (let i = 0; i < connections.length; i += batchSize) {
      const batch = connections.slice(i, i + batchSize).map(c => ({
        user_id: userId,
        consent_id: consentId,
        ...c,
      }))
      const { error: insertError } = await supabase
        .from('linkedin_imported_connections')
        .insert(batch)
      if (insertError) throw insertError
      insertedCount += batch.length
    }

    if (hybridUploadId && hybridRows.length > 0) {
      for (let i = 0; i < hybridRows.length; i += batchSize) {
        const batch = hybridRows.slice(i, i + batchSize).map((row) => ({
          user_id: userId,
          upload_id: hybridUploadId,
          first_name: row.firstName,
          last_name: row.lastName,
          full_name: row.fullName,
          email: row.email,
          company: row.company,
          position: row.position,
          connected_on: row.connectedOn,
          profile_url: row.profileUrl,
          normalized_full_name: row.normalizedFullName,
          normalized_company: row.normalizedCompany || null,
          company_domain: null,
        }))

        const { error: hybridInsertError } = await supabase
          .from('linkedin_export_connections' as never)
          .upsert(batch as never, { onConflict: 'user_id,profile_url' })

        if (hybridInsertError) throw hybridInsertError
      }

      await supabase
        .from('linkedin_connection_uploads' as never)
        .update({
          processed_count: hybridRows.length,
          status: 'processed',
          processed_at: new Date().toISOString(),
        } as never)
        .eq('id', hybridUploadId)
        .eq('user_id', userId)
    }
  } catch {
    if (hybridUploadId) {
      await supabase
        .from('linkedin_connection_uploads' as never)
        .update({
          status: 'failed',
          failure_reason: 'Import batch insert failed',
          processed_at: new Date().toISOString(),
        } as never)
        .eq('id', hybridUploadId)
        .eq('user_id', userId)
    }

    await supabase.from('linkedin_import_audit_events').insert({
      user_id: userId,
      consent_id: consentId,
      event_type: 'import_failed',
      event_data: { inserted_so_far: insertedCount },
    })
    return Response.json({ error: 'Failed to store connections. Please try again.' }, { status: 500 })
  }

  await supabase.from('linkedin_import_audit_events').insert({
    user_id: userId,
    consent_id: consentId,
    event_type: 'import_completed',
    event_data: { connection_count: insertedCount },
  })

  // Return a safe preview (first 5, no PII in response beyond what user uploaded)
  const preview = connections.slice(0, 5).map(c => ({
    full_name: c.full_name,
    headline: c.headline,
    company_name: c.company_name,
  }))

  return Response.json({
    consent_id: consentId,
    upload_id: hybridUploadId,
    connection_count: insertedCount,
    preview,
  })
}

export async function DELETE(request: NextRequest) {
  if (!isRelationshipNetworkMatchingEnabled()) {
    return Response.json({ error: 'Relationship network matching is currently disabled.' }, { status: 403 })
  }

  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const { searchParams } = new URL(request.url)
  const consentId = searchParams.get('consent_id')
  const uploadId = searchParams.get('upload_id')

  if (!consentId && !uploadId) {
    return Response.json({ error: 'consent_id or upload_id is required.' }, { status: 400 })
  }

  const supabase = await createClient()

  if (uploadId && !consentId) {
    const { error: uploadDeleteError } = await supabase
      .from('linkedin_connection_uploads' as never)
      .delete()
      .eq('id', uploadId)
      .eq('user_id', userId)

    if (uploadDeleteError) {
      return Response.json({ error: 'Upload record not found.' }, { status: 404 })
    }

    return Response.json({ ok: true, deleted: 'upload_only' })
  }

  if (!consentId) {
    return Response.json({ error: 'consent_id is required for this operation.' }, { status: 400 })
  }

  // Verify ownership before deletion
  const { data: consent, error: fetchError } = await supabase
    .from('linkedin_import_consents')
    .select('id, revoked_at')
    .eq('id', consentId)
    .eq('user_id', userId)
    .maybeSingle()

  if (fetchError || !consent) {
    return Response.json({ error: 'Consent record not found.' }, { status: 404 })
  }

  // Delete staged data (cascades via FK on consent_id)
  await supabase
    .from('linkedin_imported_connections')
    .delete()
    .eq('consent_id', consentId)
    .eq('user_id', userId)

  await supabase
    .from('linkedin_connection_uploads' as never)
    .delete()
    .eq('consent_id', consentId)
    .eq('user_id', userId)

  // Mark consent as revoked and data deleted
  await supabase
    .from('linkedin_import_consents')
    .update({ revoked_at: new Date().toISOString(), data_deleted_at: new Date().toISOString() })
    .eq('id', consentId)
    .eq('user_id', userId)

  await supabase.from('linkedin_import_audit_events').insert([
    {
      user_id: userId,
      consent_id: consentId,
      event_type: 'consent_revoked',
      event_data: {},
    },
    {
      user_id: userId,
      consent_id: consentId,
      event_type: 'data_deleted',
      event_data: { scope: 'imported_connections_and_matches' },
    },
  ])

  return Response.json({ ok: true })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
