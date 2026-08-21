import { NextResponse } from 'next/server'
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

  const admin = createAdminClient()
  const { data: current, error: requestError } = await admin
    .from('live_brief_requests')
    .select('status')
    .eq('id', id)
    .maybeSingle()
  if (requestError) return NextResponse.json({ error: 'Unable to load live brief request' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'Live brief request not found' }, { status: 404 })
  if (current.status !== 'delivered') return NextResponse.json({ error: 'Only delivered live briefs can be revoked' }, { status: 409 })

  const { data: delivery, error: deliveryError } = await admin
    .from('live_brief_deliveries')
    .select('id,revoked_at')
    .eq('request_id', id)
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (deliveryError) return NextResponse.json({ error: 'Unable to load live brief delivery' }, { status: 500 })
  if (!delivery) return NextResponse.json({ error: 'No active delivery found' }, { status: 409 })

  const revokedAt = new Date().toISOString()
  const { error: deliveryUpdateError } = await admin
    .from('live_brief_deliveries')
    .update({ revoked_at: revokedAt, revoked_by_user_id: auth.userId })
    .eq('id', delivery.id)
  if (deliveryUpdateError) return NextResponse.json({ error: 'Unable to revoke live brief delivery' }, { status: 500 })

  const { error: requestUpdateError } = await admin
    .from('live_brief_requests')
    .update({ status: 'revoked' })
    .eq('id', id)
  if (requestUpdateError) {
    await admin.from('live_brief_deliveries').update({ revoked_at: null, revoked_by_user_id: null }).eq('id', delivery.id)
    return NextResponse.json({ error: 'Unable to update live brief status' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      delivery_id: delivery.id,
      actor_user_id: auth.userId,
      event_type: 'delivery_revoked',
      idempotency_key: crypto.randomUUID(),
      event_payload: { revoked_at: revokedAt },
    })
  if (eventError) {
    await admin.from('live_brief_requests').update({ status: current.status }).eq('id', id)
    await admin.from('live_brief_deliveries').update({ revoked_at: null, revoked_by_user_id: null }).eq('id', delivery.id)
    return NextResponse.json({ error: 'Revocation event could not be recorded' }, { status: 500 })
  }

  return NextResponse.json({ revoked: true, delivery_id: delivery.id, revoked_at: revokedAt })
}