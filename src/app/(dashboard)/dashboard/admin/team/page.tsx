import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember, getAllStaff } from '@/lib/staff'
import { TeamClient } from './team-client'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const members = await getAllStaff()

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-slate-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <Link href="/dashboard/admin" className="text-[13px] text-slate-300 hover:text-white transition-colors">
            ← Admin
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-white leading-tight">Team Management</h1>
          <p className="text-[13px] text-slate-300 mt-1.5">
            Signed in as <span className="font-semibold text-slate-100">{user.email}</span>
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

