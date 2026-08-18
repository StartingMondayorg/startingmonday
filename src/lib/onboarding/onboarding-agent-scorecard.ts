import { createAdminClient } from '@/lib/supabase/admin'
import {
  ONBOARDING_EVENT_NAMES,
  type OnboardingEventRow,
} from '@/lib/onboarding/onboarding-agent-contracts'
import { analyzeOnboardingEventIntegrity } from '@/lib/onboarding/onboarding-event-integrity-agent'
import { analyzeOnboardingJourneyHealth } from '@/lib/onboarding/onboarding-journey-health-agent'
import { summarizeOnboardingWeeklyMetrics } from '@/lib/onboarding/onboarding-agent-metrics'

const AUTH_PATH_ROUTED_EVENT_NAME = 'auth_path_routed'

export type OnboardingReportingWindow = {
  generated_at: string
  week_start: string
  week_end: string
  baseline_start: string
  baseline_end: string
}

export type OnboardingQaScorecard = {
  window: OnboardingReportingWindow
  summary: ReturnType<typeof summarizeOnboardingWeeklyMetrics>
  auth_paths: {
    total: number
    by_path_category: Record<string, number>
  }
  journey_health: ReturnType<typeof analyzeOnboardingJourneyHealth>
  integrity: ReturnType<typeof analyzeOnboardingEventIntegrity>
  overall: {
    readiness: 'ready' | 'watch' | 'degraded'
    critical_findings: number
    warning_findings: number
  }
  notes: string[]
}

type ScorecardBuilderInput = {
  currentEvents: OnboardingEventRow[]
  baselineEvents: OnboardingEventRow[]
  window: OnboardingReportingWindow
  authPathEvents?: OnboardingEventRow[]
}

type LooseSupabaseClient = ReturnType<typeof createAdminClient>

function weekStartIso(referenceDate?: string): string {
  const base = referenceDate ? new Date(referenceDate) : new Date()
  const day = base.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate() - diffToMonday))
  return start.toISOString().slice(0, 10)
}

function toWindow(referenceDate?: string): OnboardingReportingWindow {
  const generatedAt = new Date().toISOString()
  const weekStart = weekStartIso(referenceDate)
  const currentStart = `${weekStart}T00:00:00.000Z`
  const currentEnd = new Date(new Date(currentStart).getTime() + 7 * 86400000).toISOString()
  const baselineStart = new Date(new Date(currentStart).getTime() - 7 * 86400000).toISOString()
  const baselineEnd = currentStart

  return {
    generated_at: generatedAt,
    week_start: weekStart,
    week_end: currentEnd,
    baseline_start: baselineStart,
    baseline_end: baselineEnd,
  }
}

function countByEventName(events: OnboardingEventRow[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const event of events) {
    counts[event.event_name] = (counts[event.event_name] ?? 0) + 1
  }
  return counts
}

function summarizeAuthPaths(events: OnboardingEventRow[]) {
  const byPathCategory: Record<string, number> = {}
  for (const event of events) {
    const pathCategory = typeof event.properties?.path_category === 'string' && event.properties.path_category.trim()
      ? event.properties.path_category.trim()
      : 'missing'
    byPathCategory[pathCategory] = (byPathCategory[pathCategory] ?? 0) + 1
  }

  return {
    total: events.length,
    by_path_category: byPathCategory,
  }
}

export function buildOnboardingQaScorecard(input: ScorecardBuilderInput): OnboardingQaScorecard {
  const summary = summarizeOnboardingWeeklyMetrics(input.currentEvents)
  const journeyHealth = analyzeOnboardingJourneyHealth({
    currentEvents: input.currentEvents,
    baselineEvents: input.baselineEvents,
    generatedAt: input.window.generated_at,
    currentWindowLabel: input.window.week_start,
    baselineWindowLabel: input.window.baseline_start.slice(0, 10),
  })
  const integrity = analyzeOnboardingEventIntegrity({
    events: input.currentEvents,
    baselineEvents: input.baselineEvents,
    previousCountsByEvent: countByEventName(input.baselineEvents),
    generatedAt: input.window.generated_at,
  })

  const criticalFindings = [...journeyHealth.findings, ...integrity.findings].filter((finding) => finding.severity === 'critical').length
  const warningFindings = [...journeyHealth.findings, ...integrity.findings].filter((finding) => finding.severity === 'warning').length

  const readiness = criticalFindings > 0 ? 'degraded' : warningFindings > 0 ? 'watch' : 'ready'
  const notes = [
    ...journeyHealth.findings.map((finding) => `${finding.severity.toUpperCase()}: ${finding.metric_name} - ${finding.recommendation}`),
    ...integrity.findings.map((finding) => `${finding.severity.toUpperCase()}: ${finding.check_name} - ${finding.recommendation}`),
  ]

  return {
    window: input.window,
    summary,
    auth_paths: summarizeAuthPaths(input.authPathEvents ?? []),
    journey_health: journeyHealth,
    integrity,
    overall: {
      readiness,
      critical_findings: criticalFindings,
      warning_findings: warningFindings,
    },
    notes,
  }
}

async function queryEvents(
  sb: LooseSupabaseClient,
  startIso: string,
  endIso: string,
): Promise<OnboardingEventRow[]> {
  const { data, error } = await sb
    .from('user_events')
    .select('user_id, event_name, created_at, properties')
    .in('event_name', ONBOARDING_EVENT_NAMES)
    .gte('created_at', startIso)
    .lt('created_at', endIso)
    .limit(100000)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as OnboardingEventRow[]
}

export async function loadOnboardingQaScorecard(
  sb: LooseSupabaseClient,
  referenceDate?: string,
): Promise<OnboardingQaScorecard> {
  const window = toWindow(referenceDate)
  const [currentEvents, baselineEvents, authPathEvents] = await Promise.all([
    queryEvents(sb, `${window.week_start}T00:00:00.000Z`, window.week_end),
    queryEvents(sb, window.baseline_start, window.baseline_end),
    sb
      .from('user_events')
      .select('user_id, event_name, created_at, properties')
      .eq('event_name', AUTH_PATH_ROUTED_EVENT_NAME)
      .gte('created_at', `${window.week_start}T00:00:00.000Z`)
      .lt('created_at', window.week_end)
      .limit(100000)
      .then((result) => {
        if (result.error) {
          throw new Error(result.error.message)
        }
        return (result.data ?? []) as OnboardingEventRow[]
      }),
  ])

  return buildOnboardingQaScorecard({ currentEvents, baselineEvents, window, authPathEvents })
}

export function serializeOnboardingQaScorecard(scorecard: OnboardingQaScorecard): string {
  return `${JSON.stringify(scorecard, null, 2)}\n`
}
