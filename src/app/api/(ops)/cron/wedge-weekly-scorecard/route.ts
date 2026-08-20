import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_LOOKBACK_DAYS = 30
const SCHEDULE_UTC = '0 14 * * 1'
const FAILURE_ALERT_CODE = 'wedge_weekly_scorecard_cron_failure'
const ERROR_CODE_MISSING_TOKEN = 'missing_automation_service_token'
const ERROR_CODE_PERSIST_FAILED = 'persist_snapshot_failed'
const ERROR_CODE_READBACK_FAILED = 'scorecard_readback_failed'

async function writeFailureAlert(
  admin: any,
  input: {
    userId: string
    lookbackDays: number
    statusCode: number
    errorCode: string
    message: string
    detail?: Record<string, unknown>
  },
) {
  if (!input.userId) return

  await admin.from('automation_alerts').insert({
    user_id: input.userId,
    source_table: 'wedge_funnel_scorecard_cron_runs',
    alert_code: FAILURE_ALERT_CODE,
    severity: 'high',
    message: input.message,
    details: {
      status_code: input.statusCode,
      error_code: input.errorCode,
      lookback_days: input.lookbackDays,
      schedule_utc: SCHEDULE_UTC,
      ...(input.detail ? { detail: input.detail } : {}),
    },
    status: 'open',
  })
}

function parseLookbackDays(request: NextRequest): number {
  const raw = Number.parseInt(request.nextUrl.searchParams.get('lookbackDays') ?? String(DEFAULT_LOOKBACK_DAYS), 10)
  if (!Number.isFinite(raw)) return DEFAULT_LOOKBACK_DAYS
  return Math.max(7, Math.min(raw, 120))
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const startedAt = new Date()
  const admin = createAdminClient() as any
  const automationUserId = process.env.AUTOMATION_SERVICE_USER_ID ?? ''

  const automationToken = process.env.AUTOMATION_SERVICE_TOKEN ?? ''
  if (!automationToken) {
    await admin.from('wedge_funnel_scorecard_cron_runs').insert({
      triggered_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt.getTime(),
      lookback_days: DEFAULT_LOOKBACK_DAYS,
      schedule_utc: SCHEDULE_UTC,
      success: false,
      http_status: 500,
      error_code: ERROR_CODE_MISSING_TOKEN,
      error_message: 'AUTOMATION_SERVICE_TOKEN is required for wedge weekly cron persistence.',
      run_payload: { reason: 'missing_automation_service_token' },
    })

    await writeFailureAlert(admin, {
      userId: automationUserId,
      lookbackDays: DEFAULT_LOOKBACK_DAYS,
      statusCode: 500,
      errorCode: ERROR_CODE_MISSING_TOKEN,
      message: 'Wedge weekly cron failed: AUTOMATION_SERVICE_TOKEN is missing.',
      detail: { reason: 'missing_automation_service_token' },
    })

    return NextResponse.json(
      { error: 'AUTOMATION_SERVICE_TOKEN is required for wedge weekly cron persistence.' },
      { status: 500 },
    )
  }

  const lookbackDays = parseLookbackDays(request)
  const targetUrl = new URL('/api/admin/automation/reporting/wedge-funnel-scorecard', request.nextUrl.origin)

  const sharedHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-automation-service-token': automationToken,
  }

  if (automationUserId) {
    sharedHeaders['x-automation-user-id'] = automationUserId
  }

  const persistRes = await fetch(targetUrl, {
    method: 'POST',
    headers: sharedHeaders,
    body: JSON.stringify({ lookbackDays }),
    cache: 'no-store',
  })

  const persistJson = await persistRes.json().catch(() => ({})) as Record<string, unknown>
  if (!persistRes.ok) {
    await admin.from('wedge_funnel_scorecard_cron_runs').insert({
      triggered_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt.getTime(),
      lookback_days: lookbackDays,
      schedule_utc: SCHEDULE_UTC,
      success: false,
      http_status: persistRes.status,
      error_code: ERROR_CODE_PERSIST_FAILED,
      error_message: 'Failed to persist wedge weekly snapshot.',
      run_payload: { persist: persistJson },
    })

    await writeFailureAlert(admin, {
      userId: automationUserId,
      lookbackDays,
      statusCode: persistRes.status,
      errorCode: ERROR_CODE_PERSIST_FAILED,
      message: 'Wedge weekly cron failed while persisting weekly snapshot.',
      detail: { persist: persistJson },
    })

    return NextResponse.json(
      {
        error: 'Failed to persist wedge weekly snapshot.',
        detail: persistJson,
      },
      { status: persistRes.status },
    )
  }

  const readUrl = new URL('/api/admin/automation/reporting/wedge-funnel-scorecard', request.nextUrl.origin)
  readUrl.searchParams.set('lookbackDays', String(lookbackDays))

  const scorecardRes = await fetch(readUrl, {
    method: 'GET',
    headers: sharedHeaders,
    cache: 'no-store',
  })

  const scorecardJson = await scorecardRes.json().catch(() => ({})) as Record<string, unknown>
  if (!scorecardRes.ok) {
    await admin.from('wedge_funnel_scorecard_cron_runs').insert({
      triggered_at: startedAt.toISOString(),
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt.getTime(),
      lookback_days: lookbackDays,
      schedule_utc: SCHEDULE_UTC,
      success: false,
      http_status: scorecardRes.status,
      error_code: ERROR_CODE_READBACK_FAILED,
      error_message: 'Snapshot persisted, but scorecard readback failed.',
      run_payload: { persist: persistJson, scorecard: scorecardJson },
    })

    await writeFailureAlert(admin, {
      userId: automationUserId,
      lookbackDays,
      statusCode: scorecardRes.status,
      errorCode: ERROR_CODE_READBACK_FAILED,
      message: 'Wedge weekly cron failed during scorecard readback after persistence.',
      detail: { persist: persistJson, scorecard: scorecardJson },
    })

    return NextResponse.json(
      {
        error: 'Snapshot persisted, but scorecard readback failed.',
        detail: scorecardJson,
      },
      { status: scorecardRes.status },
    )
  }

  const decision = (scorecardJson.decision ?? {}) as { summary?: string }
  const history = Array.isArray(scorecardJson.snapshot_history) ? scorecardJson.snapshot_history : []

  await admin.from('wedge_funnel_scorecard_cron_runs').insert({
    triggered_at: startedAt.toISOString(),
    finished_at: new Date().toISOString(),
    duration_ms: Date.now() - startedAt.getTime(),
    lookback_days: lookbackDays,
    schedule_utc: SCHEDULE_UTC,
    success: true,
    error_code: null,
    decision_summary: decision.summary ?? null,
    snapshot_history_count: history.length,
    http_status: 200,
    run_payload: { persist: persistJson, scorecard: scorecardJson },
  })

  return NextResponse.json({
    ok: true,
    ticket: 'SMK-401',
    generated_at: new Date().toISOString(),
    cadence: {
      schedule_utc: SCHEDULE_UTC,
      lookback_days: lookbackDays,
      decision_summary: decision.summary ?? 'unknown',
      snapshot_history_count: history.length,
    },
    persisted: persistJson,
    scorecard: scorecardJson,
  })
}
