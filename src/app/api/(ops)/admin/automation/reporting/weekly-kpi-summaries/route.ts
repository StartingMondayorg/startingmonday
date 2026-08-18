/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAutomationAccess } from '@/lib/admin-automation-route'
import { createAdminClient } from '@/lib/supabase/admin'

type KpiStatus = 'ok' | 'no_data' | 'query_error'

type KpiSnapshot = {
  metric_name:
    | 'emi_language_adoption_percent'
    | 'assessment_completion_percent'
    | 'day7_return_percent'
    | 'proof_assets_published_count'
    | 'b2b_pilot_conversion_percent'
    | 'tier1_claim_compliance_percent'
  metric_value: number | null
  metric_status: KpiStatus
  week_start: string
  week_end: string
  source_table: string
  source_notes: string
}

function weekRange(refDate?: string): { start: string; end: string } {
  const base = refDate ? new Date(refDate) : new Date()
  const day = base.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - diffToMonday))
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + 6))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

function roundPct(numerator: number, denominator: number): number | null {
  if (!denominator) return null
  return Math.round((numerator / denominator) * 10000) / 100
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any
  const admin = createAdminClient() as any
  const body = await request.json().catch(() => ({}))

  const { start, end } = weekRange(body?.referenceDate)
  const weekStartTs = `${start}T00:00:00.000Z`
  const weekEndTs = `${end}T23:59:59.999Z`

  const [{ count: contactsActive }, { count: followupsWeek }, { count: signalsWeek }] = await Promise.all([
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
    supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekStartTs).lte('created_at', weekEndTs),
    supabase.from('company_signals').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', weekStartTs).lte('created_at', weekEndTs),
  ])

  const snapshots: KpiSnapshot[] = []

  // Q1: EMI language adoption percent (canonical, non-proxy)
  try {
    const languageEvents = ['channel_entry_clicked', 'persona_route_selected', 'trust_block_viewed', 'micro_product_boundary_viewed']
    const [{ data: baselineRows }, { data: languageRows }] = await Promise.all([
      sb.from('user_events').select('user_id').gte('created_at', weekStartTs).lte('created_at', weekEndTs).limit(100000),
      sb.from('user_events').select('user_id').in('event_name', languageEvents).gte('created_at', weekStartTs).lte('created_at', weekEndTs).limit(100000),
    ])

    const baselineUsers = new Set<string>((baselineRows ?? []).map((r: { user_id: string }) => r.user_id))
    const adoptionUsers = new Set<string>((languageRows ?? []).map((r: { user_id: string }) => r.user_id))
    snapshots.push({
      metric_name: 'emi_language_adoption_percent',
      metric_value: roundPct(adoptionUsers.size, baselineUsers.size),
      metric_status: baselineUsers.size > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'user_events',
      source_notes: `baseline_users=${baselineUsers.size};adoption_users=${adoptionUsers.size}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q1 failed', error)
    snapshots.push({
      metric_name: 'emi_language_adoption_percent',
      metric_value: null,
      metric_status: 'query_error',
      week_start: start,
      week_end: end,
      source_table: 'user_events',
      source_notes: 'query_error',
    })
  }

  // Q2: Assessment completion percent (canonical scorecard source)
  try {
    const { data: onboardingRows } = await sb
      .from('onboarding_qa_weekly_scorecards')
      .select('started_users,completed_users,week_start')
      .gte('week_start', start)
      .lte('week_start', end)

    let started = 0
    let completed = 0
    for (const row of onboardingRows ?? []) {
      started += Number(row.started_users ?? 0)
      completed += Number(row.completed_users ?? 0)
    }

    snapshots.push({
      metric_name: 'assessment_completion_percent',
      metric_value: roundPct(completed, started),
      metric_status: started > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'onboarding_qa_weekly_scorecards',
      source_notes: `started=${started};completed=${completed}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q2 failed', error)
    snapshots.push({
      metric_name: 'assessment_completion_percent',
      metric_value: null,
      metric_status: 'query_error',
      week_start: start,
      week_end: end,
      source_table: 'onboarding_qa_weekly_scorecards',
      source_notes: 'query_error',
    })
  }

  // Q3: Day-7 return percent for activated cohort.
  try {
    const startWindow = new Date(`${end}T23:59:59.999Z`)
    startWindow.setUTCDate(startWindow.getUTCDate() - 60)
    const cohortStartTs = startWindow.toISOString()

    const { data: activationRows } = await sb
      .from('user_events')
      .select('user_id,created_at,event_name')
      .in('event_name', ['onboarding_started', 'emi_onboarding_started'])
      .gte('created_at', cohortStartTs)
      .lte('created_at', weekEndTs)
      .order('created_at', { ascending: true })
      .limit(200000)

    const firstActivationByUser = new Map<string, Date>()
    for (const row of activationRows ?? []) {
      if (!firstActivationByUser.has(row.user_id)) {
        firstActivationByUser.set(row.user_id, new Date(row.created_at))
      }
    }

    const activatedUsers = Array.from(firstActivationByUser.keys())
    let returnedUsers = 0
    if (activatedUsers.length > 0) {
      const { data: allRows } = await sb
        .from('user_events')
        .select('user_id,created_at')
        .in('user_id', activatedUsers)
        .gte('created_at', cohortStartTs)
        .lte('created_at', weekEndTs)
        .order('created_at', { ascending: true })
        .limit(300000)

      const returned = new Set<string>()
      for (const row of allRows ?? []) {
        const startedAt = firstActivationByUser.get(row.user_id)
        if (!startedAt) continue
        const eventAt = new Date(row.created_at)
        const delta = eventAt.getTime() - startedAt.getTime()
        if (delta >= 24 * 60 * 60 * 1000 && delta <= 7 * 24 * 60 * 60 * 1000) {
          returned.add(row.user_id)
        }
      }
      returnedUsers = returned.size
    }

    snapshots.push({
      metric_name: 'day7_return_percent',
      metric_value: roundPct(returnedUsers, activatedUsers.length),
      metric_status: activatedUsers.length > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'user_events',
      source_notes: `activated=${activatedUsers.length};returned=${returnedUsers}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q3 failed', error)
    snapshots.push({
      metric_name: 'day7_return_percent',
      metric_value: null,
      metric_status: 'query_error',
      week_start: start,
      week_end: end,
      source_table: 'user_events',
      source_notes: 'query_error',
    })
  }

  // Q4: Proof assets published count.
  try {
    const proofWindowStart = new Date(`${end}T23:59:59.999Z`)
    proofWindowStart.setUTCDate(proofWindowStart.getUTCDate() - 90)
    const proofWindowStartTs = proofWindowStart.toISOString()

    const { count: publishedProofAssets } = await sb
      .from('proof_assets')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', proofWindowStartTs)
      .lte('published_at', weekEndTs)

    snapshots.push({
      metric_name: 'proof_assets_published_count',
      metric_value: publishedProofAssets ?? null,
      metric_status: (publishedProofAssets ?? 0) > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'proof_assets',
      source_notes: `published_assets=${publishedProofAssets ?? 0}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q4 failed', error)
    snapshots.push({
      metric_name: 'proof_assets_published_count',
      metric_value: null,
      metric_status: 'query_error',
      week_start: start,
      week_end: end,
      source_table: 'proof_assets',
      source_notes: 'query_error',
    })
  }

  // Q5: B2B pilot conversion percent.
  try {
    const b2bStartWindow = new Date(`${end}T23:59:59.999Z`)
    b2bStartWindow.setUTCDate(b2bStartWindow.getUTCDate() - 90)
    const b2bStartTs = b2bStartWindow.toISOString()

    let rows: Array<{ stage: string; created_at: string; archived_at: string | null; qualified_at?: string | null; pilot_approved_at?: string | null }> = []
    const primary = await admin
      .from('b2b_prospects')
      .select('stage,created_at,archived_at,qualified_at,pilot_approved_at')
      .is('archived_at', null)
      .gte('created_at', b2bStartTs)
      .limit(10000)

    if (primary.error) {
      const fallback = await admin
        .from('b2b_prospects')
        .select('stage,created_at,archived_at')
        .is('archived_at', null)
        .gte('created_at', b2bStartTs)
        .limit(10000)
      rows = fallback.data ?? []
    } else {
      rows = primary.data ?? []
    }

    let denominator = 0
    let numerator = 0
    for (const row of rows) {
      const isQualified = Boolean(row.qualified_at) || ['proposal_sent', 'negotiating', 'closed_won', 'closed_lost'].includes(row.stage)
      const isApproved = Boolean(row.pilot_approved_at) || row.stage === 'closed_won'
      if (isQualified) denominator += 1
      if (isQualified && isApproved) numerator += 1
    }

    snapshots.push({
      metric_name: 'b2b_pilot_conversion_percent',
      metric_value: roundPct(numerator, denominator),
      metric_status: denominator > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'b2b_prospects',
      source_notes: `denominator=${denominator};numerator=${numerator}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q5 failed', error)
    snapshots.push({
      metric_name: 'b2b_pilot_conversion_percent',
      metric_value: null,
      metric_status: 'query_error',
      week_start: start,
      week_end: end,
      source_table: 'b2b_prospects',
      source_notes: 'query_error',
    })
  }

  // Q6: Tier-1 claim compliance percent.
  try {
    const { data: claimRows } = await sb
      .from('tier1_claims')
      .select('metric_definition,denominator,timeframe,confidence_label,status,audit_status')
      .eq('status', 'active')
      .limit(10000)

    const activeClaims = claimRows ?? []
    const compliantClaims = activeClaims.filter((row: {
      metric_definition: string | null
      denominator: number | null
      timeframe: string | null
      confidence_label: string | null
      audit_status: string
    }) => (
      Boolean(row.metric_definition)
      && row.denominator !== null
      && Boolean(row.timeframe)
      && Boolean(row.confidence_label)
      && row.audit_status === 'compliant'
    ))

    snapshots.push({
      metric_name: 'tier1_claim_compliance_percent',
      metric_value: roundPct(compliantClaims.length, activeClaims.length),
      metric_status: activeClaims.length > 0 ? 'ok' : 'no_data',
      week_start: start,
      week_end: end,
      source_table: 'tier1_claims',
      source_notes: `active_claims=${activeClaims.length};compliant_claims=${compliantClaims.length}`,
    })
  } catch (error) {
    console.error('[weekly-kpi-summaries] Q6 failed', error)
    snapshots.push({
      metric_name: 'tier1_claim_compliance_percent',
      metric_value: null,
      metric_status: 'query_error',
      week_start: start,
      week_end: end,
      source_table: 'tier1_claims',
      source_notes: 'query_error',
    })
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
    proof_assets_published_count: metricsMap.proof_assets_published_count?.value ?? null,
    b2b_pilot_conversion_percent: metricsMap.b2b_pilot_conversion_percent?.value ?? null,
    tier1_claim_compliance_percent: metricsMap.tier1_claim_compliance_percent?.value ?? null,
  }

  const { data } = await sb
    .from('weekly_kpi_summary_runs')
    .insert({ user_id: userId, week_start: start, week_end: end, summary_payload: summaryPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, weekStart: start, weekEnd: end, summaryPayload, snapshots, snapshotWriteError: null })
}

