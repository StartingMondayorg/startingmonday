import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { SalesEnablementWorkspace } from './SalesEnablementWorkspace'
import { ADMIN_DARK_PAGE_BG } from '../admin-dark-theme'
import { Badge } from '@/components/ui'
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
      <header className="bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin/revenue" className="text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Revenue</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">← Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Sales Enablement Control Room</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Evaluate proposals, set checkpoint targets, and track the best path to more qualified meetings.</p>
          <p className="text-[13px] text-muted-foreground mt-1">
            Signed in as <span className="font-semibold text-foreground">{user.email}</span>
            <Badge variant={roleBadgeVariant(staff.role)} className="ml-2">{staff.role}</Badge>
          </p>
        </div>

        <SalesEnablementWorkspace />
      </main>
    </div>
  )
}


