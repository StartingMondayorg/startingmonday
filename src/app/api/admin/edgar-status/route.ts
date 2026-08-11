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

const PROVIDER_QUALITY_ALERT_KEY = 'provider-quality-audit'
const COMPAT_HIT_ALERT_KEY = 'apollo-quality-audit-compat-hit'
const DEFAULT_COMPAT_HIT_WINDOW_HOURS = 24

function readCompatibilityHitCount(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  return Math.max(0, Math.floor(value))
}

export async function GET(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const expectedIntervalHours = readNumberEnv('EDGAR_FRESHNESS_EXPECTED_INTERVAL_HOURS', 6)
  const maxDelayHours = readNumberEnv('EDGAR_HEARTBEAT_MAX_DELAY_HOURS', 8)
  const compatHitBudget = readNumberEnv('APOLLO_COMPAT_HIT_BUDGET', 0)

  const sb = auth.supabase as any

  const [
    { data: freshnessState },
    { data: freshnessRun },
    { data: signalRun },
    { data: watchdogState },
    { data: providerQualityState },
    { data: compatHitState },
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
      .eq('alert_key', PROVIDER_QUALITY_ALERT_KEY)
      .maybeSingle(),
    sb
      .from('monitoring_alert_state')
      .select('alert_key, last_status, last_checked_at, last_stale_alert_at, last_recovery_alert_at, last_details, updated_at')
      .eq('alert_key', COMPAT_HIT_ALERT_KEY)
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

  const compatHitCount = readCompatibilityHitCount(compatHitState?.last_details?.hitCount)
  const compatLifetimeHitCount = readCompatibilityHitCount(
    compatHitState?.last_details?.lifetimeHitCount ?? compatHitCount,
  )
  const compatHitWindowHours = readCompatibilityHitCount(
    compatHitState?.last_details?.hitCountWindowHours ?? DEFAULT_COMPAT_HIT_WINDOW_HOURS,
  )
  const compatWindowStartAt = compatHitState?.last_details?.windowStartAt ?? null
  const compatWindowAgeHours = hoursSince(compatWindowStartAt)
  const compatLastSeenAt = compatHitState?.last_details?.lastSeenAt ?? null
  const compatLastSeenAgeHours = hoursSince(compatLastSeenAt)
  const compatSunsetReady = compatHitCount <= compatHitBudget

  return NextResponse.json({
    ok: true,
    status: {
      freshnessAudit: freshnessState?.last_status ?? 'unknown',
      heartbeatWatchdog: watchdogState?.last_status ?? 'unknown',
      providerQualityAudit: providerQualityState?.last_status ?? 'unknown',
      compatRouteUsage: compatHitCount > 0 ? 'active' : 'none',
    },
    schedule: {
      expectedIntervalHours,
      maxDelayHours,
      nextExpectedCheckAt,
      freshnessRunAgeHours,
      overdueByHours,
    },
    compatibilitySunset: {
      route: '/api/cron/apollo-quality-audit',
      replacementRoute: '/api/cron/provider-quality-audit',
      hitCount: compatHitCount,
      lifetimeHitCount: compatLifetimeHitCount,
      hitWindowHours: compatHitWindowHours,
      windowStartAt: compatWindowStartAt,
      windowAgeHours: compatWindowAgeHours,
      hitBudget: compatHitBudget,
      sunsetReady: compatSunsetReady,
      lastSeenAt: compatLastSeenAt,
      lastSeenAgeHours: compatLastSeenAgeHours,
    },
    lastRuns: {
      freshnessAudit: freshnessRun ?? null,
      signalJob: signalRun ?? null,
    },
    alertState: {
      freshnessAudit: freshnessState ?? null,
      heartbeatWatchdog: watchdogState ?? null,
      providerQualityAudit: providerQualityState ?? null,
      compatRouteUsage: compatHitState ?? null,
    },
  })
}
