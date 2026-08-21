import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Breadcrumbs } from '@/app/(dashboard)/dashboard/_components/Breadcrumbs'
import { StrategyClient } from './strategy-client'
import { Alert, AlertDescription, AlertTitle, Button } from '@/components/ui'
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
          <Alert className="flex flex-wrap items-center justify-between gap-3 [&>svg]:hidden">
            <AlertDescription className="text-[13px] text-muted-foreground">Strategy intake saved. Your brief uses those decision rules.</AlertDescription>
            <Link href="/dashboard/strategy/intake" className="text-[13px] font-semibold text-muted-foreground underline decoration-muted-foreground underline-offset-4 hover:text-foreground transition-colors">
              Edit intake
            </Link>
          </Alert>
        ) : (
          <Alert variant="warning" className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between [&>svg]:hidden">
            <div>
              <AlertTitle className="text-[11px] font-bold tracking-[0.16em] uppercase">Sharpen your brief</AlertTitle>
              <AlertDescription className="text-[14px] mt-1">Complete the strategy intake so your brief reflects your decision rules, red flags, and constraints. Answers from onboarding are pre-filled.</AlertDescription>
            </div>
            <Button size="sm" className="shrink-0 rounded-full" render={<Link href="/dashboard/strategy/intake" />}>
              Complete intake
            </Button>
          </Alert>
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
