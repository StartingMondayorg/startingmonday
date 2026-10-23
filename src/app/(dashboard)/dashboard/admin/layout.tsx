import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, hasAdminHeaderAccess } from '@/lib/staff'
import { resolveOrgScopeForUser } from '@/lib/org-scope'

export default async function DashboardAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?next=/dashboard/admin')

  const [staff, orgScope] = await Promise.all([
    getStaffMember(user),
    resolveOrgScopeForUser({ userId: user.id, email: user.email ?? null }),
  ])

  if (!orgScope.ok) {
    redirect('/login?error=workspace_access')
  }

  if (!hasAdminHeaderAccess(staff)) {
    notFound()
  }

  return <>{children}</>
}