/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { summarizeOutreachSendBatch } from '@/lib/outreach/send-queue'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const supabase = await createClient()
  const admin = createAdminClient() as any
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const batchId = request.nextUrl.searchParams.get('batchId')?.trim()
  if (!batchId) {
    return NextResponse.json({ error: 'batchId is required.' }, { status: 400 })
  }

  const { data: batch } = await admin
    .from('outreach_send_batches')
    .select('id, user_id, mode, status, requested_count, summary, created_at, updated_at')
    .eq('id', batchId)
    .eq('user_id', userId)
    .maybeSingle()

  if (!batch?.id) {
    return NextResponse.json({ error: 'Batch not found.' }, { status: 404 })
  }

  const refreshed = await summarizeOutreachSendBatch(admin, batchId)
  return NextResponse.json({
    ok: true,
    batchId,
    mode: batch.mode,
    status: refreshed.status,
    requestedCount: refreshed.summary.totalJobs,
    summary: refreshed.summary,
  })
}
