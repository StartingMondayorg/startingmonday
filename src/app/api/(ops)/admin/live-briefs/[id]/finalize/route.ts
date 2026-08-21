import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireLiveBriefMutationAccess } from '@/lib/live-brief-auth'
import { hashLiveBriefArtifact, LIVE_BRIEF_ARTIFACT_MAX_BYTES } from '@/lib/live-brief-artifact'
import type { Json } from '@/lib/supabase/database.types'

export const dynamic = 'force-dynamic'

function isPayload(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireLiveBriefMutationAccess()
  if (!auth) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  if (!id || id.length > 80) return NextResponse.json({ error: 'Invalid live brief request id' }, { status: 400 })

  let body: { brief_payload?: unknown }
  try {
    body = await request.json() as { brief_payload?: unknown }
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 })
  }
  if (!isPayload(body?.brief_payload)) {
    return NextResponse.json({ error: 'brief_payload must be a JSON object' }, { status: 400 })
  }

  const serialized = JSON.stringify(body.brief_payload)
  if (Buffer.byteLength(serialized, 'utf8') > LIVE_BRIEF_ARTIFACT_MAX_BYTES) {
    return NextResponse.json({ error: 'brief_payload exceeds the 512 KB limit' }, { status: 413 })
  }

  const admin = createAdminClient()
  const { data: current, error: requestError } = await admin
    .from('live_brief_requests')
    .select('status')
    .eq('id', id)
    .maybeSingle()
  if (requestError) return NextResponse.json({ error: 'Unable to load live brief request' }, { status: 500 })
  if (!current) return NextResponse.json({ error: 'Live brief request not found' }, { status: 404 })
  if (!['reviewing', 'ready_for_review'].includes(current.status)) {
    return NextResponse.json({ error: 'Live brief request is not ready for finalization' }, { status: 409 })
  }

  const { data: latest, error: latestError } = await admin
    .from('live_brief_artifacts')
    .select('version')
    .eq('request_id', id)
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (latestError) return NextResponse.json({ error: 'Unable to determine artifact version' }, { status: 500 })

  const version = (latest?.version ?? 0) + 1
  const { data: artifact, error: artifactError } = await admin
    .from('live_brief_artifacts')
    .insert({
      request_id: id,
      version,
      brief_payload: body.brief_payload as Json,
      content_hash: hashLiveBriefArtifact(body.brief_payload),
      finalized_by_user_id: auth.userId,
    })
    .select('id,version,content_hash')
    .single()
  if (artifactError || !artifact?.id) return NextResponse.json({ error: 'Unable to finalize live brief' }, { status: 500 })

  const { error: updateError } = await admin
    .from('live_brief_requests')
    .update({ status: 'ready_for_review' })
    .eq('id', id)
  if (updateError) {
    await admin.from('live_brief_artifacts').delete().eq('id', artifact.id)
    return NextResponse.json({ error: 'Unable to update live brief status' }, { status: 500 })
  }

  const { error: eventError } = await admin
    .from('live_brief_events')
    .insert({
      request_id: id,
      actor_user_id: auth.userId,
      event_type: 'brief_finalized',
      idempotency_key: crypto.randomUUID(),
      event_payload: { artifact_id: artifact.id, version: artifact.version, content_hash: artifact.content_hash },
    })
  if (eventError) {
    await admin.from('live_brief_requests').update({ status: current.status }).eq('id', id)
    await admin.from('live_brief_artifacts').delete().eq('id', artifact.id)
    return NextResponse.json({ error: 'Finalization event could not be recorded' }, { status: 500 })
  }

  return NextResponse.json({ artifact_id: artifact.id, version: artifact.version, content_hash: artifact.content_hash }, { status: 201 })
}