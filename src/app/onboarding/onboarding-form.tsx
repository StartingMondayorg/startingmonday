'use client'
import { useEffect, useRef, useState } from 'react'
import { completeOnboarding, saveOnboardingProgress, skipOnboarding } from './actions'
import { HelpQuickButton } from '@/app/components/HelpQuickButton'
import { Alert, AlertDescription, Button, Card } from '@/components/ui'
import { type OnboardingChannel, computeElapsedSeconds } from '@/lib/onboarding/onboarding-speed'
import type { OnboardingDraft } from '@/lib/onboarding/onboarding-state'
import { ONBOARDING_FINAL_STEP } from '@/lib/onboarding/onboarding-state'
import { reportOnboardingStepCompleted, useOnboardingDraftState } from './use-onboarding-draft-state'
import { ROLE_TRACK_OPTIONS, StepLevel, type RoleTrackOption } from './steps/step-level'
import { StepPosture } from './steps/step-posture'
import { StepCompanies } from './steps/step-companies'
import { StepBriefingTime } from './steps/step-briefing-time'

// R-4 (2026-10-21): three screens, one path. Role lane + posture, companies,
// briefing time. Everything that used to follow (import, enrichment, context,
// the first-value preview) lives on /dashboard/profile or is the dashboard itself.
const STEP_COUNT = ONBOARDING_FINAL_STEP + 1
const DEFAULT_BRIEFING_TIME = '07:00'

function Dots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2" aria-label={`Step ${current + 1} of ${STEP_COUNT}`}>
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <div
          key={i}
          className={[
            'rounded-full transition-all duration-300',
            i === current ? 'w-5 h-1.5 bg-primary' : i < current ? 'w-1.5 h-1.5 bg-muted' : 'w-1.5 h-1.5 bg-muted/80',
          ].join(' ')}
        />
      ))}
    </div>
  )
}

