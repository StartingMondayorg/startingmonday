import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

type ShortlistEventName =
  | 'shortlist_sprint_viewed'
  | 'shortlist_sprint_cta_clicked'
  | 'shortlist_sprint_checkout_started'
  | 'shortlist_sprint_purchased'
  | 'shortlist_sprint_delivered'
  | 'shortlist_sprint_credit_applied'

type PilotSeatEventName = 'partner_pilot_seat_status_updated'

const SHORTLIST_EVENTS: readonly ShortlistEventName[] = [
  'shortlist_sprint_viewed',
  'shortlist_sprint_cta_clicked',
  'shortlist_sprint_checkout_started',
  'shortlist_sprint_purchased',
  'shortlist_sprint_delivered',
  'shortlist_sprint_credit_applied',
] as const

type ScorecardDecision = {
  motion1_direct_paid_sprint: 'scale' | 'iterate' | 'stop'
  motion2_partner_pilot: 'scale' | 'iterate' | 'stop'
  summary: 'scale' | 'iterate' | 'stop'
  reasons: string[]
}

type ScorecardComputation = {
  shortlist: {
    viewed_users: number
    cta_click_users: number
    checkout_started_users: number
    purchased_users: number
    delivered_users: number
    credit_applied_users: number
    cta_click_through_rate: number
    checkout_start_rate: number
    purchase_rate_from_checkout: number
    delivery_completion_rate: number
    credit_application_rate: number
  }
  pilot: {
    partner_accounts_active: number
    seat_updates_logged: number
    seats_total: number
    at_risk_seats: number
    seats_active_rate: number
  }
  decision: ScorecardDecision
}

function parseLookbackDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? '30', 10)
  if (!Number.isFinite(raw)) return 30
  return Math.max(7, Math.min(raw, 120))
}

function parseBodyLookbackDays(value: unknown): number {
  const parsed = Number.parseInt(String(value ?? '30'), 10)
  if (!Number.isFinite(parsed)) return 30
  return Math.max(7, Math.min(parsed, 120))
}

function weekStartIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const day = base.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - diffToMonday))
  return start.toISOString().slice(0, 10)
}

