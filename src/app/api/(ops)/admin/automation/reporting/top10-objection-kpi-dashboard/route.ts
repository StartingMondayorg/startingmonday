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

type Comparator = '>=' | '<='

type ObjectionKpiDefinition = {
  objectionId: string
  key: string
  theme: string
  kpi: string
  target: number
  comparator: Comparator
  baselineCurrent: number
  defaultOwner: string
  snapshotMetricName?: string
}

const payloadSchema = z.object({
  referenceDate: z.string().datetime().optional(),
  metricOverrides: z.record(z.string(), z.number()).optional(),
  ownerMap: z.record(z.string(), z.string()).optional(),
})

const SPRINT_KEY = 'sprint_6_top10_objection_kpi_dashboard'
const JOB_NAME = 'emi-top10-objection-kpi-dashboard'

const KPI_DEFINITIONS: ObjectionKpiDefinition[] = [
  {
    objectionId: 'O-01',
    key: 'qualified_call_clarity_score',
    theme: 'Category ambiguity',
    kpi: 'Qualified call clarity score',
    target: 85,
    comparator: '>=',
    baselineCurrent: 81,
    defaultOwner: 'GTM Lead',
  },
  {
    objectionId: 'O-02',
    key: 'discovery_to_proposal_rate_percent',
    theme: 'Urgency uncertainty',
    kpi: 'Discovery-to-proposal rate',
    target: 32,
    comparator: '>=',
    baselineCurrent: 29,
    defaultOwner: 'Sales Ops',
  },
  {
    objectionId: 'O-03',
    key: 'onboarding_completion_by_segment_percent',
    theme: 'Emotional mismatch',
    kpi: 'Onboarding completion by segment',
    target: 68,
    comparator: '>=',
    baselineCurrent: 63,
    defaultOwner: 'Onboarding PM',
    snapshotMetricName: 'assessment_completion_percent',
  },
  {
    objectionId: 'O-04',
    key: 'trial_to_paid_conversion_percent',
    theme: 'Pricing value proof',
    kpi: 'Trial-to-paid conversion',
    target: 25,
    comparator: '>=',
    baselineCurrent: 22,
    defaultOwner: 'Revenue Ops',
  },
  {
    objectionId: 'O-05',
    key: 'claims_confidence_acceptance_percent',
    theme: 'Trust in claims',
    kpi: 'Claims confidence acceptance',
    target: 92,
    comparator: '>=',
    baselineCurrent: 89,
    defaultOwner: 'Data + Legal Ops',
    snapshotMetricName: 'tier1_claim_compliance_percent',
  },
  {
    objectionId: 'O-06',
    key: 'daily_plan_completion_percent',
    theme: 'Complexity concern',
    kpi: 'Daily plan completion',
    target: 65,
    comparator: '>=',
    baselineCurrent: 61,
    defaultOwner: 'Product',
  },
  {
    objectionId: 'O-07',
    key: 'coach_digest_utilization_percent',
    theme: 'Coach workflow burden',
    kpi: 'Coach digest utilization',
    target: 80,
    comparator: '>=',
    baselineCurrent: 74,
    defaultOwner: 'Coach Ops',
  },
  {
    objectionId: 'O-08',
    key: 'legal_cycle_time_days',
    theme: 'Procurement confidence',
    kpi: 'Legal cycle time (days)',
    target: 10,
    comparator: '<=',
    baselineCurrent: 12,
    defaultOwner: 'Partnerships Ops',
  },
  {
    objectionId: 'O-09',
    key: 'optionality_weekly_action_rate_percent',
    theme: 'Optionality noise',
    kpi: 'Optionality weekly action rate',
    target: 70,
    comparator: '>=',
    baselineCurrent: 67,
    defaultOwner: 'Lifecycle PM',
  },
  {
    objectionId: 'O-10',
    key: 'proof_to_proposal_progression_percent',
    theme: 'Proof relevance',
    kpi: 'Proof-to-proposal progression',
    target: 36,
    comparator: '>=',
    baselineCurrent: 34,
    defaultOwner: 'GTM Ops',
    snapshotMetricName: 'b2b_pilot_conversion_percent',
  },
]

function cutoffIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const d = new Date(base.toISOString())
  d.setUTCDate(d.getUTCDate() - 120)
  return d.toISOString()
}

