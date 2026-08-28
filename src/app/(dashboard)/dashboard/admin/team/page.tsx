import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, getAllStaff } from '@/lib/staff'
import { TeamClient } from './team-client'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Alert, AlertDescription, Badge } from '@/components/ui'
export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const members = await getAllStaff()

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-card">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            ← Admin
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Team Management</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>
            <Badge
              variant={staff.role === 'owner' ? 'warning' : staff.role === 'admin' ? 'info' : 'secondary'}
              className="ml-2"
            >
              {staff.role}
            </Badge>
          </p>
        </div>

        {staff.role === 'viewer' && (
          <Alert variant="info" className="mb-6">
            <AlertDescription>You have view-only access. Contact the owner to make changes.</AlertDescription>
          </Alert>
        )}

        <TeamClient members={members} currentRole={staff.role} />
      </main>
    </div>
  )
}

