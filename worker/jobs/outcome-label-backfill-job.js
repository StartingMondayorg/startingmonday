// Outcome-label backfill (T2.2, T2.3, T2.4). Daily, batch-capped:
// 1. exec_hire retro-labeler — appointment events prove a search concluded;
//    back-label the prior 180 days (captures never-posted retained searches).
// 2. user_pipeline labeler — companies in applied/interviewing/offer stages
//    prove a live search existed. Confidential ground truth: always
//    exclude_from_public_stats. Stage-change time is approximated by
//    companies.updated_at (no stage-transition timestamp exists).
// 3. proxy_diff labeler — DEF 14A officer-table diffs surface appointments
//    with the search window approximated by the filing date.

import { logger } from '../lib/logger.js'
import { getSupabase } from '../lib/supabase.js'
import { resolveCanonicalCompany, clearCanonicalCache } from '../lib/canonical-company.js'
import {
  recordRoleOpening,
  reconcileExistingOpeningLabels,
  inferRoleFamilyFromTitle,
  roleFamilyForRoleType,
  isLeadershipTitle,
} from '../lib/outcome-labels.js'
import { getOfficerAppointments } from '../signals/fetch-sec-officers.js'
import { getJobCheckpoint, saveJobCheckpoint } from '../lib/job-checkpoint.js'

const OUTCOME_BACKFILL_LOCK_KEY = 6472913850n
const EXEC_HIRE_BATCH = Number(process.env.OUTCOME_EXEC_HIRE_BATCH ?? 200)
const PIPELINE_BATCH = Number(process.env.OUTCOME_PIPELINE_BATCH ?? 200)
const PROXY_DIFF_BATCH = Number(process.env.OUTCOME_PROXY_DIFF_BATCH ?? 50)
const CAREER_SCAN_PAGE_SIZE = Number(process.env.OUTCOME_CAREER_SCAN_PAGE_SIZE ?? 1000)
const RECONCILE_OPENING_BATCH = Number(process.env.OUTCOME_RECONCILE_OPENING_BATCH ?? 1000)
const CAREER_SCAN_CHECKPOINT = 'outcome-career-scan-backfill'

export async function runOutcomeLabelBackfillJob() {
  const supabase = getSupabase()

  const { data: locked } = await supabase.rpc('try_advisory_lock', { p_key: OUTCOME_BACKFILL_LOCK_KEY })
  if (!locked) {
    logger.warn('outcome-label-backfill-job: another instance running — skipping')
    return
  }

  clearCanonicalCache()
  const totals = { execHire: 0, pipeline: 0, proxy: 0, careerScan: 0, reconciledOpenings: 0, labeledEvents: 0 }

  try {
    const reconciled = await reconcileExistingOpeningLabels(supabase, { limit: RECONCILE_OPENING_BATCH })
    totals.reconciledOpenings = reconciled.openingsChecked
    totals.labeledEvents += reconciled.labeledEvents
    await backfillExecHires(supabase, totals)
    await backfillPipelineStages(supabase, totals)
    await backfillProxyDiffs(supabase, totals)
    await backfillCareerScans(supabase, totals)
    logger.info('outcome-label-backfill-job: complete', totals)
  } finally {
    await supabase.rpc('advisory_unlock', { p_key: OUTCOME_BACKFILL_LOCK_KEY })
  }
}

// T2.1 retro — historical scan matches were never labeled: the live labeler
// only fires on hits flagged is_new at scan time. Back-label every leadership
// match found in scan_results, using the same source_ref format as the live
// labeler (`${companyId}:${title.toLowerCase()}`) so the two paths dedup.
export async function fetchAllSuccessfulCareerScans(supabase, { afterScannedAt = null } = {}) {
  const scans = []
  for (let from = 0; ; from += CAREER_SCAN_PAGE_SIZE) {
    let query = supabase
      .from('scan_results')
      .select('company_id, scanned_at, raw_hits')
      .eq('status', 'success')
      .order('scanned_at', { ascending: true })

    if (afterScannedAt) query = query.gte('scanned_at', afterScannedAt)
    const { data, error } = await query.range(from, from + CAREER_SCAN_PAGE_SIZE - 1)

    if (error) {
      throw new Error(error.message)
    }

    const page = data ?? []
    scans.push(...page)
    if (page.length < CAREER_SCAN_PAGE_SIZE) break
  }
  return scans
}