function meetsTarget(value: number, target: number, comparator: Comparator): boolean {
  return comparator === '>=' ? value >= target : value <= target
}

function resolveMetricValue(input: {
  definition: ObjectionKpiDefinition
  metricOverrides: Record<string, number> | undefined
  latestByMetric: Map<string, SnapshotRow>
}): { value: number; source: 'override' | 'snapshot' | 'artifact_baseline' } {
  const overrideValue = input.metricOverrides?.[input.definition.key]
  if (typeof overrideValue === 'number' && Number.isFinite(overrideValue)) {
    return { value: overrideValue, source: 'override' }
  }

  if (input.definition.snapshotMetricName) {
    const row = input.latestByMetric.get(input.definition.snapshotMetricName)
    if (row?.metric_status === 'ok' && row.metric_value !== null && Number.isFinite(Number(row.metric_value))) {
      return { value: Number(row.metric_value), source: 'snapshot' }
    }
  }

  return { value: input.definition.baselineCurrent, source: 'artifact_baseline' }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsed = await parseAutomationBody(request, payloadSchema)
    if (!parsed.ok) return parsed.response

    const sb = asLooseSupabaseClient(auth.supabase)
    const { data: rows } = await sb
      .from('emi_kpi_snapshots')
      .select('metric_name,metric_value,metric_status,week_end,generated_at')
      .gte('week_end', cutoffIso(parsed.body.referenceDate))
      .order('week_end', { ascending: false })
      .order('generated_at', { ascending: false })
      .limit(200)

    const snapshots = Array.isArray(rows) ? rows as SnapshotRow[] : []
    const latestByMetric = new Map<string, SnapshotRow>()
    for (const row of snapshots) {
      if (!latestByMetric.has(row.metric_name)) {
        latestByMetric.set(row.metric_name, row)
      }
    }

    const panelRows = KPI_DEFINITIONS.map((definition) => {
      const resolved = resolveMetricValue({
        definition,
        metricOverrides: parsed.body.metricOverrides,
        latestByMetric,
      })
      const owner = parsed.body.ownerMap?.[definition.objectionId] ?? definition.defaultOwner
      const pass = meetsTarget(resolved.value, definition.target, definition.comparator)

      return {
        objection_id: definition.objectionId,
        objection_theme: definition.theme,
        kpi: definition.kpi,
        current: resolved.value,
        target: definition.target,
        comparator: definition.comparator,
        status: pass ? 'On target' : 'Improving',
        pass,
        owner,
        source: resolved.source,
      }
    })

    const atRiskRows = panelRows.filter((row) => !row.pass)
    const ownerAlerts = Array.from(atRiskRows.reduce((map, row) => {
      const existing = map.get(row.owner) ?? []
      existing.push(`${row.objection_id} ${row.kpi}`)
      map.set(row.owner, existing)
      return map
    }, new Map<string, string[]>()).entries()).map(([owner, items]) => ({ owner, items }))

    if (ownerAlerts.length > 0) {
      await sb.from('automation_alerts').insert(
        ownerAlerts.map((alert) => ({
          user_id: auth.userId,
          source_table: 'emi_sprint_export_runs',
          alert_code: 'emi_objection_kpi_owner_attention',
          severity: 'medium',
          message: `EMI objection KPI attention needed for ${alert.owner}: ${alert.items.join(', ')}`,
          details: {
            sprint_key: SPRINT_KEY,
            owner: alert.owner,
            objection_metrics: alert.items,
          },
          status: 'open',
        })),
      )
    }

    const payload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      reference_date: parsed.body.referenceDate ?? null,
      panel_rows: panelRows,
      at_risk_count: atRiskRows.length,
      total_count: panelRows.length,
      owner_alerts: ownerAlerts,
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

    const status = atRiskRows.length === 0 ? 'ok' : 'late'

    const { data: obsRun } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: auth.userId,
        job_name: JOB_NAME,
        status,
        details: {
          sprint_key: SPRINT_KEY,
          at_risk_count: atRiskRows.length,
          total_count: panelRows.length,
          owner_alert_count: ownerAlerts.length,
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
    console.error('[reporting.top10-objection-kpi-dashboard] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}