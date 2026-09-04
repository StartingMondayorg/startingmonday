/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAutomationAccess } from '@/lib/admin-automation-route'
import {
  EMI_KPI_MIN_DENOMINATOR,
  type EmiMetricStatus,
  day7CohortRange,
  denominatorStatus,
  ratioPercent,
  weekRange,
} from '@/lib/emi-kpi'

// SMK-445: metrics are computed from server-side aggregates (migration 185
// RPCs) that exclude synthetic accounts (users.is_synthetic) and guarantee
// numerator <= denominator. Ratios with a denominator under
// EMI_KPI_MIN_DENOMINATOR snapshot as 'insufficient_data' and are excluded
// from pass/fail scoring downstream.
//
// proof_assets_published_count and b2b_pilot_conversion_percent were removed
// from this job per the SMK-445 scope decision (Jira comment 10973,
// 2026-09-02): both measured seed data and are tracked manually now.

type KpiSnapshot = {
  metric_name:
    | 'emi_language_adoption_percent'
    | 'assessment_completion_percent'
    | 'day7_return_percent'
    | 'tier1_claim_compliance_percent'
  metric_value: number | null
  metric_status: EmiMetricStatus
  week_start: string
  week_end: string
  source_table: string
  source_notes: string
}

type FunnelResult = { denominator: number; numerator: number }

async function callFunnelRpc(
  sb: any,
  weekStartTs: string,
  weekEndTs: string,
  denominatorEvents: string[] | null,
  numeratorEvents: string[],
): Promise<FunnelResult> {
  const { data, error } = await sb.rpc('emi_kpi_event_funnel', {
    p_start: weekStartTs,
    p_end: weekEndTs,
    p_denominator_events: denominatorEvents,
    p_numerator_events: numeratorEvents,
  })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return {
    denominator: Number(row?.denominator ?? 0),
    numerator: Number(row?.numerator ?? 0),
  }
}

function ratioSnapshot(
  metricName: KpiSnapshot['metric_name'],
  numerator: number,
  denominator: number,
  week: { start: string; end: string },
  sourceTable: string,
  extraNotes = '',
): KpiSnapshot {
  const status = denominatorStatus(denominator)
  return {
    metric_name: metricName,
    metric_value: status === 'no_data' ? null : ratioPercent(numerator, denominator),
    metric_status: status,
    week_start: week.start,
    week_end: week.end,
    source_table: sourceTable,
    source_notes: `denominator=${denominator};numerator=${numerator};floor=${EMI_KPI_MIN_DENOMINATOR};synthetic_excluded=true${extraNotes}`,
  }
}

