import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { requireAuth, withAuthCookies } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'

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

async function requireFirmAdmin(
  admin: ReturnType<typeof createAdminClient>,
  partnerId: string,
  userId: string,
): Promise<boolean> {
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

// DELETE /api/team/roles/[id] - revoke a role assignment
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { id } = await context.params
  const admin = createAdminClient()
  const { data: userRow } = await admin.from('users').select('email').eq('id', auth.userId).maybeSingle()
  const partner = await findPartner(admin, auth.userId, userRow?.email ?? null)

  if (!partner) {
    return withAuthCookies(NextResponse.json({ error: 'Partner workspace not found.' }, { status: 404 }), auth)
  }

  // Verify the role belongs to this partner before revoking
  const { data: role } = await admin
    .from('partner_roles' as never)
    .select('id, partner_id, user_id, role, revoked_at')
    .eq('id', id)
    .maybeSingle() as unknown as { data: { id: string; partner_id: string; user_id: string; role: string; revoked_at: string | null } | null }

  if (!role) {
    return withAuthCookies(NextResponse.json({ error: 'Role not found.' }, { status: 404 }), auth)
  }
  if (role.partner_id !== partner.id) {
    return withAuthCookies(NextResponse.json({ error: 'Role not found.' }, { status: 404 }), auth)
  }
  if (role.revoked_at) {
    return withAuthCookies(NextResponse.json({ error: 'Role already revoked.' }, { status: 409 }), auth)
  }

  const isAdmin = await requireFirmAdmin(admin, partner.id, auth.userId)
  if (!isAdmin) {
    return withAuthCookies(
      NextResponse.json({ error: 'Only firm admins can revoke roles.' }, { status: 403 }),
      auth,
    )
  }

  const { error } = await admin
    .from('partner_roles' as never)
    .update({ revoked_at: new Date().toISOString() } as never)
    .eq('id', id) as unknown as { error: unknown }

  if (error) {
    Sentry.captureException(error, { extra: { route: 'team/roles/[id]', op: 'revoke', userId: auth.userId } })
    return withAuthCookies(NextResponse.json({ error: 'Failed to revoke role.' }, { status: 500 }), auth)
  }

  await admin
    .from('partner_audit_events' as never)
    .insert({
      partner_id: partner.id,
      actor_user_id: auth.userId,
      action: 'role_linked',
      details: { target_user_id: role.user_id, role: role.role, action: 'revoked' },
    } as never)

  return withAuthCookies(NextResponse.json({ ok: true }), auth)
}
