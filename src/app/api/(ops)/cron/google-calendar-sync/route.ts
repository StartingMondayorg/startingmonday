import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { syncGoogleCalendarIntegration } from '@/lib/google-calendar'

function isGoogleCalendarSchemaError(error: unknown): boolean {
  const code = typeof (error as { code?: unknown })?.code === 'string'
    ? (error as { code: string }).code
    : ''
  const message = typeof (error as { message?: unknown })?.message === 'string'
    ? (error as { message: string }).message.toLowerCase()
    : ''

  if (code === '42P01' || code === '42703') return true
  return message.includes('google_calendar_integrations') && (
    message.includes('does not exist') || message.includes('column')
  )
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient() as any

  const { data: integrations, error } = await admin
    .from('google_calendar_integrations')
    .select('id, user_id, provider, calendar_id, access_token, refresh_token, token_expires_at, scope, active, last_synced_at, created_at, updated_at')
    .eq('active', true)

  if (error) {
    if (isGoogleCalendarSchemaError(error)) {
      console.warn('Google Calendar sync skipped: schema unavailable', error)
      return NextResponse.json({
        synced: 0,
        created: 0,
        updated: 0,
        errors: 0,
        skipped: true,
        reason: 'google_calendar_schema_unavailable',
      })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const activeIntegrations = integrations ?? []
  if (activeIntegrations.length === 0) {
    return NextResponse.json({ synced: 0, created: 0, updated: 0, errors: 0 })
  }

  const summary = { synced: 0, created: 0, updated: 0, errors: 0 }

  for (const integration of activeIntegrations) {
    try {
      const result = await syncGoogleCalendarIntegration(admin, integration)
      summary.synced += 1
      summary.created += result.created
      summary.updated += result.updated
    } catch (error) {
      summary.errors += 1
      console.error('Google Calendar sync failed', integration.id, error)
    }
  }

  return NextResponse.json(summary)
}
