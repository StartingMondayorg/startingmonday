import { type NextRequest } from 'next/server'
import { GET as providerQualityAuditGet } from '@/app/api/(ops)/cron/provider-quality-audit/route'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
const COMPAT_ROUTE = 'apollo-quality-audit'
const REPLACEMENT_ROUTE = 'provider-quality-audit'
const SUNSET_HTTP_DATE = 'Wed, 30 Sep 2026 00:00:00 GMT'
const COMPAT_HIT_ALERT_KEY = 'apollo-quality-audit-compat-hit'
const COMPAT_HIT_WINDOW_HOURS = 24

type MonitoringAlertDetails = {
  hitCount?: unknown
  windowHitCount?: unknown
  lifetimeHitCount?: unknown
  windowStartAt?: unknown
  hitCountWindowHours?: unknown
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

function readNumber(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(0, Math.floor(value))
}

function readWindowStartAt(value: unknown): string | null {
  if (typeof value !== 'string') return null
  return Number.isNaN(Date.parse(value)) ? null : value
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

    const nowIso = new Date().toISOString()
    const priorDetails = priorState?.last_details
    const priorWindowHitCount = readNumber(
      priorDetails?.windowHitCount,
      readNumber(priorDetails?.hitCount, 0),
    )
    const priorLifetimeHitCount = readNumber(
      priorDetails?.lifetimeHitCount,
      readNumber(priorDetails?.hitCount, 0),
    )
    const priorWindowStartAt = readWindowStartAt(priorDetails?.windowStartAt)
    const windowAgeHours = priorWindowStartAt === null
      ? null
      : (Date.now() - Date.parse(priorWindowStartAt)) / 3_600_000
    const windowExpired = priorWindowStartAt === null
      || windowAgeHours === null
      || windowAgeHours >= COMPAT_HIT_WINDOW_HOURS
    const windowStartAt = windowExpired ? nowIso : priorWindowStartAt
    const windowHitCount = windowExpired ? 1 : priorWindowHitCount + 1
    const lifetimeHitCount = priorLifetimeHitCount + 1

    const { error: writeError } = await admin
      .from('monitoring_alert_state')
      .upsert({
        alert_key: COMPAT_HIT_ALERT_KEY,
        last_status: 'deprecated-route-hit',
        last_checked_at: nowIso,
        last_details: {
          // `hitCount` remains the compatibility budget source and now represents the rolling window count.
          hitCount: windowHitCount,
          windowHitCount,
          lifetimeHitCount,
          hitCountWindowHours: COMPAT_HIT_WINDOW_HOURS,
          windowStartAt,
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
  // validateCronRequest is enforced by the delegated provider-quality-audit route.
  const response = await providerQualityAuditGet(request)
  const headers = new Headers(response.headers)
  headers.set('x-startingmonday-compat-route', COMPAT_ROUTE)
  headers.set('x-startingmonday-replacement-route', REPLACEMENT_ROUTE)
  headers.set('deprecation', 'true')
  headers.set('sunset', SUNSET_HTTP_DATE)
  headers.set('link', '</api/cron/provider-quality-audit>; rel="successor-version"')
  headers.set('warning', '299 - "Deprecated cron route; migrate to /api/cron/provider-quality-audit"')

  await recordCompatibilityHit(request)

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
