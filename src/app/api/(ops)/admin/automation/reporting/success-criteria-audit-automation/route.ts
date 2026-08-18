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

const SPRINT_KEY = 'sprint_6_success_criteria_audit'
const JOB_NAME = 'emi-success-criteria-audit-automation'

const CRITERIA = [
  { key: 'emi_language_adoption_percent', target: 85, comparator: '>=' },
  { key: 'assessment_completion_percent', target: 40, comparator: '>=' },
  { key: 'day7_return_percent', target: 55, comparator: '>=' },
  { key: 'proof_assets_published_count', target: 3, comparator: '>=' },
  { key: 'b2b_pilot_conversion_percent', target: 25, comparator: '>=' },
] as const

function cutoffIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const d = new Date(base.toISOString())
  d.setUTCDate(d.getUTCDate() - 120)
  return d.toISOString()
}

function passes(value: number | null, target: number): boolean {
  if (value === null || Number.isNaN(value)) return false
  return value >= target
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
      return NextResponse.json({ error: 'Failed to load KPI snapshots for success criteria audit' }, { status: 500 })
    }

    const snapshots = Array.isArray(rows) ? rows as SnapshotRow[] : []
    const latestByMetric = new Map<string, SnapshotRow>()
    for (const row of snapshots) {
      if (!latestByMetric.has(row.metric_name)) {
        latestByMetric.set(row.metric_name, row)
      }
    }

    const criteriaResults = CRITERIA.map((criterion) => {
      const row = latestByMetric.get(criterion.key)
      const value = row?.metric_status === 'ok' ? (row.metric_value ?? null) : null
      return {
        metric_name: criterion.key,
        comparator: criterion.comparator,
        target: criterion.target,
        value,
        pass: passes(value, criterion.target),
      }
    })

    const passCount = criteriaResults.filter((row) => row.pass).length
    const requiredPassCount = 4
    const status = passCount >= requiredPassCount ? 'ok' : 'failed'

    const payload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      reference_date: parsed.body.referenceDate ?? null,
      criteria_results: criteriaResults,
      pass_count: passCount,
      required_pass_count: requiredPassCount,
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

    const { data: obsRun } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details: {
          sprint_key: SPRINT_KEY,
          pass_count: passCount,
          required_pass_count: requiredPassCount,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: status === 'ok',
      sprintKey: SPRINT_KEY,
      exportRunId: exportRun?.id ?? null,
      runId: obsRun?.id ?? null,
      status,
      payload,
    })
  } catch (error) {
    console.error('[reporting.success-criteria-audit-automation] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
