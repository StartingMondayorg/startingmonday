import { type NextRequest } from 'next/server'
import { GET as providerQualityAuditGet } from '@/app/api/cron/provider-quality-audit/route'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
const COMPAT_ROUTE = 'apollo-quality-audit'
const REPLACEMENT_ROUTE = 'provider-quality-audit'
const SUNSET_HTTP_DATE = 'Wed, 30 Sep 2026 00:00:00 GMT'
const COMPAT_HIT_ALERT_KEY = 'apollo-quality-audit-compat-hit'

type MonitoringAlertDetails = {
  hitCount?: unknown
}

type MonitoringAlertRow = {
  last_details?: MonitoringAlertDetails
}

type QueryError = {
  message: string
}

type MonitoringAlertTableClient = {
  select: (columns: string) => {
    eq: (column: string, value: string) => {
      maybeSingle: () => Promise<{ data: MonitoringAlertRow | null; error: QueryError | null }>
    }
  }
  upsert: (
    payload: Record<string, unknown>,
    options: { onConflict: string },
  ) => Promise<{ error: QueryError | null }>
}

type MonitoringAdminClient = {
  from: (table: 'monitoring_alert_state') => MonitoringAlertTableClient
}

async function recordCompatibilityHit(request: NextRequest): Promise<void> {
  try {
    const admin = createAdminClient() as unknown as MonitoringAdminClient
    const { data: priorState, error: readError } = await admin
      .from('monitoring_alert_state')
      .select('last_details')
      .eq('alert_key', COMPAT_HIT_ALERT_KEY)
      .maybeSingle()

    if (readError) {
      throw new Error(`compat hit read failed: ${readError.message}`)
    }

    const priorHitCountRaw = priorState?.last_details?.hitCount
    const priorHitCount = typeof priorHitCountRaw === 'number' && Number.isFinite(priorHitCountRaw)
      ? priorHitCountRaw
      : 0
    const nowIso = new Date().toISOString()

    const { error: writeError } = await admin
      .from('monitoring_alert_state')
      .upsert({
        alert_key: COMPAT_HIT_ALERT_KEY,
        last_status: 'deprecated-route-hit',
        last_checked_at: nowIso,
        last_details: {
          hitCount: priorHitCount + 1,
          replacementRoute: `/api/cron/${REPLACEMENT_ROUTE}`,
          lastPath: request.nextUrl.pathname,
          lastQuery: request.nextUrl.search,
          lastUserAgent: request.headers.get('user-agent') ?? 'unknown',
          lastSeenAt: nowIso,
        },
        updated_at: nowIso,
      }, { onConflict: 'alert_key' })

    if (writeError) {
      throw new Error(`compat hit write failed: ${writeError.message}`)
    }
  } catch (error) {
    // Observability persistence must not block compatibility behavior.
    console.error('[cron.apollo-quality-audit] compat hit observability write failed', error)
  }
}

export async function GET(request: NextRequest) {
  const response = await providerQualityAuditGet(request)
  const headers = new Headers(response.headers)
  headers.set('x-startingmonday-compat-route', COMPAT_ROUTE)
  headers.set('x-startingmonday-replacement-route', REPLACEMENT_ROUTE)
  headers.set('deprecation', 'true')
  headers.set('sunset', SUNSET_HTTP_DATE)
  headers.set('link', '</api/cron/provider-quality-audit>; rel="successor-version"')
  headers.set('warning', '299 - "Deprecated cron route; migrate to /api/cron/provider-quality-audit"')

  void recordCompatibilityHit(request)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
