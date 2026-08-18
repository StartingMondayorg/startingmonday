import {
  type OnboardingEventRow,
  ONBOARDING_CONTRACT_VERSION,
} from '@/lib/onboarding/onboarding-agent-contracts'
import {
  calculateOnboardingJourneySnapshot,
  compareRatioDropPct,
  compareRatioLiftPct,
  type OnboardingJourneySnapshot,
} from '@/lib/onboarding/onboarding-agent-metrics'

export type OnboardingJourneyHealthFinding = {
  finding_id: string
  generated_at: string
  severity: 'critical' | 'warning' | 'info'
  metric_name: string
  current_value: number | string | null
  baseline_value: number | string | null
  delta_pct: number | null
  affected_window: string
  recommended_owner: string
  recommendation: string
}

export type OnboardingJourneyHealthAnalysis = {
  snapshot: OnboardingJourneySnapshot
  findings: OnboardingJourneyHealthFinding[]
}

export type OnboardingJourneyHealthInput = {
  currentEvents: OnboardingEventRow[]
  baselineEvents?: OnboardingEventRow[]
  previousDailySnapshots?: Array<Pick<OnboardingJourneySnapshot, 'ttfv_p50_minutes'>>
  generatedAt?: string
  currentWindowLabel?: string
  baselineWindowLabel?: string
}

export const ONBOARDING_JOURNEY_HEALTH_THRESHOLDS = {
  startToCompleteDropPct: 20,
  ttfvP50WarningMinutes: 5,
  stepAbandonmentWorsenPct: 15,
} as const

function toFindingId(prefix: string): string {
  return `${prefix}-${Date.now()}`
}

function valueOrNull(value: number | string | null | undefined): number | string | null {
  return value ?? null
}

export function analyzeOnboardingJourneyHealth(input: OnboardingJourneyHealthInput): OnboardingJourneyHealthAnalysis {
  const generatedAt = input.generatedAt ?? new Date().toISOString()
  const currentWindowLabel = input.currentWindowLabel ?? 'current window'
  const baselineWindowLabel = input.baselineWindowLabel ?? 'baseline window'
  const snapshot = calculateOnboardingJourneySnapshot(input.currentEvents, input.baselineEvents ?? [], generatedAt)
  const baselineSnapshot = calculateOnboardingJourneySnapshot(input.baselineEvents ?? [], [], generatedAt)

  const findings: OnboardingJourneyHealthFinding[] = []

  if (snapshot.total_users === 0 && (input.baselineEvents ?? []).length === 0) {
    findings.push({
      finding_id: toFindingId('no-data'),
      generated_at: generatedAt,
      severity: 'info',
      metric_name: 'no_data',
      current_value: 0,
      baseline_value: 0,
      delta_pct: null,
      affected_window: currentWindowLabel,
      recommended_owner: 'Engineering',
      recommendation: 'No onboarding events were available for this window.',
    })
    return { snapshot, findings }
  }

  const startToCompleteDropPct = compareRatioDropPct(snapshot.start_to_complete_conversion, baselineSnapshot.start_to_complete_conversion)
  if (startToCompleteDropPct !== null && startToCompleteDropPct >= ONBOARDING_JOURNEY_HEALTH_THRESHOLDS.startToCompleteDropPct) {
    findings.push({
      finding_id: toFindingId('funnel-start-complete-drop'),
      generated_at: generatedAt,
      severity: 'critical',
      metric_name: 'onboarding_started_to_onboarding_completed',
      current_value: valueOrNull(snapshot.start_to_complete_conversion),
      baseline_value: valueOrNull(baselineSnapshot.start_to_complete_conversion),
      delta_pct: startToCompleteDropPct,
      affected_window: `${currentWindowLabel} vs ${baselineWindowLabel}`,
      recommended_owner: 'Product',
      recommendation: 'Investigate the start-to-complete funnel drop before expanding rollout.',
    })
  }

  const ttfvP50Minutes = snapshot.ttfv_p50_minutes
  const previousDailySnapshot = input.previousDailySnapshots?.[0]
  if (
    ttfvP50Minutes !== null
    && ttfvP50Minutes > ONBOARDING_JOURNEY_HEALTH_THRESHOLDS.ttfvP50WarningMinutes
    && previousDailySnapshot?.ttfv_p50_minutes !== null
    && previousDailySnapshot?.ttfv_p50_minutes !== undefined
    && previousDailySnapshot.ttfv_p50_minutes > ONBOARDING_JOURNEY_HEALTH_THRESHOLDS.ttfvP50WarningMinutes
  ) {
    findings.push({
      finding_id: toFindingId('ttfv-p50-warning'),
      generated_at: generatedAt,
      severity: 'warning',
      metric_name: 'ttfv_p50_minutes',
      current_value: ttfvP50Minutes,
      baseline_value: previousDailySnapshot.ttfv_p50_minutes,
      delta_pct: compareRatioLiftPct(ttfvP50Minutes, previousDailySnapshot.ttfv_p50_minutes),
      affected_window: currentWindowLabel,
      recommended_owner: 'Engineering',
      recommendation: 'TTFV p50 has been above five minutes for two consecutive runs.',
    })
  }

  const largestStepDelta = snapshot.largest_step_abandonment_change
  if (largestStepDelta && largestStepDelta.delta_pct >= ONBOARDING_JOURNEY_HEALTH_THRESHOLDS.stepAbandonmentWorsenPct) {
    findings.push({
      finding_id: toFindingId('step-dropoff-warning'),
      generated_at: generatedAt,
      severity: 'warning',
      metric_name: `step_${largestStepDelta.step}_abandonment_rate`,
      current_value: snapshot.step_coverage.find((entry) => entry.step === largestStepDelta.step)?.abandonment_rate ?? null,
      baseline_value: baselineSnapshot.step_coverage.find((entry) => entry.step === largestStepDelta.step)?.abandonment_rate ?? null,
      delta_pct: largestStepDelta.delta_pct,
      affected_window: `${currentWindowLabel} vs ${baselineWindowLabel}`,
      recommended_owner: 'Product',
      recommendation: `Step ${largestStepDelta.step} abandonment worsened materially versus the trailing baseline.`,
    })
  }

  return { snapshot, findings }
}

export { ONBOARDING_CONTRACT_VERSION }
