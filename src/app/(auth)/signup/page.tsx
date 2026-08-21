'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { usePostHog } from 'posthog-js/react'
import TurnstileWidget from '@/app/components/turnstile-widget'
import { PRIVACY_VERSION, TERMS_VERSION } from '@/lib/policy-versions'
import { reportAttributionFailure } from '@/lib/attribution-failure'
import firstWeekSpine from '@/content/first-week-spine.json'
import { Alert, AlertDescription, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
const TURNSTILE_ENABLED = process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === '1'

type SituationContent = {
  title: string
  sub: string
  firstStep: string
  cta: string
}

type EntryHandoff = {
  title: string
  body: string
  nextStep: string
}

const SITUATION_COPY: Record<string, SituationContent> = {
  urgent: {
    title: 'You need to land well. Quickly.',
    sub: 'Your first briefing is ready by morning. Add target companies and Starting Monday starts working tonight.',
    firstStep: 'Add your top 10 target companies so tomorrow morning has one clear priority action.',
    cta: 'start your campaign',
  },
  executive: {
    title: 'Targeted search. Moving faster starts now.',
    sub: 'Your pipeline, your signals, your prep briefs - all in one place from day one.',
    firstStep: 'Set your level and create your first campaign pipeline.',
    cta: 'launch your campaign',
  },
  building: {
    title: 'Build your list before you announce anything.',
    sub: 'Track target companies silently. Your employer will never know you\'re watching.',
    firstStep: 'Start with quiet monitoring on companies you would call first if a transition signal appears.',
    cta: 'start monitoring quietly',
  },
  restructured: {
    title: 'You know your worth.',
    sub: 'Land at the right level, not just the next one. Every brief is calibrated to the role you deserve.',
    firstStep: 'Define your target level first, then add companies that match that altitude.',
    cta: 'start at the right level',
  },
  passive: {
    title: 'Not ready to commit. That\'s fine.',
    sub: 'Monitor your targets in the background. You\'ll know the moment something changes.',
    firstStep: 'Begin in low-visibility mode and track target companies without active outreach.',
    cta: 'start with Monitor',
  },
  'vp-up': {
    title: 'You have the record. Now run the campaign.',
    sub: 'Every output - prep briefs, outreach, strategy - calibrated to the altitude you\'re moving toward.',
    firstStep: 'Set your campaign to VP-to-CXO mode and generate your first positioning brief.',
    cta: 'start your VP-to-CXO campaign',
  },
  returning: {
    title: 'This is the one that sticks.',
    sub: 'One step at a time. Add your first company and the system starts working.',
    firstStep: 'Rebuild momentum by tracking one company first, then expand to your full list.',
    cta: 'restart your campaign',
  },
  'low-energy': {
    title: 'One thing at a time.',
    sub: 'Set it up once. The briefing comes to you. The system does the heavy lifting.',
    firstStep: 'Do one setup pass now so your morning briefing handles the daily execution rhythm.',
    cta: 'set up once and start',
  },
  optionality: {
    title: 'You want to know before you have to.',
    sub: 'Monitor your target companies without committing to an active campaign. The platform works in the background.',
    firstStep: 'Track optionality targets now so you can move the same day a signal appears.',
    cta: 'start your optionality track',
  },
}

const ENTRY_HANDOFF: Record<string, EntryHandoff> = {
  landing: {
    title: 'You are continuing from the Motion Signal landing flow.',
    body: 'This signup path keeps the same model: identify signal movement, choose one relationship action, and run weekly cadence with less friction.',
    nextStep: 'Create your account, then set your first target list and morning briefing priority.',
  },
  pricing: {
    title: 'You are continuing from pricing.',
    body: 'You do not need to finalize tier selection right now. Start free, run the first weekly rhythm, then choose based on campaign intensity.',
    nextStep: 'Create your account and begin with one target company plus one outreach priority.',
  },
  concierge: {
    title: 'You are continuing from concierge.',
    body: 'If you prefer self-serve first, this path gets you live quickly while preserving confidentiality and weekly operating discipline.',
    nextStep: 'Create your account and launch your first briefing cycle today.',
  },
}

type HeardAboutOption =
  | 'managertools'
  | 'executive_coach_referral'
  | 'linkedin'
  | 'google_web_search'
  | 'colleague_or_peer'
  | 'other'

const HEARD_ABOUT_OPTIONS: Array<{ value: HeardAboutOption; label: string }> = [
  { value: 'managertools', label: 'Manager Tools' },
  { value: 'executive_coach_referral', label: 'Executive coach referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'google_web_search', label: 'Google / web search' },
  { value: 'colleague_or_peer', label: 'Colleague or peer' },
  { value: 'other', label: 'Other (please specify)' },
]

export default function SignupPage() {
  const router = useRouter()
  const ph = usePostHog()
  const [email, setEmail] = useState('')
  const [situation, setSituation] = useState<string | null>(null)
  const [entrySource, setEntrySource] = useState<string | null>(null)
  const [managerToolsOffer, setManagerToolsOffer] = useState(false)
  const [heardAbout, setHeardAbout] = useState<HeardAboutOption | ''>('')
  const [heardAboutOther, setHeardAboutOther] = useState('')
  const [referrerName, setReferrerName] = useState('')
  const [referrerCompany, setReferrerCompany] = useState('')
  const [heardAboutLocked, setHeardAboutLocked] = useState(false)

   
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const from = params.get('from')
    if (from && SITUATION_COPY[from]) setSituation(from)
    if (from && ENTRY_HANDOFF[from]) setEntrySource(from)
    const utmSource = (params.get('utm_source') || '').trim().toLowerCase()
    if (utmSource === 'managertools') {
      setHeardAbout('managertools')
      setHeardAboutLocked(true)
      setManagerToolsOffer(true)
    }
  }, [])
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  // Error shown next to the social sign-in buttons so failures are visible
  // at the click site (captcha not ready, backend errors). Previously the
  // only error element rendered below the fold and the buttons looked dead.
  const [socialError, setSocialError] = useState<string | null>(null)
  const captchaSectionRef = useRef<HTMLDivElement | null>(null)

  const authBusy = googleLoading || appleLoading || loading

  function getSelfReportedSource(): string | null {
    if (!heardAbout) return null
    if (heardAbout === 'other') {
      const detail = heardAboutOther.trim()
      return detail ? `other:${detail.slice(0, 120)}` : 'other'
    }
    return heardAbout
  }

  function getReferrerName(): string | null {
    const value = referrerName.trim()
    return value ? value.slice(0, 120) : null
  }

  function getReferrerCompany(): string | null {
    const value = referrerCompany.trim()
    return value ? value.slice(0, 160) : null
  }

  function isManagerToolsSource(source: string | null | undefined): boolean {
    return (source ?? '').trim().toLowerCase() === 'managertools'
  }

  function managerToolsTrialEndsAt(): string {
    return new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()
  }

  function requireCaptchaToken(): string | null {
    if (!TURNSTILE_ENABLED) return ''
    if (!captchaToken) {
      setError('Complete the security check before continuing.')
      setSocialError('Complete the security check below before continuing.')
      captchaSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return null
    }
    return captchaToken
  }

  async function handleGoogle() {
    setSocialError(null)
    const token = requireCaptchaToken()
    if (token == null) return
    setGoogleLoading(true)
    try {
      ph?.capture('signup_completed', { method: 'google' })
    } catch { /* analytics must not block */ }
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source') || null
    const refCode = params.get('ref') || null
    const selfReportedSource = getSelfReportedSource()
    const referrerNameValue = getReferrerName()
    const referrerCompanyValue = getReferrerCompany()
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
    if (utmSource) callbackUrl.searchParams.set('utm_source', utmSource)
    if (refCode) callbackUrl.searchParams.set('ref_code', refCode)
    if (selfReportedSource) callbackUrl.searchParams.set('self_reported_source', selfReportedSource)
    if (referrerNameValue) callbackUrl.searchParams.set('referrer_name', referrerNameValue)
    if (referrerCompanyValue) callbackUrl.searchParams.set('referrer_company', referrerCompanyValue)
    const utmMedium = params.get('utm_medium')
    if (utmMedium) callbackUrl.searchParams.set('utm_medium', utmMedium)
    callbackUrl.searchParams.set('accepted_terms_version', TERMS_VERSION)
    callbackUrl.searchParams.set('accepted_privacy_version', PRIVACY_VERSION)
    callbackUrl.searchParams.set('policy_accepted_at', new Date().toISOString())
    try {
      const response = await fetch('/api/auth/verify-and-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(TURNSTILE_ENABLED ? { 'x-captcha-token': token } : {}),
        },
        body: JSON.stringify({
          provider: 'google',
          redirectTo: callbackUrl.toString(),
        }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; url?: string }

      if (!response.ok || !data.ok || !data.url) {
        setError(data.error || 'Failed to start Google sign-in')
        setSocialError(data.error || 'Failed to start Google sign-in. Please try again.')
        setGoogleLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setSocialError('Something went wrong starting Google sign-in. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleApple() {
    setSocialError(null)
    const token = requireCaptchaToken()
    if (token == null) return
    setAppleLoading(true)
    try {
      ph?.capture('signup_completed', { method: 'apple' })
    } catch { /* analytics must not block */ }
    const params = new URLSearchParams(window.location.search)
    const utmSource = params.get('utm_source') || null
    const refCode = params.get('ref') || null
    const selfReportedSource = getSelfReportedSource()
    const referrerNameValue = getReferrerName()
    const referrerCompanyValue = getReferrerCompany()
    const callbackUrl = new URL(`${window.location.origin}/auth/callback`)
    if (utmSource) callbackUrl.searchParams.set('utm_source', utmSource)
    if (refCode) callbackUrl.searchParams.set('ref_code', refCode)
    if (selfReportedSource) callbackUrl.searchParams.set('self_reported_source', selfReportedSource)
    if (referrerNameValue) callbackUrl.searchParams.set('referrer_name', referrerNameValue)
    if (referrerCompanyValue) callbackUrl.searchParams.set('referrer_company', referrerCompanyValue)
    const utmMedium = params.get('utm_medium')
    if (utmMedium) callbackUrl.searchParams.set('utm_medium', utmMedium)
    callbackUrl.searchParams.set('accepted_terms_version', TERMS_VERSION)
    callbackUrl.searchParams.set('accepted_privacy_version', PRIVACY_VERSION)
    callbackUrl.searchParams.set('policy_accepted_at', new Date().toISOString())
    try {
      const response = await fetch('/api/auth/verify-and-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(TURNSTILE_ENABLED ? { 'x-captcha-token': token } : {}),
        },
        body: JSON.stringify({
          provider: 'apple',
          redirectTo: callbackUrl.toString(),
        }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; url?: string }

      if (!response.ok || !data.ok || !data.url) {
        setError(data.error || 'Failed to start Apple sign-in')
        setSocialError(data.error || 'Failed to start Apple sign-in. Please try again.')
        setAppleLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setSocialError('Something went wrong starting Apple sign-in. Please try again.')
      setAppleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const token = requireCaptchaToken()
    if (token == null) return
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/auth/verify-and-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(TURNSTILE_ENABLED ? { 'x-captcha-token': token } : {}),
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; user?: { id: string; email?: string | null } | null; session?: unknown }

      if (!response.ok || !data.ok) {
        const code = (data as { code?: string }).code
        if (code === 'SIGNUPS_DISABLED') {
          setError('Email signup is temporarily unavailable. Use Google or Apple, or try again later.')
        } else if (code === 'EMAIL_EXISTS') {
          setError('An account with that email already exists. Try signing in instead.')
        } else {
          setError(data.error || 'Account creation failed')
        }
        setLoading(false)
        return
      }

      if (data.user) {
        const supabase = createClient()
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
        const params = new URLSearchParams(window.location.search)
        const ref = params.get('ref') || null
        const utmSource = params.get('utm_source') || null
        const utmMedium = params.get('utm_medium') || null
        const utmCampaign = params.get('utm_campaign') || null
        const fromSituation = params.get('from') || null
        const selfReportedSource = getSelfReportedSource()
        const referrerNameValue = getReferrerName()
        const referrerCompanyValue = getReferrerCompany()
        const signupSource = selfReportedSource ?? utmSource ?? ref ?? (fromSituation ? `situation:${fromSituation}` : null)
        const managerToolsSource = isManagerToolsSource(signupSource)
        const acceptedAt = new Date().toISOString()
        const [, attributionResult] = await Promise.all([
          supabase.from('user_profiles').upsert(
            {
              user_id: data.user.id,
              briefing_timezone: tz,
              ...(ref ? { referred_by: ref } : {}),
              ...(referrerNameValue ? { referred_by_name: referrerNameValue } : {}),
              ...(referrerCompanyValue ? { referred_by_company: referrerCompanyValue } : {}),
            },
            { onConflict: 'user_id' }
          ),
          supabase.from('users').update({
            signup_source: signupSource,
            acquisition_channel: utmMedium ?? (ref ? 'referral' : (selfReportedSource ? 'self_reported' : null)),
            referral_source: utmCampaign ?? utmSource ?? ref ?? selfReportedSource ?? null,
            accepted_terms_version: TERMS_VERSION,
            accepted_privacy_version: PRIVACY_VERSION,
            policy_accepted_at: acceptedAt,
            ...(managerToolsSource ? { trial_ends_at: managerToolsTrialEndsAt() } : {}),
          }).eq('id', data.user.id),
          ref
            ? fetch('/api/partners/attribute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ referral_code: ref }),
              }).catch(() => {})
            : Promise.resolve(),
        ])

        // This write carries attribution, the campaign trial length, and the
        // consent record. It failed silently for seven weeks when a column in
        // it did not exist in the database (SMK-456) -- never swallow it again.
        reportAttributionFailure(attributionResult?.error, {
          path: 'password_signup',
          signup_source: signupSource,
          manager_tools: managerToolsSource,
        })
      }

      try {
        const phParams = new URLSearchParams(window.location.search)
        ph?.capture('signup_completed', {
          method: 'email',
          situation: phParams.get('from') ?? null,
          source: getSelfReportedSource() ?? phParams.get('utm_source') ?? phParams.get('ref') ?? null,
        })
      } catch { /* analytics must not block */ }

      if (!data.session) {
        setConfirmed(true)
        setLoading(false)
        return
      }

      const seatToken = new URLSearchParams(window.location.search).get('seat_token')
      router.push(seatToken ? `/team/join/${seatToken}` : '/dashboard/briefing')
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-card/85 font-sans text-foreground">

      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground hover:text-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-16">
<div className="w-full max-w-sm">

          {confirmed ? (
            <>
              <section id="confirm-email" className="mb-8">
                <h2 className="text-[24px] font-bold text-foreground leading-tight">Check your email</h2>
                <p className="text-[13px] text-foreground mt-1.5">Confirmation link sent to <span className="font-semibold text-foreground">{email}</span>.</p>
                <p className="text-[13px] text-foreground mt-1">Most emails arrive in under 2 minutes.</p>
                <p className="text-[13px] text-foreground mt-1">{firstWeekSpine.confirmationLine}</p>
              </section>
              <Card variant="glass" className="border-border bg-card/80 p-8 shadow-lg">
                <p className="text-[14px] text-foreground leading-relaxed">
                  Open the email, click the link, and finish setup. If it is not there after a few minutes, check spam or promotions.
                </p>
                <p className="text-[13px] text-foreground leading-relaxed mt-3">
                  While you wait, you can preview the workflow and come back once your email is confirmed.
                </p>
                <Link href="/demo" className="inline-block mt-3 text-[13px] font-semibold text-primary underline">
                  Explore the demo while waiting &rarr;
                </Link>
              </Card>
              <p className="text-center text-[13px] text-foreground mt-5">
                Already confirmed?{' '}
                <Link href="/login" className="text-primary font-semibold">
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <section id="signup-intro" className="mb-8">
                {situation && SITUATION_COPY[situation] ? (
                  <>
                    <h2 className="text-[22px] font-bold text-foreground leading-tight">{SITUATION_COPY[situation].title}</h2>
                    <p className="text-[13px] text-foreground mt-1.5">{SITUATION_COPY[situation].sub}</p>
                      <p className="text-[13px] text-foreground mt-3">Create your account. {managerToolsOffer ? '60 days free' : '30 days free'}. No credit card.</p>
                    <div className="mt-4 rounded border border-border bg-card/70 p-3">
                      <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-2">Your first steps</p>
                      <ol className="space-y-1.5 text-[13px] text-foreground leading-relaxed">
                        <li>1. Create your account</li>
                        <li>2. {SITUATION_COPY[situation].firstStep}</li>
                        <li>3. {firstWeekSpine.condensed[1]}</li>
                        <li>4. {firstWeekSpine.condensed[2]}</li>
                      </ol>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-2">Start your free trial</p>
                    <h1 className="text-[24px] font-bold text-foreground leading-tight">Create your account</h1>
                    <p className="text-[14px] text-foreground mt-1.5 font-semibold">{managerToolsOffer ? '60 days free' : '30 days free'}. No credit card. Cancel anytime.</p>
                  </>
                )}
                {entrySource && ENTRY_HANDOFF[entrySource] && (
                  <div className="mt-4 rounded border border-border bg-card/70 p-3">
                    <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-2">Continuity note</p>
                    <p className="text-[13px] text-foreground leading-relaxed mb-1.5">{ENTRY_HANDOFF[entrySource].title}</p>
                    <p className="text-[13px] text-foreground leading-relaxed mb-1.5">{ENTRY_HANDOFF[entrySource].body}</p>
                    <p className="text-[13px] text-foreground leading-relaxed"><span className="font-semibold text-foreground">Next:</span> {ENTRY_HANDOFF[entrySource].nextStep}</p>
                  </div>
                )}
              </section>

              <Card variant="glass" className="border-border bg-card/80 p-8 shadow-lg">

                <section id="social-signin" className="mb-5">
                <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-foreground mb-3">Social sign-in</h2>
                {socialError && (
                  <Alert variant="destructive" className="mb-3">
                    <AlertDescription>{socialError}</AlertDescription>
                  </Alert>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogle}
                  disabled={authBusy}
                  className="w-full min-h-[44px] justify-center gap-2.5 !border-border !bg-muted/40 !text-foreground mb-5 hover:!bg-muted/60"
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.252 17.64 11.927 17.64 9.2z" fill="#4285F4"/>
                    <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                    <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                    <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                  </svg>
                  {googleLoading ? 'Redirecting…' : 'Continue with Google'}
                </Button>

                <Button
                  type="button"
                  onClick={handleApple}
                  disabled={authBusy}
                  className="w-full min-h-[44px] justify-center gap-2.5 !border-transparent !bg-primary !text-primary-foreground mb-5 hover:!bg-muted"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M16.365 1.43c0 1.14-.425 2.13-1.273 2.97-.852.84-1.88 1.31-3.084 1.21-.077-1.11.39-2.12 1.16-2.89.85-.85 1.99-1.35 3.197-1.29zM20.93 17.19c-.36.83-.79 1.6-1.29 2.31-.68.97-1.23 1.64-1.65 2.01-.65.6-1.34.91-2.07.93-.52 0-1.15-.15-1.89-.45-.74-.3-1.42-.45-2.04-.45-.65 0-1.35.15-2.1.45-.75.3-1.36.46-1.83.48-.7.03-1.41-.29-2.13-.96-.46-.4-1.04-1.1-1.74-2.1-.75-1.07-1.37-2.31-1.85-3.72-.51-1.52-.77-2.99-.77-4.41 0-1.63.35-3.04 1.06-4.23.56-.96 1.3-1.72 2.24-2.28.94-.56 1.96-.84 3.05-.86.57 0 1.31.18 2.22.53.91.35 1.49.53 1.74.53.19 0 .84-.2 1.95-.6 1.05-.37 1.93-.53 2.65-.48 1.95.16 3.42.93 4.4 2.31-1.75 1.06-2.62 2.55-2.6 4.47.02 1.5.56 2.75 1.64 3.74.49.46 1.04.81 1.64 1.04-.13.38-.27.75-.42 1.12z" />
                  </svg>
                  {appleLoading ? 'Redirecting…' : 'Continue with Apple'}
                </Button>
                <p className="text-[12px] text-foreground leading-relaxed">
                  By continuing, you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms and Conditions</Link> and <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                </p>
                </section>

                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 h-px bg-muted/80" />
                  <span className="text-[13px] text-foreground font-semibold uppercase tracking-wide">or</span>
                  <div className="flex-1 h-px bg-muted/80" />
                </div>

                <form id="email-signup" onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-foreground">Email signup</h2>

                  <div>
                    <Label htmlFor="email" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-1.5">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full !border-border !bg-background/60 text-base text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="password" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-1.5">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full !border-border !bg-background/60 text-base text-foreground"
                    />
                    <p className="mt-1.5 text-[13px] text-foreground">At least 8 characters.</p>
                  </div>

                  <div>
                    <Label htmlFor="heard-about" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-1.5">
                      How did you hear about Starting Monday?
                    </Label>
                    <Select
                      value={heardAbout || undefined}
                      onValueChange={(value) => setHeardAbout(value as HeardAboutOption)}
                      disabled={heardAboutLocked}
                    >
                      <SelectTrigger id="heard-about" className="w-full !border-border !bg-background/60 text-base text-foreground disabled:!bg-card disabled:!text-muted-foreground">
                        <SelectValue placeholder="Select (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {HEARD_ABOUT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {heardAboutLocked ? (
                      <p className="mt-1.5 text-[13px] text-foreground">Auto-selected from the Manager Tools link.</p>
                    ) : (
                      <p className="mt-1.5 text-[13px] text-foreground">Optional. Helps us tailor your onboarding.</p>
                    )}
                  </div>

                  {heardAbout === 'other' && !heardAboutLocked ? (
                    <div>
                      <Label htmlFor="heard-about-other" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-1.5">
                        Other source
                      </Label>
                      <Input
                        id="heard-about-other"
                        type="text"
                        value={heardAboutOther}
                        onChange={(e) => setHeardAboutOther(e.target.value)}
                        placeholder="Please specify"
                        className="w-full !border-border !bg-background/60 text-base text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  ) : null}

                  <div>
                    <Label htmlFor="referrer-name" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-1.5">
                      Referrer name (optional)
                    </Label>
                    <Input
                      id="referrer-name"
                      type="text"
                      value={referrerName}
                      onChange={(e) => setReferrerName(e.target.value)}
                      placeholder="Who referred you?"
                      className="w-full !border-border !bg-background/60 text-base text-foreground placeholder:text-muted-foreground"
                    />
                  </div>

                  <div>
                    <Label htmlFor="referrer-company" className="block text-[13px] font-bold tracking-[0.08em] uppercase text-foreground mb-1.5">
                      Referrer company (optional)
                    </Label>
                    <Input
                      id="referrer-company"
                      type="text"
                      value={referrerCompany}
                      onChange={(e) => setReferrerCompany(e.target.value)}
                      placeholder="Company or firm name"
                      className="w-full !border-border !bg-background/60 text-base text-foreground placeholder:text-muted-foreground"
                    />
                    <p className="mt-1.5 text-[13px] text-foreground">Used for partner referral fee and commission tracking.</p>
                  </div>

                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div ref={captchaSectionRef}>
                    {TURNSTILE_ENABLED ? <TurnstileWidget onTokenChange={setCaptchaToken} /> : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[44px] justify-center rounded !bg-primary !text-primary-foreground text-[14px] hover:!bg-primary/90"
                  >
                    {loading ? 'Creating account…' : (situation && SITUATION_COPY[situation] ? `Create account and ${SITUATION_COPY[situation].cta}` : 'Start free trial')}
                  </Button>
                  <p className="text-[12px] text-foreground leading-relaxed text-center">
                    By creating an account, you agree to our <Link href="/terms" className="underline hover:text-foreground">Terms and Conditions</Link> and <Link href="/privacy" className="underline hover:text-foreground">Privacy Policy</Link>.
                  </p>
                  <p id="signup-trust" className="text-center text-[13px] text-foreground">
                    Private by default. We do not share your data with recruiters, employers, or third parties.{' '}
                    <Link href="/privacy" className="inline-flex items-center min-h-[44px] underline hover:text-foreground">Privacy policy &rarr;</Link>
                  </p>
                  <p className="text-center text-[13px] font-semibold text-foreground">{firstWeekSpine.guaranteeLine}</p>

                </form>
              </Card>

              <div className="flex flex-col items-center mt-5">
                <span className="text-[13px] text-foreground">Already have an account?</span>
                <Link href="/login" className="flex items-center justify-center min-h-[44px] text-[13px] text-muted-foreground font-semibold hover:text-foreground">
                  Sign in
                </Link>
              </div>
              <div className="flex flex-col items-center mt-1">
                <span className="text-[13px] text-foreground">Not ready to commit?</span>
                <Link href="/demo" className="flex items-center justify-center min-h-[44px] text-[13px] text-muted-foreground font-semibold hover:text-foreground">
                  Explore the demo first &rarr;
                </Link>
              </div>
            </>
          )}

          <p className="text-center text-[13px] text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
          </p>

        </div>
      </main>
    </div>
  )
}

