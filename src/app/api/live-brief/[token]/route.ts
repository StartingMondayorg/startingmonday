import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashLiveBriefDeliveryToken } from '@/lib/live-brief-delivery'
import { peopleToKnowHandoffEnabled } from '@/lib/people-to-know-handoff'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  if (!token || token.length < 40 || token.length > 100) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }

  const admin = createAdminClient()
  const { data: delivery, error: deliveryError } = await admin
    .from('live_brief_deliveries')
    .select('id,request_id,artifact_id,expires_at,revoked_at,first_opened_at,view_count')
    .eq('token_digest', hashLiveBriefDeliveryToken(token))
    .maybeSingle()

  if (deliveryError || !delivery || !delivery.artifact_id || delivery.revoked_at || new Date(delivery.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }

  const { data: artifact, error: artifactError } = await admin
    .from('live_brief_artifacts')
    .select('id,version,brief_payload,content_hash')
    .eq('id', delivery.artifact_id)
    .maybeSingle()
  if (artifactError || !artifact) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })

  const openedAt = new Date().toISOString()
  const { error: telemetryError } = await admin
    .from('live_brief_deliveries')
    .update({
      first_opened_at: delivery.first_opened_at ?? openedAt,
      last_opened_at: openedAt,
      view_count: (delivery.view_count ?? 0) + 1,
    })
    .eq('id', delivery.id)
  if (telemetryError) return NextResponse.json({ error: 'Unable to record delivery access' }, { status: 500 })

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: delivery.request_id,
      delivery_id: delivery.id,
      event_type: 'delivery_opened',
      idempotency_key: crypto.randomUUID(),
      event_payload: { artifact_id: artifact.id, artifact_version: artifact.version },
    })
  if (eventError) return NextResponse.json({ error: 'Unable to record delivery access' }, { status: 500 })

  return NextResponse.json({
    delivery_id: delivery.id,
    capabilities: { people_to_know_handoff: peopleToKnowHandoffEnabled() },
    artifact: {
      version: artifact.version,
      brief_payload: artifact.brief_payload,
      content_hash: artifact.content_hash,
    },
  }, { headers: { 'Cache-Control': 'no-store' } })
}