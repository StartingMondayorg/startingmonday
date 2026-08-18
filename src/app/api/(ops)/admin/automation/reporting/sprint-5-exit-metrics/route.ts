import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

type MetricStatus = 'ok' | 'no_data' | 'query_error'

type Tier1ClaimRow = {
  audit_status: 'pending' | 'compliant' | 'non_compliant'
  confidence_label: 'high' | 'medium' | 'directional' | null
  denominator: number | null
  metric_definition: string | null
  status: 'draft' | 'active' | 'archived'
  timeframe: string | null
}

type ObservabilityRow = {
  created_at: string
  details: { freshness_hours?: number | null } | null
  status: 'ok' | 'late' | 'failed'
}

type SocialPostRow = {
  comment_count: number | null
  engagement_synced_at: string | null
  impression_count: number | null
  is_posted: boolean
  like_count: number | null
  pillar: 'search_craft' | 'market_intel' | 'behind_build' | 'user_story' | 'engagement'
  posted_at: string | null
}

type B2bProspectRow = {
  id: string
  stage: 'identified' | 'contacted' | 'demo_scheduled' | 'proposal_sent' | 'negotiating' | 'closed_won' | 'closed_lost'
}

type B2bMaterialRow = {
  created_at: string
  prospect_id: string
}

type ExportMetric = {
  metric_name:
    | 'tier1_claim_compliance_percent'
    | 'benchmark_freshness_sla_attainment_percent'
    | 'proof_asset_engagement_rate_percent'
    | 'proposal_acceptance_after_proof_exposure_percent'
  metric_value: number | null
  metric_status: MetricStatus
  source_table: string
  source_notes: string
}

const sprint5ExportSchema = z.object({
  freshnessSlaHours: z.number().min(1).max(168).optional(),
  referenceDate: z.string().date().optional(),
  trailingDays: z.number().int().min(7).max(90).optional(),
})

const SPRINT_KEY = 'sprint_5_benchmark_and_proof_system'

function roundPct(numerator: number, denominator: number): number | null {
  if (!denominator) return null
  return Math.round((numerator / denominator) * 10000) / 100
}

