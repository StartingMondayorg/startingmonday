import { type NextRequest, NextResponse } from 'next/server'
import { APP_URL } from '@/lib/config'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_RETURN_TO = '/dashboard/admin/social'

function safeReturnTo(value: string | null): string {
  return value && value.startsWith('/') ? value : DEFAULT_RETURN_TO
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', APP_URL))

  const contentType = request.headers.get('content-type')?.toLowerCase() ?? ''
  const acceptsJson = (request.headers.get('accept') ?? '').toLowerCase().includes('application/json')

  let returnTo = DEFAULT_RETURN_TO
  if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const formData = await request.formData().catch(() => null)
    returnTo = safeReturnTo(formData?.get('returnTo')?.toString() ?? null)
  } else if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null) as { returnTo?: unknown } | null
    returnTo = safeReturnTo(typeof body?.returnTo === 'string' ? body.returnTo : null)
  }

  const admin = createAdminClient() as any

  const { data: integration } = await admin
    .from('google_calendar_integrations')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (integration?.id) {
    await admin
      .from('google_calendar_integrations')
      .update({
        active: false,
        access_token: null,
        refresh_token: null,
        token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)
  }

  if (acceptsJson || contentType.includes('application/json')) {
    const response = NextResponse.json({ ok: true, disconnected: Boolean(integration?.id), returnTo })
    response.cookies.set('sm_google_calendar_oauth_state', '', { path: '/', maxAge: 0 })
    response.cookies.set('sm_google_calendar_return_to', '', { path: '/', maxAge: 0 })
    return response
  }

  const response = NextResponse.redirect(new URL(returnTo, APP_URL))
  response.cookies.set('sm_google_calendar_oauth_state', '', { path: '/', maxAge: 0 })
  response.cookies.set('sm_google_calendar_return_to', '', { path: '/', maxAge: 0 })
  return response
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
