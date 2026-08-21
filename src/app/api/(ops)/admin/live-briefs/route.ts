import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess, requireLiveBriefStaffAccess } from '@/lib/live-brief-auth'

export const dynamic = 'force-dynamic'

const REQUEST_SOURCES = new Set(['inbound_email', 'call', 'referral', 'other'])

type IntakePayload = {
  hubspot_contact_id?: unknown
  hubspot_deal_id?: unknown
  prospect_name?: unknown
  prospect_email?: unknown
  linkedin_url?: unknown
  source_text_encrypted_ref?: unknown
  consent_attested_at?: unknown
  consent_source?: unknown
  request_source?: unknown
  location_preference?: unknown
  target_role_lane?: unknown
  operator_notes?: unknown
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null || value === '') return null
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text && text.length <= maxLength ? text : null
}

function requiredText(value: unknown, minLength: number, maxLength: number): string | null {
  const text = optionalText(value, maxLength)
  return text && text.length >= minLength ? text : null
}

function parseIntakePayload(payload: IntakePayload) {
  const prospectName = requiredText(payload.prospect_name, 2, 160)
  const prospectEmail = requiredText(payload.prospect_email, 3, 320)
  const sourceRef = requiredText(payload.source_text_encrypted_ref, 1, 500)
  const consentSource = requiredText(payload.consent_source, 2, 500)
  const consentAttestedAt = typeof payload.consent_attested_at === 'string'
    ? new Date(payload.consent_attested_at)
    : null
  const requestSource = typeof payload.request_source === 'string'
    ? payload.request_source.trim()
    : ''

  if (!prospectName || !prospectEmail || !prospectEmail.includes('@') || !sourceRef || !consentSource) {
    return { error: 'prospect_name, prospect_email, source_text_encrypted_ref, and consent_source are required' }
  }
  if (!consentAttestedAt || Number.isNaN(consentAttestedAt.getTime())) {
    return { error: 'consent_attested_at must be a valid ISO timestamp' }
  }
  if (!REQUEST_SOURCES.has(requestSource)) {
    return { error: 'request_source is invalid' }
  }

  return {
    value: {
      hubspot_contact_id: optionalText(payload.hubspot_contact_id, 120),
      hubspot_deal_id: optionalText(payload.hubspot_deal_id, 120),
      prospect_name: prospectName,
      prospect_email: prospectEmail.toLowerCase(),
      linkedin_url: optionalText(payload.linkedin_url, 500),
      source_text_encrypted_ref: sourceRef,
      consent_attested_at: consentAttestedAt.toISOString(),
      consent_source: consentSource,
      request_source: requestSource,
      location_preference: optionalText(payload.location_preference, 240),
      target_role_lane: optionalText(payload.target_role_lane, 240),
      operator_notes: optionalText(payload.operator_notes, 4_000),
    },
  }
}

export async function GET() {
  const auth = await requireLiveBriefStaffAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('live_brief_requests')
    .select('id,hubspot_contact_id,hubspot_deal_id,prospect_name,prospect_email,linkedin_url,consent_attested_at,consent_source,request_received_at,request_source,location_preference,target_role_lane,status,hubspot_sync_status,created_at,updated_at')
    .order('request_received_at', { ascending: false })
    .limit(100)

  if (error) return NextResponse.json({ error: 'Unable to load live brief requests' }, { status: 500 })
  return NextResponse.json({ requests: data ?? [] })
}

export async function POST(request: Request) {
  const auth = await requireLiveBriefMutationAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let payload: IntakePayload
  try {
    payload = await request.json() as IntakePayload
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return NextResponse.json({ error: 'Request body must be a JSON object' }, { status: 400 })
  }

  const parsed = parseIntakePayload(payload)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })

  const admin = createAdminClient()
  const { data: created, error: createError } = await admin
    .from('live_brief_requests')
    .insert({ ...parsed.value, requested_by_user_id: auth.userId })
    .select('id')
    .single()

  if (createError || !created?.id) {
    return NextResponse.json({ error: 'Unable to create live brief request' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: created.id,
      actor_user_id: auth.userId,
      event_type: 'request_created',
      idempotency_key: crypto.randomUUID(),
      event_payload: { request_source: parsed.value.request_source },
    })

  if (eventError) {
    await admin
      .from('live_brief_requests')
      .delete()
      .eq('id', created.id)
    return NextResponse.json({ error: 'Live brief request event could not be recorded' }, { status: 500 })
  }

  return NextResponse.json({ id: created.id }, { status: 201 })
}