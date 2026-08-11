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

type SunsetRecommendation = 'remove_compat_route' | 'monitor' | 'migrate_callers'
type SunsetRecommendationReason = 'no_hits_and_inactive' | 'within_budget' | 'over_budget'
type SunsetBlockingReason = 'compat_hits_over_budget' | 'compat_route_still_active' | 'inactivity_window_not_elapsed'
type SunsetBlockingSummary = 'none' | 'over_budget_only' | 'active_traffic' | 'inactivity_window_pending' | 'multiple'
type SunsetPrimaryBlockingReason = 'none' | 'compat_hits_over_budget' | 'compat_route_still_active' | 'inactivity_window_not_elapsed'
type SunsetBlockingFlags = {
  any: boolean
  overBudget: boolean
  activeTraffic: boolean
  inactivityWindowPending: boolean
}
type CompatibilityWindowSource = 'alert_state' | 'default_fallback'
type InactivityWindowPhase = 'elapsed' | 'in_progress' | 'unknown_last_seen'

function readCompatibilityHitCount(value: unknown): number {
  const parsed = typeof value === 'number'
    ? value
    : typeof value === 'string'
      ? Number(value)
      : Number.NaN

  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.floor(parsed))
}

function resolveCompatibilityHitWindow(input: unknown): {
  hitWindowHours: number
  hitWindowSource: CompatibilityWindowSource
} {
  const parsed = readCompatibilityHitCount(input)
  if (parsed > 0) {
    return {
      hitWindowHours: parsed,
      hitWindowSource: 'alert_state',
    }
  }

  return {
    hitWindowHours: DEFAULT_COMPAT_HIT_WINDOW_HOURS,
    hitWindowSource: 'default_fallback',
  }
}

function resolveSunsetRecommendation(input: {
  hitCount: number
  hitBudget: number
  hitWindowHours: number
  lastSeenAgeHours: number | null
}): { recommendation: SunsetRecommendation, reason: SunsetRecommendationReason } {
  const inactivityWindowElapsed = input.lastSeenAgeHours === null
    || input.lastSeenAgeHours >= input.hitWindowHours

  if (input.hitCount === 0 && inactivityWindowElapsed) {
    return {
      recommendation: 'remove_compat_route',
      reason: 'no_hits_and_inactive',
    }
  }

  if (input.hitCount <= input.hitBudget) {
    return {
      recommendation: 'monitor',
      reason: 'within_budget',
    }
  }

  return {
    recommendation: 'migrate_callers',
    reason: 'over_budget',
  }
}

function resolveInactivityWindowElapsed(input: {
  hitWindowHours: number
  lastSeenAgeHours: number | null
}): boolean {
  return input.lastSeenAgeHours === null || input.lastSeenAgeHours >= input.hitWindowHours
}

function resolveInactivityWindowRemainingHours(input: {
  hitWindowHours: number
  lastSeenAgeHours: number | null
}): number | null {
  if (input.lastSeenAgeHours === null) {
    return null
  }

  return Math.max(0, input.hitWindowHours - input.lastSeenAgeHours)
}

function resolveInactivityWindowProgressPct(input: {
  hitWindowHours: number
  lastSeenAgeHours: number | null
}): number | null {
  if (input.lastSeenAgeHours === null) {
    return null
  }

  if (input.hitWindowHours <= 0) {
    return null
  }

  const progress = (input.lastSeenAgeHours / input.hitWindowHours) * 100
  return Math.max(0, Math.min(100, progress))
}

function resolveInactivityWindowPhase(input: {
  inactivityWindowElapsed: boolean
  lastSeenAgeHours: number | null
}): InactivityWindowPhase {
  if (input.lastSeenAgeHours === null) {
    return 'unknown_last_seen'
  }

  return input.inactivityWindowElapsed ? 'elapsed' : 'in_progress'
}

function resolveInactivityWindowEndsAt(input: {
  hitWindowHours: number
  lastSeenAt: string | null
}): string | null {
  if (!input.lastSeenAt) {
    return null
  }

  const t = Date.parse(input.lastSeenAt)
  if (Number.isNaN(t)) {
    return null
  }

  return new Date(t + input.hitWindowHours * 3_600_000).toISOString()
}

function resolveCompatibilityBlockingReasons(input: {
  recommendation: SunsetRecommendation
  hitCount: number
  inactivityWindowElapsed: boolean
}): SunsetBlockingReason[] {
  if (input.recommendation === 'remove_compat_route') {
    return []
  }

  if (input.recommendation === 'migrate_callers') {
    return ['compat_hits_over_budget']
  }

  const reasons: SunsetBlockingReason[] = []
  if (input.hitCount > 0) {
    reasons.push('compat_route_still_active')
  }
  if (!input.inactivityWindowElapsed) {
    reasons.push('inactivity_window_not_elapsed')
  }
  return reasons
}

function resolveCompatibilityBlockingSummary(input: {
  blockingReasons: SunsetBlockingReason[]
}): SunsetBlockingSummary {
  if (input.blockingReasons.length === 0) {
    return 'none'
  }

  if (input.blockingReasons.length > 1) {
    return 'multiple'
  }

  const [reason] = input.blockingReasons
  if (reason === 'compat_hits_over_budget') {
    return 'over_budget_only'
  }

  if (reason === 'compat_route_still_active') {
    return 'active_traffic'
  }

  return 'inactivity_window_pending'
}

function resolveCompatibilityPrimaryBlockingReason(input: {
  blockingReasons: SunsetBlockingReason[]
}): SunsetPrimaryBlockingReason {
  const set = new Set(input.blockingReasons)
  if (set.has('compat_hits_over_budget')) {
    return 'compat_hits_over_budget'
  }
  if (set.has('compat_route_still_active')) {
    return 'compat_route_still_active'
  }
  if (set.has('inactivity_window_not_elapsed')) {
    return 'inactivity_window_not_elapsed'
  }
  return 'none'
}

