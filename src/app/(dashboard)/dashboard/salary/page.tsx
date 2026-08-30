import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSubscription, canAccessFeature } from '@/lib/billing/subscription'
import { SalaryIntelClient } from './salary-client'
import Link from 'next/link'
import { Button, Card } from '@/components/ui'
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
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark text-foreground bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            ← Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Executive</p>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Salary Intelligence</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Compensation range, negotiation script, and pushback responses - specific to the role, company, and location.
          </p>
        </div>

        {!canAccess ? (
          <Card className="p-8 text-center">
            <p className="text-[15px] font-semibold text-foreground mb-2">Executive plan required</p>
            <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
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

