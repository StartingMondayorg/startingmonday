import { type NextRequest } from 'next/server'
import { GET as providerQualityAuditGet } from '@/app/api/cron/provider-quality-audit/route'

export const runtime = 'nodejs'
const COMPAT_ROUTE = 'apollo-quality-audit'
const REPLACEMENT_ROUTE = 'provider-quality-audit'
const SUNSET_HTTP_DATE = 'Wed, 30 Sep 2026 00:00:00 GMT'

export async function GET(request: NextRequest) {
  const response = await providerQualityAuditGet(request)
  const headers = new Headers(response.headers)
  headers.set('x-startingmonday-compat-route', COMPAT_ROUTE)
  headers.set('x-startingmonday-replacement-route', REPLACEMENT_ROUTE)
  headers.set('deprecation', 'true')
  headers.set('sunset', SUNSET_HTTP_DATE)
  headers.set('link', '</api/cron/provider-quality-audit>; rel="successor-version"')
  headers.set('warning', '299 - "Deprecated cron route; migrate to /api/cron/provider-quality-audit"')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
