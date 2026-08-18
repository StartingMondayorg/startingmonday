import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

export const runtime = 'nodejs'

type RequestBody = {
  provider?: unknown
  redirectTo?: unknown
}

const ALLOWED_PROVIDERS = new Set(['google', 'apple'])

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  return request.nextUrl.origin
}

export async function POST(request: NextRequest) {
  const guardResponse = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'oauth',
    maxPerMinute: 5,
    requireCaptcha: true,
  })
  if (guardResponse) return guardResponse

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const provider = typeof body.provider === 'string' ? body.provider : ''
  const redirectTo = typeof body.redirectTo === 'string' && body.redirectTo ? body.redirectTo : `${getPublicOrigin(request)}/auth/callback`

  if (!ALLOWED_PROVIDERS.has(provider)) {
    return NextResponse.json({ ok: false, error: 'Unsupported provider' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google' | 'apple',
    options: { redirectTo },
  })

  if (error || !data.url) {
    return NextResponse.json({ ok: false, error: error?.message ?? 'Failed to start OAuth sign-in' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, url: data.url }, { status: 200 })
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
