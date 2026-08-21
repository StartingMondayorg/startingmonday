import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess, type StaffMember } from '@/lib/staff'
import { hasRecentAuthentication } from '@/lib/recent-auth'

export type LiveBriefMutationAuth = {
  userId: string
  userEmail: string
  staff: StaffMember
}

export async function requireLiveBriefMutationAccess(): Promise<LiveBriefMutationAuth | null> {
  const supabase = await createClient()
  const [{ data: userData, error: userError }, { data: claimsData, error: claimsError }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getClaims(),
  ])
  const user = userData.user
  const claims = claimsData?.claims

  if (userError || claimsError || !user || !claims?.sub || claims.sub !== user.id) return null
  if (!hasRecentAuthentication(claims.amr)) return null

  const userEmail = user.email?.trim() ?? ''
  const staff = await getStaffMember(userEmail)
  if (!staff || !hasAdminHeaderAccess(staff)) return null

  return { userId: user.id, userEmail, staff }
}