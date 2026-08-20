import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'

type SeatStatus = 'Active' | 'At risk'

type Seat = {
  owner: string
  activeClients: number
  weeklyActions: number
  status: SeatStatus
  lastUpdatedAt: string | null
}

type SeatStatusEvent = {
  event_name: 'partner_pilot_seat_status_updated'
  created_at: string
  properties: {
    seat_owner?: string
    next_status?: string
  } | null
}

function baseSeats(): Seat[] {
  return [
    { owner: 'Coach Seat 1', activeClients: 3, weeklyActions: 8, status: 'Active', lastUpdatedAt: null },
    { owner: 'Coach Seat 2', activeClients: 2, weeklyActions: 5, status: 'Active', lastUpdatedAt: null },
    { owner: 'Search Seat 1', activeClients: 4, weeklyActions: 11, status: 'At risk', lastUpdatedAt: null },
  ]
}

function mergeSeatStatuses(seats: Seat[], updates: SeatStatusEvent[]): Seat[] {
  const bySeat = new Map<string, Seat>(seats.map((seat) => [seat.owner, { ...seat }]))

  for (const update of updates) {
    const seatOwner = update.properties?.seat_owner
    const nextStatus = update.properties?.next_status
    if (!seatOwner || !nextStatus || !bySeat.has(seatOwner)) continue

    const seat = bySeat.get(seatOwner)
    if (!seat) continue

    seat.status = nextStatus === 'at_risk' ? 'At risk' : 'Active'
    seat.lastUpdatedAt = update.created_at
    bySeat.set(seatOwner, seat)
  }

  return Array.from(bySeat.values())
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const sinceIso = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: updates, error: updatesError }, { data: partnerRows, error: partnerError }] = await Promise.all([
    supabase
      .from('user_events')
      .select('event_name, created_at, properties')
      .eq('user_id', auth.userId)
      .eq('event_name', 'partner_pilot_seat_status_updated')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true })
      .limit(200),
    supabase
      .from('partners')
      .select('id')
      .eq('user_id', auth.userId)
      .eq('is_active', true)
      .limit(20),
  ])

  if (updatesError) {
    return withAuthCookies(NextResponse.json({ error: updatesError.message }, { status: 500 }), auth)
  }

  if (partnerError) {
    return withAuthCookies(NextResponse.json({ error: partnerError.message }, { status: 500 }), auth)
  }

  const seats = mergeSeatStatuses(baseSeats(), (updates ?? []) as SeatStatusEvent[])
  const totalSeats = seats.length
  const atRiskSeats = seats.filter((seat) => seat.status === 'At risk').length

  const summary = {
    seats_total: totalSeats,
    seats_active_rate: totalSeats ? Number((((totalSeats - atRiskSeats) / totalSeats) * 100).toFixed(2)) : 0,
    at_risk_seats: atRiskSeats,
    weekly_actions_total: seats.reduce((sum, seat) => sum + seat.weeklyActions, 0),
    active_clients_total: seats.reduce((sum, seat) => sum + seat.activeClients, 0),
    partner_accounts_active: (partnerRows ?? []).length,
  }

  return withAuthCookies(
    NextResponse.json({
      ok: true,
      generated_at: new Date().toISOString(),
      window_days: 30,
      summary,
      seats,
    }),
    auth,
  )
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => ({})) as {
    seatOwner?: string
    previousStatus?: 'active' | 'at_risk'
    nextStatus?: 'active' | 'at_risk'
  }

  const seatOwner = (body.seatOwner ?? '').trim()
  const previousStatus = body.previousStatus
  const nextStatus = body.nextStatus

  if (!seatOwner || !previousStatus || !nextStatus) {
    return withAuthCookies(
      NextResponse.json({ error: 'seatOwner, previousStatus, and nextStatus are required' }, { status: 400 }),
      auth,
    )
  }

  const action = nextStatus === 'at_risk' ? 'mark_at_risk' : 'mark_active'

  await logEvent(auth.userId, 'partner_pilot_seat_status_updated', {
    route: '/partners/pilot-admin',
    seat_owner: seatOwner,
    previous_status: previousStatus,
    next_status: nextStatus,
    action,
    action_context: 'partner_pilot_admin',
  })

  await logEvent(auth.userId, 'partner_pilot_admin_viewed', {
    route: '/partners/pilot-admin',
    partner_type: 'mixed',
    action_context: 'partner_pilot_admin',
  })

  return withAuthCookies(NextResponse.json({ ok: true }), auth)
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
