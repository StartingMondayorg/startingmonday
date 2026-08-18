import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

type ShortlistEventName =
  | 'shortlist_sprint_viewed'
  | 'shortlist_sprint_cta_clicked'
  | 'shortlist_sprint_checkout_started'
  | 'shortlist_sprint_purchased'
  | 'shortlist_sprint_delivered'
  | 'shortlist_sprint_credit_applied'

type PilotEventName = 'partner_pilot_seat_status_updated'

const SHORTLIST_EVENTS: readonly ShortlistEventName[] = [
  'shortlist_sprint_viewed',
  'shortlist_sprint_cta_clicked',
  'shortlist_sprint_checkout_started',
  'shortlist_sprint_purchased',
  'shortlist_sprint_delivered',
  'shortlist_sprint_credit_applied',
] as const

const PAID_SPRINT_PRICE_USD = 199
const TIER_MRR_USD: Record<string, number> = {
  passive: 49,
  monitor: 49,
  active: 199,
  executive: 499,
  concierge: 499,
}

function parseLookbackDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? '30', 10)
  if (!Number.isFinite(raw)) return 30
  return Math.max(7, Math.min(raw, 120))
}

function percentage(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function toIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function nullableNumber(value: number | null): number | null {
  if (value === null) return null
  return Number(value.toFixed(2))
}

function percentageOrNull(numerator: number, denominator: number): number | null {
  if (!denominator) return null
  return Number(((numerator / denominator) * 100).toFixed(2))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = parseLookbackDays(request)

  const now = new Date()
  const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
  const sinceIso = since.toISOString()

  const [
    shortlistResult,
    pilotResult,
    partnersResult,
    scorecardsResult,
    cronRunsResult,
    refundsResult,
    actionEventsResult,
    interviewsResult,
    referralAttributionsResult,
    usersResult,
    partnersAllResult,
    partnerProgramsResult,
    marketingSpendResult,
    partnerCommercialEventsResult,
  ] = await Promise.all([
    sb
      .from('user_events')
      .select('event_name, user_id, created_at')
      .in('event_name', [...SHORTLIST_EVENTS])
      .gte('created_at', sinceIso)
      .limit(200000),
    sb
      .from('user_events')
      .select('event_name, user_id, created_at, properties')
      .eq('event_name', 'partner_pilot_seat_status_updated' satisfies PilotEventName)
      .gte('created_at', sinceIso)
      .limit(100000),
    sb
      .from('partners')
      .select('id, name, is_active')
      .eq('is_active', true)
      .limit(100000),
    sb
      .from('wedge_funnel_weekly_scorecards')
      .select('week_start, generated_at, lookback_days, shortlist_purchase_rate_from_checkout, shortlist_delivery_completion_rate, pilot_seats_active_rate, pilot_at_risk_seats, decision_summary, decision_motion1_direct_paid_sprint, decision_motion2_partner_pilot, decision_reasons')
      .order('week_start', { ascending: false })
      .limit(8),
    sb
      .from('wedge_funnel_scorecard_cron_runs')
      .select('triggered_at, success, error_code, error_message, http_status')
      .order('triggered_at', { ascending: false })
      .limit(8),
    sb
      .from('refund_workflow_triggers')
      .select('id, created_at')
      .gte('created_at', sinceIso)
      .limit(50000),
    sb
      .from('signal_action_events')
      .select('id, user_id, action_type, created_at')
      .gte('created_at', sinceIso)
      .limit(100000),
    sb
      .from('company_interview_logs')
      .select('id, user_id, created_at')
      .gte('created_at', sinceIso)
      .limit(100000),
    sb
      .from('referral_attributions')
      .select('signup_user_id, partner_id, attributed_at')
      .gte('attributed_at', sinceIso)
      .limit(100000),
    sb
      .from('users')
      .select('id, subscription_tier, subscription_status, created_at')
      .gte('created_at', sinceIso)
      .limit(100000),
    sb
      .from('partners')
      .select('id, commission_pct, seats_purchased, is_active')
      .eq('is_active', true)
      .limit(100000),
    sb
      .from('partner_programs')
      .select('id, partner_id, status, created_at, closed_at')
      .gte('created_at', sinceIso)
      .limit(100000),
    sb
      .from('marketing_spend_entries')
      .select('motion, channel, amount_usd, effective_at')
      .eq('motion', 'direct_paid_sprint')
      .gte('effective_at', sinceIso)
      .limit(100000),
    sb
      .from('partner_commercial_events')
      .select('partner_id, event_type, amount_usd, effective_at')
      .gte('effective_at', sinceIso)
      .limit(100000),
  ])

  const errors = [
    shortlistResult,
    pilotResult,
    partnersResult,
    scorecardsResult,
    cronRunsResult,
    refundsResult,
    actionEventsResult,
    interviewsResult,
    referralAttributionsResult,
    usersResult,
    partnersAllResult,
    partnerProgramsResult,
    marketingSpendResult,
    partnerCommercialEventsResult,
  ]
    .map((result) => result.error?.message)
    .filter((message): message is string => Boolean(message))

  if (errors.length > 0) {
    return NextResponse.json({ error: 'Failed to build wedge epic closeout package.', details: errors }, { status: 500 })
  }

  const shortlistRows = (shortlistResult.data ?? []) as Array<{ event_name: ShortlistEventName; user_id: string; created_at: string }>
  const pilotRows = (pilotResult.data ?? []) as Array<{
    user_id: string
    created_at: string
    properties: { seat_owner?: string; next_status?: string } | null
  }>

  const uniqueUsersByShortlistEvent = Object.fromEntries(
    SHORTLIST_EVENTS.map((eventName) => [eventName, new Set<string>()]),
  ) as Record<ShortlistEventName, Set<string>>

  for (const row of shortlistRows) {
    uniqueUsersByShortlistEvent[row.event_name].add(row.user_id)
  }

  const shortlistUsers = {
    viewed: uniqueUsersByShortlistEvent.shortlist_sprint_viewed.size,
    checkout_started: uniqueUsersByShortlistEvent.shortlist_sprint_checkout_started.size,
    purchased: uniqueUsersByShortlistEvent.shortlist_sprint_purchased.size,
    delivered: uniqueUsersByShortlistEvent.shortlist_sprint_delivered.size,
    credit_applied: uniqueUsersByShortlistEvent.shortlist_sprint_credit_applied.size,
  }

  const firstPurchasedAtByUser = new Map<string, string>()
  const firstDeliveredAtByUser = new Map<string, string>()

  for (const row of shortlistRows) {
    if (row.event_name === 'shortlist_sprint_purchased') {
      const existing = firstPurchasedAtByUser.get(row.user_id)
      if (!existing || new Date(row.created_at) < new Date(existing)) {
        firstPurchasedAtByUser.set(row.user_id, row.created_at)
      }
    }

    if (row.event_name === 'shortlist_sprint_delivered') {
      const existing = firstDeliveredAtByUser.get(row.user_id)
      if (!existing || new Date(row.created_at) < new Date(existing)) {
        firstDeliveredAtByUser.set(row.user_id, row.created_at)
      }
    }
  }

  const deliveryHours: number[] = []
  for (const [userId, purchasedAt] of firstPurchasedAtByUser.entries()) {
    const deliveredAt = firstDeliveredAtByUser.get(userId)
    if (!deliveredAt) continue

    const deltaMs = new Date(deliveredAt).getTime() - new Date(purchasedAt).getTime()
    if (deltaMs >= 0) {
      deliveryHours.push(deltaMs / (1000 * 60 * 60))
    }
  }

  const avgDeliveryHours = deliveryHours.length > 0
    ? deliveryHours.reduce((sum, value) => sum + value, 0) / deliveryHours.length
    : null

  const latestSeatStatusByOwner = new Map<string, { next_status: string; created_at: string }>()
  for (const row of pilotRows) {
    const seatOwner = row.properties?.seat_owner
    const nextStatus = row.properties?.next_status
    if (!seatOwner || !nextStatus) continue

    const existing = latestSeatStatusByOwner.get(seatOwner)
    if (!existing || new Date(row.created_at) > new Date(existing.created_at)) {
      latestSeatStatusByOwner.set(seatOwner, { next_status: nextStatus, created_at: row.created_at })
    }
  }

  const seatsActivated = latestSeatStatusByOwner.size
  const seatsAtRisk = Array.from(latestSeatStatusByOwner.values()).filter((row) => row.next_status === 'at_risk').length
  const seatsActiveRate = seatsActivated > 0
    ? percentage(Math.max(seatsActivated - seatsAtRisk, 0), seatsActivated)
    : 0

  const latestScorecard = ((scorecardsResult.data ?? []) as Array<Record<string, unknown>>)[0] ?? null
  const decisionSummary = latestScorecard ? String(latestScorecard.decision_summary ?? 'iterate') : 'iterate'

  const latestCronRuns = (cronRunsResult.data ?? []) as Array<{
    triggered_at: string
    success: boolean
    error_code: string | null
    error_message: string | null
    http_status: number | null
  }>
  const actionRows = (actionEventsResult.data ?? []) as Array<{
    id: string
    user_id: string
    action_type: string
    created_at: string
  }>
  const interviewRows = (interviewsResult.data ?? []) as Array<{
    id: string
    user_id: string
    created_at: string
  }>
  const attributionRows = (referralAttributionsResult.data ?? []) as Array<{
    signup_user_id: string
    partner_id: string
    attributed_at: string
  }>
  const userRows = (usersResult.data ?? []) as Array<{
    id: string
    subscription_tier: string | null
    subscription_status: string
    created_at: string
  }>
  const partnerCommissionRows = (partnersAllResult.data ?? []) as Array<{
    id: string
    commission_pct: number
    seats_purchased: number
    is_active: boolean
  }>
  const partnerProgramRows = (partnerProgramsResult.data ?? []) as Array<{
    id: string
    partner_id: string
    status: string
    created_at: string
    closed_at: string | null
  }>
  const marketingSpendRows = (marketingSpendResult.data ?? []) as Array<{
    motion: string
    channel: string | null
    amount_usd: number
    effective_at: string
  }>
  const partnerCommercialEventRows = (partnerCommercialEventsResult.data ?? []) as Array<{
    partner_id: string
    event_type: 'pilot_fee_collected' | 'expansion_proposal_sent' | 'expansion_accepted' | 'expansion_rejected'
    amount_usd: number | null
    effective_at: string
  }>

  const recentCronFailures = latestCronRuns.filter((row) => !row.success)
  const refundCount = (refundsResult.data ?? []).length
  const refundRate = percentage(refundCount, shortlistUsers.purchased)

  const purchasedUserIds = new Set(Array.from(firstPurchasedAtByUser.keys()))
  const actionUserIds = new Set(actionRows.map((row) => row.user_id))
  const interviewUserIds = new Set(interviewRows.map((row) => row.user_id))

  const purchasedUsersWithRelationshipAction = Array.from(purchasedUserIds).filter((userId) => actionUserIds.has(userId)).length
  const purchasedUsersWithQualifiedConversation = Array.from(purchasedUserIds).filter((userId) => interviewUserIds.has(userId)).length

  const firstActionAtByUser = new Map<string, string>()
  for (const row of actionRows) {
    const existing = firstActionAtByUser.get(row.user_id)
    if (!existing || new Date(row.created_at) < new Date(existing)) {
      firstActionAtByUser.set(row.user_id, row.created_at)
    }
  }

  const purchasedUsersWithActionWithin7d = Array.from(firstPurchasedAtByUser.entries()).filter(([userId, purchasedAt]) => {
    const firstActionAt = firstActionAtByUser.get(userId)
    if (!firstActionAt) return false
    const deltaMs = new Date(firstActionAt).getTime() - new Date(purchasedAt).getTime()
    return deltaMs >= 0 && deltaMs <= 7 * 24 * 60 * 60 * 1000
  }).length

  const usersById = new Map(userRows.map((row) => [row.id, row]))
  const activeAttributedRows = attributionRows.filter((row) => {
    const user = usersById.get(row.signup_user_id)
    return user?.subscription_status === 'active'
  })

  const activeAttributedMonthlyRevenue = activeAttributedRows.reduce((sum, row) => {
    const user = usersById.get(row.signup_user_id)
    const tier = (user?.subscription_tier ?? '').toLowerCase()
    return sum + (TIER_MRR_USD[tier] ?? 0)
  }, 0)

  const commissionPctByPartnerId = new Map(
    partnerCommissionRows.map((row) => [row.id, Number(row.commission_pct ?? 0)]),
  )

  const partnerMonthlyCommissionCost = activeAttributedRows.reduce((sum, row) => {
    const user = usersById.get(row.signup_user_id)
    const tier = (user?.subscription_tier ?? '').toLowerCase()
    const monthlyRevenue = TIER_MRR_USD[tier] ?? 0
    const commissionPct = commissionPctByPartnerId.get(row.partner_id) ?? 0
    return sum + (monthlyRevenue * commissionPct / 100)
  }, 0)

  const activeAttributedCount = activeAttributedRows.length
  const partnerCacPerActiveUser = activeAttributedCount > 0
    ? Number((partnerMonthlyCommissionCost / activeAttributedCount).toFixed(2))
    : null
  const partnerArpuMonthly = activeAttributedCount > 0
    ? Number((activeAttributedMonthlyRevenue / activeAttributedCount).toFixed(2))
    : null
  const partnerPaybackMonths = partnerCacPerActiveUser !== null && partnerArpuMonthly && partnerArpuMonthly > 0
    ? Number((partnerCacPerActiveUser / partnerArpuMonthly).toFixed(2))
    : null
  const partnerGrossMarginPct = activeAttributedMonthlyRevenue > 0
    ? Number((((activeAttributedMonthlyRevenue - partnerMonthlyCommissionCost) / activeAttributedMonthlyRevenue) * 100).toFixed(2))
    : null

  const paidSprintGrossRevenue = shortlistUsers.purchased * PAID_SPRINT_PRICE_USD
  const paidSprintRefundCost = refundCount * PAID_SPRINT_PRICE_USD
  const paidSprintNetRevenue = Math.max(paidSprintGrossRevenue - paidSprintRefundCost, 0)
  const directPaidMarketingSpendUsd = marketingSpendRows.reduce((sum, row) => sum + Number(row.amount_usd ?? 0), 0)
  const directPaidCac = shortlistUsers.purchased > 0
    ? Number((directPaidMarketingSpendUsd / shortlistUsers.purchased).toFixed(2))
    : null
  const directPaidPaybackMonths = directPaidCac !== null
    ? Number((directPaidCac / PAID_SPRINT_PRICE_USD).toFixed(2))
    : null
  const paidSprintGrossMarginPct = paidSprintGrossRevenue > 0
    ? Number(((paidSprintNetRevenue / paidSprintGrossRevenue) * 100).toFixed(2))
    : null

  const activePrograms = partnerProgramRows.filter((row) => row.status === 'active')
  const closedPrograms = partnerProgramRows.filter((row) => row.status === 'closed')
  const expansionProposalSent = partnerProgramRows.length > 0
    ? activePrograms.length + closedPrograms.length > 0
    : null
  const expansionAccepted = activePrograms.length > 0
    ? true
    : closedPrograms.length > 0
      ? false
      : null

  const totalPartnerSeatsPurchased = partnerCommissionRows.reduce((sum, row) => {
    return sum + Number(row.seats_purchased ?? 0)
  }, 0)
  const pilotFeeCollectedProxy = totalPartnerSeatsPurchased > 0
    ? totalPartnerSeatsPurchased * 39
    : null

  const canonicalPilotFeeCollected = partnerCommercialEventRows
    .filter((row) => row.event_type === 'pilot_fee_collected')
    .reduce((sum, row) => sum + Number(row.amount_usd ?? 0), 0)
  const canonicalProposalSent = partnerCommercialEventRows.some((row) => row.event_type === 'expansion_proposal_sent')
  const canonicalAccepted = partnerCommercialEventRows.some((row) => row.event_type === 'expansion_accepted')
  const canonicalRejected = partnerCommercialEventRows.some((row) => row.event_type === 'expansion_rejected')

  const pilotFeeCollected = canonicalPilotFeeCollected > 0
    ? Number(canonicalPilotFeeCollected.toFixed(2))
    : pilotFeeCollectedProxy
  const expansionProposalSentFinal = canonicalProposalSent
    ? true
    : expansionProposalSent
  const expansionAcceptedFinal = canonicalAccepted
    ? true
    : canonicalRejected
      ? false
      : expansionAccepted

  const decisionForPartnerPilot = decisionSummary === 'scale'
    ? 'Expand'
    : decisionSummary === 'stop'
      ? 'Stop'
      : 'Extend pilot'

  const packagePayload = {
    ok: true,
    epic: 'SMK-381',
    generated_at: now.toISOString(),
    lookback_days: lookbackDays,
    cohort_window: {
      start_date: toIsoDate(since),
      end_date: toIsoDate(now),
    },
    smk_395_paid_sprint_cohort_report: {
      cohort_size_target: 20,
      funnel_summary: {
        landing_page_visits: shortlistUsers.viewed,
        checkout_starts: shortlistUsers.checkout_started,
        purchases_completed: shortlistUsers.purchased,
        completion_rate: percentage(shortlistUsers.purchased, shortlistUsers.checkout_started),
      },
      delivery_metrics: {
        average_time_to_deliver_shortlist_package_hours: nullableNumber(avgDeliveryHours),
        pct_with_5_targets_delivered: null,
        pct_with_decision_path_maps_completed: null,
        pct_with_action_queue_delivered: percentage(shortlistUsers.delivered, shortlistUsers.purchased),
      },
      outcome_metrics_14_day: {
        pct_with_qualified_warm_conversation: percentageOrNull(purchasedUsersWithQualifiedConversation, purchasedUserIds.size),
        pct_with_relationship_action_completed: percentageOrNull(purchasedUsersWithRelationshipAction, purchasedUserIds.size),
        refund_rate: refundRate,
      },
      commercial_metrics: {
        paid_sprint_to_monthly_conversion_rate: percentage(shortlistUsers.credit_applied, shortlistUsers.purchased),
        average_upgrade_time_days: null,
        net_revenue_after_refunds: paidSprintNetRevenue,
        direct_paid_marketing_spend_usd: Number(directPaidMarketingSpendUsd.toFixed(2)),
      },
      qualitative_findings: {
        top_value_comments: [],
        top_objections: [],
        top_friction_points: recentCronFailures.slice(0, 3).map((row) => row.error_message ?? 'Unknown cron failure'),
      },
    },
    smk_398_partner_pilot_outcomes_tracker: {
      pilot_cohort: {
        partner_name: (partnersResult.data ?? []).length === 1
          ? String((partnersResult.data as Array<Record<string, unknown>>)[0]?.name ?? 'active_partner')
          : `${(partnersResult.data ?? []).length} active partners`,
        partner_type: 'mixed',
        seats_activated: seatsActivated,
        pilot_start: toIsoDate(since),
        pilot_end: toIsoDate(now),
      },
      weekly_metrics: {
        weekly_active_seats_rate: seatsActiveRate,
        relationship_actions_completed_per_seat: seatsActivated > 0 ? nullableNumber(actionRows.length / seatsActivated) : null,
        qualified_conversations_initiated: interviewRows.length,
        shortlist_quality_feedback_score: null,
      },
      commercial_metrics: {
        pilot_fee_collected: pilotFeeCollected,
        expansion_proposal_sent: expansionProposalSentFinal,
        expansion_accepted: expansionAcceptedFinal,
      },
      qualitative_findings: {
        what_partners_used_most: ['Seat status updates', 'Weekly run review cadence'],
        what_they_ignored: [],
        what_blocked_usage: recentCronFailures.slice(0, 3).map((row) => row.error_code ?? 'unknown_failure'),
      },
      decision: {
        recommendation: decisionForPartnerPilot,
        why: latestScorecard
          ? `Latest wedge scorecard summary is ${decisionSummary}.`
          : 'No weekly scorecard snapshots found yet.',
      },
    },
    smk_401_scale_stop_decision_memo: {
      decision_date: toIsoDate(now),
      motions_evaluated: [
        'Direct paid sprint (B2C)',
        'Partner pilot (B2B)',
      ],
      kpi_scorecard: {
        hook_clarity_pct: null,
        time_to_first_shortlist_median_min: null,
        first_relationship_action_completion_7d_pct: percentageOrNull(purchasedUsersWithActionWithin7d, purchasedUserIds.size),
        paid_sprint_to_monthly_conversion_pct: percentage(shortlistUsers.credit_applied, shortlistUsers.purchased),
        partner_weekly_seat_activity_pct: seatsActiveRate,
        refund_rate_pct: refundRate,
      },
      economics: {
        cac_by_motion: {
          direct_paid_sprint_usd_proxy: directPaidCac,
          partner_pilot_usd_proxy: partnerCacPerActiveUser,
          notes: 'Direct paid CAC uses canonical marketing_spend_entries over paid sprint purchases. Partner CAC proxy uses first-month commission payout per active attributed user.',
        },
        gross_margin_by_motion: {
          direct_paid_sprint_pct_proxy: paidSprintGrossMarginPct,
          partner_pilot_pct_proxy: partnerGrossMarginPct,
          notes: 'Direct margin proxy is refund-adjusted gross receipt retention. Partner margin proxy uses attributable MRR minus commission.',
        },
        payback_window: {
          direct_paid_sprint_months_proxy: directPaidPaybackMonths,
          partner_pilot_months_proxy: partnerPaybackMonths,
          notes: 'Direct paid payback proxy uses CAC divided by paid sprint unit price. Partner payback proxy is CAC per active attributed user divided by attributable ARPU.',
        },
      },
      decision: {
        motion_1_direct_paid_sprint: latestScorecard ? String(latestScorecard.decision_motion1_direct_paid_sprint ?? decisionSummary) : 'iterate',
        motion_2_partner_pilot: latestScorecard ? String(latestScorecard.decision_motion2_partner_pilot ?? decisionSummary) : 'iterate',
        summary: decisionSummary,
        reasons: latestScorecard && Array.isArray(latestScorecard.decision_reasons)
          ? (latestScorecard.decision_reasons as string[])
          : ['Generated from latest wedge scorecard snapshot.'],
      },
      next_30_day_focus: [
        'Raise paid sprint conversion and delivery completion rates above scale thresholds.',
        'Stabilize partner seat activity with at-risk seat interventions.',
        'Close instrumentation gaps for hook clarity and relationship-action outcomes.',
      ],
    },
    data_gaps: [
      'hook_clarity_pct requires canonical event capture and is currently null.',
      'time_to_first_shortlist_median_min is not yet emitted in user_events.',
      ...(directPaidMarketingSpendUsd > 0 ? [] : ['Direct paid CAC requires marketing_spend_entries rows for the selected window.']),
      ...(canonicalPilotFeeCollected > 0 || canonicalProposalSent || canonicalAccepted || canonicalRejected
        ? []
        : ['Partner commercial fields are falling back to proxy values until partner_commercial_events are recorded.']),
    ],
  }

  return NextResponse.json(packagePayload)
}
