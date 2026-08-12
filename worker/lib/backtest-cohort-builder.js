import { logger } from './logger.js'

const COHORT_WINDOW_DAYS = Number(process.env.BACKTEST_WINDOW_DAYS ?? 180)
const OPENING_TARGET = Number(process.env.BACKTEST_OPENING_TARGET ?? 300)
const CONTROLS_PER_COHORT = Number(process.env.BACKTEST_CONTROLS_PER_COHORT ?? 3)
const CONTROL_LOOKAROUND_DAYS = Number(process.env.BACKTEST_CONTROL_LOOKAROUND_DAYS ?? 90)
const HTTP_TIMEOUT_MS = Number(process.env.BACKTEST_HTTP_TIMEOUT_MS ?? 10000)

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

async function upsertCohort(supabase, opening) {
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
    cohort_version: 'v1',
    updated_at: new Date().toISOString(),
  }

  const { data: row, error } = await supabase
    .from('backtest_cohorts')
    .upsert(payload, { onConflict: 'opening_id' })
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
  const desired = CONTROLS_PER_COHORT

  const { data: existing } = await supabase
    .from('backtest_controls')
    .select('canonical_company_id, control_rank')
    .eq('cohort_id', cohort.id)

  const existingIds = new Set((existing ?? []).map((row) => row.canonical_company_id))

  let rank = (existing ?? []).length + 1
  if (rank > desired) return 0

  let candidatesQuery = supabase
    .from('canonical_companies')
    .select('id, sector')
    .neq('id', cohort.canonical_company_id)
    .limit(500)

  if (cohort.sector) candidatesQuery = candidatesQuery.eq('sector', cohort.sector)

  const { data: candidates, error } = await candidatesQuery
  if (error || !candidates?.length) return 0

  const nearbyOpeningIds = await findCandidatesWithNearbyOpenings(
    supabase,
    candidates.map((candidate) => candidate.id),
    cohort.opened_on,
  )
  if (!nearbyOpeningIds) return 0

  let inserted = 0
  for (const candidate of candidates) {
    if (rank > desired) break
    if (existingIds.has(candidate.id)) continue

    if (nearbyOpeningIds.has(candidate.id)) continue

    const { error: insertError } = await supabase
      .from('backtest_controls')
      .insert({
        cohort_id: cohort.id,
        canonical_company_id: candidate.id,
        control_rank: rank,
        sector: candidate.sector ?? null,
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

  const { data: openings, error } = await supabase
    .from('role_openings')
    .select('id, canonical_company_id, role_family, opened_on, canonical_companies(name, domain, sector)')
    .eq('exclude_from_public_stats', false)
    .order('opened_on', { ascending: false })
    .limit(OPENING_TARGET)

  if (error) {
    logger.error('backtest-cohort-builder: failed to fetch openings', { error: error.message })
    return { cohortsBuilt: 0, controlsAdded: 0, elapsedMs: Date.now() - startedAt }
  }

  let cohortsBuilt = 0
  let controlsAdded = 0

  for (const opening of openings ?? []) {
    const canonical = opening.canonical_companies ?? {}
    const cohort = await upsertCohort(supabase, {
      ...opening,
      company_name: canonical.name ?? null,
      domain: canonical.domain ?? null,
    })
    if (!cohort) continue

    cohortsBuilt += 1
    controlsAdded += await pickControlsForCohort(
      supabase,
      {
        ...cohort,
        opened_on: opening.opened_on,
        sector: canonical.sector ?? null,
      },
    )
  }

  return {
    cohortsBuilt,
    controlsAdded,
    openingTarget: OPENING_TARGET,
    controlsPerCohort: CONTROLS_PER_COHORT,
    elapsedMs: Date.now() - startedAt,
  }
}
