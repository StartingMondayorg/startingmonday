import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { SalaryIntelClient } from './salary-client'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export const metadata = { title: 'Salary Intelligence - Starting Monday' }

export default async function SalaryPage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string; role?: string }>
}) {
  const { company, role } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const sub = await getUserSubscription(user.id)
  const canAccess = canAccessFeature(sub, 'salary_intelligence')

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] text-slate-300 hover:text-white transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">Executive</p>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Salary Intelligence</h1>
          <p className="text-[13px] text-slate-500 mt-1.5">
            Compensation range, negotiation script, and pushback responses - specific to the role, company, and location.
          </p>
        </div>

        {!canAccess ? (
          <Card className="p-8 text-center">
            <p className="text-[15px] font-semibold text-slate-900 mb-2">Executive plan required</p>
            <p className="text-[13px] text-slate-500 mb-6 leading-relaxed">
              Salary intelligence is available on the Executive plan ($499/mo). It includes daily scanning, recruiter tracker enhancements, and negotiation scripts.
            </p>
            <Button render={<Link href="/settings/billing" />}>
              Upgrade to Executive →
            </Button>
          </Card>
        ) : (
          <SalaryIntelClient defaultCompany={company ?? ''} defaultRole={role ?? ''} />
        )}
      </main>
    </div>
  )
}

