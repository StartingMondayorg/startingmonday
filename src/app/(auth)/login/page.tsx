'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import TurnstileWidget from '@/app/components/turnstile-widget'
import { Alert, AlertDescription, Button, Card, Input, Label } from '@/components/ui'
const TURNSTILE_ENABLED = process.env.NEXT_PUBLIC_TURNSTILE_ENABLED === '1'

function getInitialQueryError(): string | null {
  if (typeof window === 'undefined') return null
  const errorCode = new URLSearchParams(window.location.search).get('error')
  switch (errorCode) {
    case 'missing_credentials':
      return 'Enter both email and password to sign in.'
    case 'invalid_credentials':
      return 'That email/password did not work. If this account was created with Google or Apple, sign in with that provider first, then set a password in Settings > Security.'
    case 'auth_error':
      return 'Sign-in failed. Please try again.'
    case 'magic_failed':
      return 'Could not send sign-in link. Please try again.'
    case 'magic_disabled':
      return 'Magic link sign-in has been disabled. Use password, Google, or Apple.'
    case 'oauth_start_failed':
      return 'Could not start social sign-in. Please try again.'
    case 'rate_limited':
      return 'Too many attempts. Please wait a minute and try again.'
    case 'captcha_required':
      return 'Complete the security check before continuing.'
    default:
      return null
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [safeNextPath] = useState(() => {
    if (typeof window === 'undefined') return '/dashboard/briefing'
    const params = new URLSearchParams(window.location.search)
    const nextPath = params.get('next')?.trim() || '/dashboard/briefing'
    return nextPath.startsWith('/') ? nextPath : '/dashboard/briefing'
  })
  const googleFallbackHref = `/api/auth/oauth-start?provider=google&next=${encodeURIComponent(safeNextPath)}`
  const appleFallbackHref = `/api/auth/oauth-start?provider=apple&next=${encodeURIComponent(safeNextPath)}`

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(() => getInitialQueryError())
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [captchaToken, setCaptchaToken] = useState<string | null>(null)
  const [captchaUnavailable, setCaptchaUnavailable] = useState(false)

  const authBusy = googleLoading || appleLoading || loading

  function mapAuthError(error?: string, code?: string): string {
    if (code === 'CAPTCHA_UNAVAILABLE') {
      return 'Security check is temporarily unavailable. Please try again in a minute.'
    }
    if (code === 'CAPTCHA_REQUIRED') {
      return 'Complete the security check before continuing.'
    }
    if (code === 'CAPTCHA_FAILED') {
      return 'Security check failed. Please refresh and retry.'
    }
    return error || 'Sign-in failed'
  }

  function requireCaptchaToken(): string | null {
    if (!TURNSTILE_ENABLED) return ''
    if (captchaUnavailable) return ''
    if (!captchaToken) {
      setError('Complete the security check before continuing.')
      return null
    }
    return captchaToken
  }

  async function handleGoogle() {
    const token = requireCaptchaToken()
    if (token == null) return
    setError(null)
    setInfo(null)
    setGoogleLoading(true)
    try {
      const response = await fetch('/api/auth/verify-and-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-captcha-token': token } : {}),
        },
        body: JSON.stringify({
          provider: 'google',
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; code?: string; url?: string }

      if (!response.ok || !data.ok || !data.url) {
        setError(mapAuthError(data.error || 'Failed to start Google sign-in', data.code))
        setGoogleLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleApple() {
    const token = requireCaptchaToken()
    if (token == null) return
    setError(null)
    setInfo(null)
    setAppleLoading(true)
    try {
      const response = await fetch('/api/auth/verify-and-oauth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-captcha-token': token } : {}),
        },
        body: JSON.stringify({
          provider: 'apple',
          redirectTo: `${window.location.origin}/auth/callback`,
        }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; code?: string; url?: string }

      if (!response.ok || !data.ok || !data.url) {
        setError(mapAuthError(data.error || 'Failed to start Apple sign-in', data.code))
        setAppleLoading(false)
        return
      }

      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setAppleLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (authBusy) return
    const token = requireCaptchaToken()
    if (token == null) return
    setLoading(true)
    setError(null)
    setInfo(null)

    // Password managers can populate DOM inputs without firing onChange.
    // Read from the submitted form first, then fall back to React state.
    const formData = new FormData(e.currentTarget)
    const submittedEmail = (formData.get('email')?.toString().trim().toLowerCase() ?? '') || email
    const submittedPassword = (formData.get('password')?.toString() ?? '') || password

    setEmail(submittedEmail)
    setPassword(submittedPassword)

    try {
      const response = await fetch('/api/auth/verify-and-signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'x-captcha-token': token } : {}),
        },
        body: JSON.stringify({ email: submittedEmail, password: submittedPassword }),
      })

      const data = await response.json() as { ok?: boolean; error?: string; code?: string; user?: unknown }

      if (!response.ok || !data.ok) {
        if (data.code === 'INVALID_CREDENTIALS') {
          setError('That email/password did not work. If this account was created with Google or Apple, sign in with that provider first, then set a password in Settings > Security.')
        } else {
          setError(mapAuthError(data.error, data.code))
        }
        setLoading(false)
        return
      }

      // Successfully authenticated; cookies are already set by server
      router.push(safeNextPath)
      router.refresh()
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground transition-colors">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] px-6 py-16">
<div className="w-full max-w-sm">

          <div className="mb-8">
            <h1 className="text-[24px] font-bold text-foreground leading-tight">Sign in</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">Welcome back.</p>
          </div>

          <Card variant="glass" className="border-border bg-card/80 p-8 shadow-lg">

            <section id="login-social" className="mb-5">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Social sign-in</h2>
            <Button
              variant="outline"
              className={`w-full min-h-[44px] justify-center gap-2.5 !border-border !bg-muted/40 !text-foreground mb-5 hover:!bg-muted/60 ${authBusy ? '!opacity-50 !pointer-events-none' : ''}`}
              render={
                <a
                  href={googleFallbackHref}
                  onClick={(event) => {
                    event.preventDefault()
                    if (authBusy) return
                    void handleGoogle()
                  }}
                />
              }
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
              className={`w-full min-h-[44px] justify-center gap-2.5 !border-transparent !bg-primary !text-primary-foreground mb-5 hover:!bg-primary/90 ${authBusy ? '!opacity-50 !pointer-events-none' : ''}`}
              render={
                <a
                  href={appleFallbackHref}
                  onClick={(event) => {
                    event.preventDefault()
                    if (authBusy) return
                    void handleApple()
                  }}
                />
              }
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M16.365 1.43c0 1.14-.425 2.13-1.273 2.97-.852.84-1.88 1.31-3.084 1.21-.077-1.11.39-2.12 1.16-2.89.85-.85 1.99-1.35 3.197-1.29zM20.93 17.19c-.36.83-.79 1.6-1.29 2.31-.68.97-1.23 1.64-1.65 2.01-.65.6-1.34.91-2.07.93-.52 0-1.15-.15-1.89-.45-.74-.3-1.42-.45-2.04-.45-.65 0-1.35.15-2.1.45-.75.3-1.36.46-1.83.48-.7.03-1.41-.29-2.13-.96-.46-.4-1.04-1.1-1.74-2.1-.75-1.07-1.37-2.31-1.85-3.72-.51-1.52-.77-2.99-.77-4.41 0-1.63.35-3.04 1.06-4.23.56-.96 1.3-1.72 2.24-2.28.94-.56 1.96-.84 3.05-.86.57 0 1.31.18 2.22.53.91.35 1.49.53 1.74.53.19 0 .84-.2 1.95-.6 1.05-.37 1.93-.53 2.65-.48 1.95.16 3.42.93 4.4 2.31-1.75 1.06-2.62 2.55-2.6 4.47.02 1.5.56 2.75 1.64 3.74.49.46 1.04.81 1.64 1.04-.13.38-.27.75-.42 1.12z" />
              </svg>
              {appleLoading ? 'Redirecting…' : 'Continue with Apple'}
            </Button>
            </section>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-muted/80" />
              <span className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wide">or</span>
              <div className="flex-1 h-px bg-muted/80" />
            </div>

            <form id="login-password" onSubmit={handleSubmit} action="/api/auth/login-submit" method="post" className="flex flex-col gap-5">
              <input type="hidden" name="next" value={safeNextPath} />
              <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Email and password</h2>

              <div>
                <Label htmlFor="email" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full !border-border !bg-background/60 text-base text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <Label htmlFor="password" className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full !border-border !bg-background/60 text-base text-foreground"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {info && (
                <Alert variant="success">
                  <AlertDescription>{info}</AlertDescription>
                </Alert>
              )}

              {TURNSTILE_ENABLED ? (
                <TurnstileWidget
                  onTokenChange={setCaptchaToken}
                  onStatusChange={(status) => {
                    setCaptchaUnavailable(status === 'error')
                  }}
                />
              ) : null}

              <p className="text-[12px] text-muted-foreground">
                Used Google or Apple to sign up? Use that provider first, then set a password in Settings -&gt; Security.
              </p>




              <Button
                type="submit"
                name="intent"
                value="signin"
                disabled={authBusy}
                className="w-full min-h-[44px] justify-center rounded !bg-primary !text-primary-foreground text-[14px] hover:!bg-primary/90"
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </Button>

            </form>
          </Card>

          <div className="flex flex-col items-center mt-5">
            <span className="text-[13px] text-muted-foreground">No account?</span>
            <Link href="/signup" className="flex items-center justify-center min-h-[44px] text-[13px] text-primary font-semibold">
              Start your free trial - 30 days free, no credit card
            </Link>
          </div>

          <p className="text-center text-[11px] text-muted-foreground mt-8">
            &copy; {new Date().getFullYear()} Starting Monday. All rights reserved.
          </p>
          <p className="text-center text-[11px] text-muted-foreground mt-2">
            Private by default. We do not share your data with recruiters, employers, or third parties.
          </p>

        </div>
      </main>
    </div>
  )
}

