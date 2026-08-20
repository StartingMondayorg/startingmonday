import type { OnboardingEventName, OnboardingEventRow, OnboardingEventProperties } from '@/lib/onboarding/onboarding-agent-contracts'

export type OnboardingJourneyStepCoverage = {
  step: number
  completed_users: number
  coverage_rate: number
  abandonment_rate: number
}

export type OnboardingJourneySnapshot = {
  generated_at: string
  total_users: number
  onboarding_started_users: number
  onboarding_completed_users: number
  onboarding_first_value_ready_users: number
  start_to_complete_conversion: number | null
  start_to_first_value_conversion: number | null
  ttfv_p50_minutes: number | null
  ttfv_p90_minutes: number | null
  under_ten_minutes_share: number | null
  step_coverage: OnboardingJourneyStepCoverage[]
  largest_step_abandonment_change: { step: number; delta_pct: number } | null
  briefing_viewed_users: number
  guided_briefing_users: number
  guided_share_among_briefings: number | null
  day1_return_rate: number | null
  day7_return_rate: number | null
}

export type OnboardingWeeklySummary = {
  started_users: number
  completed_users: number
  transition_first_completed: number
  median_seconds_to_first_value: number
  under_ten_min_rate: number
  avg_manual_fields_reduction_rate: number
  low_energy_mode_rate: number
  nudge_coverage_rate: number
  channel_mix: Record<string, number>
  persona_mix: Record<string, number>
}

type UserTimeline = {
  events: OnboardingEventRow[]
}

function toTimestamp(value: string): number {
  return new Date(value).getTime()
}

function groupByUser(events: OnboardingEventRow[]): Map<string, UserTimeline> {
  const grouped = new Map<string, UserTimeline>()
  for (const event of events) {
    const existing = grouped.get(event.user_id)
    if (existing) {
      existing.events.push(event)
    } else {
      grouped.set(event.user_id, { events: [event] })
    }
  }

  for (const timeline of grouped.values()) {
    timeline.events.sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at))
  }

  return grouped
}

function uniqueUsersWithEvent(grouped: Map<string, UserTimeline>, eventName: OnboardingEventName): Set<string> {
  const users = new Set<string>()
  for (const [userId, timeline] of grouped.entries()) {
    if (timeline.events.some((event) => event.event_name === eventName)) {
      users.add(userId)
    }
  }
  return users
}

function firstEventForUser(timeline: UserTimeline, eventName: OnboardingEventName): OnboardingEventRow | null {
  return timeline.events.find((event) => event.event_name === eventName) ?? null
}

function percentile(values: number[], targetPercentile: number): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((targetPercentile / 100) * sorted.length) - 1))
  return sorted[index] ?? null
}

function mean(values: number[]): number | null {
  if (values.length === 0) return null
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return Number(((sorted[middle - 1] + sorted[middle]) / 2).toFixed(2))
  }
  return Number(sorted[middle].toFixed(2))
}

function ratio(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null
  return numerator / denominator
}

function toPercent(delta: number): number {
  return Number((delta * 100).toFixed(2))
}

function stepCoverageFromTimelines(grouped: Map<string, UserTimeline>): OnboardingJourneyStepCoverage[] {
  const startedUsers = [...grouped.entries()].filter(([, timeline]) => timeline.events.some((event) => event.event_name === 'onboarding_started'))
  const totalStarted = startedUsers.length
  const stepCounts = new Map<number, Set<string>>()

  for (const [userId, timeline] of startedUsers) {
    for (const event of timeline.events) {
      if (event.event_name !== 'onboarding_step_completed') continue
      const step = Number((event.properties as OnboardingEventProperties).step)
      if (!Number.isFinite(step)) continue
      const existing = stepCounts.get(step)
      if (existing) {
        existing.add(userId)
      } else {
        stepCounts.set(step, new Set([userId]))
      }
    }
  }

  const steps = [...stepCounts.keys()].sort((a, b) => a - b)
  return steps.map((step) => {
    const completedUsers = stepCounts.get(step)?.size ?? 0
    const coverageRate = ratio(completedUsers, totalStarted) ?? 0
    return {
      step,
      completed_users: completedUsers,
      coverage_rate: coverageRate,
      abandonment_rate: 1 - coverageRate,
    }
  })
}

