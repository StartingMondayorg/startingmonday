import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { canAccessFeature, getUserSubscription, type UserSubscription } from '@/lib/billing/subscription'
import { resolveOrgScopeForUser } from '@/lib/org-scope'
import { getStaffMember, type StaffAuthUser, type StaffMember } from '@/lib/staff'

// R-6 (2026-10-21): B2B and tier-bound surfaces are entitlement-gated at the
// route. Solo accounts that lack the entitlement land on /dashboard instead of
// an empty shell. Staff with owner/admin roles pass every gate so operators can
// still inspect any surface.
export type Entitlement = 'coach' | 'partner' | 'ai_chat'

export type EntitlementInputs = {
  subscription: UserSubscription
  partnerId: string | null
  staff: StaffMember | null
}

export function isStaffOperator(staff: StaffMember | null): boolean {
  return staff?.role === 'owner' || staff?.role === 'admin'
}

export function isEntitled(kind: Entitlement, inputs: EntitlementInputs): boolean {
  if (isStaffOperator(inputs.staff)) return true
  switch (kind) {
    case 'coach':
      return canAccessFeature(inputs.subscription, 'coach_dashboard')
    case 'partner':
      return inputs.partnerId !== null
    case 'ai_chat':
      return canAccessFeature(inputs.subscription, 'ai_chat')
  }
}

export async function loadEntitlementInputs(
  user: StaffAuthUser & { id: string },
): Promise<EntitlementInputs> {
  const userId = user.id
  const email = user.email ?? null
  const supabase = await createClient()
  const [subscription, scope, staff] = await Promise.all([
    getUserSubscription(userId, supabase),
    resolveOrgScopeForUser({ userId, email }),
    getStaffMember(user),
  ])
  return {
    subscription,
    partnerId: scope.ok ? scope.partnerId : null,
    staff,
  }
}

// For server layouts/pages. Redirects to /login without a session and to
// /dashboard without the entitlement; returns the inputs otherwise so the
// caller can reuse them.
export async function requireEntitlement(kind: Entitlement): Promise<EntitlementInputs> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const inputs = await loadEntitlementInputs(user)
  if (!isEntitled(kind, inputs)) redirect('/dashboard')
  return inputs
}
