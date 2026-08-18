import { randomUUID } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { APP_URL } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { buildGoogleCalendarAuthUrl } from '@/lib/google-calendar'

const STATE_COOKIE = 'sm_google_calendar_oauth_state'
const RETURN_TO_COOKIE = 'sm_google_calendar_return_to'
const DEFAULT_RETURN_TO = '/dashboard/admin/social'
const COOKIE_SECURE = APP_URL.startsWith('https://')

function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') ? value : DEFAULT_RETURN_TO
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', APP_URL))

  const url = new URL(request.url)
  const returnTo = safeReturnTo(url.searchParams.get('returnTo'))
  const state = randomUUID()
  let authUrl = ''
  try {
    authUrl = buildGoogleCalendarAuthUrl({ state })
  } catch (error) {
    console.warn('google-calendar-connect: oauth is not configured', error)
    const fallback = new URL(returnTo, APP_URL)
    fallback.searchParams.set('google_calendar', 'error')
    fallback.searchParams.set('message', 'Google Calendar is not configured for this environment.')
    return NextResponse.redirect(fallback)
  }

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    path: '/',
    maxAge: 10 * 60,
  })
  response.cookies.set(RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    path: '/',
    maxAge: 10 * 60,
  })
  return response
}
