import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { StrategyClient } from './strategy-client'

export const metadata = {
  title: 'Search Strategy Brief - Starting Monday',
}

export default async function StrategyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('onboarding_completed_at, current_title, current_company, target_titles, positioning_summary, resume_text, role_context')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed_at) redirect('/onboarding')

  const hasIntake = Boolean((profile?.role_context as Record<string, unknown> | null)?.search_intake)

  const missing: { label: string; anchor: string }[] = []
  if (!profile?.current_title && !profile?.current_company)
    missing.push({ label: 'Current or most recent role', anchor: 'current_title' })
  if (!profile?.target_titles?.length)
    missing.push({ label: 'Target titles (e.g. CIO, VP of Technology)', anchor: 'target_titles' })
  if (!profile?.resume_text && !profile?.positioning_summary)
    missing.push({ label: 'Resume or positioning summary', anchor: 'resume_text' })

  return (
    <main>
      <Breadcrumbs
        className="mb-4 px-4 sm:px-6 pt-6 max-w-6xl mx-auto"
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Search Strategy' },
        ]}
      />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 mb-4">
        {hasIntake ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-slate-600">Strategy intake saved. Your brief uses those decision rules.</p>
            <Link href="/dashboard/strategy/intake" className="text-[13px] font-semibold text-slate-700 underline decoration-slate-300 underline-offset-4 hover:text-slate-900 transition-colors">
              Edit intake
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-orange-200 bg-orange-50 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-600">Sharpen your brief</p>
              <p className="text-[14px] text-slate-700 mt-1">Complete the strategy intake so your brief reflects your decision rules, red flags, and constraints. Answers from onboarding are pre-filled.</p>
            </div>
            <Link href="/dashboard/strategy/intake" className="shrink-0 rounded-full bg-slate-900 px-4 py-2 text-[13px] font-semibold text-white hover:bg-slate-800 transition-colors">
              Complete intake
            </Link>
          </div>
        )}
      </div>
      <h1 className="sr-only">Search Strategy Brief</h1>
      <nav className="sr-only" aria-label="Strategy quick actions">
        <Link href="/dashboard">Back to dashboard</Link>
        <Link href="/dashboard">Review target companies</Link>
        <Link href="/onboarding">Complete onboarding inputs</Link>
      </nav>
      <StrategyClient missingFields={missing} />
    </main>
  )
}