async function backfillCareerScans(supabase, totals) {
  let scans
  let afterScannedAt = null
  let nextScannedAt = null
  try {
    const checkpoint = await getJobCheckpoint(supabase, CAREER_SCAN_CHECKPOINT)
    afterScannedAt = checkpoint?.context?.baselineCompleted
      ? checkpoint?.cursor?.lastScannedAt ?? null
      : null
    scans = await fetchAllSuccessfulCareerScans(supabase, { afterScannedAt })
    nextScannedAt = scans.at(-1)?.scanned_at ?? afterScannedAt ?? new Date().toISOString()
  } catch (error) {
    logger.warn('outcome-label-backfill-job: career_scan fetch failed', { error: error.message })
    return
  }

  // Earliest scan date per unique (company, title) leadership match.
  const earliestByPair = new Map()
  for (const scan of scans) {
    const hits = Array.isArray(scan.raw_hits) ? scan.raw_hits : []
    for (const hit of hits) {
      if (!hit?.is_match || !hit?.title) continue
      if (!isLeadershipTitle(hit.title)) continue
      const sourceRef = `${scan.company_id}:${hit.title.toLowerCase()}`
      if (!earliestByPair.has(sourceRef)) {
        earliestByPair.set(sourceRef, {
          companyId: scan.company_id,
          title: hit.title,
          scannedAt: scan.scanned_at,
        })
      }
    }
  }
  if (earliestByPair.size === 0) {
    await saveJobCheckpoint(supabase, CAREER_SCAN_CHECKPOINT, {
      cursor: { lastScannedAt: nextScannedAt },
      context: { baselineCompleted: true },
    })
    return
  }

  const companyIds = [...new Set([...earliestByPair.values()].map(p => p.companyId))]
  const { data: companies, error: companiesError } = await supabase
    .from('companies')
    .select('id, name, company_url, sector, sec_cik_padded, canonical_company_id')
    .in('id', companyIds)
  if (companiesError) {
    logger.warn('outcome-label-backfill-job: career_scan companies fetch failed', { error: companiesError.message })
    return
  }
  const companyById = new Map((companies ?? []).map(c => [c.id, c]))
  let retryRequired = false

  for (const [sourceRef, pair] of earliestByPair) {
    const company = companyById.get(pair.companyId)
    if (!company) continue

    const { data: existing } = await supabase
      .from('role_openings')
      .select('id')
      .eq('label_source', 'career_scan')
      .eq('source_ref', sourceRef)
      .limit(1)
      .maybeSingle()
    if (existing) continue

    const canonicalCompanyId = await resolveCanonicalCompany(supabase, company)
    if (!canonicalCompanyId) {
      retryRequired = true
      continue
    }

    const result = await recordRoleOpening(supabase, {
      canonicalCompanyId,
      roleFamily: inferRoleFamilyFromTitle(pair.title),
      roleTitle: pair.title,
      openedOn: (pair.scannedAt ?? new Date().toISOString()).slice(0, 10),
      labelSource: 'career_scan',
      sourceRef,
    })
    if (result.openingId && !result.existing) {
      totals.careerScan++
      totals.labeledEvents += result.labeledEvents
    } else if (!result.openingId) {
      retryRequired = true
    }
  }

  if (!retryRequired) {
    await saveJobCheckpoint(supabase, CAREER_SCAN_CHECKPOINT, {
      cursor: { lastScannedAt: nextScannedAt },
      context: { baselineCompleted: true },
    })
  }
}

// T2.2 — exec_hire events are retroactive proof a role was open.
async function backfillExecHires(supabase, totals) {
  const { data: events, error } = await supabase
    .from('company_events')
    .select('id, canonical_company_id, event_date, summary')
    .eq('event_type', 'exec_hire')
    .order('event_date', { ascending: false })
    .limit(EXEC_HIRE_BATCH)

  if (error) {
    logger.warn('outcome-label-backfill-job: exec_hire fetch failed', { error: error.message })
    return
  }

  for (const event of events ?? []) {
    const { data: existing } = await supabase
      .from('role_openings')
      .select('id')
      .eq('label_source', 'exec_hire')
      .eq('source_ref', event.id)
      .limit(1)
      .maybeSingle()
    if (existing) continue

    const result = await recordRoleOpening(supabase, {
      canonicalCompanyId: event.canonical_company_id,
      roleFamily: inferRoleFamilyFromTitle(event.summary),
      roleTitle: null,
      openedOn: event.event_date,
      labelSource: 'exec_hire',
      sourceRef: event.id,
      excludeEventId: event.id,
    })
    if (result.openingId && !result.existing) {
      totals.execHire++
      totals.labeledEvents += result.labeledEvents
    }
  }
}

