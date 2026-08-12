import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getDevAuthHeaders, isDevAuthBypassEnabled } from '@/lib/dev-auth'
import { getBrandContextFromHosts } from '@/lib/brand'

// Obvious non-browser clients: blocked on /api/optimize and /intelligence/* routes
const BOT_UA_RE = /^(curl|python-requests|python-urllib|go-http|java\/|wget|scrapy|httpx|aiohttp|libwww-perl|okhttp|axios\/|node-fetch|python\/|go\/|ruby|perl|php\/|spider|crawler|bot\/|bot$|scraper|HeadlessChrome)/i

const NOINDEX = { 'X-Robots-Tag': 'noindex, nofollow' }

const MANDATE_SIGNAL_ALLOWED_EXACT = new Set([
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/icon',
  '/apple-icon',
  '/opengraph-image',
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/api/health',
])

const MANDATE_SIGNAL_ALLOWED_PREFIXES = [
  '/api/auth/',
]

const DEPLOY_SHA = process.env.RAILWAY_GIT_COMMIT_SHA
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.GIT_COMMIT_SHA
  ?? 'unknown'

function generateRequestId(): string {
  // crypto.randomUUID is available on the edge runtime
  return `req_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`
}

function logRequest(request: NextRequest, requestId: string) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    event: 'request',
    method: request.method,
    path: request.nextUrl.pathname,
    correlation_id: requestId,
    deploy_sha: DEPLOY_SHA,
    ip: request.headers.get('cf-connecting-ip')
      ?? request.headers.get('x-real-ip')
      ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? '-',
  }))
}

function isMandateSignalAllowedPath(pathname: string): boolean {
  if (MANDATE_SIGNAL_ALLOWED_EXACT.has(pathname)) return true
  return MANDATE_SIGNAL_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function isProtectedRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/dashboard/')
    || pathname === '/dashboard'
    || pathname.startsWith('/onboarding/')
    || pathname === '/onboarding'
    || pathname.startsWith('/settings/')
    || pathname === '/settings'
  )
}

function markNoIndex(response: NextResponse, requestId: string): NextResponse {
  Object.entries(NOINDEX).forEach(([key, value]) => response.headers.set(key, value))
  response.headers.set('X-Request-Id', requestId)
  return response
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const requestId = request.headers.get('x-request-id') ?? generateRequestId()
  const devAuthEnabled = isDevAuthBypassEnabled()
  const brand = getBrandContextFromHosts([
    request.headers.get('host'),
    request.headers.get('x-forwarded-host'),
  ])

  // Enforce standalone host isolation for MandateSignal.
  if (brand.isMandateSignal && !isMandateSignalAllowedPath(pathname)) {
    const homeUrl = request.nextUrl.clone()
    homeUrl.pathname = '/'
    homeUrl.search = ''
    return NextResponse.redirect(homeUrl)
  }

  if (devAuthEnabled && (pathname === '/login' || pathname === '/auth/login')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''
    return NextResponse.redirect(dashboardUrl)
  }

  const nextRequestHeaders = devAuthEnabled ? new Headers(request.headers) : null
  if (nextRequestHeaders) {
    const devAuthHeaders = getDevAuthHeaders()
    devAuthHeaders.forEach((value, key) => nextRequestHeaders.set(key, value))
  }

  // --- API routes: early return after header/bot handling ---
  if (pathname.startsWith('/api/')) {
    // Skip logging for healthcheck to avoid noise
    if (pathname !== '/api/health') logRequest(request, requestId)

    // Block automated clients from the public LinkedIn review tool
    if (pathname === '/api/optimize') {
      const ua = request.headers.get('user-agent') ?? ''
      if (!ua || BOT_UA_RE.test(ua)) {
        return new NextResponse('Forbidden', { status: 403 })
      }
    }
    // Tell crawlers not to index API responses
    const res = NextResponse.next(nextRequestHeaders ? { request: { headers: nextRequestHeaders } } : undefined)
    res.headers.set('X-Robots-Tag', 'noindex, nofollow')
    res.headers.set('X-Request-Id', requestId)
    return res
  }

  // --- Intelligence routes: bot detection only, no auth required ---
  if (pathname.startsWith('/intelligence/')) {
    logRequest(request, requestId)
    const ua = request.headers.get('user-agent') ?? ''
    if (!ua || BOT_UA_RE.test(ua)) {
      return new NextResponse('Forbidden', { status: 403 })
    }
    const intelligenceRes = NextResponse.next(nextRequestHeaders ? { request: { headers: nextRequestHeaders } } : undefined)
    intelligenceRes.headers.set('X-Request-Id', requestId)
    return intelligenceRes
  }

  if (devAuthEnabled && nextRequestHeaders) {
    return markNoIndex(NextResponse.next({ request: { headers: nextRequestHeaders } }), requestId)
  }

  if (!isProtectedRoute(pathname)) {
    const response = NextResponse.next(nextRequestHeaders ? { request: { headers: nextRequestHeaders } } : undefined)
    response.headers.set('X-Request-Id', requestId)
    return response
  }

  // --- Protected routes: session refresh + redirect guard ---
  // Item 4: Refresh Supabase session cookie on every dashboard request.
  // getUser() validates with the Supabase Auth server and rotates the
  // refresh token when needed. getSession() must not be used here.
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          Object.entries(NOINDEX).forEach(([k, v]) => supabaseResponse.headers.set(k, v))
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return markNoIndex(NextResponse.redirect(loginUrl), requestId)
  }

  return markNoIndex(supabaseResponse, requestId)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|.*\\..*).*)',
  ],
}