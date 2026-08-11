import { type NextRequest } from 'next/server'
import { GET as providerQualityAuditGet } from '@/app/api/cron/provider-quality-audit/route'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const response = await providerQualityAuditGet(request)
  const headers = new Headers(response.headers)
  headers.set('x-startingmonday-compat-route', 'apollo-quality-audit')
  headers.set('x-startingmonday-replacement-route', 'provider-quality-audit')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
