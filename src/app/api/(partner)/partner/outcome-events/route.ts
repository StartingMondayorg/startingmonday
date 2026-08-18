import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const OUTCOME_EVENT_TYPES = [
  'activation_complete',
  'session_prep_viewed',
  'weekly_loop_complete',
  'interview_stage_advance',
  'offer_recorded',
] as const

export type OutcomeEventType = (typeof OUTCOME_EVENT_TYPES)[number]

const PROGRAM_TRACKS = ['executive_transition', 'professional_transition'] as const

function isOutcomeEventType(v: unknown): v is OutcomeEventType {
  return typeof v === 'string' && (OUTCOME_EVENT_TYPES as readonly string[]).includes(v)
}

type PartnerRow = { id: string; email: string | null; user_id: string | null }

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

// POST /api/partner/outcome-events
// Emit a canonical outcome event for a participant in a partner program.
// Body: { targetUserId, eventType, cohortId?, programTrack?, metadata? }
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)

  if (!isOutcomeEventType(body?.eventType)) {
    return withAuthCookies(
      NextResponse.json({ error: `eventType must be one of: ${OUTCOME_EVENT_TYPES.join(', ')}.` }, { status: 400 }),
      auth,
    )
  }

  const targetUserId = body?.targetUserId
  if (targetUserId !== undefined && typeof targetUserId !== 'string') {
    return withAuthCookies(NextResponse.json({ error: 'targetUserId must be a string.' }, { status: 400 }), auth)
  }

  const programTrack = body?.programTrack ?? null
  if (programTrack !== null && !(PROGRAM_TRACKS as readonly string[]).includes(programTrack)) {
    return withAuthCookies(
      NextResponse.json({ error: `programTrack must be one of: ${PROGRAM_TRACKS.join(', ')}.` }, { status: 400 }),
      auth,
    )
  }

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  // The subject of the event: the caller themselves, or a specified participant
  const subjectUserId: string = targetUserId ?? auth.userId

  const { error } = await admin
    .from('partner_outcome_events' as never)
    .insert({
      partner_id: partner.id,
      cohort_id: body?.cohortId ?? null,
      user_id: subjectUserId,
      event_type: body.eventType,
      program_track: programTrack,
      metadata: body?.metadata ?? {},
    } as never) as unknown as { error: unknown }

  if (error) {
    Sentry.captureException(error, { extra: { route: 'partner/outcome-events', op: 'record', userId: auth.userId } })
    return withAuthCookies(NextResponse.json({ error: 'Failed to record outcome event.' }, { status: 500 }), auth)
  }

  return withAuthCookies(
    NextResponse.json({ ok: true, eventType: body.eventType, userId: subjectUserId }),
    auth,
  )
}

// GET /api/partner/outcome-events
// Query params: eventType?, cohortId?, since? (ISO), limit?
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
  const eventType = q.get('eventType')
  const cohortId = q.get('cohortId')
  const since = q.get('since')
  const limit = Math.min(Math.max(1, Number(q.get('limit') ?? 200)), 1000)

  let query = (admin.from('partner_outcome_events' as never) as ReturnType<typeof admin.from>)
    .select('id, user_id, event_type, cohort_id, program_track, metadata, created_at')
    .eq('partner_id', partner.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (eventType && isOutcomeEventType(eventType)) {
    query = query.eq('event_type', eventType)
  }
  if (cohortId) {
    query = query.eq('cohort_id', cohortId)
  }
  if (since) {
    query = query.gte('created_at', since)
  }

  const { data: events, error } = await (query as unknown as Promise<{ data: unknown[] | null; error: unknown }>)

  if (error) {
    Sentry.captureException(error, { extra: { route: 'partner/outcome-events', op: 'list', userId: auth.userId } })
    return withAuthCookies(NextResponse.json({ error: 'Failed to load outcome events.' }, { status: 500 }), auth)
  }

  return withAuthCookies(
    NextResponse.json({ data: events ?? [], partner: { id: partner.id } }),
    auth,
  )
}
