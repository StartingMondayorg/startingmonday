/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { loadReliabilitySnapshotFromDb, resolveReliabilityThresholds } from '@/lib/outreach/reliability-metrics'

function readNumberParam(request: NextRequest, key: string): number | undefined {
  const raw = request.nextUrl.searchParams.get(key)
  if (!raw) return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const admin = createAdminClient() as any
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const windowDays = readNumberParam(request, 'windowDays')
  const thresholds = resolveReliabilityThresholds({
    minAcceptedRatePct: readNumberParam(request, 'minAcceptedRatePct'),
    maxNegativeOutcomeRatePct: readNumberParam(request, 'maxNegativeOutcomeRatePct'),
    maxHardFailureRatePct: readNumberParam(request, 'maxHardFailureRatePct'),
    maxQueueStaleMinutes: readNumberParam(request, 'maxQueueStaleMinutes'),
    maxSendingLockMinutes: readNumberParam(request, 'maxSendingLockMinutes'),
    maxWebhookLagMinutes: readNumberParam(request, 'maxWebhookLagMinutes'),
    maxRetryRatePct: readNumberParam(request, 'maxRetryRatePct'),
  })

  const snapshot = await loadReliabilitySnapshotFromDb(admin, {
    windowDays,
    thresholds,
  })

  return NextResponse.json({ ok: true, snapshot })
}
