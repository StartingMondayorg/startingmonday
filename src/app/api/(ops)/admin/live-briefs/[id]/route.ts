import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess, requireLiveBriefStaffAccess } from '@/lib/live-brief-auth'

export const dynamic = 'force-dynamic'

type ReviewPayload = {
  reviewed_profile?: unknown
}

function isProfileObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefStaffAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('live_brief_requests')
    .select('id,hubspot_contact_id,hubspot_deal_id,prospect_name,prospect_email,linkedin_url,consent_attested_at,consent_source,request_received_at,request_source,location_preference,target_role_lane,reviewed_profile,status,hubspot_sync_status,created_at,updated_at')
    .eq('id', id)
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'Unable to load live brief request' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Live brief request not found' }, { status: 404 })
  return NextResponse.json({ request: data })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefMutationAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  let payload: ReviewPayload
  try {
    payload = await request.json() as ReviewPayload
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }
  if (!isProfileObject(payload?.reviewed_profile)) {
    return NextResponse.json({ error: 'reviewed_profile must be a JSON object' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: current, error: readError } = await admin
    .from('live_brief_requests')
    .select('reviewed_profile,status')
    .eq('id', id)
    .maybeSingle()

  if (readError) return NextResponse.json({ error: 'Unable to load live brief request' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'Live brief request not found' }, { status: 404 })

  const { error: updateError } = await admin
    .from('live_brief_requests')
    .update({ reviewed_profile: payload.reviewed_profile, status: 'reviewing' })
    .eq('id', id)

  if (updateError) return NextResponse.json({ error: 'Unable to save reviewed profile' }, { status: 500 })

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      actor_user_id: auth.userId,
      event_type: 'profile_reviewed',
      idempotency_key: crypto.randomUUID(),
      event_payload: { field_count: Object.keys(payload.reviewed_profile).length },
    })

  if (eventError) {
    await admin
      .from('live_brief_requests')
      .update({ reviewed_profile: current.reviewed_profile, status: current.status })
      .eq('id', id)
    return NextResponse.json({ error: 'Reviewed profile event could not be recorded' }, { status: 500 })
  }

  return NextResponse.json({ id, status: 'reviewing' })
}