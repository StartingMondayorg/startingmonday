import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { isMeasuredStatus } from '@/lib/emi-kpi'

type JobStatus = 'ok' | 'failed'

type SnapshotRow = {
  metric_name: string
  metric_value: number | null
  metric_status: 'ok' | 'no_data' | 'query_error' | 'insufficient_data'
  week_start: string
  week_end: string
  generated_at: string
  source_table: string | null
  source_notes: string | null
}

type FreshnessResult = {
  metricName: string
  currentValue: number | null
  metricStatus: SnapshotRow['metric_status'] | 'missing'
  freshnessStatus: 'fresh' | 'stale' | 'missing'
  latestWeekEnd: string | null
  consecutiveNullWeeks: number
  sourceTable: string | null
}

const rerunSchema = z.object({
  referenceDate: z.string().datetime().optional(),
  tolerancePoints: z.number().min(0).max(100).optional(),
})

// Metrics whose weekly instrumentation is monitored for staleness.
//
// This job previously compared each metric to a hardcoded PUBLISHED_KPI_VALUES
// baseline with a +/-5 point tolerance and failed the deploy gate on any larger
// gap. That check was retired in SMK-444: the constants required a source edit
// every time a metric legitimately moved, so genuine improvements (day-7 return
// rising from 8.33 to 27.78) registered as regressions, and the only metrics
// that ever passed were the ones frozen on seed data.
//
// What remains is instrumentation freshness, which needs no baseline: a metric
// that reports no_data or query_error for two consecutive weeks has stopped
// being measured and needs a human. An insufficient_data snapshot with a
// value still counts as measured (SMK-445): the instrumentation works, the
// sample is just under the floor.
//
// proof_assets_published_count and b2b_pilot_conversion_percent left the
// automated metric set in SMK-445 (Jira comment 10973): they measured seed
// data and are tracked manually now, so this job no longer watches them.
const TRACKED_METRICS = [
  'emi_language_adoption_percent',
  'assessment_completion_percent',
  'day7_return_percent',
  'tier1_claim_compliance_percent',
] as const

const NULL_STREAK_WEEKS = 2

const JOB_NAME = 'emi-production-validation-rerun'

function cutoffIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const d = new Date(base.toISOString())
  d.setUTCDate(d.getUTCDate() - 120)
  return d.toISOString()
}

function classifyMetric(metricName: string, rows: SnapshotRow[]): FreshnessResult {
  const latest = rows[0]

  let consecutiveNullWeeks = 0
  for (const row of rows.slice(0, NULL_STREAK_WEEKS)) {
    if (isMeasuredStatus(row.metric_status, row.metric_value)) break
    consecutiveNullWeeks += 1
  }

  if (!latest) {
    return {
      metricName,
      currentValue: null,
      metricStatus: 'missing',
      freshnessStatus: 'missing',
      latestWeekEnd: null,
      consecutiveNullWeeks,
      sourceTable: null,
    }
  }

  const measured = isMeasuredStatus(latest.metric_status, latest.metric_value)

  return {
    metricName,
    currentValue: measured ? Number(latest.metric_value) : null,
    metricStatus: latest.metric_status,
    freshnessStatus: consecutiveNullWeeks >= NULL_STREAK_WEEKS ? 'stale' : 'fresh',
    latestWeekEnd: latest.week_end,
    consecutiveNullWeeks,
    sourceTable: latest.source_table,
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, rerunSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const { data: rawSnapshots, error } = await sb
      .from('emi_kpi_snapshots')
      .select('metric_name,metric_value,metric_status,week_start,week_end,generated_at,source_table,source_notes')
      .gte('week_end', cutoffIso(body.referenceDate))
      .order('week_end', { ascending: false })
      .order('generated_at', { ascending: false })
      .limit(200)

    if (error) {
      return NextResponse.json({ error: 'Failed to load EMI KPI snapshots' }, { status: 500 })
    }

    const snapshots = Array.isArray(rawSnapshots) ? rawSnapshots as SnapshotRow[] : []
    const grouped = new Map<string, SnapshotRow[]>()
    for (const row of snapshots) {
      const existing = grouped.get(row.metric_name) ?? []
      existing.push(row)
      grouped.set(row.metric_name, existing)
    }

    const freshnessResults = TRACKED_METRICS
      .map((metricName) => classifyMetric(metricName, grouped.get(metricName) ?? []))

    // Align with runbook policy: a metric is blocking-stale only after two consecutive weekly nulls.
    const staleMetrics = freshnessResults.filter((row) => row.freshnessStatus !== 'fresh')
    const nullStreakCount = staleMetrics.length
    const status: JobStatus = nullStreakCount > 0 ? 'failed' : 'ok'

    const runPayload = {
      reference_date: body.referenceDate ?? null,
      null_streak_weeks: NULL_STREAK_WEEKS,
      null_streak_count: nullStreakCount,
      stale_metrics: staleMetrics.map((row) => row.metricName),
      freshness_results: freshnessResults,
    }

    const { data } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: userId,
        job_name: JOB_NAME,
        status,
        details: runPayload,
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      runId: data?.id,
      jobName: JOB_NAME,
      status,
      nullStreakCount,
      staleMetrics: staleMetrics.map((row) => row.metricName),
      freshnessResults,
    })
  } catch (error) {
    console.error('[reporting.emi-validation-reruns] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
