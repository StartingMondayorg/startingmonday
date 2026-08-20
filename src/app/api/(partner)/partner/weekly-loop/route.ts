import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

type PartnerRow = { id: string; email: string | null; user_id: string | null }

type LoopItem = {
  id: string
  label: string
  completed: boolean
  completed_at?: string | null
}

function isoWeekMonday(date: Date): string {
  const d = new Date(date)
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() - (day - 1))
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

function isLoopItemArray(v: unknown): v is LoopItem[] {
  if (!Array.isArray(v)) return false
  return v.every(
    (item) =>
      item !== null &&
      typeof item === 'object' &&
      typeof (item as LoopItem).id === 'string' &&
      typeof (item as LoopItem).label === 'string' &&
      typeof (item as LoopItem).completed === 'boolean',
  )
}

async function findPartner(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  email: string | null,
): Promise<PartnerRow | null> {
  const { data: byUser } = await admin
    .from('partners')
    .select('id, email, user_id')
    .eq('user_id', userId)
    .maybeSingle()
  if (byUser) return byUser as PartnerRow
  if (!email) return null

  const { data: byEmail } = await admin
    .from('partners')
    .select('id, email, user_id')
    .eq('email', email)
    .eq('is_active', true)
    .maybeSingle()
  if (!byEmail) return null
  const p = byEmail as PartnerRow
  if (!p.user_id) {
    await admin.from('partners').update({ user_id: userId }).eq('id', p.id)
    p.user_id = userId
  }
  return p
}

// GET /api/partner/weekly-loop
// Returns the current week's loop for the caller (or targetUserId if provided and caller is counselor/admin)
// Query params: targetUserId?, weekStart? (YYYY-MM-DD, defaults to current week Monday)
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  const q = request.nextUrl.searchParams
  const targetUserId = q.get('targetUserId') ?? auth.userId
  const weekStart = q.get('weekStart') ?? isoWeekMonday(new Date())

  const { data: loop } = await admin
    .from('partner_weekly_loops' as never)
    .select('id, week_start, completed_at, loop_items, counselor_notes, cohort_id, updated_at')
    .eq('partner_id', partner.id)
    .eq('user_id', targetUserId)
    .eq('week_start', weekStart)
    .maybeSingle()

  return withAuthCookies(
    NextResponse.json({ data: loop ?? null, weekStart, partner: { id: partner.id } }),
    auth,
  )
}

// POST /api/partner/weekly-loop
// Upsert the weekly loop for a participant. Mark complete if all items done or body.complete=true.
// Body: { targetUserId?, weekStart?, cohortId?, loopItems?, counselorNotes?, complete? }
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  const targetUserId: string = body?.targetUserId ?? auth.userId
  const weekStart: string = body?.weekStart ?? isoWeekMonday(new Date())

  // Validate loopItems if provided
  if (body?.loopItems !== undefined && !isLoopItemArray(body.loopItems)) {
    return withAuthCookies(
      NextResponse.json({ error: 'loopItems must be an array of { id, label, completed } objects.' }, { status: 400 }),
      auth,
    )
  }

  const loopItems: LoopItem[] = body?.loopItems ?? []
  const allComplete = loopItems.length > 0 && loopItems.every((item) => item.completed)
  const explicitComplete = body?.complete === true
  const shouldMarkComplete = allComplete || explicitComplete

  const now = new Date().toISOString()
  const completedAt = shouldMarkComplete ? now : null

  // Upsert
  const { data: existing } = await admin
    .from('partner_weekly_loops' as never)
    .select('id, completed_at')
    .eq('partner_id', partner.id)
    .eq('user_id', targetUserId)
    .eq('week_start', weekStart)
    .maybeSingle() as unknown as { data: { id: string; completed_at: string | null } | null }

  if (existing) {
    const updates: Record<string, unknown> = { updated_at: now }
    if (loopItems.length > 0) updates.loop_items = loopItems
    if (body?.counselorNotes !== undefined) updates.counselor_notes = body.counselorNotes
    if (body?.cohortId !== undefined) updates.cohort_id = body.cohortId
    if (shouldMarkComplete && !existing.completed_at) updates.completed_at = completedAt

    const { error } = await admin
      .from('partner_weekly_loops' as never)
      .update(updates as never)
      .eq('id', existing.id) as unknown as { error: unknown }

    if (error) {
      Sentry.captureException(error, { extra: { route: 'partner/weekly-loop', op: 'update', userId: auth.userId } })
      return withAuthCookies(NextResponse.json({ error: 'Failed to update weekly loop.' }, { status: 500 }), auth)
    }
  } else {
    const { error } = await admin
      .from('partner_weekly_loops' as never)
      .insert({
        partner_id: partner.id,
        user_id: targetUserId,
        cohort_id: body?.cohortId ?? null,
        week_start: weekStart,
        loop_items: loopItems,
        counselor_notes: body?.counselorNotes ?? null,
        completed_at: completedAt,
      } as never) as unknown as { error: unknown }

    if (error) {
      Sentry.captureException(error, { extra: { route: 'partner/weekly-loop', op: 'create', userId: auth.userId } })
      return withAuthCookies(NextResponse.json({ error: 'Failed to create weekly loop.' }, { status: 500 }), auth)
    }
  }

  // Emit outcome event if loop just completed
  if (shouldMarkComplete && !existing?.completed_at) {
    await admin
      .from('partner_outcome_events' as never)
      .insert({
        partner_id: partner.id,
        cohort_id: body?.cohortId ?? null,
        user_id: targetUserId,
        event_type: 'weekly_loop_complete',
        metadata: { week_start: weekStart },
      } as never)
  }

  return withAuthCookies(
    NextResponse.json({ ok: true, weekStart, completed: shouldMarkComplete }),
    auth,
  )
}