export function OnboardingForm({
  initialDraft,
  initialStep,
  serverError,
}: {
  initialDraft: OnboardingDraft
  initialStep: number
  serverError: string | null
}) {
  const onboardingParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const channelParam = onboardingParams?.get('channel')

  const [step, setStep] = useState(Math.min(Math.max(initialStep, 0), ONBOARDING_FINAL_STEP))
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const [animating, setAnimating] = useState(false)
  const [savingProgress, setSavingProgress] = useState(false)
  const [progressError, setProgressError] = useState(serverError ?? '')
  const [onboardingChannel] = useState<OnboardingChannel>(() => {
    if (channelParam && ['executives', 'coaches', 'outplacement', 'search_firms'].includes(channelParam)) {
      return channelParam as OnboardingChannel
    }
    return 'executives'
  })
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [onboardingStartedAt] = useState(() => new Date().toISOString())
  const startLogged = useRef(false)

  const draft = useOnboardingDraftState(initialDraft)
  const {
    searchPersona, setSearchPersona, searchPosture, setSearchPosture,
    roleFamily, setRoleFamily, roleTitle, setRoleTitle, roleTitles, setRoleTitles,
    currentTitle, resumeText, targetTitles,
    companyNames, setCompanyNames, briefingTime, setBriefingTime,
    emailNudgesOptIn, setEmailNudgesOptIn, buildDraft,
  } = draft

  const effectiveBriefingTime = briefingTime || DEFAULT_BRIEFING_TIME
  const companyCount = companyNames.filter((n) => n.trim()).length
  const posturePicked = searchPosture === 'active' || searchPosture === 'exploring' || searchPosture === 'not_looking'

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds(computeElapsedSeconds(onboardingStartedAt))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [onboardingStartedAt])

  useEffect(() => {
    if (startLogged.current) return
    startLogged.current = true
    fetch('/api/onboarding/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'onboarding_started',
        properties: {
          started_at: onboardingStartedAt,
          channel: onboardingChannel,
          mode: 'standard',
          confidence_band: null,
          action_context: 'onboarding_started',
        },
      }),
    }).catch(() => {})
  }, [onboardingStartedAt, onboardingChannel])

  async function goTo(next: number) {
    if (animating || savingProgress) return
    if (next > step) {
      setSavingProgress(true)
      setProgressError('')
      try {
        await saveOnboardingProgress(next, buildDraft(false))
      } catch {
        setProgressError('We could not save your progress. Check your connection and try again.')
        setSavingProgress(false)
        return
      }
      setSavingProgress(false)
      reportOnboardingStepCompleted({ step, onboardingStartedAt, lowEnergyMode: false, onboardingChannel })
    }
    setDirection(next > step ? 'forward' : 'back')
    setAnimating(true)
    window.setTimeout(() => {
      setStep(next)
      setAnimating(false)
    }, 180)
  }

  function toggleRoleTrack(opt: RoleTrackOption) {
    setRoleTitles((prev) => {
      const next = prev.includes(opt.value) ? prev.filter((v) => v !== opt.value) : [...prev, opt.value]
      const primary = ROLE_TRACK_OPTIONS.find((o) => o.value === next[0]) ?? null
      setRoleTitle(primary?.value ?? '')
      setRoleFamily(primary?.roleFamily ?? '')
      setSearchPersona(primary?.persona ?? '')
      return next
    })
  }

  // The first scan starts the moment companies are confirmed so the dashboard
  // has something to show when the user lands on it a few seconds later.
  function startFirstScan() {
    const names = companyNames.map((n) => n.trim()).filter(Boolean)
    if (names.length === 0) return
    fetch('/api/onboarding/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyNames: names }),
    }).catch(() => {})
  }

  const slideClass = animating
    ? direction === 'forward'
      ? 'opacity-0 translate-x-4'
      : 'opacity-0 -translate-x-4'
    : 'opacity-100 translate-x-0'

  const hint =
    step === 0
      ? 'Two taps. This shapes your first dashboard.'
      : step === 1
        ? 'Three is a good start. You can add more any time.'
        : 'Your dashboard is next.'

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <form id="onboarding-form" action={completeOnboarding} className="hidden">
        <input type="hidden" name="search_persona" value={searchPersona} />
        <input type="hidden" name="search_posture" value={searchPosture} />
        <input type="hidden" name="role_family" value={roleFamily} />
        <input type="hidden" name="role_title" value={roleTitle} />
        <input type="hidden" name="target_role_tracks" value={JSON.stringify(roleTitles)} />
        <input type="hidden" name="onboarding_channel" value={onboardingChannel} />
        <input type="hidden" name="onboarding_started_at" value={onboardingStartedAt} />
        <input type="hidden" name="onboarding_elapsed_seconds" value={String(elapsedSeconds)} />
        <input type="hidden" name="company_names" value={JSON.stringify(companyNames.filter((n) => n.trim()))} />
        <input type="hidden" name="briefing_time" value={effectiveBriefingTime} />
        <input type="hidden" name="briefing_frequency" value="daily" />
        <input type="hidden" name="email_nudges_opt_in" value={emailNudgesOptIn ? 'true' : 'false'} />
      </form>

      <Card variant="glass" className="w-full max-w-lg rounded-2xl border-border bg-card/80 p-5 shadow-xl sm:p-6">
        <div className="text-center mb-10">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span>
            <span className="text-primary">Monday</span>
          </span>
        </div>

        {progressError && (
          <Alert variant="destructive" className="mb-5">
            <AlertDescription>{progressError}</AlertDescription>
          </Alert>
        )}

        <div className={['transition-all duration-200 ease-out', slideClass].join(' ')}>
          {step === 0 && (
            <>
              <StepLevel roleTitles={roleTitles} onToggle={toggleRoleTrack} />
              <StepPosture value={searchPosture} onChange={setSearchPosture} />
            </>
          )}

          {step === 1 && (
            <StepCompanies
              names={companyNames}
              onChange={setCompanyNames}
              persona={searchPersona}
              currentTitle={currentTitle}
              targetTitles={targetTitles}
              resumeText={resumeText}
              isPassive={searchPosture === 'not_looking'}
            />
          )}

          {step === 2 && (
            <StepBriefingTime
              value={effectiveBriefingTime}
              onChange={setBriefingTime}
              emailNudgesOptIn={emailNudgesOptIn}
              onEmailNudgesOptIn={setEmailNudgesOptIn}
            />
          )}
        </div>

        <div className="mt-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {step > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => goTo(step - 1)}
                className="h-auto p-0 !bg-transparent text-[13px] font-normal text-muted-foreground hover:text-foreground"
              >
                Back
              </Button>
            )}
            <Button
              type="submit"
              variant="ghost"
              form="onboarding-form"
              formAction={skipOnboarding}
              className="h-auto p-0 !bg-transparent text-[12px] font-normal text-muted-foreground"
            >
              Skip setup
            </Button>
          </div>

          <div className="flex flex-col items-center gap-2">
            <Dots current={step} />
            <p className="text-[11px] text-muted-foreground">{hint}</p>
          </div>

          <div>
            {step === 0 && (
              <Button
                type="button"
                onClick={() => goTo(1)}
                disabled={roleTitles.length === 0 || !posturePicked || savingProgress}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Continue
              </Button>
            )}
            {step === 1 && (
              <Button
                type="button"
                onClick={() => {
                  startFirstScan()
                  void goTo(2)
                }}
                disabled={companyCount === 0 || savingProgress}
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                Continue
              </Button>
            )}
            {step === 2 && (
              <Button
                type="submit"
                form="onboarding-form"
                className="px-6 min-h-[44px] text-[14px] font-semibold"
              >
                {searchPosture === 'not_looking' ? 'Start monitoring' : 'Go to my dashboard'}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <HelpQuickButton source="onboarding" href="/settings/help" />
    </div>
  )
}
