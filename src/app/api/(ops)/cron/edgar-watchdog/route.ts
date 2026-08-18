import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendSlackMessage } from '@/lib/slack'

export const runtime = 'nodejs'

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function hoursSince(value: string | null): number | null {
  if (!value) return null
  const t = Date.parse(value)
  if (Number.isNaN(t)) return null
  return (Date.now() - t) / 3_600_000
}

function staleMessage(input: {
  latestFreshnessRunAt: string | null
  ageHours: number | null
  expectedIntervalHours: number
  maxDelayHours: number
}): string {
  return [
    '*EDGAR freshness heartbeat watchdog alert*',
    '- Status: stale',
    `- Latest freshness-audit run: ${input.latestFreshnessRunAt ?? 'none'}`,
    `- Run age hours: ${input.ageHours === null ? 'n/a' : input.ageHours.toFixed(2)}`,
    `- Expected interval hours: ${input.expectedIntervalHours}`,
    `- Max allowed delay hours: ${input.maxDelayHours}`,
  ].join('\n')
}

function recoveryMessage(input: {
  latestFreshnessRunAt: string | null
  ageHours: number | null
}): string {
  return [
    '*EDGAR freshness heartbeat watchdog recovered*',
    '- Status: fresh',
    `- Latest freshness-audit run: ${input.latestFreshnessRunAt ?? 'none'}`,
    `- Run age hours: ${input.ageHours === null ? 'n/a' : input.ageHours.toFixed(2)}`,
  ].join('\n')
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const healthMode = request.nextUrl.searchParams.get('mode') === 'health'
    || request.nextUrl.searchParams.get('health') === '1'
    || request.nextUrl.searchParams.get('dry_run') === '1'

  const expectedIntervalHours = readNumberEnv('EDGAR_FRESHNESS_EXPECTED_INTERVAL_HOURS', 6)
  const maxDelayHours = readNumberEnv('EDGAR_HEARTBEAT_MAX_DELAY_HOURS', 8)
  const staleAlertCooldownHours = readNumberEnv('EDGAR_HEARTBEAT_ALERT_COOLDOWN_HOURS', 4)

  const admin = createAdminClient() as any

  const [{ data: latestRun }, { data: state }] = await Promise.all([
    admin
      .from('sec_ingestion_runs')
      .select('started_at, finished_at, status')
      .eq('source', 'freshness-audit')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('monitoring_alert_state')
      .select('alert_key, last_status, last_stale_alert_at, last_recovery_alert_at')
      .eq('alert_key', 'edgar-heartbeat-watchdog')
      .maybeSingle(),
  ])

  const latestFreshnessRunAt = latestRun?.finished_at ?? latestRun?.started_at ?? null
  const ageHours = hoursSince(latestFreshnessRunAt)
  const isStale = ageHours === null || ageHours > maxDelayHours

  const previousStatus = state?.last_status ?? 'unknown'
  const staleAlertAgeHours = hoursSince(state?.last_stale_alert_at ?? null)
  const shouldAlertStale = !healthMode
    && isStale
    && (previousStatus !== 'stale' || staleAlertAgeHours === null || staleAlertAgeHours >= staleAlertCooldownHours)
  const shouldAlertRecovery = !healthMode && !isStale && previousStatus === 'stale'

  let slack = { ok: true, error: null as string | null }
  if (shouldAlertStale) {
    const result = await sendSlackMessage({
      text: staleMessage({
        latestFreshnessRunAt,
        ageHours,
        expectedIntervalHours,
        maxDelayHours,
      }),
    })
    slack = result.ok ? { ok: true, error: null } : { ok: false, error: result.error }
  } else if (shouldAlertRecovery) {
    const result = await sendSlackMessage({ text: recoveryMessage({ latestFreshnessRunAt, ageHours }) })
    slack = result.ok ? { ok: true, error: null } : { ok: false, error: result.error }
  }

  const nowIso = new Date().toISOString()
  const details = {
    latestFreshnessRunAt,
    ageHours,
    expectedIntervalHours,
    maxDelayHours,
    thresholds: {
      staleAlertCooldownHours,
    },
    mode: healthMode ? 'health' : 'live',
  }

  await admin
    .from('monitoring_alert_state')
    .upsert({
      alert_key: 'edgar-heartbeat-watchdog',
      last_status: isStale ? 'stale' : 'fresh',
      last_checked_at: nowIso,
      last_stale_alert_at: shouldAlertStale && slack.ok ? nowIso : state?.last_stale_alert_at ?? null,
      last_recovery_alert_at: shouldAlertRecovery && slack.ok ? nowIso : state?.last_recovery_alert_at ?? null,
      last_details: details,
      updated_at: nowIso,
    }, { onConflict: 'alert_key' })

  await admin
    .from('sec_ingestion_runs')
    .insert({
      source: 'freshness-watchdog',
      status: isStale ? 'stale' : 'fresh',
      started_at: nowIso,
      finished_at: nowIso,
      error_message: isStale ? 'Freshness audit run overdue' : null,
      metadata: {
        ...details,
        shouldAlertStale,
        shouldAlertRecovery,
        slack,
      },
    })

  return NextResponse.json({
    ok: true,
    status: isStale ? 'stale' : 'fresh',
    shouldAlertStale,
    shouldAlertRecovery,
    slack,
    details,
  })
}
