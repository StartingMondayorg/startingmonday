import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess } from '@/lib/live-brief-auth'
import { hashLiveBriefArtifact } from '@/lib/live-brief-artifact'

export const dynamic = 'force-dynamic'

const REDACTED = '[deleted]'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefMutationAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  const admin = createAdminClient() as unknown as SupabaseClient
  const { data: current, error: requestError } = await admin
    .from('live_brief_requests')
    .select('status')
    .eq('id', id)
    .maybeSingle()
  if (requestError) return NextResponse.json({ error: 'Unable to load live brief request' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'Live brief request not found' }, { status: 404 })
  if (current.status === 'deleted') return NextResponse.json({ deleted: true, id })

  const redactedAt = new Date().toISOString()
  const { error: deliveryError } = await admin
    .from('live_brief_deliveries')
    .update({ revoked_at: redactedAt, revoked_by_user_id: auth.userId })
    .eq('request_id', id)
    .is('revoked_at', null)
  if (deliveryError) return NextResponse.json({ error: 'Unable to revoke live brief deliveries' }, { status: 500 })

  const { error: artifactError } = await admin
    .from('live_brief_artifacts')
    .update({ brief_payload: {}, content_hash: hashLiveBriefArtifact({}) })
    .eq('request_id', id)
  if (artifactError) return NextResponse.json({ error: 'Unable to redact live brief artifacts' }, { status: 500 })

  const { error: scanError } = await admin
    .from('live_brief_scan_companies')
    .update({ evidence_summary: [], error_class: 'redacted', observed_at: redactedAt })
    .in('run_id', (await admin.from('live_brief_scan_runs').select('id').eq('request_id', id)).data?.map((run: { id: string }) => run.id) ?? [])
  if (scanError) return NextResponse.json({ error: 'Unable to redact scan evidence' }, { status: 500 })

  const { error: requestUpdateError } = await admin
    .from('live_brief_requests')
    .update({
      prospect_name: REDACTED,
      prospect_email: `deleted+${id}@invalid.local`,
      linkedin_url: null,
      source_text_encrypted_ref: REDACTED,
      consent_source: REDACTED,
      location_preference: null,
      target_role_lane: null,
      operator_notes: null,
      reviewed_profile: {},
      status: 'deleted',
    })
    .eq('id', id)
  if (requestUpdateError) return NextResponse.json({ error: 'Unable to mark live brief deleted' }, { status: 500 })

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      actor_user_id: auth.userId,
      event_type: 'request_deleted',
      idempotency_key: crypto.randomUUID(),
      event_payload: { redacted_at: redactedAt },
    })
  if (eventError) return NextResponse.json({ error: 'Deletion event could not be recorded' }, { status: 500 })

  return NextResponse.json({ deleted: true, id })
}