function resolveCompatibilityBlockingFlags(input: {
  blockingReasons: SunsetBlockingReason[]
}): SunsetBlockingFlags {
  const set = new Set(input.blockingReasons)
  return {
    any: input.blockingReasons.length > 0,
    overBudget: set.has('compat_hits_over_budget'),
    activeTraffic: set.has('compat_route_still_active'),
    inactivityWindowPending: set.has('inactivity_window_not_elapsed'),
  }
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
  const compatRouteStillActive = compatHitCount > 0
  const compatLifetimeHitCount = readCompatibilityHitCount(
    compatHitState?.last_details?.lifetimeHitCount ?? compatHitCount,
  )
  const compatHitWindow = resolveCompatibilityHitWindow(compatHitState?.last_details?.hitCountWindowHours)
  const compatHitWindowHours = compatHitWindow.hitWindowHours
  const compatWindowStartAt = compatHitState?.last_details?.windowStartAt ?? null
  const compatWindowAgeHours = hoursSince(compatWindowStartAt)
  const compatLastSeenAt = compatHitState?.last_details?.lastSeenAt ?? null
  const compatLastSeenAgeHours = hoursSince(compatLastSeenAt)
  const compatSunsetReady = compatHitCount <= compatHitBudget
  const compatOverBudgetBy = Math.max(0, compatHitCount - compatHitBudget)
  const compatBudgetRemaining = Math.max(0, compatHitBudget - compatHitCount)
  const compatInactivityWindowElapsed = resolveInactivityWindowElapsed({
    hitWindowHours: compatHitWindowHours,
    lastSeenAgeHours: compatLastSeenAgeHours,
  })
  const compatInactivityWindowRemainingHours = resolveInactivityWindowRemainingHours({
    hitWindowHours: compatHitWindowHours,
    lastSeenAgeHours: compatLastSeenAgeHours,
  })
  const compatInactivityWindowProgressPct = resolveInactivityWindowProgressPct({
    hitWindowHours: compatHitWindowHours,
    lastSeenAgeHours: compatLastSeenAgeHours,
  })
  const compatInactivityWindowPhase = resolveInactivityWindowPhase({
    inactivityWindowElapsed: compatInactivityWindowElapsed,
    lastSeenAgeHours: compatLastSeenAgeHours,
  })
  const compatInactivityWindowEndsAt = resolveInactivityWindowEndsAt({
    hitWindowHours: compatHitWindowHours,
    lastSeenAt: compatLastSeenAt,
  })
  const compatRecommendationContext = resolveSunsetRecommendation({
    hitCount: compatHitCount,
    hitBudget: compatHitBudget,
    hitWindowHours: compatHitWindowHours,
    lastSeenAgeHours: compatLastSeenAgeHours,
  })
  const compatEligibleForRouteRemoval = compatRecommendationContext.recommendation === 'remove_compat_route'
  const compatRequiresObservationOnly = compatRecommendationContext.recommendation === 'monitor'
  const compatRequiresCallerMigration = compatRecommendationContext.recommendation === 'migrate_callers'
  const compatBlockingReasons = resolveCompatibilityBlockingReasons({
    recommendation: compatRecommendationContext.recommendation,
    hitCount: compatHitCount,
    inactivityWindowElapsed: compatInactivityWindowElapsed,
  })
  const compatBlockingReasonCount = compatBlockingReasons.length
  const compatBlockingSummary = resolveCompatibilityBlockingSummary({
    blockingReasons: compatBlockingReasons,
  })
  const compatBlockingPrimaryReason = resolveCompatibilityPrimaryBlockingReason({
    blockingReasons: compatBlockingReasons,
  })
  const compatBlockingFlags = resolveCompatibilityBlockingFlags({
    blockingReasons: compatBlockingReasons,
  })

  return NextResponse.json({
    ok: true,
    status: {
      freshnessAudit: freshnessState?.last_status ?? 'unknown',
      heartbeatWatchdog: watchdogState?.last_status ?? 'unknown',
      providerQualityAudit: providerQualityState?.last_status ?? 'unknown',
      compatRouteUsage: compatRouteStillActive ? 'active' : 'none',
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
      routeStillActive: compatRouteStillActive,
      lifetimeHitCount: compatLifetimeHitCount,
      hitWindowHours: compatHitWindowHours,
      hitWindowSource: compatHitWindow.hitWindowSource,
      windowStartAt: compatWindowStartAt,
      windowAgeHours: compatWindowAgeHours,
      hitBudget: compatHitBudget,
      overBudgetBy: compatOverBudgetBy,
      budgetRemaining: compatBudgetRemaining,
      sunsetReady: compatSunsetReady,
      recommendation: compatRecommendationContext.recommendation,
      recommendationReason: compatRecommendationContext.reason,
      eligibleForRouteRemoval: compatEligibleForRouteRemoval,
      requiresObservationOnly: compatRequiresObservationOnly,
      requiresCallerMigration: compatRequiresCallerMigration,
      blockingReasons: compatBlockingReasons,
      blockingReasonCount: compatBlockingReasonCount,
      blockingSummary: compatBlockingSummary,
      blockingPrimaryReason: compatBlockingPrimaryReason,
      blockingFlags: compatBlockingFlags,
      inactivityWindowElapsed: compatInactivityWindowElapsed,
      inactivityWindowRemainingHours: compatInactivityWindowRemainingHours,
      inactivityWindowProgressPct: compatInactivityWindowProgressPct,
      inactivityWindowPhase: compatInactivityWindowPhase,
      inactivityWindowEndsAt: compatInactivityWindowEndsAt,
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
