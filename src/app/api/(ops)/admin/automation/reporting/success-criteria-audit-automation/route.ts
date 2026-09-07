import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import type { EmiMetricStatus } from '@/lib/emi-kpi'

type SnapshotRow = {
  metric_name: string
  metric_value: number | null
  metric_status: EmiMetricStatus
  week_end: string
  generated_at: string
}

const payloadSchema = z.object({
  referenceDate: z.string().datetime().optional(),
})

const SPRINT_KEY = 'sprint_6_success_criteria_audit'
const JOB_NAME = 'emi-success-criteria-audit-automation'

// SMK-445 (Jira comment 10973, 2026-09-02):
// - proof_assets_published_count and b2b_pilot_conversion_percent are out of
//   the automated gate entirely; both measured seed data and are tracked
//   manually now.
// - The red/green gate is downgraded to advisory until targets are
//   re-baselined from 4 to 8 weeks of clean post-fix data. The job reports
//   per-criterion advisory results but always logs status 'ok'; the existing
//   targets are carried for reference only, not as a verdict.
const GATE_MODE = 'advisory'

const CRITERIA = [
  { key: 'emi_language_adoption_percent', target: 85, comparator: '>=' },
  { key: 'assessment_completion_percent', target: 40, comparator: '>=' },
  { key: 'day7_return_percent', target: 55, comparator: '>=' },
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
      // Only a healthy 'ok' snapshot is scored; no_data, query_error, and
      // insufficient_data (denominator under the sample floor) are excluded
      // from scoring rather than treated as red.
      const scored = row?.metric_status === 'ok' && row.metric_value !== null
      const value = scored ? row.metric_value : null
      return {
        metric_name: criterion.key,
        comparator: criterion.comparator,
        target: criterion.target,
        value,
        scored,
        not_scored_reason: scored ? null : (row?.metric_status ?? 'missing'),
        pass: scored ? (value as number) >= criterion.target : null,
      }
    })

    const scoredCount = criteriaResults.filter((row) => row.scored).length
    const passCount = criteriaResults.filter((row) => row.pass === true).length

    const payload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      reference_date: parsed.body.referenceDate ?? null,
      gate_mode: GATE_MODE,
      gate_note: 'Advisory only until targets are re-baselined from clean post-SMK-445 data; targets are pre-baseline reference values.',
      criteria_results: criteriaResults,
      pass_count: passCount,
      scored_count: scoredCount,
      total_count: CRITERIA.length,
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
        status: 'ok',
        details: {
          sprint_key: SPRINT_KEY,
          gate_mode: GATE_MODE,
          pass_count: passCount,
          scored_count: scoredCount,
          total_count: CRITERIA.length,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      sprintKey: SPRINT_KEY,
      exportRunId: exportRun?.id ?? null,
      runId: obsRun?.id ?? null,
      status: 'ok',
      payload,
    })
  } catch (error) {
    console.error('[reporting.success-criteria-audit-automation] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
