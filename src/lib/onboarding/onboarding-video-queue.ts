import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { logQueueWorkerRun } from '@/lib/telemetry'
import {
  dispatchOnboardingVideoProvider,
  isProviderTerminalError,
} from '@/lib/onboarding/onboarding-video-provider'
import {
  clampLimit,
  computeRetryDelayMs,
  mapMilestoneToFlow,
  normalizeMaxRetries,
  type MilestoneEventName,
} from '@/lib/onboarding/onboarding-video-queue.utils'

type DbError = { message: string }
type DbResponse<T = unknown> = Promise<{ data: T | null; error: DbError | null }>
type DbQuery<T = unknown> = DbResponse<T> & {
  select: (columns: string) => DbQuery<T>
  insert: (values: unknown) => DbQuery<T>
  update: (values: unknown) => DbQuery<T>
  eq: (column: string, value: unknown) => DbQuery<T>
  in: (column: string, values: unknown[]) => DbQuery<T>
  contains: (column: string, value: unknown) => DbQuery<T>
  lte: (column: string, value: string) => DbQuery<T>
  gte: (column: string, value: string) => DbQuery<T>
  is: (column: string, value: null) => DbQuery<T>
  order: (column: string, options?: unknown) => DbQuery<T>
  limit: (count: number) => DbQuery<T>
  maybeSingle: () => DbResponse<T>
  single: () => DbResponse<T>
}
type QueueAdminClient = {
  from: (table: string) => DbQuery<unknown>
}

export type OnboardingVideoRunStatus = 'queued' | 'processing' | 'completed' | 'failed' | 'canceled'
export type OnboardingVideoTriggerSource = 'manual' | 'event' | 'cron' | 'retry'

export type OnboardingVideoProviderEvent =
  | 'video.completed'
  | 'video.failed'
  | 'video.canceled'
  | 'video.processing'

type QueueRunRecord = {
  id: string
  user_id: string
  workflow_id: string | null
  provider: string
  provider_run_id?: string | null
  trigger_source: OnboardingVideoTriggerSource
  status: OnboardingVideoRunStatus
  retry_count: number
  max_retries: number
  input_payload: Record<string, unknown>
  output_payload: Record<string, unknown>
  error_payload: Record<string, unknown>
  next_retry_at: string | null
  started_at: string | null
  completed_at: string | null
  created_at: string
}

function shouldForceFailure(inputPayload: Record<string, unknown>): boolean {
  return inputPayload.force_fail === true
}

async function appendRunEvent(admin: QueueAdminClient, input: {
  runId: string
  userId: string
  eventType: string
  eventPayload?: Record<string, unknown>
}) {
  await admin
    .from('onboarding_video_run_events')
    .insert({
      run_id: input.runId,
      user_id: input.userId,
      event_type: input.eventType,
      event_payload: input.eventPayload ?? {},
    })
}

export function mapOnboardingVideoProviderEventToStatus(eventType: string): OnboardingVideoRunStatus | null {
  if (eventType === 'video.completed') return 'completed'
  if (eventType === 'video.failed') return 'failed'
  if (eventType === 'video.canceled') return 'canceled'
  if (eventType === 'video.processing') return 'processing'
  return null
}

function summarizeRuns(runs: QueueRunRecord[]) {
  const summary = {
    total: 0,
    queued: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    canceled: 0,
    retrying: 0,
  }

  for (const run of runs) {
    summary.total += 1
    if (run.status === 'queued') summary.queued += 1
    if (run.status === 'processing') summary.processing += 1
    if (run.status === 'completed') summary.completed += 1
    if (run.status === 'failed') summary.failed += 1
    if (run.status === 'canceled') summary.canceled += 1
    if (run.status === 'queued' && run.retry_count > 0) summary.retrying += 1
  }

  return summary
}

export async function enqueueOnboardingVideoRun(admin: QueueAdminClient, input: {
  userId: string
  workflowId?: string | null
  triggerSource?: OnboardingVideoTriggerSource
  provider?: string
  maxRetries?: number
  inputPayload?: Record<string, unknown>
}) {
  const nowIso = new Date().toISOString()
  const payload = input.inputPayload ?? {}
  const maxRetries = normalizeMaxRetries(input.maxRetries)

  const { data, error } = await admin
    .from('onboarding_video_runs')
    .insert({
      user_id: input.userId,
      workflow_id: input.workflowId ?? null,
      trigger_source: input.triggerSource ?? 'manual',
      provider: input.provider ?? 'heygen',
      status: 'queued',
      retry_count: 0,
      max_retries: maxRetries,
      next_retry_at: nowIso,
      input_payload: payload,
      output_payload: {},
      error_payload: {},
    })
    .select('id, user_id, workflow_id, provider, trigger_source, status, retry_count, max_retries, input_payload, output_payload, error_payload, next_retry_at, started_at, completed_at, created_at')
    .single()

  if (error || !data) {
    throw new Error(error?.message ?? 'Failed to enqueue onboarding video run')
  }
  const insertedRun = data as QueueRunRecord

  await appendRunEvent(admin, {
    runId: insertedRun.id,
    userId: insertedRun.user_id,
    eventType: 'queued',
    eventPayload: {
      trigger_source: insertedRun.trigger_source,
      provider: insertedRun.provider,
    },
  })

  return insertedRun
}

