// Epic E2 T2.6: Admin API endpoint for label metrics (coverage, latency, breakdowns)
import { type NextRequest, NextResponse } from 'next/server'
import { buildLabelAndBacktestGates } from '@/lib/intelligence-label-gates'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

const PAGE_SIZE = 1000

type QueryError = { message: string }
type PageResult<Row> = { data: Row[] | null; error: QueryError | null }
type OpeningRow = {
  canonical_company_id: string
  label_source: string
  role_family: string
  canonical_companies: { sector: string | null } | null
}
type LabeledEventRow = { days_to_opening: number }
type SourceStatRow = {
  event_type: string
  n_events: number
  n_preceded: number
  median_days_to_opening: number | string | null
}
type PatternRow = {
  pattern_name: string
  role_family: string | null
  support_n: number
  precision: number
  recall: number
  fp_rate: number
  median_lead_time_days: number | null
  computed_at: string
}

async function fetchAllRows<Row>(
  loadPage: (from: number, to: number) => PromiseLike<PageResult<Row>>,
): Promise<Row[]> {
  const rows: Row[] = []
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await loadPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    const page = data ?? []
    rows.push(...page)
    if (page.length < PAGE_SIZE) return rows
  }
}

export async function GET(request: NextRequest) {
  const staffAuth = await requireStaffAutomationAccess(request)
  if (!staffAuth.ok) return staffAuth.response

  const admin = createAdminClient() as any

  try {
    const queriedAt = new Date().toISOString()
    const [companyCountResult, openingRows, labeledEvents, sourceStatsResult, latestReplayResult, patternRows, cohortCountResult, controlCountResult] = await Promise.all([
      admin.from('canonical_companies').select('id', { count: 'exact', head: true }),
      fetchAllRows<OpeningRow>((from, to) => admin
        .from('role_openings')
        .select('canonical_company_id, label_source, role_family, canonical_companies(sector)')
        .order('created_at', { ascending: true })
        .range(from, to)),
      fetchAllRows<LabeledEventRow>((from, to) => admin
        .from('event_outcome_labels')
        .select('days_to_opening')
        .order('days_to_opening', { ascending: true })
        .range(from, to)),
      admin
        .from('precursor_stats')
        .select('event_type, n_events, n_preceded, median_days_to_opening')
        .gte('computed_at', new Date(Date.now() - 86400000).toISOString()),
      admin
        .from('backtest_replay_runs')
        .select('id, status, cohort_count, control_count, started_at, finished_at, error')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      fetchAllRows<PatternRow>((from, to) => admin
        .from('pattern_backtests')
        .select('pattern_name, role_family, support_n, precision, recall, fp_rate, median_lead_time_days, computed_at')
        .order('computed_at', { ascending: false })
        .range(from, to)),
      admin.from('backtest_cohorts').select('id', { count: 'exact', head: true }),
      admin.from('backtest_controls').select('id', { count: 'exact', head: true }),
    ])

    const totalCompanies = companyCountResult.count ?? 0
    const sourceStats = (sourceStatsResult.data ?? []) as SourceStatRow[]
    const latestReplay = latestReplayResult.data ?? null
    const cohortCount = cohortCountResult.count ?? 0
    const controlCount = controlCountResult.count ?? 0

    // Coverage calculation
    const uniqueCompanies = new Set(openingRows.map((row) => row.canonical_company_id)).size
    const coveragePercent = totalCompanies ? (uniqueCompanies / totalCompanies) * 100 : 0

    // Median days to opening across all labeled events
    const medianDaysToOpening = calculateMedian(labeledEvents.map((event) => event.days_to_opening))

    // Openings by source
    const sourceMap = new Map<string, number>()
    for (const row of openingRows) {
      sourceMap.set(row.label_source, (sourceMap.get(row.label_source) ?? 0) + 1)
    }
    const openingsBySource = [...sourceMap.entries()].map(([source, count]) => ({
      source,
      count,
    }))

    // Openings by role family
    const familyMap = new Map<string, number>()
    for (const row of openingRows) {
      familyMap.set(row.role_family, (familyMap.get(row.role_family) ?? 0) + 1)
    }
    const openingsByFamily = [...familyMap.entries()].map(([family, count]) => ({
      family,
      count,
    }))

    // Openings by sector (requires join to canonical_companies)
    const sectorMap = new Map<string, number>()
    for (const row of openingRows) {
      const sector = row.canonical_companies?.sector ?? 'Unknown'
      sectorMap.set(sector, (sectorMap.get(sector) ?? 0) + 1)
    }
    const openingsBySector = [...sectorMap.entries()]
      .map(([sector, count]) => ({ sector, count }))
      .sort((a, b) => b.count - a.count)

    const sourceBreakdown = sourceStats.map((row) => ({
      source_key: row.event_type,
      total_openings: row.n_preceded,
      median_days_to_opening: row.median_days_to_opening ? Number(row.median_days_to_opening) : null,
      hit_rate: row.n_events > 0 ? row.n_preceded / row.n_events : 0,
    }))

    const gates = buildLabelAndBacktestGates({
      openingCount: openingRows.length,
      labelCount: labeledEvents.length,
      labelSourceCount: sourceMap.size,
      precursorStatCount: sourceStats.length,
      cohortCount,
      replayCohortCount: latestReplay?.cohort_count ?? 0,
      replayControlCount: latestReplay?.control_count ?? 0,
      patternCount: patternRows.length,
      latestReplayStatus: latestReplay?.status ?? null,
    })

    return NextResponse.json({
      timestamp: queriedAt,
      stats: {
        totalCompanies,
        companiesWithLabels: uniqueCompanies,
        coveragePercent: Math.round(coveragePercent * 10) / 10,
        medianDaysToOpening,
        eventOutcomeLabelCount: labeledEvents.length,
        openingsBySource,
        openingsByFamily,
        openingsBySector,
        queriedAt,
      },
      sourceBreakdown,
      backtests: {
        cohortCount,
        controlCount,
        latestReplay,
        patternCount: patternRows.length,
        patterns: patternRows,
      },
      gates,
      gate: gates.labeledOpenings,
    })
  } catch (err) {
    console.error('label-metrics: error', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function calculateMedian(values: number[]): number | null {
  if (!values?.length) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}
