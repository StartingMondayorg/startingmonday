// T3.4 — ATS poller: polls ATS JSON boards (the PROBE_PROVIDERS set in
// worker/signals/fetch-ats-json.js, kept in parity with the scanner's
// adapters) for leadership postings.
// Board discovery is cached in ats_boards: companies are probed at
// most MAX_PROBE_ATTEMPTS times (URL detection first, then token probing),
// after which known boards are polled directly every run. Companies without a
// career_page_url are still covered via domain/name token probing.
//
// Coverage comes from two pools:
// 1. User watchlists (companies table) — probed first, they matter most.
// 2. The reference_companies base set (1,791 Crunchbase-ranked companies,
//    most prominent first) — fills the remaining probe budget each run, so
//    label volume grows independently of user activity.

import { logger } from '../lib/logger.js'
import { getSupabase } from '../lib/supabase.js'
import { resolveCanonicalCompany, clearCanonicalCache, extractDomain } from '../lib/canonical-company.js'
import { probeAtsBoard, fetchBoardOpenings, PROBE_PROVIDERS, providerSetMissing } from '../signals/fetch-ats-json.js'
import { inferRoleFamilyFromTitle, recordRoleOpening } from '../lib/outcome-labels.js'

const ATS_POLLER_LOCK_KEY = 9315702442n
const ATS_COMPANY_BATCH = Number(process.env.ATS_POLLER_COMPANY_BATCH ?? 300)
const ATS_PROBE_BUDGET = Number(process.env.ATS_POLLER_PROBE_BUDGET ?? 40)
const MAX_PROBE_ATTEMPTS = Number(process.env.ATS_POLLER_MAX_PROBE_ATTEMPTS ?? 2)
const ATS_REFERENCE_BATCH = Number(process.env.ATS_POLLER_REFERENCE_BATCH ?? 400)

export async function runAtsPollerJob() {
  const supabase = getSupabase()

  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: ATS_POLLER_LOCK_KEY })
  if (!locked) {
    logger.warn('ats-poller-job: another instance running — skipping')
    return
  }

  clearCanonicalCache()

  const stats = {
    companies: 0,
    referenceCompanies: 0,
    probed: 0,
    reprobedAfterWidening: 0,
    boardsDetected: 0,
    boardsPolled: 0,
    openingsSeen: 0,
    openingsUpserted: 0,
    openingsClosed: 0,
    roleLabels: 0,
  }

  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('id, name, user_id, company_url, sector, is_public_company, sec_cik_padded, canonical_company_id, career_page_url')
      .is('archived_at', null)
      .limit(ATS_COMPANY_BATCH)

    if (error) {
      logger.error('ats-poller-job: failed to fetch companies', { error: error.message })
      return
    }

    stats.companies = companies?.length ?? 0

    // Deduplicate to one representative per canonical company.
    // User companies first — they take probe-budget priority.
    const byCanonical = new Map()
    for (const company of companies ?? []) {
      const canonicalCompanyId = await resolveCanonicalCompany(supabase, company)
      if (!canonicalCompanyId) continue
      if (!byCanonical.has(canonicalCompanyId)) byCanonical.set(canonicalCompanyId, company)
    }

    // Base-set expansion: reference_companies (most prominent first) fill the
    // remaining probe budget so coverage grows without user activity.
    const { data: referenceCompanies, error: refError } = await supabase
      .from('reference_companies')
      .select('id, name, industries')
      .order('cb_rank', { ascending: true })
      .limit(ATS_REFERENCE_BATCH)
    if (refError) {
      logger.warn('ats-poller-job: reference companies fetch failed', { error: refError.message })
    }
    for (const ref of referenceCompanies ?? []) {
      const pseudoCompany = {
        id: ref.id,
        name: ref.name,
        company_url: null,
        sector: Array.isArray(ref.industries) ? (ref.industries[0] ?? null) : null,
      }
      const canonicalCompanyId = await resolveCanonicalCompany(supabase, pseudoCompany)
      if (!canonicalCompanyId) continue
      if (!byCanonical.has(canonicalCompanyId)) {
        byCanonical.set(canonicalCompanyId, pseudoCompany)
        stats.referenceCompanies++
      }
    }

    let probesUsed = 0
    for (const [canonicalCompanyId, company] of byCanonical) {
      const board = await getOrDetectBoard(supabase, canonicalCompanyId, company, stats, () => {
        if (probesUsed >= ATS_PROBE_BUDGET) return false
        probesUsed++
        return true
      })
      if (!board) continue

      await pollBoard(supabase, canonicalCompanyId, board, stats)
    }

    logger.info('ats-poller-job: complete', stats)
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: ATS_POLLER_LOCK_KEY })
  }
}

