import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess, type StaffMember } from '@/lib/staff'
import { hasRecentAuthentication } from '@/lib/recent-auth'

export type LiveBriefMutationAuth = {
  userId: string
  userEmail: string
  staff: StaffMember
}

export async function requireLiveBriefStaffAccess(): Promise<LiveBriefMutationAuth | null> {
  const supabase = await createClient()
  const { data: userData, error: userError } = await supabase.auth.getUser()
  const user = userData.user

  if (userError || !user) return null

  const userEmail = user.email?.trim() ?? ''
  const staff = await getStaffMember(userEmail)
  if (!staff || !hasAdminHeaderAccess(staff)) return null

  return { userId: user.id, userEmail, staff }
}

export async function requireLiveBriefMutationAccess(): Promise<LiveBriefMutationAuth | null> {
  const auth = await requireLiveBriefStaffAccess()
  if (!auth) return null

  const supabase = await createClient()
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims()
  const claims = claimsData?.claims
  if (claimsError || !claims?.sub || claims.sub !== auth.userId) return null
  if (!hasRecentAuthentication(claims.amr)) return null
  return auth
}