function errorSnapshot(
  metricName: KpiSnapshot['metric_name'],
  week: { start: string; end: string },
  sourceTable: string,
): KpiSnapshot {
  return {
    metric_name: metricName,
    metric_value: null,
    metric_status: 'query_error',
    week_start: week.start,
    week_end: week.end,
    source_table: sourceTable,
    source_notes: 'query_error',
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any
  const body = await request.json().catch(() => ({}))

  const week = weekRange(body?.referenceDate)
  const { start, end } = week
  const weekStartTs = `${start}T00:00:00.000Z`
  const weekEndTs = `${end}T23:59:59.999Z`

  const [{ count: contactsActive }, { count: followupsWeek }, { count: signalsWeek }] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
    supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekStartTs).lte('created_at', weekEndTs),
    supabase.from('company_signals').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekStartTs).lte('created_at', weekEndTs),
  ])

  const snapshots: KpiSnapshot[] = []

  // Q1: EMI language adoption percent. Denominator: distinct non-synthetic
  // users with any event in the week (server-side aggregate, defect 2 fix).
  try {
    const languageEvents = ['channel_entry_clicked', 'persona_route_selected', 'trust_block_viewed', 'micro_product_boundary_viewed']
    const funnel = await callFunnelRpc(sb, weekStartTs, weekEndTs, null, languageEvents)
    snapshots.push(ratioSnapshot('emi_language_adoption_percent', funnel.numerator, funnel.denominator, week, 'user_events'))
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q1 failed', error)
    snapshots.push(errorSnapshot('emi_language_adoption_percent', week, 'user_events'))
  }

  // Q2: Assessment completion percent, sourced from user_events instead of
  // the dead onboarding_qa_weekly_scorecards table (defect 1 fix). The
  // numerator is intersected with starters server-side, so it cannot exceed
  // the denominator.
  try {
    const funnel = await callFunnelRpc(sb, weekStartTs, weekEndTs, ['emi_assessment_started'], ['emi_assessment_completed'])
    snapshots.push(ratioSnapshot('assessment_completion_percent', funnel.numerator, funnel.denominator, week, 'user_events'))
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q2 failed', error)
    snapshots.push(errorSnapshot('assessment_completion_percent', week, 'user_events'))
  }

  // Q3: Day-7 return percent on a fixed weekly cohort with full 7-day
  // maturity: the cohort scored for this reporting week is the activation
  // week one week earlier (defect 3 fix).
  try {
    const { cohortStart, cohortEnd } = day7CohortRange(start, end)
    const { data, error } = await sb.rpc('emi_kpi_day7_cohort', {
      p_cohort_start: `${cohortStart}T00:00:00.000Z`,
      p_cohort_end: `${cohortEnd}T23:59:59.999Z`,
    })
    if (error) throw error
    const row = Array.isArray(data) ? data[0] : data
    const activated = Number(row?.activated ?? 0)
    const returned = Number(row?.returned ?? 0)
    snapshots.push(ratioSnapshot(
      'day7_return_percent',
      returned,
      activated,
      week,
      'user_events',
      `;cohort_start=${cohortStart};cohort_end=${cohortEnd}`,
    ))
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q3 failed', error)
    snapshots.push(errorSnapshot('day7_return_percent', week, 'user_events'))
  }

  // Q6: Tier-1 claim compliance percent via server-side counts. The
  // denominator here is active claims, not users, so the user-sample floor
  // does not apply; zero active claims is no_data.
  try {
    const [{ count: activeClaims, error: activeError }, { count: compliantClaims, error: compliantError }] = await Promise.all([
      sb.from('tier1_claims').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      sb.from('tier1_claims')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'active')
        .eq('audit_status', 'compliant')
        .not('metric_definition', 'is', null)
        .neq('metric_definition', '')
        .not('denominator', 'is', null)
        .not('timeframe', 'is', null)
        .neq('timeframe', '')
        .not('confidence_label', 'is', null)
        .neq('confidence_label', ''),
    ])
    if (activeError) throw activeError
    if (compliantError) throw compliantError

    const active = activeClaims ?? 0
    const compliant = compliantClaims ?? 0
    snapshots.push({
      metric_name: 'tier1_claim_compliance_percent',
      metric_value: active > 0 ? ratioPercent(compliant, active) : null,
      metric_status: active > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'tier1_claims',
      source_notes: `active_claims=${active};compliant_claims=${compliant}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q6 failed', error)
    snapshots.push(errorSnapshot('tier1_claim_compliance_percent', week, 'tier1_claims'))
  }

  const snapshotWrite = await sb.from('emi_kpi_snapshots').upsert(snapshots, { onConflict: 'metric_name,week_start,week_end' })
  if (snapshotWrite.error) {
    console.error('[weekly-kpi-summaries] snapshot write skipped', snapshotWrite.error)
    return NextResponse.json({
      error: 'Failed to persist EMI KPI snapshots',
      details: snapshotWrite.error.message,
      weekStart: start,
      weekEnd: end,
    }, { status: 500 })
  }

  const metricsMap = Object.fromEntries(
    snapshots.map((snapshot) => [snapshot.metric_name, { value: snapshot.metric_value, status: snapshot.metric_status, source: snapshot.source_table, notes: snapshot.source_notes }])
  )

  const summaryPayload = {
    generated_at: new Date().toISOString(),
    contacts_active: contactsActive ?? 0,
    followups_week: followupsWeek ?? 0,
    signals_week: signalsWeek ?? 0,
    emi_metrics: metricsMap,
    emi_language_adoption_percent: metricsMap.emi_language_adoption_percent?.value ?? null,
    assessment_completion_percent: metricsMap.assessment_completion_percent?.value ?? null,
    day7_return_percent: metricsMap.day7_return_percent?.value ?? null,
    tier1_claim_compliance_percent: metricsMap.tier1_claim_compliance_percent?.value ?? null,
  }

  const { data } = await sb
    .from('weekly_kpi_summary_runs')
    .insert({ user_id: userId, week_start: start, week_end: end, summary_payload: summaryPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, weekStart: start, weekEnd: end, summaryPayload, snapshots, snapshotWriteError: null })
}
