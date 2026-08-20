import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { SalesEnablementWorkspace } from './SalesEnablementWorkspace'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Badge } from '@/components/ui/badge'

export const metadata = { title: 'Sales Enablement - Admin' }

function roleBadgeVariant(role: string): 'warning' | 'info' | 'secondary' {
  if (role === 'owner') return 'warning'
  if (role === 'admin') return 'info'
  return 'secondary'
}

export default async function AdminSalesEnablementPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/revenue" className="text-[12px] font-semibold text-slate-400 hover:text-slate-200 transition-colors">Revenue</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-slate-300 hover:text-white transition-colors">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-white leading-tight">Sales Enablement Control Room</h1>
          <p className="text-[13px] text-slate-300 mt-1.5">Evaluate proposals, set checkpoint targets, and track the best path to more qualified meetings.</p>
          <p className="text-[13px] text-slate-300 mt-1">
            Signed in as <span className="font-semibold text-slate-200">{user.email}</span>
            <Badge variant={roleBadgeVariant(staff.role)} className="ml-2">{staff.role}</Badge>
          </p>
        </div>

        <SalesEnablementWorkspace />
      </main>
    </div>
  )
}


