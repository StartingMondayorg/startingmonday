import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { logEvent } from '@/lib/events'
import { captureServerEvent } from '@/lib/posthog-server'
import { withApiTelemetry } from '@/lib/telemetry'

type TouchpointPayload = {
  contact_id?: string
  touch_type?: 'linkedin_follow' | 'linkedin_connect' | 'email_sent' | 'email_reply' | 'intro_requested' | 'intro_made' | 'call' | 'meeting' | 'interview' | 'note_added' | 'content_engaged' | 'other'
  channel?: string
  direction?: 'outbound' | 'inbound' | 'internal'
  summary?: string
  outcome?: string
  occurred_at?: string
  next_recommended_at?: string
}

async function postHandler(req: NextRequest) {
  const auth = await requireAuth(req)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const payload = await req.json().catch(() => ({})) as TouchpointPayload

  const contactId = typeof payload.contact_id === 'string' ? payload.contact_id.trim() : ''
  if (!contactId) {
    return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
  }

  const touchType = payload.touch_type ?? 'other'
  const direction = payload.direction ?? 'outbound'
  const occurredAt = typeof payload.occurred_at === 'string' ? payload.occurred_at : new Date().toISOString()
  const nextRecommendedAt = typeof payload.next_recommended_at === 'string' ? payload.next_recommended_at : null

  const { data: contact, error: contactError } = await supabase
    .from('contacts')
    .select('id, company_id')
    .eq('id', contactId)
    .eq('user_id', auth.userId)
    .maybeSingle()

  if (contactError) {
    return NextResponse.json({ error: 'Failed to verify contact ownership' }, { status: 500 })
  }

  if (!contact) {
    return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
  }

  const { data: inserted, error: insertError } = await supabase
    .from('relationship_touchpoints' as never)
    .insert({
      user_id: auth.userId,
      contact_id: contactId,
      company_id: contact.company_id,
      touch_type: touchType,
      channel: typeof payload.channel === 'string' ? payload.channel : null,
      direction,
      summary: typeof payload.summary === 'string' ? payload.summary : null,
      outcome: typeof payload.outcome === 'string' ? payload.outcome : null,
      occurred_at: occurredAt,
      next_recommended_at: nextRecommendedAt,
    } as never)
    .select('id, touch_type, direction, occurred_at, next_recommended_at')
    .single()

  if (!insertError && inserted) {
    const contactPatch: Record<string, string> = {
      contacted_at: occurredAt,
    }
    if (nextRecommendedAt) {
      contactPatch.follow_up_at = nextRecommendedAt
    }

    await supabase
      .from('contacts')
      .update(contactPatch)
      .eq('id', contactId)
      .eq('user_id', auth.userId)

    const eventProps = {
      contact_id: contactId,
      company_id: contact.company_id ?? null,
      action_type: touchType,
      action_channel: typeof payload.channel === 'string' ? payload.channel : null,
      touch_type: touchType,
      direction,
      source: 'relationship_touchpoint',
      chain_stage: 'relationship_action',
    }
    await logEvent(auth.userId, 'briefing_action_clicked', eventProps)
    captureServerEvent(auth.userId, 'briefing_action_clicked', eventProps)

    return NextResponse.json({ ok: true, touchpoint: inserted }, { status: 201 })
  }

  // Graceful fallback before migration rollout.
  if ((insertError as { code?: string } | null)?.code === '42P01') {
    const patch: Record<string, string> = {
      contacted_at: occurredAt,
    }
    if (nextRecommendedAt) {
      patch.follow_up_at = nextRecommendedAt
    }

    const { error: fallbackError } = await supabase
      .from('contacts')
      .update(patch)
      .eq('id', contactId)
      .eq('user_id', auth.userId)

    if (fallbackError) {
      return NextResponse.json({ error: 'Failed to store touchpoint fallback' }, { status: 500 })
    }

    const eventProps = {
      contact_id: contactId,
      company_id: contact.company_id ?? null,
      action_type: touchType,
      action_channel: typeof payload.channel === 'string' ? payload.channel : null,
      touch_type: touchType,
      direction,
      source: 'contacts_timestamp_fallback',
      chain_stage: 'relationship_action',
    }
    await logEvent(auth.userId, 'briefing_action_clicked', eventProps)
    captureServerEvent(auth.userId, 'briefing_action_clicked', eventProps)

    return NextResponse.json({ ok: true, fallback: 'contacts timestamps only' }, { status: 201 })
  }

  return NextResponse.json({ error: 'Failed to create touchpoint' }, { status: 500 })
}

export const POST = withApiTelemetry('/api/relationships/touchpoints', postHandler)
