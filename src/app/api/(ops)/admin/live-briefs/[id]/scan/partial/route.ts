import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess } from '@/lib/live-brief-auth'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefMutationAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  const admin = createAdminClient() as unknown as SupabaseClient
  const { data: run, error: runError } = await admin
    .from('live_brief_scan_runs')
    .select('id,status,request_id')
    .eq('request_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (runError) return NextResponse.json({ error: 'Unable to load scan run' }, { status: 500 })
  if (!run) return NextResponse.json({ error: 'Scan run not found' }, { status: 404 })
  if (['completed', 'failed', 'canceled', 'partial_ready'].includes(run.status)) {
    return NextResponse.json({ error: 'Scan run is no longer accepting partial completion' }, { status: 409 })
  }

  const acceptedAt = new Date().toISOString()
  const { error: runUpdateError } = await admin
    .from('live_brief_scan_runs')
    .update({ status: 'partial_ready', accepted_partial_at: acceptedAt, accepted_partial_by_user_id: auth.userId })
    .eq('id', run.id)
  if (runUpdateError) return NextResponse.json({ error: 'Unable to accept partial scan' }, { status: 500 })

  const { error: requestUpdateError } = await admin
    .from('live_brief_requests')
    .update({ status: 'ready_for_review' })
    .eq('id', id)
  if (requestUpdateError) {
    await admin.from('live_brief_scan_runs').update({ status: run.status, accepted_partial_at: null, accepted_partial_by_user_id: null }).eq('id', run.id)
    return NextResponse.json({ error: 'Unable to update request after partial acceptance' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      actor_user_id: auth.userId,
      event_type: 'scan_partial_accepted',
      idempotency_key: crypto.randomUUID(),
      event_payload: { run_id: run.id, accepted_at: acceptedAt },
    })
  if (eventError) {
    await admin.from('live_brief_requests').update({ status: 'scanning' }).eq('id', id)
    await admin.from('live_brief_scan_runs').update({ status: run.status, accepted_partial_at: null, accepted_partial_by_user_id: null }).eq('id', run.id)
    return NextResponse.json({ error: 'Partial acceptance event could not be recorded' }, { status: 500 })
  }

  return NextResponse.json({ accepted: true, run_id: run.id, status: 'partial_ready' })
}