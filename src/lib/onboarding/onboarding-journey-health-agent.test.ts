import { describe, expect, it } from 'vitest'
import { analyzeOnboardingJourneyHealth } from '@/lib/onboarding/onboarding-journey-health-agent'
import type { OnboardingEventRow } from '@/lib/onboarding/onboarding-agent-contracts'

function event(overrides: Partial<OnboardingEventRow> & Pick<OnboardingEventRow, 'user_id' | 'event_name' | 'created_at'>): OnboardingEventRow {
  return {
    user_id: overrides.user_id,
    event_name: overrides.event_name,
    created_at: overrides.created_at,
    properties: overrides.properties ?? {},
  }
}

describe('onboarding journey health agent', () => {
  it('raises a critical finding for a large funnel drop versus baseline', () => {
    const { findings } = analyzeOnboardingJourneyHealth({
      currentEvents: [
        event({ user_id: 'u1', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      ],
      baselineEvents: [
        event({ user_id: 'b1', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'b1', event_name: 'onboarding_completed', created_at: '2026-06-24T00:05:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 300, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'manager', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
        event({ user_id: 'b2', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'b2', event_name: 'onboarding_completed', created_at: '2026-06-24T00:05:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 300, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'manager', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
      ],
      currentWindowLabel: '2026-07-01',
      baselineWindowLabel: '2026-06-24',
    })

    expect(findings.some((finding) => finding.severity === 'critical' && finding.metric_name === 'onboarding_started_to_onboarding_completed')).toBe(true)
  })

  it('warns when p50 TTFV stays above the threshold for two consecutive runs', () => {
    const { findings } = analyzeOnboardingJourneyHealth({
      currentEvents: [
        event({ user_id: 'u1', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'u1', event_name: 'onboarding_first_value_ready', created_at: '2026-07-01T00:06:00.000Z', properties: { elapsed_seconds: 360, under_ten_minutes: true, company_count: 1, wedge_surface: 'shortlist', transition_first: true, low_energy_mode: false, mode: 'standard', confidence_band: null, action_context: 'onboarding_first_value_ready' } }),
      ],
      previousDailySnapshots: [{ ttfv_p50_minutes: 6 }],
    })

    expect(findings.some((finding) => finding.severity === 'warning' && finding.metric_name === 'ttfv_p50_minutes')).toBe(true)
  })

  it('warns on material step abandonment increases versus baseline', () => {
    const { findings } = analyzeOnboardingJourneyHealth({
      currentEvents: [
        event({ user_id: 'u1', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'u1', event_name: 'onboarding_step_completed', created_at: '2026-07-01T00:01:00.000Z', properties: { step: 1, elapsed_seconds: 60, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
        event({ user_id: 'u2', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      ],
      baselineEvents: [
        event({ user_id: 'b1', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'b1', event_name: 'onboarding_step_completed', created_at: '2026-06-24T00:01:00.000Z', properties: { step: 1, elapsed_seconds: 60, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
        event({ user_id: 'b2', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'b2', event_name: 'onboarding_step_completed', created_at: '2026-06-24T00:01:00.000Z', properties: { step: 1, elapsed_seconds: 60, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
      ],
    })

    expect(findings.some((finding) => finding.severity === 'warning' && finding.metric_name === 'step_1_abandonment_rate')).toBe(true)
  })
})
