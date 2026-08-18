/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'
import { enqueueOnboardingVideoRun, fetchOnboardingVideoRunSnapshot } from '@/lib/onboarding-video-queue'

const enqueueSchema = z.object({
  workflow_id: z.string().uuid().optional(),
  trigger_source: z.enum(['manual', 'event', 'cron', 'retry']).default('manual'),
  provider: z.string().min(1).default('heygen'),
  max_retries: z.number().int().min(0).max(10).default(3),
  input_payload: z.record(z.string(), z.unknown()).default({}),
})

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const parsed = await parseAutomationBody(request, enqueueSchema)
  if (!parsed.ok) return parsed.response

  try {
    const sb = asLooseSupabaseClient(auth.supabase)
    const payload = parsed.body
    const run = await enqueueOnboardingVideoRun(sb, {
      userId: auth.userId,
      workflowId: payload.workflow_id ?? null,
      triggerSource: payload.trigger_source,
      provider: payload.provider,
      maxRetries: payload.max_retries,
      inputPayload: payload.input_payload,
    })

    return NextResponse.json({
      ok: true,
      run,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to enqueue onboarding video run' },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const statusRaw = request.nextUrl.searchParams.get('status')
  const status = statusRaw && ['queued', 'processing', 'completed', 'failed', 'canceled'].includes(statusRaw)
    ? statusRaw
    : undefined
  const workflowId = request.nextUrl.searchParams.get('workflow_id')
  const includeEvents = request.nextUrl.searchParams.get('include_events') === '1'
  const limitRaw = Number(request.nextUrl.searchParams.get('limit') ?? 50)
  const limit = Number.isFinite(limitRaw) ? limitRaw : 50

  try {
    const sb = asLooseSupabaseClient(auth.supabase)
    const snapshot = await fetchOnboardingVideoRunSnapshot(sb, {
      userId: auth.userId,
      workflowId,
      status: status as any,
      limit,
    })

    let events: Array<Record<string, unknown>> = []
    if (includeEvents) {
      const runIds = snapshot.runs.map((run) => run.id)
      if (runIds.length > 0) {
        const { data } = await sb
          .from('onboarding_video_run_events')
          .select('id, run_id, event_type, event_payload, created_at')
          .in('run_id', runIds)
          .order('created_at', { ascending: false })
          .limit(Math.min(runIds.length * 6, 400))
        events = (data ?? []) as Array<Record<string, unknown>>
      }
    }

    return NextResponse.json({
      ok: true,
      ...snapshot,
      events,
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch onboarding video queue status' },
      { status: 500 },
    )
  }
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