function isoWindow(referenceDate?: string, trailingDays = 30) {
  const end = referenceDate ? new Date(`${referenceDate}T23:59:59.999Z`) : new Date()
  const start = new Date(end.getTime())
  start.setUTCDate(start.getUTCDate() - (trailingDays - 1))
  start.setUTCHours(0, 0, 0, 0)
  return {
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const parsedBody = await parseAutomationBody(request, sprint5ExportSchema)
    if (!parsedBody.ok) return parsedBody.response

    const { userId, supabase } = auth
    const { freshnessSlaHours = 24, referenceDate, trailingDays = 30 } = parsedBody.body
    const sb = asLooseSupabaseClient(supabase)
    const { windowStart, windowEnd } = isoWindow(referenceDate, trailingDays)

    const metrics: ExportMetric[] = []

    try {
      const { data: claimRows, error } = await sb
        .from('tier1_claims')
        .select('status,audit_status,metric_definition,denominator,timeframe,confidence_label')
        .eq('status', 'active')
        .limit(10000)

      if (error) throw error

      const activeClaims = Array.isArray(claimRows) ? claimRows as Tier1ClaimRow[] : []
      const compliantClaims = activeClaims.filter((row) => (
        row.audit_status === 'compliant'
        && Boolean(row.metric_definition)
        && row.denominator !== null
        && Boolean(row.timeframe)
        && Boolean(row.confidence_label)
      ))

      metrics.push({
        metric_name: 'tier1_claim_compliance_percent',
        metric_value: roundPct(compliantClaims.length, activeClaims.length),
        metric_status: activeClaims.length > 0 ? 'ok' : 'no_data',
        source_table: 'tier1_claims',
        source_notes: `active_claims=${activeClaims.length};compliant_claims=${compliantClaims.length}`,
      })
    } catch (error) {
      console.error('[reporting.sprint-5-exit-metrics] tier1_claims failed', error)
      metrics.push({
        metric_name: 'tier1_claim_compliance_percent',
        metric_value: null,
        metric_status: 'query_error',
        source_table: 'tier1_claims',
        source_notes: 'query_error',
      })
    }

    try {
      const { data: runRows, error } = await sb
        .from('scheduled_job_observability_runs')
        .select('status,details,created_at')
        .eq('job_name', 'emi-benchmark-pipeline')
        .gte('created_at', windowStart)
        .lte('created_at', windowEnd)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      const benchmarkRuns = Array.isArray(runRows) ? runRows as ObservabilityRow[] : []
      const withinSlaRuns = benchmarkRuns.filter((row) => row.status === 'ok').length
      const latestFreshnessHours = benchmarkRuns.find((row) => typeof row.details?.freshness_hours === 'number')?.details?.freshness_hours ?? null

      metrics.push({
        metric_name: 'benchmark_freshness_sla_attainment_percent',
        metric_value: roundPct(withinSlaRuns, benchmarkRuns.length),
        metric_status: benchmarkRuns.length > 0 ? 'ok' : 'no_data',
        source_table: 'scheduled_job_observability_runs',
        source_notes: `job_name=emi-benchmark-pipeline;runs=${benchmarkRuns.length};within_sla_runs=${withinSlaRuns};freshness_sla_hours=${freshnessSlaHours};latest_freshness_hours=${latestFreshnessHours ?? 'null'}`,
      })
    } catch (error) {
      console.error('[reporting.sprint-5-exit-metrics] benchmark freshness failed', error)
      metrics.push({
        metric_name: 'benchmark_freshness_sla_attainment_percent',
        metric_value: null,
        metric_status: 'query_error',
        source_table: 'scheduled_job_observability_runs',
        source_notes: 'query_error',
      })
    }

    try {
      const { data: postRows, error } = await sb
        .from('social_posts')
        .select('pillar,is_posted,posted_at,like_count,comment_count,impression_count,engagement_synced_at')
        .in('pillar', ['market_intel', 'user_story'])
        .eq('is_posted', true)
        .gte('posted_at', windowStart)
        .lte('posted_at', windowEnd)
        .limit(1000)

      if (error) throw error

      const proofPosts = (Array.isArray(postRows) ? postRows as SocialPostRow[] : [])
        .filter((row) => row.engagement_synced_at)
      const totalImpressions = proofPosts.reduce((sum, row) => sum + Number(row.impression_count ?? 0), 0)
      const totalEngagements = proofPosts.reduce((sum, row) => sum + Number(row.like_count ?? 0) + Number(row.comment_count ?? 0), 0)

      metrics.push({
        metric_name: 'proof_asset_engagement_rate_percent',
        metric_value: roundPct(totalEngagements, totalImpressions),
        metric_status: totalImpressions > 0 ? 'ok' : 'no_data',
        source_table: 'social_posts',
        source_notes: `pillars=market_intel,user_story;posts=${proofPosts.length};impressions=${totalImpressions};engagements=${totalEngagements}`,
      })
    } catch (error) {
      console.error('[reporting.sprint-5-exit-metrics] proof engagement failed', error)
      metrics.push({
        metric_name: 'proof_asset_engagement_rate_percent',
        metric_value: null,
        metric_status: 'query_error',
        source_table: 'social_posts',
        source_notes: 'query_error',
      })
    }

    try {
      const [{ data: prospectRows, error: prospectError }, { data: materialRows, error: materialError }] = await Promise.all([
        sb
          .from('b2b_prospects')
          .select('id,stage')
          .is('archived_at', null)
          .in('stage', ['proposal_sent', 'negotiating', 'closed_won', 'closed_lost'])
          .limit(10000),
        sb
          .from('b2b_materials')
          .select('prospect_id,created_at')
          .gte('created_at', windowStart)
          .lte('created_at', windowEnd)
          .limit(10000),
      ])

      if (prospectError) throw prospectError
      if (materialError) throw materialError

      const proposalStageProspects = Array.isArray(prospectRows) ? prospectRows as B2bProspectRow[] : []
      const proofExposureProspectIds = new Set((Array.isArray(materialRows) ? materialRows as B2bMaterialRow[] : []).map((row) => row.prospect_id))
      const exposedProspects = proposalStageProspects.filter((row) => proofExposureProspectIds.has(row.id))
      const acceptedProspects = exposedProspects.filter((row) => row.stage === 'closed_won')

      metrics.push({
        metric_name: 'proposal_acceptance_after_proof_exposure_percent',
        metric_value: roundPct(acceptedProspects.length, exposedProspects.length),
        metric_status: exposedProspects.length > 0 ? 'ok' : 'no_data',
        source_table: 'b2b_prospects,b2b_materials',
        source_notes: `proposal_or_later_prospects=${proposalStageProspects.length};proof_exposed_prospects=${exposedProspects.length};accepted_prospects=${acceptedProspects.length};exposure_definition=has_b2b_material_within_window`,
      })
    } catch (error) {
      console.error('[reporting.sprint-5-exit-metrics] proposal acceptance failed', error)
      metrics.push({
        metric_name: 'proposal_acceptance_after_proof_exposure_percent',
        metric_value: null,
        metric_status: 'query_error',
        source_table: 'b2b_prospects,b2b_materials',
        source_notes: 'query_error',
      })
    }

    const exportPayload = {
      sprint_key: SPRINT_KEY,
      generated_at: new Date().toISOString(),
      reference_date: referenceDate ?? null,
      trailing_days: trailingDays,
      freshness_sla_hours: freshnessSlaHours,
      metrics,
      values: Object.fromEntries(metrics.map((metric) => [metric.metric_name, metric.metric_value])),
    }

    const { data, error } = await sb
      .from('emi_sprint_export_runs')
      .insert({
        user_id: userId,
        sprint_key: SPRINT_KEY,
        export_payload: exportPayload,
      })
      .select('id')
      .single()

    if (error) {
      console.error('[reporting.sprint-5-exit-metrics] export write failed', error)
      return NextResponse.json({ error: 'Failed to persist sprint export' }, { status: 500 })
    }

    const status = metrics.every((metric) => metric.metric_status === 'ok') ? 'ok' : 'late'
    const { data: observabilityRun } = await sb
      .from('scheduled_job_observability_runs')
      .insert({
        user_id: userId,
        job_name: 'emi-sprint-5-exit-metrics-export',
        status,
        details: {
          sprint_key: SPRINT_KEY,
          metric_count: metrics.length,
          ok_metric_count: metrics.filter((metric) => metric.metric_status === 'ok').length,
          run_id: data?.id ?? null,
        },
      })
      .select('id')
      .single()

    return NextResponse.json({
      ok: true,
      runId: data?.id,
      observabilityRunId: observabilityRun?.id ?? null,
      sprintKey: SPRINT_KEY,
      exportPayload,
    })
  } catch (error) {
    console.error('[reporting.sprint-5-exit-metrics] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}