import crypto from 'node:crypto'
import { logger } from './logger.js'
import {
  MATCHING_DIMENSION_VERSION,
  MATCHING_POLICY_VERSION,
  buildCanonicalDimensionUpdates,
  selectControlCandidates,
} from './backtest-matching-dimensions.js'

const COHORT_WINDOW_DAYS = Number(process.env.BACKTEST_WINDOW_DAYS ?? 180)
const OPENING_TARGET = Number(process.env.BACKTEST_OPENING_TARGET ?? 300)
const OPENING_SCAN_LIMIT = Number(process.env.BACKTEST_OPENING_SCAN_LIMIT ?? 1000)
const CONTROLS_PER_COHORT = Number(process.env.BACKTEST_CONTROLS_PER_COHORT ?? 3)
const CONTROL_LOOKAROUND_DAYS = Number(process.env.BACKTEST_CONTROL_LOOKAROUND_DAYS ?? 90)
const HTTP_TIMEOUT_MS = Number(process.env.BACKTEST_HTTP_TIMEOUT_MS ?? 10000)
const COHORT_VERSION_PREFIX = process.env.BACKTEST_COHORT_VERSION ?? 'v2'

function isoDateOffset(dateStr, days) {
  const date = new Date(`${dateStr}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function toYmdCompact(dateStr) {
  return dateStr.replace(/-/g, '')
}

function withTimeout(ms = HTTP_TIMEOUT_MS) {
  return AbortSignal.timeout(ms)
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { signal: withTimeout() })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

async function fetchWaybackSnapshotCount(domain, startDate, endDate) {
  if (!domain) return 0
  const from = toYmdCompact(startDate)
  const to = toYmdCompact(endDate)
  const url = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(domain)}/*&from=${from}&to=${to}&output=json&fl=timestamp&filter=statuscode:200&limit=2000`
  const rows = await fetchJson(url)
  if (!Array.isArray(rows)) return 0
  return Math.max(0, rows.length - 1)
}

async function fetchGdeltEventCount(companyName, startDate, endDate) {
  if (!companyName) return 0
  const start = `${toYmdCompact(startDate)}000000`
  const end = `${toYmdCompact(endDate)}235959`
  const query = encodeURIComponent(`"${companyName}"`)
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=ArtList&maxrecords=250&format=json&startdatetime=${start}&enddatetime=${end}`
  const payload = await fetchJson(url)
  if (!payload || !Array.isArray(payload.articles)) return 0
  return payload.articles.length
}

async function findCandidatesWithNearbyOpenings(supabase, candidateIds, centerDate) {
  if (candidateIds.length === 0) return null

  const { data, error } = await supabase
    .from('role_openings')
    .select('canonical_company_id')
    .in('canonical_company_id', candidateIds)
    .gte('opened_on', isoDateOffset(centerDate, -CONTROL_LOOKAROUND_DAYS))
    .lte('opened_on', isoDateOffset(centerDate, CONTROL_LOOKAROUND_DAYS))
    .limit(5000)

  if (error) return null
  return new Set((data ?? []).map((row) => row.canonical_company_id))
}

async function fetchAllRows(supabase, table, columns, configure = (query) => query) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    const { data, error } = await configure(supabase.from(table).select(columns))
      .range(from, from + 999)
    if (error) throw new Error(`${table}: ${error.message}`)
    const page = data ?? []
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

export async function reconcileCanonicalMatchingDimensions(supabase) {
  const [canonicalCompanies, linkedCompanies] = await Promise.all([
    fetchAllRows(
      supabase,
      'canonical_companies',
      'id, sector, broad_sector_slug, size_band, matching_dimension_version',
    ),
    fetchAllRows(
      supabase,
      'companies',
      'canonical_company_id, sector, company_size',
      (query) => query.not('canonical_company_id', 'is', null),
    ),
  ])
  const currentById = new Map(canonicalCompanies.map((company) => [company.id, company]))
  const updates = buildCanonicalDimensionUpdates(canonicalCompanies, linkedCompanies)
  let updated = 0

  for (const update of updates) {
    const current = currentById.get(update.id)
    if (
      current?.broad_sector_slug === update.broad_sector_slug
      && current?.size_band === update.size_band
      && current?.matching_dimension_version === MATCHING_DIMENSION_VERSION
    ) continue

    const { error } = await supabase
      .from('canonical_companies')
      .update({
        broad_sector_slug: update.broad_sector_slug,
        size_band: update.size_band,
        matching_dimension_version: MATCHING_DIMENSION_VERSION,
        updated_at: new Date().toISOString(),
      })
      .eq('id', update.id)
    if (error) throw new Error(`canonical dimension update failed: ${error.message}`)
    updated += 1
  }

  return {
    canonicalCompanies: canonicalCompanies.length,
    updated,
    withBroadSector: updates.filter((row) => row.broad_sector_slug).length,
    withSizeBand: updates.filter((row) => row.size_band).length,
    withBoth: updates.filter((row) => row.broad_sector_slug && row.size_band).length,
  }
}

export async function findControlCandidates(supabase, cohort, excludedIds = new Set()) {
  if (!cohort.broad_sector_slug) {
    return { selected: [], exclusionReason: 'missing_broad_sector' }
  }

  const { data: candidates, error } = await supabase
    .from('canonical_companies')
    .select('id, sector, broad_sector_slug, size_band')
    .eq('broad_sector_slug', cohort.broad_sector_slug)
    .neq('id', cohort.canonical_company_id)
    .order('id', { ascending: true })
    .limit(500)
  if (error) throw new Error(`control candidate fetch failed: ${error.message}`)

  const nearbyOpeningIds = await findCandidatesWithNearbyOpenings(
    supabase,
    (candidates ?? []).map((candidate) => candidate.id),
    cohort.opened_on,
  )
  if (!nearbyOpeningIds) {
    return { selected: [], exclusionReason: 'nearby_opening_check_failed' }
  }

  const selected = selectControlCandidates(
    cohort,
    (candidates ?? []).filter((candidate) => !excludedIds.has(candidate.id)),
    nearbyOpeningIds,
    CONTROLS_PER_COHORT,
  )
  return {
    selected,
    exclusionReason: selected.length === CONTROLS_PER_COHORT
      ? null
      : 'insufficient_eligible_controls',
  }
}

async function upsertCohort(supabase, opening, cohortVersion) {
  const timelineStart = isoDateOffset(opening.opened_on, -COHORT_WINDOW_DAYS)
  const timelineEnd = opening.opened_on

  const { data: events } = await supabase
    .from('company_events')
    .select('id, event_type, event_date, summary, corroboration_count, confidence')
    .eq('canonical_company_id', opening.canonical_company_id)
    .gte('event_date', timelineStart)
    .lte('event_date', timelineEnd)
    .order('event_date', { ascending: true })
    .limit(1000)

  const timeline = (events ?? []).map((event) => ({
    event_id: event.id,
    event_type: event.event_type,
    event_date: event.event_date,
    summary: event.summary,
    corroboration_count: event.corroboration_count,
    confidence: event.confidence,
  }))

  const [waybackSnapshotCount, gdeltEventCount] = await Promise.all([
    fetchWaybackSnapshotCount(opening.domain ?? null, timelineStart, timelineEnd),
    fetchGdeltEventCount(opening.company_name, timelineStart, timelineEnd),
  ])

  const payload = {
    opening_id: opening.id,
    canonical_company_id: opening.canonical_company_id,
    role_family: opening.role_family,
    opened_on: opening.opened_on,
    timeline_start: timelineStart,
    timeline_end: timelineEnd,
    wayback_snapshot_count: waybackSnapshotCount,
    gdelt_event_count: gdeltEventCount,
    timeline,
    cohort_version: cohortVersion,
    broad_sector_slug: opening.broad_sector_slug,
    size_band: opening.size_band,
    matching_policy_version: MATCHING_POLICY_VERSION,
    updated_at: new Date().toISOString(),
  }

  const { data: row, error } = await supabase
    .from('backtest_cohorts')
    .upsert(payload, { onConflict: 'opening_id,cohort_version' })
    .select('id, canonical_company_id')
    .single()

  if (error) {
    logger.warn('backtest-cohort-builder: cohort upsert failed', {
      openingId: opening.id,
      error: error.message,
    })
    return null
  }

  return row
}

export async function pickControlsForCohort(supabase, cohort) {
  const { data: existing } = await supabase
    .from('backtest_controls')
    .select('canonical_company_id, control_rank')
    .eq('cohort_id', cohort.id)

  const existingIds = new Set((existing ?? []).map((row) => row.canonical_company_id))

  let rank = (existing ?? []).length + 1
  if (rank > CONTROLS_PER_COHORT) return 0

  const { selected } = await findControlCandidates(supabase, cohort, existingIds)

  let inserted = 0
  for (const candidate of selected) {
    if (rank > CONTROLS_PER_COHORT) break
    if (existingIds.has(candidate.id)) continue

    const { error: insertError } = await supabase
      .from('backtest_controls')
      .insert({
        cohort_id: cohort.id,
        canonical_company_id: candidate.id,
        control_rank: rank,
        sector: candidate.sector ?? null,
        broad_sector_slug: candidate.broad_sector_slug,
        size_band: candidate.size_band,
        match_tier: candidate.match_tier,
        matching_policy_version: MATCHING_POLICY_VERSION,
      })

    if (insertError) continue
    existingIds.add(candidate.id)
    rank += 1
    inserted += 1
  }

  return inserted
}

export async function buildBacktestCohortsAndControls(supabase) {
  const startedAt = Date.now()
  const dimensions = await reconcileCanonicalMatchingDimensions(supabase)
  const cohortVersion = `${COHORT_VERSION_PREFIX}-${crypto.randomUUID()}`

  const { data: buildRun, error: buildRunError } = await supabase
    .from('backtest_cohort_build_runs')
    .insert({
      cohort_version: cohortVersion,
      matching_policy_version: MATCHING_POLICY_VERSION,
      controls_per_cohort: CONTROLS_PER_COHORT,
      status: 'running',
    })
    .select('id')
    .single()
  if (buildRunError) throw new Error(`cohort build run insert failed: ${buildRunError.message}`)
  const buildRunId = buildRun.id

  try {

  const { data: openings, error } = await supabase
    .from('role_openings')
    .select('id, canonical_company_id, role_family, opened_on, canonical_companies(name, domain, sector, broad_sector_slug, size_band)')
    .eq('exclude_from_public_stats', false)
    .order('opened_on', { ascending: false })
    .limit(OPENING_SCAN_LIMIT)

  if (error) {
    logger.error('backtest-cohort-builder: failed to fetch openings', { error: error.message })
    await supabase.from('backtest_cohort_build_runs').update({
      status: 'failed',
      error: error.message,
      finished_at: new Date().toISOString(),
    }).eq('id', buildRunId)
    return { cohortsBuilt: 0, controlsAdded: 0, elapsedMs: Date.now() - startedAt }
  }

  let cohortsBuilt = 0
  let controlsAdded = 0
  let scannedOpenings = 0
  const exclusionReasons = {}

  for (const opening of openings ?? []) {
    if (cohortsBuilt >= OPENING_TARGET) break
    scannedOpenings += 1
    const canonical = opening.canonical_companies ?? {}
    const cohortInput = {
      canonical_company_id: opening.canonical_company_id,
      opened_on: opening.opened_on,
      broad_sector_slug: canonical.broad_sector_slug ?? null,
      size_band: canonical.size_band ?? null,
    }
    const { selected, exclusionReason } = await findControlCandidates(supabase, cohortInput)
    if (exclusionReason) {
      exclusionReasons[exclusionReason] = (exclusionReasons[exclusionReason] ?? 0) + 1
      continue
    }

    const cohort = await upsertCohort(supabase, {
      ...opening,
      company_name: canonical.name ?? null,
      domain: canonical.domain ?? null,
      broad_sector_slug: canonical.broad_sector_slug ?? null,
      size_band: canonical.size_band ?? null,
    }, cohortVersion)
    if (!cohort) {
      exclusionReasons.cohort_write_failed = (exclusionReasons.cohort_write_failed ?? 0) + 1
      continue
    }

    const { error: deleteError } = await supabase
      .from('backtest_controls')
      .delete()
      .eq('cohort_id', cohort.id)
    if (deleteError) throw new Error(`control replacement delete failed: ${deleteError.message}`)

    const controlRows = selected.map((candidate, index) => ({
      cohort_id: cohort.id,
      canonical_company_id: candidate.id,
      control_rank: index + 1,
      sector: candidate.sector ?? null,
      broad_sector_slug: candidate.broad_sector_slug,
      size_band: candidate.size_band,
      match_tier: candidate.match_tier,
      matching_policy_version: MATCHING_POLICY_VERSION,
    }))
    const { error: controlWriteError } = await supabase
      .from('backtest_controls')
      .insert(controlRows)
    if (controlWriteError) {
      await supabase.from('backtest_cohorts').delete().eq('id', cohort.id)
      exclusionReasons.control_write_failed = (exclusionReasons.control_write_failed ?? 0) + 1
      continue
    }

    cohortsBuilt += 1
    controlsAdded += controlRows.length
  }

  const excludedCohorts = scannedOpenings - cohortsBuilt
  await supabase.from('backtest_cohort_build_runs').update({
    scanned_opening_count: scannedOpenings,
    included_cohort_count: cohortsBuilt,
    excluded_cohort_count: excludedCohorts,
    exclusion_reasons: exclusionReasons,
    status: 'complete',
    finished_at: new Date().toISOString(),
  }).eq('id', buildRunId)

  return {
    buildRunId,
    cohortVersion,
    cohortsBuilt,
    controlsAdded,
    scannedOpenings,
    excludedCohorts,
    exclusionReasons,
    dimensions,
    openingTarget: OPENING_TARGET,
    controlsPerCohort: CONTROLS_PER_COHORT,
    elapsedMs: Date.now() - startedAt,
  }
  } catch (error) {
    await supabase.from('backtest_cohort_build_runs').update({
      status: 'failed',
      error: error.message,
      finished_at: new Date().toISOString(),
    }).eq('id', buildRunId)
    throw error
  }
}
