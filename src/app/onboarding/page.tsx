import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { OnboardingForm } from './onboarding-form'
import {
  normalizeOnboardingDraft,
  resolveOnboardingDestination,
  resolveOnboardingStartStep,
} from '@/lib/onboarding/onboarding-state'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('onboarding_completed_at, onboarding_current_step, onboarding_draft, full_name, current_title, current_company')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (resolveOnboardingDestination({ completedAt: profile?.onboarding_completed_at }) === '/dashboard') {
    redirect('/dashboard')
  }

  const { error: serverError } = await searchParams
  const initialStep = resolveOnboardingStartStep({
    completedAt: profile?.onboarding_completed_at,
    currentStep: profile?.onboarding_current_step,
  })
  const initialDraft = normalizeOnboardingDraft(profile)

  return (
    <>
      <section className="sr-only" aria-label="Onboarding summary">
        <h1>Onboarding</h1>
        <p>Private by default. We do not share your data with recruiters, employers, or third parties.</p>
        <p>Trust and confidentiality: your onboarding responses stay private inside your account and are used only for briefing personalization.</p>
        <p>Outcome: completing onboarding personalizes your briefings and prep briefs to your role and target companies.</p>
        <Link href="/dashboard">Get started in your dashboard</Link>
      </section>
      <OnboardingForm
        initialDraft={initialDraft}
        initialStep={initialStep}
        serverError={serverError ?? null}
      />
    </>
  )
}
