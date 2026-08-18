import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { enforcePublicEndpointGuard, getClientIp } from '@/lib/public-endpoint-guard'
import { canAccessFeature, getUserSubscription } from '@/lib/subscription'

export const runtime = 'nodejs'

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  return request.nextUrl.origin
}

function getSafeNext(nextParam: FormDataEntryValue | null): string {
  const value = (nextParam?.toString() ?? '').trim()
  if (!value) return '/dashboard'
  return value.startsWith('/') ? value : '/dashboard'
}

function buildLoginRedirect(publicOrigin: string, nextPath: string, params: Record<string, string>) {
  const url = new URL('/login', publicOrigin)
  url.searchParams.set('next', nextPath)
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  return url
}

function resolvePostLoginPath(nextPath: string, hasCoachDashboard: boolean): string {
  // Respect explicit redirects. Only change the default onboarding path.
  if (!hasCoachDashboard) return nextPath
  if (nextPath !== '/dashboard') return nextPath
  return '/dashboard/coach'
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { allowed } = await checkRateLimit(`login_submit:${ip}`, 8)

  const publicOrigin = getPublicOrigin(request)

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.redirect(new URL('/login?error=auth_error', publicOrigin))
  }

  const nextPath = getSafeNext(formData.get('next'))

  if (!allowed) {
    return NextResponse.redirect(
      buildLoginRedirect(publicOrigin, nextPath, { error: 'rate_limited' })
    )
  }

  const intent = (formData.get('intent')?.toString() ?? 'signin').trim()
  const email = (formData.get('email')?.toString() ?? '').trim().toLowerCase()
  const password = formData.get('password')?.toString() ?? ''

  const supabase = await createClient()

  if (intent === 'magic') {
    return NextResponse.redirect(
      buildLoginRedirect(publicOrigin, nextPath, { error: 'magic_disabled' })
    )
  }

  if (!email || !password) {
    return NextResponse.redirect(
      buildLoginRedirect(publicOrigin, nextPath, { error: 'missing_credentials' })
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const invalidCredentials = /invalid login credentials/i.test(error.message)
    return NextResponse.redirect(
      buildLoginRedirect(publicOrigin, nextPath, {
        error: invalidCredentials ? 'invalid_credentials' : 'auth_error',
      })
    )
  }

  let redirectPath = nextPath
  const userId = data.user?.id
  if (userId) {
    const subscription = await getUserSubscription(userId, supabase)
    redirectPath = resolvePostLoginPath(nextPath, canAccessFeature(subscription, 'coach_dashboard'))
  }

  return NextResponse.redirect(new URL(redirectPath, publicOrigin))
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
