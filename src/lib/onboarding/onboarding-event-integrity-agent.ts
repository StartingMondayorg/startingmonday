import {
  ONBOARDING_CONTRACT_VERSION,
  ONBOARDING_EVENT_NAMES,
  type ContractIssue,
  type OnboardingEventName,
  type OnboardingEventRow,
  normalizeOnboardingEventProperties,
  validateOnboardingEventProperties,
} from '@/lib/onboarding/onboarding-agent-contracts'

export type OnboardingIntegrityFinding = {
  finding_id: string
  generated_at: string
  severity: 'critical' | 'warning' | 'info'
  event_name: OnboardingEventName | string
  check_name: string
  anomaly_rate: number
  sample_size: number
  expected_contract_version: string
  recommendation: string
  sample_payload_hint?: string
}

export type OnboardingIntegritySnapshot = {
  counts_by_event: Record<string, number>
  previous_counts_by_event: Record<string, number>
  generated_at: string
}

export type OnboardingIntegrityAnalysis = {
  snapshot: OnboardingIntegritySnapshot
  findings: OnboardingIntegrityFinding[]
}

type UserTimeline = {
  events: OnboardingEventRow[]
}

type IntegrityInput = {
  events: OnboardingEventRow[]
  previousCountsByEvent?: Record<string, number>
  generatedAt?: string
  sessionWindowMinutes?: number
  baselineEvents?: OnboardingEventRow[]
}

function toTimestamp(value: string): number {
  return new Date(value).getTime()
}

function groupByUser(events: OnboardingEventRow[]): Map<string, UserTimeline> {
  const grouped = new Map<string, UserTimeline>()
  for (const event of events) {
    const current = grouped.get(event.user_id)
    if (current) {
      current.events.push(event)
    } else {
      grouped.set(event.user_id, { events: [event] })
    }
  }

  for (const timeline of grouped.values()) {
    timeline.events.sort((a, b) => toTimestamp(a.created_at) - toTimestamp(b.created_at))
  }

  return grouped
}

function eventCounts(events: OnboardingEventRow[]): Record<string, number> {
  const counts: Record<string, number> = {}
  for (const event of events) {
    counts[event.event_name] = (counts[event.event_name] ?? 0) + 1
  }
  return counts
}

function maxPercent(current: number, baseline: number): number {
  if (baseline === 0) return 100
  return Number(((current - baseline) / baseline * 100).toFixed(2))
}

function sampleHint(properties: Record<string, unknown>): string {
  return JSON.stringify(properties, null, 0).slice(0, 240)
}

function contractIssuesForEvents(events: OnboardingEventRow[]): ContractIssue[] {
  const issues: ContractIssue[] = []
  for (const event of events) {
    issues.push(...validateOnboardingEventProperties(event.event_name, event.properties))
  }
  return issues
}

