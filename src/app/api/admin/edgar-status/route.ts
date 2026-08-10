/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

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

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const expectedIntervalHours = readNumberEnv('EDGAR_FRESHNESS_EXPECTED_INTERVAL_HOURS', 6)
  const maxDelayHours = readNumberEnv('EDGAR_HEARTBEAT_MAX_DELAY_HOURS', 8)

  const sb = auth.supabase as any

  const [
    { data: freshnessState },
    { data: freshnessRun },
    { data: signalRun },
    { data: watchdogState },
    { data: legacyProviderState },
  ] = await Promise.all([
    sb
      .from('sec_freshness_audit_state')
      .select('id, last_status, last_checked_at, last_stale_alert_at, last_recovery_alert_at, last_details, updated_at')
      .eq('id', 1)
      .maybeSingle(),
    sb
      .from('sec_ingestion_runs')
      .select('id, source, status, started_at, finished_at, error_message, metadata')
      .eq('source', 'freshness-audit')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from('sec_ingestion_runs')
      .select('id, source, status, started_at, finished_at, error_message, metadata')
      .eq('source', 'signal-job')
      .order('finished_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    sb
      .from('monitoring_alert_state')
      .select('alert_key, last_status, last_checked_at, last_stale_alert_at, last_recovery_alert_at, last_details, updated_at')
      .eq('alert_key', 'edgar-heartbeat-watchdog')
      .maybeSingle(),
    sb
      .from('monitoring_alert_state')
      .select('alert_key, last_status, last_checked_at, last_stale_alert_at, last_recovery_alert_at, last_details, updated_at')
      .eq('alert_key', 'apollo-quality-audit')
      .maybeSingle(),
  ])

  const freshnessRunAt = freshnessRun?.finished_at ?? freshnessRun?.started_at ?? null
  const freshnessRunAgeHours = hoursSince(freshnessRunAt)
  const nextExpectedCheckAt = freshnessRunAt
    ? new Date(Date.parse(freshnessRunAt) + expectedIntervalHours * 3_600_000).toISOString()
    : null

  const overdueByHours = freshnessRunAgeHours === null
    ? null
    : Math.max(0, freshnessRunAgeHours - maxDelayHours)

  return NextResponse.json({
    ok: true,
    status: {
      freshnessAudit: freshnessState?.last_status ?? 'unknown',
      heartbeatWatchdog: watchdogState?.last_status ?? 'unknown',
      providerQualityAudit: legacyProviderState?.last_status ?? 'unknown',
      apolloQualityAudit: legacyProviderState?.last_status ?? 'unknown',
    },
    schedule: {
      expectedIntervalHours,
      maxDelayHours,
      nextExpectedCheckAt,
      freshnessRunAgeHours,
      overdueByHours,
    },
    lastRuns: {
      freshnessAudit: freshnessRun ?? null,
      signalJob: signalRun ?? null,
    },
    alertState: {
      freshnessAudit: freshnessState ?? null,
      heartbeatWatchdog: watchdogState ?? null,
      providerQualityAudit: legacyProviderState ?? null,
      apolloQualityAudit: legacyProviderState ?? null,
    },
  })
}