// Returns { provider, token } for a known active board, probing (budget
// permitting) when the company has not been resolved yet. Null when no board.
async function getOrDetectBoard(supabase, canonicalCompanyId, company, stats, takeProbeSlot) {
  const { data: existing } = await supabase
    .from('ats_boards')
    .select('id, provider, board_token, status, probe_attempts, probed_providers')
    .eq('canonical_company_id', canonicalCompanyId)
    .maybeSingle()

  if (existing?.status === 'active' && existing.provider && existing.board_token) {
    return { provider: existing.provider, token: existing.board_token }
  }

  // SMK-486: a not_found decided against a narrower provider set than the
  // prober now searches gets exactly one re-probe. The upsert below records
  // the current set, so the row cannot qualify again until the set widens.
  const staleProviderSet = existing?.status === 'not_found'
    && providerSetMissing(existing.probed_providers)

  if (existing && existing.probe_attempts >= MAX_PROBE_ATTEMPTS && !staleProviderSet) return null
  if (!takeProbeSlot()) return null

  stats.probed++
  if (staleProviderSet && existing.probe_attempts >= MAX_PROBE_ATTEMPTS) stats.reprobedAfterWidening++
  const detected = await probeAtsBoard({
    name: company.name,
    domain: extractDomain(company.company_url),
    careerPageUrl: company.career_page_url,
  })

  const now = new Date().toISOString()
  const row = {
    canonical_company_id: canonicalCompanyId,
    provider: detected?.provider ?? null,
    board_token: detected?.token ?? null,
    status: detected ? 'active' : 'not_found',
    detected_via: detected?.via ?? null,
    // The provider set this probe searched. For a not_found row this is the
    // set the decision was made against; a future provider-list widening
    // re-probes exactly the rows whose recorded set is narrower. SMK-486.
    probed_providers: PROBE_PROVIDERS,
    probe_attempts: (existing?.probe_attempts ?? 0) + 1,
    last_probed_at: now,
    updated_at: now,
  }
  const { error: upsertError } = await supabase
    .from('ats_boards')
    .upsert(row, { onConflict: 'canonical_company_id' })
  if (upsertError) {
    logger.warn('ats-poller-job: board upsert failed', { canonicalCompanyId, error: upsertError.message })
  }

  if (!detected) return null
  stats.boardsDetected++
  logger.info('ats-poller-job: board detected', {
    canonicalCompanyId,
    companyName: company.name,
    provider: detected.provider,
    token: detected.token,
    via: detected.via,
  })
  return { provider: detected.provider, token: detected.token }
}

// Polls one board: upserts leadership postings, labels openings, closes
// postings that disappeared from the feed.
async function pollBoard(supabase, canonicalCompanyId, board, stats) {
  const openings = await fetchBoardOpenings(board.provider, board.token)
  stats.boardsPolled++
  stats.openingsSeen += openings.length

  const activeUrls = new Set()
  for (const opening of openings) {
    const openedOn = opening.opened_on ?? new Date().toISOString().slice(0, 10)
    activeUrls.add(opening.role_url)

    const { error: upsertError } = await supabase
      .from('ats_role_openings')
      .upsert(
        {
          canonical_company_id: canonicalCompanyId,
          source_platform: board.provider,
          role_title: opening.role_title,
          role_family: inferRoleFamilyFromTitle(opening.role_title),
          role_url: opening.role_url,
          opened_on: openedOn,
          is_open: true,
          closed_on: null,
          raw_payload: opening.raw ?? {},
          fetched_at: new Date().toISOString(),
        },
        { onConflict: 'canonical_company_id,source_platform,role_url' },
      )

    if (!upsertError) stats.openingsUpserted += 1

    const label = await recordRoleOpening(supabase, {
      canonicalCompanyId,
      roleFamily: inferRoleFamilyFromTitle(opening.role_title),
      roleTitle: opening.role_title,
      openedOn,
      labelSource: 'ats_json',
      sourceRef: `${board.provider}:${opening.role_url}`,
    })
    if (label.openingId && !label.existing) stats.roleLabels += 1
  }

  const { data: currentlyOpen } = await supabase
    .from('ats_role_openings')
    .select('id, role_url')
    .eq('canonical_company_id', canonicalCompanyId)
    .eq('source_platform', board.provider)
    .eq('is_open', true)

  for (const row of currentlyOpen ?? []) {
    if (activeUrls.has(row.role_url)) continue
    const { error: closeError } = await supabase
      .from('ats_role_openings')
      .update({ is_open: false, closed_on: new Date().toISOString().slice(0, 10), fetched_at: new Date().toISOString() })
      .eq('id', row.id)
    if (!closeError) stats.openingsClosed += 1
  }

  await supabase
    .from('ats_boards')
    .update({ last_polled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('canonical_company_id', canonicalCompanyId)
}
