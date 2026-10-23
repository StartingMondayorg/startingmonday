import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

export const runtime = 'nodejs'

type RequestBody = {
  email?: unknown
  password?: unknown
}

function getPublicOrigin(request: NextRequest): string {
  const forwardedHost = request.headers.get('x-forwarded-host')
  const forwardedProto = request.headers.get('x-forwarded-proto') ?? 'https'
  if (forwardedHost) return `${forwardedProto}://${forwardedHost}`
  return request.nextUrl.origin
}

function isSignupDisabledError(error: { message?: string } | null | undefined): boolean {
  const message = error?.message?.toLowerCase() ?? ''
  return (
    message.includes('signups not allowed')
    || message.includes('signup not allowed')
    || message.includes('signups are not allowed')
    || message.includes('signup is disabled')
    || message.includes('sign up is disabled')
  )
}

export async function POST(request: NextRequest) {
  const guardResponse = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'signup',
    maxPerMinute: 3,
    requireCaptcha: true,
  })
  if (guardResponse) return guardResponse

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400 })
  }

  const redirectTo = `${getPublicOrigin(request)}/auth/callback?next=/dashboard/briefing`

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

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: redirectTo },
  })

  // Never fall back to admin.createUser here: a pre-confirmed account for an
  // unverified address could claim email-keyed access such as staff roles.
  if (error && isSignupDisabledError(error)) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Email signup is temporarily unavailable. Use Google or Apple, or try again later.',
        code: 'SIGNUPS_DISABLED',
      },
      { status: 503 }
    )
  }

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
  }

  return NextResponse.json(
    {
      ok: true,
      user: data.user ?? null,
      session: data.session ?? null,
      message: 'If the email is valid, check your inbox to confirm your account.',
    },
    { status: 200 }
  )
}

const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
