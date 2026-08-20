import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

export const runtime = 'nodejs'

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  return request.nextUrl.origin
}

function getSafeNext(nextParam: string | null): string {
  if (!nextParam) return '/dashboard/briefing'
  return nextParam.startsWith('/') ? nextParam : '/dashboard/briefing'
}

export async function GET(request: NextRequest) {
  const guardResponse = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'oauth-start',
    maxPerMinute: 20,
    requireCaptcha: false,
  })
  if (guardResponse) {
    const loginUrl = new URL('/login', getPublicOrigin(request))
    loginUrl.searchParams.set('error', 'rate_limited')
    return NextResponse.redirect(loginUrl)
  }

  const provider = request.nextUrl.searchParams.get('provider')
  const nextPath = getSafeNext(request.nextUrl.searchParams.get('next'))
  const loginUrl = new URL('/login', getPublicOrigin(request))
  loginUrl.searchParams.set('next', nextPath)

  if (provider !== 'google' && provider !== 'apple') {
    loginUrl.searchParams.set('error', 'oauth_start_failed')
    return NextResponse.redirect(loginUrl)
  }

  const callbackUrl = new URL('/auth/callback', getPublicOrigin(request))
  callbackUrl.searchParams.set('next', nextPath)

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })

    if (error || !data.url) {
      loginUrl.searchParams.set('error', 'oauth_start_failed')
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.redirect(data.url)
  } catch {
    loginUrl.searchParams.set('error', 'oauth_start_failed')
    return NextResponse.redirect(loginUrl)
  }
}