// T2.3 — active pipeline stages are confidential-search ground truth.
async function backfillPipelineStages(supabase, totals) {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, user_id, name, company_url, sector, stage, updated_at, canonical_company_id')
    .in('stage', ['applied', 'interviewing', 'offer'])
    .is('archived_at', null)
    .order('updated_at', { ascending: false })
    .limit(PIPELINE_BATCH)

  if (error) {
    logger.warn('outcome-label-backfill-job: pipeline fetch failed', { error: error.message })
    return
  }
  if (!companies?.length) return

  const userIds = [...new Set(companies.map(c => c.user_id))]
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, role_type')
    .in('user_id', userIds)
  const roleTypeByUser = new Map((profiles ?? []).map(p => [p.user_id, p.role_type]))

  for (const company of companies) {
    const sourceRef = `${company.id}:${company.stage}`
    const { data: existing } = await supabase
      .from('role_openings')
      .select('id')
      .eq('label_source', 'user_pipeline')
      .eq('source_ref', sourceRef)
      .limit(1)
      .maybeSingle()
    if (existing) continue

    const canonicalCompanyId = await resolveCanonicalCompany(supabase, company)
    if (!canonicalCompanyId) continue

    const result = await recordRoleOpening(supabase, {
      canonicalCompanyId,
      roleFamily: roleFamilyForRoleType(roleTypeByUser.get(company.user_id)),
      roleTitle: null,
      // Approximation: no stage-transition timestamp exists; updated_at is
      // the best available bound on when the stage became active.
      openedOn: (company.updated_at ?? new Date().toISOString()).slice(0, 10),
      labelSource: 'user_pipeline',
      sourceRef,
      excludeFromPublicStats: true,
    })
    if (result.openingId && !result.existing) {
      totals.pipeline++
      totals.labeledEvents += result.labeledEvents
    }
  }
}

// T2.4 — DEF 14A officer-table diffs surface appointments.
async function backfillProxyDiffs(supabase, totals) {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, company_url, sector, sec_cik_padded, canonical_company_id')
    .not('sec_cik_padded', 'is', null)
    .is('archived_at', null)
    .limit(500)

  if (error) {
    logger.warn('outcome-label-backfill-job: proxy candidates fetch failed', { error: error.message })
    return
  }

  // One representative company per CIK; skip CIKs already diffed (two snapshots present).
  const byCik = new Map()
  for (const company of companies ?? []) {
    if (!byCik.has(company.sec_cik_padded)) byCik.set(company.sec_cik_padded, company)
  }

  let processed = 0
  for (const [cikPadded, company] of byCik) {
    if (processed >= PROXY_DIFF_BATCH) break

    const { count } = await supabase
      .from('officer_snapshots')
      .select('id', { count: 'exact', head: true })
      .eq('sec_cik_padded', cikPadded)
    if ((count ?? 0) >= 2) continue // already snapshotted and diffed

    processed++
    const { appointments, filingDate } = await getOfficerAppointments(supabase, {
      cikPadded,
      companyName: company.name,
    })
    if (!appointments.length || !filingDate) continue

    const canonicalCompanyId = await resolveCanonicalCompany(supabase, company)
    if (!canonicalCompanyId) continue

    for (const appointment of appointments) {
      const result = await recordRoleOpening(supabase, {
        canonicalCompanyId,
        roleFamily: inferRoleFamilyFromTitle(appointment.title),
        roleTitle: appointment.title,
        openedOn: filingDate,
        labelSource: 'proxy_diff',
        sourceRef: `${cikPadded}:${appointment.name}`,
      })
      if (result.openingId && !result.existing) {
        totals.proxy++
        totals.labeledEvents += result.labeledEvents
      }
    }
  }
}
