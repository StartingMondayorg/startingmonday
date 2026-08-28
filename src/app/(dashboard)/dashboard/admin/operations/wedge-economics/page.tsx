import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { ADMIN_DARK_PAGE_BG } from '../../admin-dark-theme'
import WedgeEconomicsClient from './wedge-economics-client'

export default async function WedgeEconomicsLedgerPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
            <Link href="/dashboard/admin/operations" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Operations</Link>
            <Link href="/dashboard/admin/wedge-funnels" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">Wedge Monitor</Link>
            <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-7">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Wedge Economics Ledger</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Enter canonical direct-paid spend and partner commercial events used by the wedge closeout artifact.</p>
          <p className="mt-1 text-[13px] text-muted-foreground">Signed in as {user.email}</p>
        </div>

        <WedgeEconomicsClient />
      </main>
    </div>
  )
}

