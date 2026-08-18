 
import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'
import { sendSlackMessage } from '@/lib/slack'
import { toPercent } from '@/lib/partner-kpi-schema'

const PILOT_TARGET_COUNT = 3

const CHECKLIST_TEMPLATE = [
  {
    id: 'dashboard_scope_verified',
    label: 'Dashboard scope verified for partner account',
    required: true,
  },
  {
    id: 'cohort_population_verified',
    label: 'Pilot cohort population verified with attributed users',
    required: true,
  },
  {
    id: 'kpi_data_window_verified',
    label: 'KPI window has current telemetry events',
    required: true,
  },
  {
    id: 'pilot_signoff_completed',
    label: 'Pilot sign-off completed by lane owner protocol',
    required: true,
  },
] as const

function parseLookbackDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? '30', 10)
  if (!Number.isFinite(raw)) return 30
  return Math.max(7, Math.min(raw, 90))
}

function dueDateIso(daysAhead: number): string {
  const date = new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 10)
}

function passRateToSignoff(passRate: number): 'approved' | 'hold' {
  return passRate >= 75 ? 'approved' : 'hold'
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)
  const lookbackDays = parseLookbackDays(request)
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const partnersQuery = await sb
    .from('partners')
    .select('id,name,email,is_active,created_at')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(PILOT_TARGET_COUNT)

  const pilotPartners = (partnersQuery.data ?? []) as Array<{
    id: string
    name: string
    email: string
    is_active: boolean
    created_at: string
  }>

  const partnerIds = pilotPartners.map((partner) => partner.id)

  let attributions: Array<{ partner_id: string; signup_user_id: string; attributed_at: string }> = []
  if (partnerIds.length > 0) {
    const attributionsQuery = await sb
      .from('referral_attributions')
      .select('partner_id,signup_user_id,attributed_at')
      .in('partner_id', partnerIds)
    attributions = (attributionsQuery.data ?? []) as typeof attributions
  }

  const scopedUserIds = Array.from(new Set(attributions.map((row) => row.signup_user_id)))

  let eventRows: Array<{ user_id: string; created_at: string }> = []
  let prepRows: Array<{ user_id: string; created_at: string }> = []
  let followupRows: Array<{ user_id: string; status: string | null; created_at: string }> = []

  if (scopedUserIds.length > 0) {
    const [eventsRes, prepsRes, followupsRes] = await Promise.all([
      sb
        .from('user_events')
        .select('user_id,created_at')
        .in('user_id', scopedUserIds)
        .gte('created_at', sinceIso)
        .limit(100000),
      sb
        .from('briefs')
        .select('user_id,created_at,type')
        .in('user_id', scopedUserIds)
        .in('type', ['prep', 'prep_section'])
        .gte('created_at', sinceIso)
        .limit(100000),
      sb
        .from('follow_ups')
        .select('user_id,status,created_at')
        .in('user_id', scopedUserIds)
        .gte('created_at', sinceIso)
        .limit(100000),
    ])

    eventRows = (eventsRes.data ?? []) as typeof eventRows
    prepRows = (prepsRes.data ?? []) as Array<{ user_id: string; created_at: string }>
    followupRows = (followupsRes.data ?? []) as typeof followupRows
  }

  const completedFollowupStatuses = new Set(['done', 'completed', 'sent'])
  const defects: Array<{
    partner_id: string
    partner_name: string
    defect_code: string
    owner: string
    remediation_due_date: string
    severity: 'high' | 'medium'
    message: string
  }> = []

  const validationRows = pilotPartners.map((partner) => {
    const partnerUserIds = Array.from(
      new Set(
        attributions
          .filter((row) => row.partner_id === partner.id)
          .map((row) => row.signup_user_id),
      ),
    )

    const eventUsers = new Set(eventRows.filter((row) => partnerUserIds.includes(row.user_id)).map((row) => row.user_id))
    const prepUsers = new Set(prepRows.filter((row) => partnerUserIds.includes(row.user_id)).map((row) => row.user_id))
    const followupUsers = new Set(
      followupRows
        .filter((row) => partnerUserIds.includes(row.user_id) && completedFollowupStatuses.has((row.status ?? '').toLowerCase()))
        .map((row) => row.user_id),
    )

    const denominator = partnerUserIds.length
    const utilizationRate = toPercent(eventUsers.size, denominator)
    const prepCompletionRate = toPercent(prepUsers.size, denominator)
    const followupCompletionRate = toPercent(followupUsers.size, denominator)

    const kpiWindowOk = eventUsers.size > 0
    const signoffRate = (utilizationRate + prepCompletionRate + followupCompletionRate) / 3
    const signoffDecision = passRateToSignoff(signoffRate)

    const checklist = [
      {
        id: CHECKLIST_TEMPLATE[0].id,
        label: CHECKLIST_TEMPLATE[0].label,
        pass: Boolean(partner.is_active),
      },
      {
        id: CHECKLIST_TEMPLATE[1].id,
        label: CHECKLIST_TEMPLATE[1].label,
        pass: denominator > 0,
      },
      {
        id: CHECKLIST_TEMPLATE[2].id,
        label: CHECKLIST_TEMPLATE[2].label,
        pass: kpiWindowOk,
      },
      {
        id: CHECKLIST_TEMPLATE[3].id,
        label: CHECKLIST_TEMPLATE[3].label,
        pass: signoffDecision === 'approved',
      },
    ]

    const failedItems = checklist.filter((item) => !item.pass)
    if (failedItems.length > 0) {
      defects.push({
        partner_id: partner.id,
        partner_name: partner.name,
        defect_code: 'pilot_validation_incomplete',
        owner: 'lane_e_partner_ops',
        remediation_due_date: dueDateIso(7),
        severity: signoffDecision === 'approved' ? 'medium' : 'high',
        message: `Checklist gaps for ${partner.name}: ${failedItems.map((item) => item.id).join(', ')}`,
      })
    }

    return {
      partner_id: partner.id,
      partner_name: partner.name,
      checklist,
      metrics: {
        users_in_scope: denominator,
        utilization_rate: utilizationRate,
        prep_completion_rate: prepCompletionRate,
        followup_completion_rate: followupCompletionRate,
      },
      signoff: {
        decision: signoffDecision,
        score: Number(signoffRate.toFixed(2)),
        completed_at: signoffDecision === 'approved' ? new Date().toISOString() : null,
        protocol: 'lane_e_partner_ops_review_v1',
      },
    }
  })

  let defectsLogged = 0
  for (const defect of defects) {
    const existing = await sb
      .from('automation_alerts')
      .select('id')
      .eq('user_id', userId)
      .eq('source_table', 'partners')
      .eq('alert_code', defect.defect_code)
      .eq('status', 'open')
      .eq('message', defect.message)
      .maybeSingle()

    if (existing.data?.id) continue

    const insertRes = await sb.from('automation_alerts').insert({
      user_id: userId,
      source_table: 'partners',
      alert_code: defect.defect_code,
      severity: defect.severity,
      message: `${defect.message} | owner=${defect.owner} | remediation_due_date=${defect.remediation_due_date}`,
      status: 'open',
    })
    if (!insertRes.error) defectsLogged += 1
  }

  const completedSignoffs = validationRows.filter((row) => row.signoff.decision === 'approved').length
  const summary = {
    checklist_published: true,
    pilot_accounts_target: PILOT_TARGET_COUNT,
    pilot_accounts_evaluated: validationRows.length,
    signoff_completed_count: completedSignoffs,
    acceptance_pass: validationRows.length >= PILOT_TARGET_COUNT && completedSignoffs >= PILOT_TARGET_COUNT,
  }

  const report = [
    'Pilot partner validation workflow report',
    `lookback_days=${lookbackDays}`,
    `checklist_published=${summary.checklist_published}`,
    `pilot_accounts_evaluated=${summary.pilot_accounts_evaluated}`,
    `signoff_completed_count=${summary.signoff_completed_count}`,
    `defects_logged=${defectsLogged}`,
  ].join('\n')

  const slack = await sendSlackMessage({ text: report })

  return NextResponse.json({
    ok: true,
    ticket: 'PB-Q1-003',
    generated_at: new Date().toISOString(),
    lookback_days: lookbackDays,
    checklist_template: CHECKLIST_TEMPLATE,
    summary,
    pilot_validations: validationRows,
    defects,
    defects_logged: defectsLogged,
    distribution: {
      channel: 'slack',
      sent: slack.ok,
    },
  })
}