function findSequenceIssues(grouped: Map<string, UserTimeline>, sessionWindowMinutes: number): OnboardingIntegrityFinding[] {
  const findings: OnboardingIntegrityFinding[] = []
  let relevantUsers = 0
  let anomalyUsers = 0

  for (const [userId, timeline] of grouped.entries()) {
    const hasOnboardingStarted = timeline.events.some((event) => event.event_name === 'onboarding_started')
    const hasOnboardingCompleted = timeline.events.some((event) => event.event_name === 'onboarding_completed')
    const guidedEvents = timeline.events.filter((event) => event.event_name === 'briefing_first_session_guided_viewed')
    const briefingEvents = timeline.events.filter((event) => event.event_name === 'briefing_viewed')

    const userHasRelevantAnomaly = (!hasOnboardingStarted && hasOnboardingCompleted)
      || guidedEvents.some((guidedEvent) => {
        const guidedTs = toTimestamp(guidedEvent.created_at)
        return !briefingEvents.some((briefingEvent) => Math.abs(toTimestamp(briefingEvent.created_at) - guidedTs) <= sessionWindowMinutes * 60_000)
      })

    if (hasOnboardingStarted || hasOnboardingCompleted || guidedEvents.length > 0 || briefingEvents.length > 0) {
      relevantUsers += 1
      if (userHasRelevantAnomaly) {
        anomalyUsers += 1
      }
    }

    if (!hasOnboardingStarted && hasOnboardingCompleted) {
      findings.push({
        finding_id: `sequence-missing-start-${userId}`,
        generated_at: timeline.events[0]?.created_at ?? new Date().toISOString(),
        severity: 'warning',
        event_name: 'onboarding_completed',
        check_name: 'sequence_integrity',
        anomaly_rate: 1,
        sample_size: 1,
        expected_contract_version: ONBOARDING_CONTRACT_VERSION,
        recommendation: 'Ensure onboarding_started is emitted before onboarding_completed for every user flow.',
        sample_payload_hint: sampleHint(normalizeOnboardingEventProperties(timeline.events.find((event) => event.event_name === 'onboarding_completed')?.properties)),
      })
    }

    for (const guidedEvent of guidedEvents) {
      const guidedTs = toTimestamp(guidedEvent.created_at)
      const hasMatchingBriefing = briefingEvents.some((briefingEvent) => Math.abs(toTimestamp(briefingEvent.created_at) - guidedTs) <= sessionWindowMinutes * 60_000)
      if (!hasMatchingBriefing) {
        findings.push({
          finding_id: `sequence-guided-without-briefing-${userId}`,
          generated_at: guidedEvent.created_at,
          severity: 'warning',
          event_name: 'briefing_first_session_guided_viewed',
          check_name: 'sequence_integrity',
          anomaly_rate: 1,
          sample_size: 1,
          expected_contract_version: ONBOARDING_CONTRACT_VERSION,
          recommendation: 'Emit briefing_viewed in the same session window when the guided first-session state is shown.',
          sample_payload_hint: sampleHint(normalizeOnboardingEventProperties(guidedEvent.properties)),
        })
      }
    }
  }

  if (relevantUsers > 0) {
    const anomalyRate = anomalyUsers / relevantUsers
    if (anomalyRate > 0.05) {
      findings.push({
        finding_id: 'sequence-anomaly-rate',
        generated_at: new Date().toISOString(),
        severity: 'warning',
        event_name: 'onboarding_completed',
        check_name: 'sequence_integrity_rate',
        anomaly_rate: Number((anomalyRate * 100).toFixed(2)),
        sample_size: relevantUsers,
        expected_contract_version: ONBOARDING_CONTRACT_VERSION,
        recommendation: 'Investigate onboarding/session sequencing for the affected cohort.',
      })
    }
  }

  return findings
}

function findRedirectIssues(events: OnboardingEventRow[]): OnboardingIntegrityFinding[] {
  const findings: OnboardingIntegrityFinding[] = []
  const authCallbackEvents = events.filter((event) => event.event_name === 'auth_callback_completed')

  for (const event of authCallbackEvents) {
    const properties = normalizeOnboardingEventProperties(event.properties)
    const explicitNext = properties.explicit_next === true
    const redirectPath = typeof properties.redirect_path === 'string' ? properties.redirect_path : null
    const suspiciousOnboardingRedirect = explicitNext && redirectPath === '/onboarding'

    if (suspiciousOnboardingRedirect) {
      findings.push({
        finding_id: `redirect-suspicious-${event.user_id}-${event.created_at}`,
        generated_at: event.created_at,
        severity: 'warning',
        event_name: 'auth_callback_completed',
        check_name: 'redirect_integrity',
        anomaly_rate: 100,
        sample_size: 1,
        expected_contract_version: ONBOARDING_CONTRACT_VERSION,
        recommendation: 'Explicit next paths should not be redirected back to onboarding.',
        sample_payload_hint: sampleHint(properties),
      })
    }
  }

  return findings
}

