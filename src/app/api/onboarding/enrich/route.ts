import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getEnrichmentProvider } from '@/lib/enrichment'
import { logEvent } from '@/lib/events'

type CompanyRow = { id: string; name: string }
type ContactRow = { company_id: string | null; name: string; enrichment_source?: string | null }

const MAX_COMPANIES = 8

function parseCompanyNames(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const names: string[] = []
  for (const entry of value) {
    if (typeof entry !== 'string') continue
    const name = entry.trim()
    if (!name || name.length > 120) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
    if (names.length >= MAX_COMPANIES) break
  }
  return names
}

function dedupeKey(companyId: string, name: string) {
  return `${companyId}::${name.trim().toLowerCase()}`
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = (await request.json().catch(() => ({}))) as { companyNames?: unknown }
  const requestedNames = parseCompanyNames(body.companyNames)

  if (requestedNames.length > 0) {
    const companyRows = requestedNames.map((name) => ({
      user_id: user.id,
      name,
      stage: 'target',
    }))

    const { error: upsertError } = await supabase
      .from('companies')
      .upsert(companyRows, { onConflict: 'user_id,name', ignoreDuplicates: true })

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to save companies for enrichment' }, { status: 500 })
    }
  }

  let companiesQuery = supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user.id)
    .is('archived_at', null)

  if (requestedNames.length > 0) {
    companiesQuery = companiesQuery.in('name', requestedNames)
  }

  const { data: companies, error: companiesError } = await companiesQuery
    .order('created_at', { ascending: true })
    .limit(25)
  if (companiesError) {
    return NextResponse.json({ error: 'Failed to load companies' }, { status: 500 })
  }

  const targetCompanies = (companies ?? []).slice(0, MAX_COMPANIES) as CompanyRow[]
  if (targetCompanies.length === 0) {
    return NextResponse.json({ error: 'No companies available for enrichment' }, { status: 400 })
  }

  const companyIds = targetCompanies.map((company) => company.id)
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('company_id, name, enrichment_source' as never)
    .eq('user_id', user.id)
    .in('company_id', companyIds)

  const existingKeys = new Set<string>()
  const existingRows = (existingContacts ?? []) as unknown as ContactRow[]
  for (const contact of existingRows) {
    if (!contact.company_id || !contact.name) continue
    existingKeys.add(dedupeKey(contact.company_id, contact.name))
  }

  const provider = getEnrichmentProvider()
  const rowsToInsert: Array<{
    user_id: string
    company_id: string
    name: string
    title: string
    firm: string
    status: string
    notes: string
    enrichment_source: string
    enrichment_confidence: number
  }> = []

  for (const company of targetCompanies) {
    const suggestions = await provider.enrichPeople({
      companyName: company.name,
      sector: 'Technology',
      persona: 'executive',
    })

    for (const suggestion of suggestions) {
      const key = dedupeKey(company.id, suggestion.name)
      if (existingKeys.has(key)) continue
      existingKeys.add(key)
      rowsToInsert.push({
        user_id: user.id,
        company_id: company.id,
        name: suggestion.name,
        title: suggestion.title,
        firm: company.name,
        status: 'active',
        notes: suggestion.reason,
        enrichment_source: suggestion.source,
        enrichment_confidence: suggestion.confidence,
      })
    }
  }

  if (rowsToInsert.length > 0) {
    const { error: insertError } = await supabase.from('contacts').insert(rowsToInsert)
    if (insertError) {
      return NextResponse.json({ error: 'Failed to save enriched contacts' }, { status: 500 })
    }
  }

  await logEvent(user.id, 'onboarding_step_completed', {
    action_context: 'onboarding_relationship_enrichment_started',
    companies_scanned: targetCompanies.length,
    contacts_inserted: rowsToInsert.length,
    enrichment_provider: provider.providerName,
  })

  return NextResponse.json(
    {
      ok: true,
      companiesScanned: targetCompanies.length,
      contactsInserted: rowsToInsert.length,
      provider: provider.providerName,
    },
    { status: 202 }
  )
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', user.id)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .limit(25)
  if (companiesError) {
    return NextResponse.json({ error: 'Failed to load companies' }, { status: 500 })
  }

  const rows = (companies ?? []) as CompanyRow[]
  const companyIds = rows.map((company) => company.id)
  const countsByCompany = new Map<string, { total: number; enriched: number }>()

  if (companyIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('company_id, name, enrichment_source' as never)
      .eq('user_id', user.id)
      .in('company_id', companyIds)

    const contactRows = (contacts ?? []) as unknown as ContactRow[]
    for (const contact of contactRows) {
      if (!contact.company_id) continue
      const current = countsByCompany.get(contact.company_id) ?? { total: 0, enriched: 0 }
      current.total += 1
      if (contact.enrichment_source === 'anthropic' || contact.enrichment_source === 'fallback') {
        current.enriched += 1
      }
      countsByCompany.set(contact.company_id, current)
    }
  }

  const companiesWithCounts = rows.map((company) => {
    const counts = countsByCompany.get(company.id) ?? { total: 0, enriched: 0 }
    return {
      companyId: company.id,
      name: company.name,
      contacts: counts.total,
      enrichedContacts: counts.enriched,
      status: counts.enriched > 0 ? 'complete' : 'scanning',
    }
  })

  const totalContacts = companiesWithCounts.reduce((sum, company) => sum + company.contacts, 0)
  const totalEnriched = companiesWithCounts.reduce((sum, company) => sum + company.enrichedContacts, 0)
  const completed = companiesWithCounts.filter((company) => company.status === 'complete').length

  return NextResponse.json({
    ok: true,
    companies: companiesWithCounts,
    progress: {
      total: companiesWithCounts.length,
      completed,
      done: completed > 0 || totalContacts > 0,
      totalContacts,
      totalEnriched,
    },
  })
}