function largestCoverageDelta(current: OnboardingJourneyStepCoverage[], baseline: OnboardingJourneyStepCoverage[]): { step: number; delta_pct: number } | null {
  const baselineByStep = new Map(baseline.map((entry) => [entry.step, entry]))
  let worst: { step: number; delta_pct: number } | null = null

  for (const currentStep of current) {
    const baselineStep = baselineByStep.get(currentStep.step)
    if (!baselineStep) continue
    const deltaPct = toPercent(currentStep.abandonment_rate - baselineStep.abandonment_rate)
    if (deltaPct > 0 && (!worst || deltaPct > worst.delta_pct)) {
      worst = { step: currentStep.step, delta_pct: deltaPct }
    }
  }

  return worst
}

function ttfvMinutes(grouped: Map<string, UserTimeline>): number[] {
  const values: number[] = []

  for (const timeline of grouped.values()) {
    const started = firstEventForUser(timeline, 'onboarding_started')
    const firstValue = firstEventForUser(timeline, 'onboarding_first_value_ready')
    if (!started || !firstValue) continue

    const elapsedMinutes = (toTimestamp(firstValue.created_at) - toTimestamp(started.created_at)) / 60000
    if (Number.isFinite(elapsedMinutes) && elapsedMinutes >= 0) {
      values.push(elapsedMinutes)
    }
  }

  return values
}

function returnRate(grouped: Map<string, UserTimeline>, thresholdDays: number): number | null {
  let eligibleUsers = 0
  let returningUsers = 0

  for (const timeline of grouped.values()) {
    const started = firstEventForUser(timeline, 'onboarding_started')
    if (!started) continue
    eligibleUsers += 1

    const thresholdMs = toTimestamp(started.created_at) + thresholdDays * 24 * 60 * 60 * 1000
    const hasReturn = timeline.events.some((event) => toTimestamp(event.created_at) >= thresholdMs)
    if (hasReturn) {
      returningUsers += 1
    }
  }

  return ratio(returningUsers, eligibleUsers)
}

function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(2))
}

function getBoolean(properties: OnboardingEventProperties | null | undefined, key: string): boolean {
  if (!properties) return false
  const value = properties[key]
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value === 'true'
  return false
}

