import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'
import { logEvent } from '@/lib/events'

export const runtime = 'nodejs'

type RequestBody = {
  email?: unknown
  password?: unknown
}

export async function POST(request: NextRequest) {
  const guardResponse = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'login',
    maxPerMinute: 5,
    requireCaptcha: true,
  })
  if (guardResponse) return guardResponse

  let body: RequestBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { email, password } = body

  // Validate input types
  if (typeof email !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'Missing or invalid required fields' },
      { status: 400 }
    )
  }

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: 'Missing required fields' },
      { status: 400 }
    )
  }

  // Proceed with authentication
  try {
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

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      const isInvalidCredentials = /invalid login credentials/i.test(error.message)
      return NextResponse.json(
        {
          ok: false,
          error: isInvalidCredentials
            ? 'Invalid email/password. If you signed up with Google or Apple, sign in with that provider first, then set a password in Settings > Security.'
            : error.message,
          code: isInvalidCredentials ? 'INVALID_CREDENTIALS' : 'AUTH_ERROR',
        },
        { status: 401 }
      )
    }

    if (data.user) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      await supabase.from('user_profiles').upsert(
        { user_id: data.user.id, briefing_timezone: tz },
        { onConflict: 'user_id' }
      )

      await logEvent(data.user.id, 'auth_path_routed', {
        route: 'verify-and-signin',
        path_category: 'direct_password',
        auth_method: 'password',
      })
    }

    return NextResponse.json(
      {
        ok: true,
        user: data.user,
        session: data.session,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Login error:', err)
    return NextResponse.json(
      { ok: false, error: 'An error occurred during sign-in' },
      { status: 500 }
    )
  }
}