export async function fetchOnboardingVideoRunSnapshot(admin: QueueAdminClient, input: {
  userId: string
  workflowId?: string | null
  status?: OnboardingVideoRunStatus
  limit?: number
}) {
  const limit = clampLimit(input.limit, 50, 200)

  let query = admin
    .from('onboarding_video_runs')
    .select('id, user_id, workflow_id, provider, trigger_source, status, retry_count, max_retries, input_payload, output_payload, error_payload, next_retry_at, started_at, completed_at, created_at')
    .eq('user_id', input.userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (input.workflowId) query = query.eq('workflow_id', input.workflowId)
  if (input.status) query = query.eq('status', input.status)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  const runs = (data ?? []) as QueueRunRecord[]
  return {
    runs,
    summary: summarizeRuns(runs),
  }
}

export async function fetchOnboardingVideoRunDetails(admin: QueueAdminClient, input: {
  userId: string
  runId: string
  eventLimit?: number
  includeRunEvents?: boolean
  includeWebhookEvents?: boolean
}) {
  const eventLimit = clampLimit(input.eventLimit, 50, 500)
  const includeRunEvents = input.includeRunEvents !== false
  const includeWebhookEvents = input.includeWebhookEvents === true

  const { data: run, error } = await admin
    .from('onboarding_video_runs')
    .select('id, user_id, workflow_id, provider, provider_run_id, trigger_source, status, retry_count, max_retries, input_payload, output_payload, error_payload, next_retry_at, started_at, completed_at, created_at')
    .eq('id', input.runId)
    .eq('user_id', input.userId)
    .maybeSingle()
  const runRecord = (run ?? null) as QueueRunRecord | null

  if (error) throw new Error(error.message)
  if (!runRecord) return { run: null, events: [], webhookEvents: [] }

  let events: Array<Record<string, unknown>> = []
  if (includeRunEvents) {
    const { data: eventRows, error: eventError } = await admin
      .from('onboarding_video_run_events')
      .select('id, run_id, event_type, event_payload, created_at')
      .eq('run_id', runRecord.id)
      .order('created_at', { ascending: false })
      .limit(eventLimit)

    if (eventError) throw new Error(eventError.message)
    events = (eventRows ?? []) as Array<Record<string, unknown>>
  }

  let webhookEvents: Array<Record<string, unknown>> = []
  if (includeWebhookEvents && runRecord.provider_run_id) {
    const { data: webhookRows, error: webhookError } = await admin
      .from('onboarding_video_webhook_events')
      .select('id, provider, provider_event_id, provider_run_id, event_type, event_status, matched_run_count, received_at, processed_at, error_message, payload, created_at')
      .eq('user_id', input.userId)
      .eq('provider', runRecord.provider)
      .eq('provider_run_id', runRecord.provider_run_id)
      .order('received_at', { ascending: false })
      .limit(eventLimit)

    if (webhookError) throw new Error(webhookError.message)
    webhookEvents = (webhookRows ?? []) as Array<Record<string, unknown>>
  }

  return {
    run: runRecord,
    events,
    webhookEvents,
  }
}

async function processClaimedRun(admin: QueueAdminClient, run: QueueRunRecord, workerId: string) {
  const nowIso = new Date().toISOString()
  await appendRunEvent(admin, {
    runId: run.id,
    userId: run.user_id,
    eventType: 'processing_started',
    eventPayload: {
      worker_id: workerId,
      retry_count: run.retry_count,
    },
  })

  try {
    if (shouldForceFailure(run.input_payload ?? {})) {
      throw new Error('Forced failure requested by run payload')
    }

    const dispatchResult = await dispatchOnboardingVideoProvider({
      runId: run.id,
      userId: run.user_id,
      provider: run.provider,
      inputPayload: run.input_payload ?? {},
    })

    const outputPayload = {
      ...dispatchResult.outputPayload,
      worker_id: workerId,
      provider_run_id: dispatchResult.providerRunId,
      dispatched_at: nowIso,
    }

    if (dispatchResult.status === 'completed') {
      await admin
        .from('onboarding_video_runs')
        .update({
          status: 'completed',
          provider_run_id: dispatchResult.providerRunId,
          completed_at: nowIso,
          next_retry_at: null,
          output_payload: outputPayload,
          error_payload: {},
        })
        .eq('id', run.id)

      await appendRunEvent(admin, {
        runId: run.id,
        userId: run.user_id,
        eventType: 'completed',
        eventPayload: outputPayload,
      })
    } else {
      await admin
        .from('onboarding_video_runs')
        .update({
          status: 'processing',
          provider_run_id: dispatchResult.providerRunId,
          next_retry_at: null,
          output_payload: outputPayload,
          error_payload: {},
        })
        .eq('id', run.id)

      await appendRunEvent(admin, {
        runId: run.id,
        userId: run.user_id,
        eventType: 'provider_dispatched',
        eventPayload: {
          provider: run.provider,
          provider_run_id: dispatchResult.providerRunId,
          worker_id: workerId,
        },
      })
    }

    return { ok: true as const }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown onboarding video failure'
    const isTerminal = isProviderTerminalError(error)
    const canRetry = !isTerminal && run.retry_count < run.max_retries
    const retryAt = canRetry
      ? new Date(Date.now() + computeRetryDelayMs(run.retry_count)).toISOString()
      : null

    await admin
      .from('onboarding_video_runs')
      .update({
        status: canRetry ? 'queued' : 'failed',
        next_retry_at: retryAt,
        completed_at: canRetry ? null : new Date().toISOString(),
        error_payload: {
          code: canRetry ? 'provider_transient' : isTerminal ? 'provider_terminal' : 'provider_exhausted',
          message,
          worker_id: workerId,
          occurred_at: nowIso,
        },
      })
      .eq('id', run.id)

    await appendRunEvent(admin, {
      runId: run.id,
      userId: run.user_id,
      eventType: canRetry ? 'retry_scheduled' : 'failed',
      eventPayload: {
        worker_id: workerId,
        retry_count: run.retry_count,
        max_retries: run.max_retries,
        next_retry_at: retryAt,
        message,
      },
    })

    return { ok: false as const, retried: canRetry }
  }
}

export async function processOnboardingVideoRuns(input?: { limit?: number; workerId?: string }) {
  const startedAtMs = Date.now()
  const admin = createAdminClient() as unknown as QueueAdminClient
  const limit = clampLimit(input?.limit, 10, 25)
  const workerId = input?.workerId ?? `onboarding-video-worker-${randomUUID()}`
  const nowIso = new Date().toISOString()

  const { data: candidates, error } = await admin
    .from('onboarding_video_runs')
    .select('id, user_id, workflow_id, provider, trigger_source, status, retry_count, max_retries, input_payload, output_payload, error_payload, next_retry_at, started_at, completed_at, created_at')
    .eq('status', 'queued')
    .lte('next_retry_at', nowIso)
    .order('next_retry_at', { ascending: true })
    .limit(limit * 4)

  if (error) {
    logQueueWorkerRun({
      queue: 'onboarding_video_runs',
      workerId,
      event: 'queue_worker_run_error',
      startedAtMs,
      processed: 0,
      failed: 0,
      retried: 0,
      error: error.message,
    })

    return {
      ok: false as const,
      workerId,
      processed: 0,
      completed: 0,
      failed: 0,
      retried: 0,
      byUser: [] as Array<{ userId: string; processed: number; completed: number; failed: number; retried: number }>,
      error: error.message,
    }
  }

  let processed = 0
  let completed = 0
  let failed = 0
  let retried = 0
  const byUser = new Map<string, { processed: number; completed: number; failed: number; retried: number }>()

  for (const candidate of (candidates ?? []) as QueueRunRecord[]) {
    if (processed >= limit) break

    const { data: claimed } = await admin
      .from('onboarding_video_runs')
      .update({
        status: 'processing',
        started_at: nowIso,
      })
      .eq('id', candidate.id)
      .eq('status', 'queued')
      .select('id, user_id, workflow_id, provider, trigger_source, status, retry_count, max_retries, input_payload, output_payload, error_payload, next_retry_at, started_at, completed_at, created_at')
      .maybeSingle()
    const claimedRun = (claimed ?? null) as QueueRunRecord | null

    if (!claimedRun?.id) continue

    processed += 1
    const userId = String(claimedRun.user_id)
    const summary = byUser.get(userId) ?? { processed: 0, completed: 0, failed: 0, retried: 0 }
    summary.processed += 1
    const result = await processClaimedRun(admin, claimedRun, workerId)
    if (result.ok) {
      completed += 1
      summary.completed += 1
    } else if (result.retried) {
      retried += 1
      summary.retried += 1
    } else {
      failed += 1
      summary.failed += 1
    }
    byUser.set(userId, summary)
  }

  const byUserSummary = Array.from(byUser.entries()).map(([userId, summary]) => ({
    userId,
    processed: summary.processed,
    completed: summary.completed,
    failed: summary.failed,
    retried: summary.retried,
  }))

  logQueueWorkerRun({
    queue: 'onboarding_video_runs',
    workerId,
    event: 'queue_worker_run',
    startedAtMs,
    processed,
    completed,
    failed,
    retried,
    metadata: {
      limit,
      by_user: byUserSummary,
    },
  })

  return {
    ok: true as const,
    workerId,
    processed,
    completed,
    failed,
    retried,
    byUser: byUserSummary,
  }
}

export async function updateOnboardingVideoRunFromWebhook(admin: QueueAdminClient, input: {
  providerRunId: string
  eventType: OnboardingVideoProviderEvent | string
  eventPayload?: Record<string, unknown>
}) {
  const nextStatus = mapOnboardingVideoProviderEventToStatus(input.eventType)
  if (!nextStatus) return []

  const nowIso = new Date().toISOString()
  const updatePayload: Record<string, unknown> = {
    status: nextStatus,
    output_payload: {
      provider_event_type: input.eventType,
      ...(input.eventPayload ?? {}),
    },
  }

  if (nextStatus === 'completed' || nextStatus === 'failed' || nextStatus === 'canceled') {
    updatePayload.completed_at = nowIso
    updatePayload.next_retry_at = null
  }

  if (nextStatus === 'failed') {
    updatePayload.error_payload = {
      code: 'provider_callback_failure',
      message: String((input.eventPayload ?? {}).message ?? 'Provider reported failure'),
      occurred_at: nowIso,
    }
  }

  const { data: runs } = await admin
    .from('onboarding_video_runs')
    .update(updatePayload)
    .eq('provider_run_id', input.providerRunId)
    .select('id, user_id')
  const runRows = (runs ?? []) as Array<{ id: string; user_id: string }>

  for (const run of runRows) {
    await appendRunEvent(admin, {
      runId: String(run.id),
      userId: String(run.user_id),
      eventType: `provider_${input.eventType}`,
      eventPayload: {
        provider_run_id: input.providerRunId,
        ...(input.eventPayload ?? {}),
      },
    })
  }

  return runRows
}

export async function enqueueOnboardingVideoRunForMilestoneEvent(
  admin: QueueAdminClient,
  input: {
    userId: string
    eventName: MilestoneEventName
    properties?: Record<string, string | number | boolean | null>
  },
) {
  const properties = input.properties ?? {}
  const tutorialFlow = mapMilestoneToFlow(input.eventName, properties)
  const provider = String(process.env.ONBOARDING_VIDEO_PROVIDER ?? 'heygen')
  const dedupeSince = new Date(Date.now() - 90 * 60 * 1000).toISOString()

  const dedupePayload = {
    event_name: input.eventName,
    tutorial_flow: tutorialFlow,
  }

  const { data: existing } = await admin
    .from('onboarding_video_runs')
    .select('id, status, created_at')
    .eq('user_id', input.userId)
    .eq('trigger_source', 'event')
    .in('status', ['queued', 'processing', 'completed'])
    .gte('created_at', dedupeSince)
    .contains('input_payload', dedupePayload)
    .order('created_at', { ascending: false })
    .limit(1)
  const existingRuns = (existing ?? []) as Array<{ id?: string }>

  if (existingRuns.length > 0) {
    return {
      queued: false as const,
      reason: 'deduped_recent_milestone',
      tutorialFlow,
      runId: String(existingRuns[0]?.id ?? ''),
    }
  }

  const run = await enqueueOnboardingVideoRun(admin, {
    userId: input.userId,
    triggerSource: 'event',
    provider,
    inputPayload: {
      event_name: input.eventName,
      tutorial_flow: tutorialFlow,
      milestone_properties: properties,
    },
  })

  await appendRunEvent(admin, {
    runId: run.id,
    userId: input.userId,
    eventType: 'milestone_auto_enqueued',
    eventPayload: {
      event_name: input.eventName,
      tutorial_flow: tutorialFlow,
    },
  })

  return {
    queued: true as const,
    tutorialFlow,
    runId: run.id,
  }
}
