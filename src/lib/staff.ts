import type { User } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'

export type StaffRole = 'owner' | 'admin' | 'viewer'

export type StaffMember = {
  id: string
  email: string
  role: StaffRole
  permissions: Record<string, boolean>
  created_at: string
  created_by: string | null
}

export function hasAdminHeaderAccess(staff: StaffMember | null): boolean {
  return staff?.role === 'owner' || staff?.role === 'admin'
}

// `aud` is required so callers must pass the Supabase auth user itself, not a
// hand-built `{ email }` object that would silently lack `email_confirmed_at`.
export type StaffAuthUser = Pick<User, 'aud' | 'email' | 'email_confirmed_at'>

export async function canUserSeeAdminHeader(user: StaffAuthUser | null | undefined): Promise<boolean> {
  const staff = await getStaffMember(user)
  return hasAdminHeaderAccess(staff)
}

// Local-only owner fallback. Requires an explicit opt-in so a stray
// NODE_ENV=development deployment cannot grant owner access to every account.
export function isDevStaffBypassEnabled(): boolean {
  return process.env.NODE_ENV === 'development' && process.env.DEV_STAFF_BYPASS === '1'
}

// staff_members is keyed by email, so a staff grant is only as strong as the
// proof that the signed-in user owns that address.
export function hasConfirmedEmail(user: StaffAuthUser | null | undefined): user is StaffAuthUser & { email: string } {
  return Boolean(user?.email?.trim() && user.email_confirmed_at)
}

/**
 * Resolves the staff record for a signed-in Supabase user. Pass the user
 * object from `supabase.auth.getUser()`: users whose email is not confirmed
 * never resolve to a staff member.
 *
 * Passing a bare email string is a legacy lookup that cannot verify email
 * ownership; do not use it for authorization decisions.
 */
export async function getStaffMember(subject: StaffAuthUser | string | null | undefined): Promise<StaffMember | null> {
  let lookupEmail = ''
  let displayEmail = ''
  if (typeof subject === 'string') {
    lookupEmail = subject.trim().toLowerCase()
    displayEmail = lookupEmail
  } else {
    displayEmail = subject?.email?.trim().toLowerCase() ?? ''
    if (hasConfirmedEmail(subject)) lookupEmail = displayEmail
  }

  try {
    if (lookupEmail) {
      const admin = createAdminClient()
      const { data } = await admin
        .from('staff_members')
        .select('*')
        .eq('email', lookupEmail)
        .maybeSingle()

      if (data) {
        return data as StaffMember
      }
    }

    if (isDevStaffBypassEnabled()) {
      return {
        id: '00000000-0000-0000-0000-000000000000',
        email: displayEmail || process.env.DEV_AUTH_EMAIL?.trim() || 'demo@startingmonday.app',
        role: 'owner',
        permissions: {},
        created_at: new Date(0).toISOString(),
        created_by: null,
      }
    }

    return null
  } catch {
    return null
  }
}

export async function getAllStaff(): Promise<StaffMember[]> {
  try {
    const admin = createAdminClient()
    const { data } = await admin
      .from('staff_members')
      .select('*')
      .order('created_at', { ascending: true })
    return (data ?? []) as StaffMember[]
  } catch {
    return []
  }
}

export async function addStaffMember(email: string, role: StaffRole, createdBy: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('staff_members').insert({ email, role, created_by: createdBy })
    return !error
  } catch {
    return false
  }
}

export async function updateStaffRole(id: string, role: StaffRole): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('staff_members').update({ role }).eq('id', id)
    return !error
  } catch {
    return false
  }
}

export async function removeStaffMember(id: string): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { error } = await admin.from('staff_members').delete().eq('id', id)
    return !error
  } catch {
    return false
  }
}
