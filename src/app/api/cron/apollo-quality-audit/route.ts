import { type NextRequest } from 'next/server'
import { GET as providerQualityAuditGet, runtime } from '@/app/api/cron/provider-quality-audit/route'

export { runtime }

export async function GET(request: NextRequest) {
  return providerQualityAuditGet(request)
}