function findVolumeIssues(currentCounts: Record<string, number>, previousCounts: Record<string, number>): OnboardingIntegrityFinding[] {
  const findings: OnboardingIntegrityFinding[] = []
  const criticalEvents: OnboardingEventName[] = ['onboarding_started', 'onboarding_completed', 'briefing_viewed', 'auth_callback_completed']

  for (const eventName of criticalEvents) {
    const current = currentCounts[eventName] ?? 0
    const previous = previousCounts[eventName] ?? 0
    if (current === 0 && previous === 0) {
      findings.push({
        finding_id: `volume-zero-${eventName}`,
        generated_at: new Date().toISOString(),
        severity: 'critical',
        event_name: eventName,
        check_name: 'volume_sanity',
        anomaly_rate: 100,
        sample_size: 0,
        expected_contract_version: ONBOARDING_CONTRACT_VERSION,
        recommendation: `Critical onboarding event ${eventName} has been zero for two consecutive runs. Check the emitter and deployment health.`,
      })
    }
  }

  return findings
}

function findPropertyRateIssues(events: OnboardingEventRow[]): OnboardingIntegrityFinding[] {
  const findings: OnboardingIntegrityFinding[] = []
  const targets: OnboardingEventName[] = ['auth_callback_completed', 'briefing_viewed']

  for (const eventName of targets) {
    const rows = events.filter((event) => event.event_name === eventName)
    if (rows.length === 0) continue

    const missingIssues = rows.flatMap((row) => validateOnboardingEventProperties(row.event_name, row.properties))
    const missingCount = missingIssues.filter((issue) => issue.code === 'missing_property' || issue.code === 'type_mismatch').length
    const anomalyRate = (missingCount / rows.length) * 100

    if (anomalyRate > 20) {
      findings.push({
        finding_id: `properties-${eventName}`,
        generated_at: new Date().toISOString(),
        severity: 'critical',
        event_name: eventName,
        check_name: 'required_property_completeness',
        anomaly_rate: Number(anomalyRate.toFixed(2)),
        sample_size: rows.length,
        expected_contract_version: ONBOARDING_CONTRACT_VERSION,
        recommendation: `Fix the property contract for ${eventName} before relying on downstream analytics.`,
      })
    }
  }

  return findings
}

function findTypeIssues(events: OnboardingEventRow[]): OnboardingIntegrityFinding[] {
  return contractIssuesForEvents(events)
    .filter((issue) => issue.code === 'type_mismatch')
    .map((issue, index) => ({
      finding_id: `type-${issue.event_name}-${issue.property_name ?? index}`,
      generated_at: new Date().toISOString(),
      severity: issue.event_name === 'auth_callback_completed' || issue.event_name === 'briefing_viewed' ? 'critical' : 'warning',
      event_name: issue.event_name,
      check_name: 'property_type',
      anomaly_rate: 100,
      sample_size: 1,
      expected_contract_version: ONBOARDING_CONTRACT_VERSION,
      recommendation: issue.message,
      sample_payload_hint: issue.property_name ? `property=${issue.property_name}` : undefined,
    }))
}

export function analyzeOnboardingEventIntegrity(input: IntegrityInput): OnboardingIntegrityAnalysis {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const countsByEvent = eventCounts(input.events)
  const previousCountsByEvent = input.previousCountsByEvent ?? eventCounts(input.baselineEvents ?? [])
  const snapshot: OnboardingIntegritySnapshot = {
    counts_by_event: countsByEvent,
    previous_counts_by_event: previousCountsByEvent,
    generated_at: generatedAt,
  }

  const findings: OnboardingIntegrityFinding[] = []

  findings.push(...findTypeIssues(input.events))
  findings.push(...findPropertyRateIssues(input.events))
  findings.push(...findSequenceIssues(groupByUser(input.events), input.sessionWindowMinutes ?? 60))
  findings.push(...findRedirectIssues(input.events))
  findings.push(...findVolumeIssues(countsByEvent, previousCountsByEvent))

  return { snapshot, findings }
}
