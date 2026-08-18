import { createHash, timingSafeEqual } from 'crypto'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { updateOnboardingVideoRunFromWebhook } from '@/lib/onboarding-video-queue'

type OnboardingVideoWebhookPayload = {
  id?: string
  event_id?: string
  provider?: string
  type?: string
  data?: {
    provider_run_id?: string
    message?: string
    video_url?: string
    [key: string]: unknown
  }
}

type OnboardingQueueAdminClient = Parameters<typeof updateOnboardingVideoRunFromWebhook>[0]

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function isValidWebhookSecret(secret: string, expected: string): boolean {
  try {
    const a = Buffer.from(secret)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function parsePayload(rawBody: string): OnboardingVideoWebhookPayload | null {
  try {
    return JSON.parse(rawBody) as OnboardingVideoWebhookPayload
  } catch {
    return null
  }
}

function normalizeProvider(payload: OnboardingVideoWebhookPayload): string {
  const provider = (payload.provider ?? payload.data?.provider ?? 'heygen').toString().trim().toLowerCase()
  return provider || 'heygen'
}

function buildDedupeKey(payload: OnboardingVideoWebhookPayload, rawBody: string): string {
  const providerEventId = payload.event_id ?? payload.id ?? null
  if (providerEventId) return `event_id:${providerEventId}`

  const providerRunId = payload.data?.provider_run_id ?? 'unknown_run'
  const eventType = payload.type ?? 'unknown_event'
  const fingerprint = createHash('sha256')
    .update(rawBody)
    .digest('hex')
  return `fingerprint:${providerRunId}:${eventType}:${fingerprint}`
}

export async function POST(request: NextRequest) {
  const secret = request.headers.get('x-webhook-secret') ?? ''
  const expected = process.env.ONBOARDING_VIDEO_WEBHOOK_SECRET ?? ''
  if (!expected || !secret || !isValidWebhookSecret(secret, expected)) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 })
  }

  const rawBody = await request.text()
  const payload = parsePayload(rawBody)
  if (!payload?.type || !payload?.data?.provider_run_id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const provider = normalizeProvider(payload)
  const providerEventId = payload.event_id ?? payload.id ?? null
  const dedupeKey = buildDedupeKey(payload, rawBody)

  const { data: existing } = await supabase
    .from('onboarding_video_webhook_events')
    .select('id, event_status, matched_run_count, processed_at')
    .eq('provider', provider)
    .eq('dedupe_key', dedupeKey)
    .maybeSingle()

  if (existing?.id) {
    return NextResponse.json({
      ok: true,
      deduped: true,
      matchedRuns: existing.matched_run_count ?? 0,
      status: existing.event_status ?? 'processed',
    })
  }

  const { data: runLookup } = await supabase
    .from('onboarding_video_runs')
    .select('user_id')
    .eq('provider_run_id', payload.data.provider_run_id)
    .limit(1)
    .maybeSingle()

  const initialPayload = {
    provider,
    provider_event_id: providerEventId,
    provider_run_id: payload.data.provider_run_id,
    event_type: payload.type,
    payload,
  }

  const { data: createdEvent, error: insertError } = await supabase
    .from('onboarding_video_webhook_events')
    .insert({
      user_id: runLookup?.user_id ?? null,
      provider,
      dedupe_key: dedupeKey,
      provider_event_id: providerEventId,
      provider_run_id: payload.data.provider_run_id,
      event_type: payload.type,
      event_status: 'received',
      payload: initialPayload,
    })
    .select('id')
    .single()

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json({ ok: true, deduped: true, matchedRuns: 0, status: 'processed' })
    }
    return NextResponse.json({ error: 'Failed to persist webhook event' }, { status: 500 })
  }

  const eventId = createdEvent?.id as string
  const updatedRuns = await updateOnboardingVideoRunFromWebhook(supabase as unknown as OnboardingQueueAdminClient, {
    providerRunId: payload.data.provider_run_id,
    eventType: payload.type,
    eventPayload: payload.data,
  })
  const matchedRunRows = (updatedRuns ?? []) as Array<{ id: string; user_id: string }>

  await supabase
    .from('onboarding_video_webhook_events')
    .update({
      user_id: runLookup?.user_id ?? null,
      event_status: 'processed',
      matched_run_count: matchedRunRows.length,
      processed_at: new Date().toISOString(),
    })
    .eq('id', eventId)

  return NextResponse.json({
    ok: true,
    deduped: false,
    matchedRuns: matchedRunRows.length,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
