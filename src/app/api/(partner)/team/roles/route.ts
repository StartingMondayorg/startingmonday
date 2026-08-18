import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export const PARTNER_ROLES = ['firm_admin', 'counselor', 'participant', 'sponsor_viewer'] as const
export type PartnerRole = (typeof PARTNER_ROLES)[number]

type PartnerRow = { id: string; email: string | null; user_id: string | null }

type PartnerRoleRow = {
  id: string
  partner_id: string
  user_id: string
  role: PartnerRole
  granted_by: string | null
  granted_at: string
  revoked_at: string | null
}

function isPartnerRole(value: unknown): value is PartnerRole {
  return typeof value === 'string' && (PARTNER_ROLES as readonly string[]).includes(value)
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

async function requireFirmAdmin(
  admin: ReturnType<typeof createAdminClient>,
  partnerId: string,
  userId: string,
): Promise<boolean> {
  // Partner owner (user_id match) is implicitly firm_admin
  const { data: partner } = await admin
    .from('partners')
    .select('user_id')
    .eq('id', partnerId)
    .maybeSingle()
  if (partner && (partner as { user_id: string | null }).user_id === userId) return true

  const { data: role } = await admin
    .from('partner_roles' as never)
    .select('id')
    .eq('partner_id', partnerId)
    .eq('user_id', userId)
    .eq('role', 'firm_admin')
    .is('revoked_at', null)
    .maybeSingle()
  return !!role
}

// GET /api/team/roles - list active roles for the caller's partner workspace
export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  const { data: roles, error } = await admin
    .from('partner_roles' as never)
    .select('id, user_id, role, granted_by, granted_at')
    .eq('partner_id', partner.id)
    .is('revoked_at', null)
    .order('granted_at', { ascending: true }) as unknown as { data: PartnerRoleRow[] | null; error: unknown }

  if (error) {
    Sentry.captureException(error, { extra: { route: 'team/roles', op: 'list', userId: auth.userId } })
    return withAuthCookies(NextResponse.json({ error: 'Failed to load roles.' }, { status: 500 }), auth)
  }

  return withAuthCookies(
    NextResponse.json({ data: roles ?? [], partner: { id: partner.id } }),
    auth,
  )
}

// POST /api/team/roles - assign a role
// Body: { userId: string, role: PartnerRole }
export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const body = await request.json().catch(() => null)
  if (!body?.userId || typeof body.userId !== 'string') {
    return withAuthCookies(NextResponse.json({ error: 'userId is required.' }, { status: 400 }), auth)
  }
  if (!isPartnerRole(body?.role)) {
    return withAuthCookies(
      NextResponse.json({ error: `role must be one of: ${PARTNER_ROLES.join(', ')}.` }, { status: 400 }),
      auth,
    )
  }

  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  const isAdmin = await requireFirmAdmin(admin, partner.id, auth.userId)
  if (!isAdmin) {
    return withAuthCookies(
      NextResponse.json({ error: 'Only firm admins can assign roles.' }, { status: 403 }),
      auth,
    )
  }

  // Upsert: if role was previously revoked, restore it
  const { data: existing } = await admin
    .from('partner_roles' as never)
    .select('id, revoked_at')
    .eq('partner_id', partner.id)
    .eq('user_id', body.userId)
    .eq('role', body.role)
    .maybeSingle() as unknown as { data: { id: string; revoked_at: string | null } | null }

  if (existing && !existing.revoked_at) {
    return withAuthCookies(NextResponse.json({ error: 'Role already active for this user.' }, { status: 409 }), auth)
  }

  if (existing?.revoked_at) {
    const { error } = await admin
      .from('partner_roles' as never)
      .update({ revoked_at: null, granted_by: auth.userId, granted_at: new Date().toISOString() } as never)
      .eq('id', existing.id) as unknown as { error: unknown }
    if (error) {
      Sentry.captureException(error, { extra: { route: 'team/roles', op: 'restore', userId: auth.userId } })
      return withAuthCookies(NextResponse.json({ error: 'Failed to restore role.' }, { status: 500 }), auth)
    }
  } else {
    const { error } = await admin
      .from('partner_roles' as never)
      .insert({
        partner_id: partner.id,
        user_id: body.userId,
        role: body.role,
        granted_by: auth.userId,
      } as never) as unknown as { error: unknown }
    if (error) {
      Sentry.captureException(error, { extra: { route: 'team/roles', op: 'assign', userId: auth.userId } })
      return withAuthCookies(NextResponse.json({ error: 'Failed to assign role.' }, { status: 500 }), auth)
    }
  }

  await admin
    .from('partner_audit_events' as never)
    .insert({
      partner_id: partner.id,
      actor_user_id: auth.userId,
      action: 'role_linked',
      details: { target_user_id: body.userId, role: body.role },
    } as never)

  return withAuthCookies(
    NextResponse.json({ ok: true, role: body.role, userId: body.userId }),
    auth,
  )
}
