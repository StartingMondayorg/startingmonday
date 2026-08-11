import { type NextRequest } from 'next/server'
import { GET as providerQualityAuditGet } from '@/app/api/cron/provider-quality-audit/route'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  return providerQualityAuditGet(request)
}
