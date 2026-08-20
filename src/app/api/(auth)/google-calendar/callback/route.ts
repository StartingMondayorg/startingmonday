import { type NextRequest, NextResponse } from 'next/server'
import { APP_URL } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  exchangeGoogleCalendarCode,
  syncGoogleCalendarIntegration,
} from '@/lib/google-calendar'

const STATE_COOKIE = 'sm_google_calendar_oauth_state'
const RETURN_TO_COOKIE = 'sm_google_calendar_return_to'
const DEFAULT_RETURN_TO = '/dashboard/admin/social'

function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') ? value : DEFAULT_RETURN_TO
}

function redirectWithError(message: string): NextResponse {
  const url = new URL(DEFAULT_RETURN_TO, APP_URL)
  url.searchParams.set('google_calendar', 'error')
  url.searchParams.set('message', message)
  return NextResponse.redirect(url)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', APP_URL))

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')

  const stateCookie = request.cookies.get(STATE_COOKIE)?.value ?? null
  const returnTo = safeReturnTo(request.cookies.get(RETURN_TO_COOKIE)?.value ?? null)

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return redirectWithError('Google Calendar authorization could not be verified.')
  }

  try {
    const token = await exchangeGoogleCalendarCode(code)
    const admin = createAdminClient() as any
    const now = new Date().toISOString()

    const { data: integration, error: upsertError } = await admin
      .from('google_calendar_integrations')
      .upsert({
        user_id: user.id,
        provider: 'google',
        calendar_id: 'primary',
        access_token: token.access_token,
        refresh_token: token.refresh_token,
        token_expires_at: token.expires_at,
        scope: token.scope,
        active: true,
        updated_at: now,
      }, {
        onConflict: 'user_id',
      })
      .select('id, user_id, provider, calendar_id, access_token, refresh_token, token_expires_at, scope, active, last_synced_at, created_at, updated_at')
      .single()

    if (upsertError || !integration) {
      throw new Error(upsertError?.message ?? 'Unable to save Google Calendar connection.')
    }

    try {
      await syncGoogleCalendarIntegration(admin, integration)
    } catch (syncError) {
      console.error('Google Calendar initial sync failed', syncError)
    }

    const response = NextResponse.redirect(new URL(returnTo, APP_URL))
    response.cookies.set(STATE_COOKIE, '', { path: '/', maxAge: 0 })
    response.cookies.set(RETURN_TO_COOKIE, '', { path: '/', maxAge: 0 })
    return response
  } catch (error) {
    console.error('Google Calendar callback failed', error)
    const message = error instanceof Error ? error.message : 'Google Calendar connection failed.'
    return redirectWithError(message)
  }
}