function getNumber(properties: OnboardingEventProperties | null | undefined, key: string): number | null {
  if (!properties) return null
  const value = properties[key]
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function getString(properties: OnboardingEventProperties | null | undefined, key: string): string | null {
  if (!properties) return null
  const value = properties[key]
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

export function summarizeOnboardingWeeklyMetrics(events: OnboardingEventRow[]): OnboardingWeeklySummary {
  const startedUsers = new Set<string>()
  const completedUsers = new Set<string>()
  const transitionFirstCompletedUsers = new Set<string>()
  const lowEnergyUsers = new Set<string>()
  const nudgedUsers = new Set<string>()

  const channelMix = new Map<string, number>()
  const personaMix = new Map<string, number>()
  const completionSeconds: number[] = []
  const reductionRates: number[] = []

  for (const row of events) {
    if (row.event_name === 'onboarding_started') {
      startedUsers.add(row.user_id)
      continue
    }

    if (row.event_name === 'onboarding_nudge_shown') {
      nudgedUsers.add(row.user_id)
      continue
    }

    if (row.event_name === 'onboarding_low_energy_enabled') {
      lowEnergyUsers.add(row.user_id)
      continue
    }

    if (row.event_name !== 'onboarding_completed') continue

    completedUsers.add(row.user_id)

    if (getBoolean(row.properties, 'transition_first')) transitionFirstCompletedUsers.add(row.user_id)

    const elapsedSeconds = getNumber(row.properties, 'onboarding_elapsed_seconds')
    if (elapsedSeconds !== null && elapsedSeconds > 0) completionSeconds.push(elapsedSeconds)

    const reductionRate = getNumber(row.properties, 'manual_fields_reduction_rate')
    if (reductionRate !== null) reductionRates.push(reductionRate)

    const channel = getString(row.properties, 'onboarding_channel') ?? 'unknown'
    channelMix.set(channel, (channelMix.get(channel) ?? 0) + 1)

    const persona = getString(row.properties, 'search_persona') ?? 'unknown'
    personaMix.set(persona, (personaMix.get(persona) ?? 0) + 1)

    if (getBoolean(row.properties, 'onboarding_low_energy')) {
      lowEnergyUsers.add(row.user_id)
    }
  }

  const startedCount = startedUsers.size
  const completedCount = completedUsers.size

  const medianSecondsToFirstValue = median(completionSeconds) ?? 0
  const underTenCount = completionSeconds.filter((seconds) => seconds <= 600).length
  const underTenMinRate = pct(underTenCount, completionSeconds.length)
  const avgManualFieldsReductionRate = reductionRates.length
    ? Number((reductionRates.reduce((sum, value) => sum + value, 0) / reductionRates.length).toFixed(2))
    : 0
  const lowEnergyModeRate = pct(lowEnergyUsers.size, completedCount || startedCount)
  const nudgeCoverageRate = pct(nudgedUsers.size, startedCount)

  return {
    started_users: startedCount,
    completed_users: completedCount,
    transition_first_completed: transitionFirstCompletedUsers.size,
    median_seconds_to_first_value: medianSecondsToFirstValue,
    under_ten_min_rate: underTenMinRate,
    avg_manual_fields_reduction_rate: avgManualFieldsReductionRate,
    low_energy_mode_rate: lowEnergyModeRate,
    nudge_coverage_rate: nudgeCoverageRate,
    channel_mix: Object.fromEntries([...channelMix.entries()].sort((a, b) => b[1] - a[1])),
    persona_mix: Object.fromEntries([...personaMix.entries()].sort((a, b) => b[1] - a[1])),
  }
}

export function calculateOnboardingJourneySnapshot(
  events: OnboardingEventRow[],
  baselineEvents: OnboardingEventRow[] = [],
  generatedAt = new Date().toISOString(),
): OnboardingJourneySnapshot {
  const grouped = groupByUser(events)
  const baselineGrouped = groupByUser(baselineEvents)

  const startedUsers = uniqueUsersWithEvent(grouped, 'onboarding_started')
  const completedUsers = uniqueUsersWithEvent(grouped, 'onboarding_completed')
  const firstValueUsers = uniqueUsersWithEvent(grouped, 'onboarding_first_value_ready')
  const briefingViewedUsers = uniqueUsersWithEvent(grouped, 'briefing_viewed')
  const guidedUsers = uniqueUsersWithEvent(grouped, 'briefing_first_session_guided_viewed')

  const ttfvValues = ttfvMinutes(grouped)
  const currentCoverage = stepCoverageFromTimelines(grouped)
  const baselineCoverage = stepCoverageFromTimelines(baselineGrouped)

  return {
    generated_at: generatedAt,
    total_users: grouped.size,
    onboarding_started_users: startedUsers.size,
    onboarding_completed_users: completedUsers.size,
    onboarding_first_value_ready_users: firstValueUsers.size,
    start_to_complete_conversion: ratio(completedUsers.size, startedUsers.size),
    start_to_first_value_conversion: ratio(firstValueUsers.size, startedUsers.size),
    ttfv_p50_minutes: percentile(ttfvValues, 50),
    ttfv_p90_minutes: percentile(ttfvValues, 90),
    under_ten_minutes_share: ratio(ttfvValues.filter((value) => value <= 10).length, ttfvValues.length),
    step_coverage: currentCoverage,
    largest_step_abandonment_change: largestCoverageDelta(currentCoverage, baselineCoverage),
    briefing_viewed_users: briefingViewedUsers.size,
    guided_briefing_users: guidedUsers.size,
    guided_share_among_briefings: ratio(guidedUsers.size, briefingViewedUsers.size),
    day1_return_rate: returnRate(grouped, 1),
    day7_return_rate: returnRate(grouped, 7),
  }
}

export function compareRatioDropPct(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null || baseline === 0) return null
  return toPercent((baseline - current) / baseline)
}

export function compareRatioLiftPct(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null || baseline === 0) return null
  return toPercent((current - baseline) / baseline)
}

export function formatWindowLabel(days: number): string {
  return `${days}d trailing window`
}
