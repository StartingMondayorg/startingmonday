import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type SnapshotRow = {
  metric_name: string
  metric_value: number | null
  metric_status: 'ok' | 'no_data' | 'query_error'
  week_end: string
  generated_at: string
}

const payloadSchema = z.object({
  referenceDate: z.string().datetime().optional(),
})

const SPRINT_KEY = 'sprint_6_capstone_report'
const JOB_NAME = 'emi-capstone-report-generation'
const REQUIRED_METRICS = [
  'emi_language_adoption_percent',
  'assessment_completion_percent',
  'day7_return_percent',
  'proof_assets_published_count',
  'b2b_pilot_conversion_percent',
  'tier1_claim_compliance_percent',
] as const

function cutoffIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const d = new Date(base.toISOString())
  d.setUTCDate(d.getUTCDate() - 120)
  return d.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsed = await parseAutomationBody(request, payloadSchema)
    if (!parsed.ok) return parsed.response

    const sb = asLooseSupabaseClient(auth.supabase)
    const { data: rows, error } = await sb
      .from('emi_kpi_snapshots')
      .select('metric_name,metric_value,metric_status,week_end,generated_at')
      .gte('week_end', cutoffIso(parsed.body.referenceDate))
      .order('week_end', { ascending: false })
      .order('generated_at', { ascending: false })
      .limit(300)

    if (error) {
      return NextResponse.json({ error: 'Failed to load KPI snapshots for capstone report' }, { status: 500 })
    }

    const snapshots = Array.isArray(rows) ? rows as SnapshotRow[] : []
    const latestByMetric = new Map<string, SnapshotRow>()
    for (const row of snapshots) {
      if (!latestByMetric.has(row.metric_name)) {
        latestByMetric.set(row.metric_name, row)
      }
    }

    const values = Object.fromEntries(
      REQUIRED_METRICS.map((metric) => [metric, latestByMetric.get(metric)?.metric_value ?? null]),
    )

    const readyCount = REQUIRED_METRICS.filter((metric) => {
      const row = latestByMetric.get(metric)
      return row?.metric_status === 'ok' && row.metric_value !== null
    }).length

    const payload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      reference_date: parsed.body.referenceDate ?? null,
      metric_values: values,
      ready_metric_count: readyCount,
      required_metric_count: REQUIRED_METRICS.length,
    }

    const { data: exportRun } = await sb
      .from('emi_sprint_export_runs')
      .insert({
        user_id: auth.userId,
        sprint_key: SPRINT_KEY,
        export_payload: payload,
      })
      .select('id')
      .single()

    const status = readyCount === REQUIRED_METRICS.length ? 'ok' : 'late'

    const { data: obsRun } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details: {
          sprint_key: SPRINT_KEY,
          ready_metric_count: readyCount,
          required_metric_count: REQUIRED_METRICS.length,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      sprintKey: SPRINT_KEY,
      exportRunId: exportRun?.id ?? null,
      runId: obsRun?.id ?? null,
      status,
      payload,
    })
  } catch (error) {
    console.error('[reporting.capstone-report-generation] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
