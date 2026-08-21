import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashLiveBriefDeliveryToken } from '@/lib/live-brief-delivery'

export const dynamic = 'force-dynamic'

const EVENT_TYPES = new Set(['delivery_section_viewed', 'delivery_cta_clicked', 'delivery_handoff_clicked'])
const HANDOFF_DESTINATIONS = new Set(['linkedin', 'apollo'])

type EventPayload = {
  event_type?: unknown
  section?: unknown
  destination?: unknown
}

function validToken(token: string): boolean {
  return token.length >= 40 && token.length <= 100
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params
  if (!validToken(token)) return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })

  let payload: EventPayload
  try {
    payload = await request.json() as EventPayload
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }

  const eventType = typeof payload.event_type === 'string' ? payload.event_type : ''
  if (!EVENT_TYPES.has(eventType)) return NextResponse.json({ error: 'Unsupported delivery event' }, { status: 400 })
  const section = payload.section
  const destination = typeof payload.destination === 'string' ? payload.destination : ''
  if (eventType === 'delivery_section_viewed' && (typeof section !== 'string' || section.trim().length < 1 || section.trim().length > 100)) {
    return NextResponse.json({ error: 'section is required for section-view events' }, { status: 400 })
  }
  if (eventType === 'delivery_handoff_clicked' && !HANDOFF_DESTINATIONS.has(destination)) {
    return NextResponse.json({ error: 'destination is invalid for handoff events' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: delivery, error: deliveryError } = await admin
    .from('live_brief_deliveries')
    .select('id,request_id,artifact_id,expires_at,revoked_at')
    .eq('token_digest', hashLiveBriefDeliveryToken(token))
    .maybeSingle()
  if (deliveryError || !delivery || delivery.revoked_at || new Date(delivery.expires_at).getTime() <= Date.now()) {
    return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
  }

  if (eventType === 'delivery_handoff_clicked') {
    const { error } = await admin.rpc('record_live_brief_handoff_click', {
      p_delivery_id: delivery.id,
      p_destination: destination,
    })
    if (error) return NextResponse.json({ error: 'Unable to record delivery event' }, { status: 500 })
    return NextResponse.json({ recorded: true }, { status: 202 })
  }

  if (eventType === 'delivery_cta_clicked') {
    const { error } = await admin
      .from('live_brief_deliveries')
      .update({ cta_clicked_at: new Date().toISOString() })
      .eq('id', delivery.id)
    if (error) return NextResponse.json({ error: 'Unable to record delivery event' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: delivery.request_id,
      delivery_id: delivery.id,
      event_type: eventType,
      idempotency_key: crypto.randomUUID(),
      event_payload: eventType === 'delivery_section_viewed' ? { section: (section as string).trim() } : {},
    })
  if (eventError) return NextResponse.json({ error: 'Unable to record delivery event' }, { status: 500 })

  return NextResponse.json({ recorded: true }, { status: 202 })
}