function percentage(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function decisionFromMetrics(input: {
  shortlistPurchaseFromCheckoutRate: number
  shortlistDeliveryCompletionRate: number
  pilotSeatsActiveRate: number
  pilotAtRiskSeats: number
}): ScorecardDecision {
  const reasons: string[] = []

  const motion1 =
    input.shortlistPurchaseFromCheckoutRate >= 25 && input.shortlistDeliveryCompletionRate >= 80
      ? 'scale'
      : input.shortlistPurchaseFromCheckoutRate < 10 || input.shortlistDeliveryCompletionRate < 50
        ? 'stop'
        : 'iterate'

  if (motion1 === 'scale') reasons.push('Direct paid sprint meets conversion and delivery thresholds.')
  if (motion1 === 'iterate') reasons.push('Direct paid sprint has partial signal but needs conversion/delivery improvement.')
  if (motion1 === 'stop') reasons.push('Direct paid sprint is below minimum conversion or delivery floor.')

  const motion2 =
    input.pilotSeatsActiveRate >= 70 && input.pilotAtRiskSeats <= 1
      ? 'scale'
      : input.pilotSeatsActiveRate < 45
        ? 'stop'
        : 'iterate'

  if (motion2 === 'scale') reasons.push('Partner pilot seat activity is strong with low risk concentration.')
  if (motion2 === 'iterate') reasons.push('Partner pilot activity is promising but requires seat stabilization.')
  if (motion2 === 'stop') reasons.push('Partner pilot activity is below the operating floor.')

  const summary = motion1 === 'stop' || motion2 === 'stop'
    ? 'stop'
    : motion1 === 'scale' && motion2 === 'scale'
      ? 'scale'
      : 'iterate'

  return {
    motion1_direct_paid_sprint: motion1,
    motion2_partner_pilot: motion2,
    summary,
    reasons,
  }
}

async function computeScorecard(
  sb: ReturnType<typeof asLooseSupabaseClient>,
  lookbackDays: number,
): Promise<{ ok: true; data: ScorecardComputation } | { ok: false; error: string }> {
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const [shortlistResult, pilotEventsResult, partnerResult] = await Promise.all([
    sb
      .from('user_events')
      .select('event_name, created_at, user_id')
      .in('event_name', [...SHORTLIST_EVENTS])
      .gte('created_at', sinceIso)
      .limit(200000),
    sb
      .from('user_events')
      .select('event_name, created_at, user_id, properties')
      .eq('event_name', 'partner_pilot_seat_status_updated' satisfies PilotSeatEventName)
      .gte('created_at', sinceIso)
      .limit(100000),
    sb
      .from('partners')
      .select('id, is_active')
      .eq('is_active', true)
      .limit(100000),
  ])

  if (shortlistResult.error) {
    return { ok: false, error: shortlistResult.error.message }
  }
  if (pilotEventsResult.error) {
    return { ok: false, error: pilotEventsResult.error.message }
  }
  if (partnerResult.error) {
    return { ok: false, error: partnerResult.error.message }
  }

  const shortlistRows = (shortlistResult.data ?? []) as Array<{ event_name: ShortlistEventName; user_id: string }>
  const pilotRows = (pilotEventsResult.data ?? []) as Array<{
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

  const shortlistMetrics = {
    viewed_users: uniqueUsersByShortlistEvent.shortlist_sprint_viewed.size,
    cta_click_users: uniqueUsersByShortlistEvent.shortlist_sprint_cta_clicked.size,
    checkout_started_users: uniqueUsersByShortlistEvent.shortlist_sprint_checkout_started.size,
    purchased_users: uniqueUsersByShortlistEvent.shortlist_sprint_purchased.size,
    delivered_users: uniqueUsersByShortlistEvent.shortlist_sprint_delivered.size,
    credit_applied_users: uniqueUsersByShortlistEvent.shortlist_sprint_credit_applied.size,
  }

  const shortlistRates = {
    cta_click_through_rate: percentage(shortlistMetrics.cta_click_users, shortlistMetrics.viewed_users),
    checkout_start_rate: percentage(shortlistMetrics.checkout_started_users, shortlistMetrics.cta_click_users),
    purchase_rate_from_checkout: percentage(shortlistMetrics.purchased_users, shortlistMetrics.checkout_started_users),
    delivery_completion_rate: percentage(shortlistMetrics.delivered_users, shortlistMetrics.purchased_users),
    credit_application_rate: percentage(shortlistMetrics.credit_applied_users, shortlistMetrics.purchased_users),
  }

  const latestSeatStatusByOwner = new Map<string, { next_status: string; created_at: string }>()
  for (const row of pilotRows) {
    const seatOwner = row.properties?.seat_owner
    const nextStatus = row.properties?.next_status
    if (!seatOwner || !nextStatus) continue

    const current = latestSeatStatusByOwner.get(seatOwner)
    if (!current || new Date(row.created_at) > new Date(current.created_at)) {
      latestSeatStatusByOwner.set(seatOwner, {
        next_status: nextStatus,
        created_at: row.created_at,
      })
    }
  }

  const totalSeats = Math.max(latestSeatStatusByOwner.size, 3)
  const atRiskSeats = Array.from(latestSeatStatusByOwner.values()).filter((row) => row.next_status === 'at_risk').length
  const activeSeats = Math.max(totalSeats - atRiskSeats, 0)

  const pilotMetrics = {
    partner_accounts_active: (partnerResult.data ?? []).length,
    seat_updates_logged: pilotRows.length,
    seats_total: totalSeats,
    at_risk_seats: atRiskSeats,
    seats_active_rate: percentage(activeSeats, totalSeats),
  }

  const decision = decisionFromMetrics({
    shortlistPurchaseFromCheckoutRate: shortlistRates.purchase_rate_from_checkout,
    shortlistDeliveryCompletionRate: shortlistRates.delivery_completion_rate,
    pilotSeatsActiveRate: pilotMetrics.seats_active_rate,
    pilotAtRiskSeats: pilotMetrics.at_risk_seats,
  })

  return {
    ok: true,
    data: {
      shortlist: {
        ...shortlistMetrics,
        ...shortlistRates,
      },
      pilot: pilotMetrics,
      decision,
    },
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = parseLookbackDays(request)
  const scorecardResult = await computeScorecard(sb, lookbackDays)
  if (!scorecardResult.ok) {
    return NextResponse.json({ error: scorecardResult.error }, { status: 500 })
  }

  const historyResult = await sb
    .from('wedge_funnel_weekly_scorecards')
    .select('week_start, generated_at, lookback_days, shortlist_purchase_rate_from_checkout, shortlist_delivery_completion_rate, pilot_seats_active_rate, pilot_at_risk_seats, decision_summary')
    .order('week_start', { ascending: false })
    .limit(8)

  const cronRunsResult = await sb
    .from('wedge_funnel_scorecard_cron_runs')
    .select('triggered_at, finished_at, duration_ms, lookback_days, success, error_code, decision_summary, snapshot_history_count, http_status, error_message')
    .order('triggered_at', { ascending: false })
    .limit(8)

  const history = historyResult.error
    ? []
    : (historyResult.data ?? []).map((row: Record<string, unknown>) => ({
        week_start: String(row.week_start ?? ''),
        generated_at: String(row.generated_at ?? ''),
        lookback_days: Number(row.lookback_days ?? 0),
        shortlist_purchase_rate_from_checkout: Number(row.shortlist_purchase_rate_from_checkout ?? 0),
        shortlist_delivery_completion_rate: Number(row.shortlist_delivery_completion_rate ?? 0),
        pilot_seats_active_rate: Number(row.pilot_seats_active_rate ?? 0),
        pilot_at_risk_seats: Number(row.pilot_at_risk_seats ?? 0),
        decision_summary: String(row.decision_summary ?? ''),
      }))

  const latest = history[0]
  const previous = history[1]
  const trend = latest && previous
    ? {
        purchase_rate_from_checkout_delta: Number((latest.shortlist_purchase_rate_from_checkout - previous.shortlist_purchase_rate_from_checkout).toFixed(2)),
        delivery_completion_rate_delta: Number((latest.shortlist_delivery_completion_rate - previous.shortlist_delivery_completion_rate).toFixed(2)),
        seats_active_rate_delta: Number((latest.pilot_seats_active_rate - previous.pilot_seats_active_rate).toFixed(2)),
        at_risk_seats_delta: latest.pilot_at_risk_seats - previous.pilot_at_risk_seats,
      }
    : null

  const cron_runs = cronRunsResult.error
    ? []
    : (cronRunsResult.data ?? []).map((row: Record<string, unknown>) => ({
        triggered_at: String(row.triggered_at ?? ''),
        finished_at: row.finished_at ? String(row.finished_at) : null,
        duration_ms: Number(row.duration_ms ?? 0),
        lookback_days: Number(row.lookback_days ?? 0),
        success: Boolean(row.success),
        error_code: row.error_code ? String(row.error_code) : null,
        decision_summary: row.decision_summary ? String(row.decision_summary) : null,
        snapshot_history_count: Number(row.snapshot_history_count ?? 0),
        http_status: Number(row.http_status ?? 0),
        error_message: row.error_message ? String(row.error_message) : null,
      }))

  return NextResponse.json({
    ok: true,
    ticket: 'SMK-401',
    generated_at: new Date().toISOString(),
    lookback_days: lookbackDays,
    source_table: 'user_events + partners + wedge_funnel_weekly_scorecards',
    ...scorecardResult.data,
    snapshot_history: history,
    trend,
    cron_runs,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const body = await request.json().catch(() => ({})) as { referenceDate?: string; lookbackDays?: number }
  const lookbackDays = parseBodyLookbackDays(body.lookbackDays)
  const weekStart = weekStartIso(body.referenceDate)

  const scorecardResult = await computeScorecard(sb, lookbackDays)
  if (!scorecardResult.ok) {
    return NextResponse.json({ error: scorecardResult.error }, { status: 500 })
  }

  const payload = {
    week_start: weekStart,
    generated_at: new Date().toISOString(),
    lookback_days: lookbackDays,
    shortlist_viewed_users: scorecardResult.data.shortlist.viewed_users,
    shortlist_cta_click_users: scorecardResult.data.shortlist.cta_click_users,
    shortlist_checkout_started_users: scorecardResult.data.shortlist.checkout_started_users,
    shortlist_purchased_users: scorecardResult.data.shortlist.purchased_users,
    shortlist_delivered_users: scorecardResult.data.shortlist.delivered_users,
    shortlist_credit_applied_users: scorecardResult.data.shortlist.credit_applied_users,
    shortlist_cta_click_through_rate: scorecardResult.data.shortlist.cta_click_through_rate,
    shortlist_checkout_start_rate: scorecardResult.data.shortlist.checkout_start_rate,
    shortlist_purchase_rate_from_checkout: scorecardResult.data.shortlist.purchase_rate_from_checkout,
    shortlist_delivery_completion_rate: scorecardResult.data.shortlist.delivery_completion_rate,
    shortlist_credit_application_rate: scorecardResult.data.shortlist.credit_application_rate,
    pilot_partner_accounts_active: scorecardResult.data.pilot.partner_accounts_active,
    pilot_seat_updates_logged: scorecardResult.data.pilot.seat_updates_logged,
    pilot_seats_total: scorecardResult.data.pilot.seats_total,
    pilot_at_risk_seats: scorecardResult.data.pilot.at_risk_seats,
    pilot_seats_active_rate: scorecardResult.data.pilot.seats_active_rate,
    decision_motion1_direct_paid_sprint: scorecardResult.data.decision.motion1_direct_paid_sprint,
    decision_motion2_partner_pilot: scorecardResult.data.decision.motion2_partner_pilot,
    decision_summary: scorecardResult.data.decision.summary,
    decision_reasons: scorecardResult.data.decision.reasons,
  }

  const upsertResult = await sb
    .from('wedge_funnel_weekly_scorecards')
    .upsert(payload, { onConflict: 'week_start' })
    .select('id, week_start, generated_at')
    .single()

  if (upsertResult.error) {
    return NextResponse.json({ error: upsertResult.error.message }, { status: 500 })
  }

  if (scorecardResult.data.decision.summary === 'stop') {
    await sb.from('automation_alerts').insert({
      user_id: auth.userId,
      source_table: 'wedge_funnel_weekly_scorecards',
      alert_code: 'wedge_scorecard_stop_decision',
      severity: 'high',
      message: `Wedge weekly scorecard recorded stop decision for week_start=${weekStart}.`,
      status: 'open',
    })
  }

  return NextResponse.json({
    ok: true,
    ticket: 'SMK-401',
    persisted: true,
    snapshot: upsertResult.data,
    lookback_days: lookbackDays,
    ...scorecardResult.data,
  })
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
