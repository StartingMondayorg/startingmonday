import { describe, expect, it } from 'vitest'
import { calculateOnboardingJourneySnapshot } from '@/lib/onboarding/onboarding-agent-metrics'
import type { OnboardingEventRow } from '@/lib/onboarding/onboarding-agent-contracts'

function event(overrides: Partial<OnboardingEventRow> & Pick<OnboardingEventRow, 'user_id' | 'event_name' | 'created_at'>): OnboardingEventRow {
  return {
    user_id: overrides.user_id,
    event_name: overrides.event_name,
    created_at: overrides.created_at,
    properties: overrides.properties ?? {},
  }
}

describe('onboarding agent metrics', () => {
  it('computes funnel and first-value metrics from user events', () => {
    const snapshot = calculateOnboardingJourneySnapshot([
      event({ user_id: 'u1', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'u1', event_name: 'onboarding_first_value_ready', created_at: '2026-07-01T00:08:00.000Z', properties: { elapsed_seconds: 480, under_ten_minutes: true, company_count: 1, wedge_surface: 'shortlist', transition_first: true, low_energy_mode: false, mode: 'standard', confidence_band: null, action_context: 'onboarding_first_value_ready' } }),
      event({ user_id: 'u1', event_name: 'onboarding_completed', created_at: '2026-07-01T00:10:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 600, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'executive', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
      event({ user_id: 'u1', event_name: 'briefing_viewed', created_at: '2026-07-02T00:00:00.000Z', properties: { signals: 2, matches: 1, due_today: 0, total_companies: 1, first_session_guided_state: true } }),
      event({ user_id: 'u1', event_name: 'briefing_first_session_guided_viewed', created_at: '2026-07-02T00:00:01.000Z', properties: { total_companies: 1, account_age_hours: 4, rollout_percentage: 50 } }),
      event({ user_id: 'u2', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'u2', event_name: 'onboarding_step_completed', created_at: '2026-07-01T00:02:00.000Z', properties: { step: 1, elapsed_seconds: 120, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
      event({ user_id: 'u2', event_name: 'onboarding_completed', created_at: '2026-07-08T00:00:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 604800, onboarding_under_ten_minutes: false, transition_first: true, role_family: 'leadership', role_title: 'manager', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 14, manual_fields_required: 10, manual_fields_reduction_rate: 0.29 } }),
    ], [
      event({ user_id: 'b1', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'b1', event_name: 'onboarding_completed', created_at: '2026-06-24T00:06:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 360, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'executive', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
      event({ user_id: 'b2', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'b2', event_name: 'onboarding_completed', created_at: '2026-06-24T00:04:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 240, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'director', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
    ])

    expect(snapshot.total_users).toBe(2)
    expect(snapshot.onboarding_started_users).toBe(2)
    expect(snapshot.onboarding_completed_users).toBe(2)
    expect(snapshot.start_to_complete_conversion).toBe(1)
    expect(snapshot.onboarding_first_value_ready_users).toBe(1)
    expect(snapshot.ttfv_p50_minutes).toBe(8)
    expect(snapshot.under_ten_minutes_share).toBe(1)
    expect(snapshot.guided_share_among_briefings).toBe(1)
    expect(snapshot.day7_return_rate).toBe(0.5)
  })

  it('detects step coverage compared with a baseline', () => {
    const snapshot = calculateOnboardingJourneySnapshot([
      event({ user_id: 'u1', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'u1', event_name: 'onboarding_step_completed', created_at: '2026-07-01T00:01:00.000Z', properties: { step: 1, elapsed_seconds: 60, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
      event({ user_id: 'u2', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
    ], [
      event({ user_id: 'b1', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'b1', event_name: 'onboarding_step_completed', created_at: '2026-06-24T00:01:00.000Z', properties: { step: 1, elapsed_seconds: 60, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
      event({ user_id: 'b2', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
      event({ user_id: 'b2', event_name: 'onboarding_step_completed', created_at: '2026-06-24T00:01:00.000Z', properties: { step: 1, elapsed_seconds: 60, low_energy_mode: false, channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_step_completed' } }),
    ])

    expect(snapshot.largest_step_abandonment_change).toEqual({ step: 1, delta_pct: 50 })
  })
})
