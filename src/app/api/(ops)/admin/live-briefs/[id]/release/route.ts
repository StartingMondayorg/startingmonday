import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess } from '@/lib/live-brief-auth'
import { createLiveBriefDeliveryToken, hashLiveBriefDeliveryToken, LIVE_BRIEF_DELIVERY_TTL_SECONDS } from '@/lib/live-brief-delivery'

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
  if (current.status !== 'ready_for_review') {
    return NextResponse.json({ error: 'A finalized brief is required before release' }, { status: 409 })
  }

  const { data: artifact, error: artifactError } = await admin
    .from('live_brief_artifacts')
    .select('id,version')
    .eq('request_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (artifactError) return NextResponse.json({ error: 'Unable to load finalized brief artifact' }, { status: 500 })
  if (!artifact) return NextResponse.json({ error: 'A finalized brief is required before release' }, { status: 409 })

  const token = createLiveBriefDeliveryToken()
  const expiresAt = new Date(Date.now() + LIVE_BRIEF_DELIVERY_TTL_SECONDS * 1_000).toISOString()
  const { data: delivery, error: deliveryError } = await admin
    .from('live_brief_deliveries')
    .insert({
      request_id: id,
      artifact_id: artifact.id,
      token_digest: hashLiveBriefDeliveryToken(token),
      released_by_user_id: auth.userId,
      expires_at: expiresAt,
    })
    .select('id,expires_at')
    .single()
  if (deliveryError || !delivery?.id) return NextResponse.json({ error: 'Unable to release live brief' }, { status: 500 })

  const { error: updateError } = await admin
    .from('live_brief_requests')
    .update({ status: 'delivered' })
    .eq('id', id)
  if (updateError) {
    await admin.from('live_brief_deliveries').delete().eq('id', delivery.id)
    return NextResponse.json({ error: 'Unable to update live brief delivery status' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      delivery_id: delivery.id,
      actor_user_id: auth.userId,
      event_type: 'delivery_released',
      idempotency_key: crypto.randomUUID(),
      event_payload: { artifact_id: artifact.id, artifact_version: artifact.version, expires_at: delivery.expires_at },
    })
  if (eventError) {
    await admin.from('live_brief_requests').update({ status: current.status }).eq('id', id)
    await admin.from('live_brief_deliveries').delete().eq('id', delivery.id)
    return NextResponse.json({ error: 'Delivery release event could not be recorded' }, { status: 500 })
  }

  return NextResponse.json({ delivery_id: delivery.id, token, expires_at: delivery.expires_at }, { status: 201 })
}