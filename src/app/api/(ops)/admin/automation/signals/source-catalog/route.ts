import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { getCatalogGovernanceSummary, getSignalSourceCatalog } from '@/lib/signal-source-catalog'

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const catalog = getSignalSourceCatalog()
  const governance = getCatalogGovernanceSummary()

  return NextResponse.json({
    ok: true,
    catalogVersion: catalog.version,
    reviewCadenceDays: catalog.reviewCadenceDays,
    updatedAt: catalog.updatedAt,
    governance,
    sources: catalog.sources,
  })
}
