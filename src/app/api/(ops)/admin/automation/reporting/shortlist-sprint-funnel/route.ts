import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

type FunnelEventName =
  | 'shortlist_sprint_viewed'
  | 'shortlist_sprint_cta_clicked'
  | 'shortlist_sprint_checkout_started'
  | 'shortlist_sprint_purchased'
  | 'shortlist_sprint_delivered'
  | 'shortlist_sprint_credit_applied'

const FUNNEL_EVENTS: readonly FunnelEventName[] = [
  'shortlist_sprint_viewed',
  'shortlist_sprint_cta_clicked',
  'shortlist_sprint_checkout_started',
  'shortlist_sprint_purchased',
  'shortlist_sprint_delivered',
  'shortlist_sprint_credit_applied',
] as const

function parseLookbackDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? '30', 10)
  if (!Number.isFinite(raw)) return 30
  return Math.max(7, Math.min(raw, 120))
}

function percentage(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const sb = asLooseSupabaseClient(auth.supabase)
  const lookbackDays = parseLookbackDays(request)
  const sinceIso = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await sb
    .from('user_events')
    .select('event_name, created_at, user_id, properties')
    .in('event_name', [...FUNNEL_EVENTS])
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(100000)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as Array<{
    event_name: FunnelEventName
    created_at: string
    user_id: string
    properties: Record<string, unknown> | null
  }>

  const counts = Object.fromEntries(FUNNEL_EVENTS.map((eventName) => [eventName, 0])) as Record<FunnelEventName, number>
  const uniqueUsersByEvent = Object.fromEntries(FUNNEL_EVENTS.map((eventName) => [eventName, new Set<string>()])) as Record<FunnelEventName, Set<string>>

  for (const row of rows) {
    counts[row.event_name] += 1
    uniqueUsersByEvent[row.event_name].add(row.user_id)
  }

  const viewedUsers = uniqueUsersByEvent.shortlist_sprint_viewed.size
  const ctaUsers = uniqueUsersByEvent.shortlist_sprint_cta_clicked.size
  const checkoutUsers = uniqueUsersByEvent.shortlist_sprint_checkout_started.size
  const purchasedUsers = uniqueUsersByEvent.shortlist_sprint_purchased.size
  const deliveredUsers = uniqueUsersByEvent.shortlist_sprint_delivered.size
  const creditAppliedUsers = uniqueUsersByEvent.shortlist_sprint_credit_applied.size

  const metrics = {
    viewed_users: viewedUsers,
    cta_click_users: ctaUsers,
    checkout_started_users: checkoutUsers,
    purchased_users: purchasedUsers,
    delivered_users: deliveredUsers,
    credit_applied_users: creditAppliedUsers,
    cta_click_through_rate: percentage(ctaUsers, viewedUsers),
    checkout_start_rate: percentage(checkoutUsers, ctaUsers),
    purchase_rate_from_checkout: percentage(purchasedUsers, checkoutUsers),
    delivery_completion_rate: percentage(deliveredUsers, purchasedUsers),
    credit_application_rate: percentage(creditAppliedUsers, purchasedUsers),
  }

  const timeline = rows.slice(0, 50).map((row) => ({
    event_name: row.event_name,
    created_at: row.created_at,
    user_id: row.user_id,
    route: typeof row.properties?.route === 'string' ? row.properties.route : null,
    cta_label: typeof row.properties?.cta_label === 'string' ? row.properties.cta_label : null,
  }))

  return NextResponse.json({
    ok: true,
    ticket: 'SMK-395',
    generated_at: new Date().toISOString(),
    lookback_days: lookbackDays,
    source_table: 'user_events',
    event_counts: counts,
    unique_users: Object.fromEntries(FUNNEL_EVENTS.map((eventName) => [eventName, uniqueUsersByEvent[eventName].size])),
    metrics,
    recent_timeline: timeline,
  })
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
