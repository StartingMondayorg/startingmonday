import { describe, expect, it } from 'vitest'
import { buildOnboardingQaScorecard } from '@/lib/onboarding/onboarding-agent-scorecard'
import type { OnboardingEventRow } from '@/lib/onboarding/onboarding-agent-contracts'

function event(overrides: Partial<OnboardingEventRow> & Pick<OnboardingEventRow, 'user_id' | 'event_name' | 'created_at'>): OnboardingEventRow {
  return {
    user_id: overrides.user_id,
    event_name: overrides.event_name,
    created_at: overrides.created_at,
    properties: overrides.properties ?? {},
  }
}

describe('onboarding agent scorecard wiring', () => {
  it('builds a combined live scorecard from current and baseline windows', () => {
    const scorecard = buildOnboardingQaScorecard({
      currentEvents: [
        event({ user_id: 'u1', event_name: 'onboarding_started', created_at: '2026-07-01T00:00:00.000Z', properties: { started_at: '2026-07-01T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'u1', event_name: 'onboarding_completed', created_at: '2026-07-01T00:05:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 300, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'manager', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
        event({ user_id: 'u1', event_name: 'briefing_viewed', created_at: '2026-07-02T00:00:00.000Z', properties: { signals: 2, matches: 1, due_today: 0, total_companies: 1, first_session_guided_state: true } }),
        event({ user_id: 'u1', event_name: 'briefing_first_session_guided_viewed', created_at: '2026-07-02T00:00:01.000Z', properties: { total_companies: 1, account_age_hours: 4, rollout_percentage: 50 } }),
      ],
      baselineEvents: [
        event({ user_id: 'b1', event_name: 'onboarding_started', created_at: '2026-06-24T00:00:00.000Z', properties: { started_at: '2026-06-24T00:00:00.000Z', channel: 'executives', mode: 'standard', confidence_band: null, action_context: 'onboarding_started' } }),
        event({ user_id: 'b1', event_name: 'onboarding_completed', created_at: '2026-06-24T00:05:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 300, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'manager', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
      ],
      authPathEvents: [
        event({ user_id: 'u1', event_name: 'auth_path_routed', created_at: '2026-07-02T00:00:02.000Z', properties: { route: 'auth_callback', path_category: 'callback', auth_method: 'oauth_code' } }),
      ],
      window: {
        generated_at: '2026-07-06T12:00:00.000Z',
        week_start: '2026-07-06',
        week_end: '2026-07-13T00:00:00.000Z',
        baseline_start: '2026-06-29T00:00:00.000Z',
        baseline_end: '2026-07-06T00:00:00.000Z',
      },
    })

    expect(scorecard.summary.started_users).toBe(1)
    expect(scorecard.auth_paths).toEqual({
      total: 1,
      by_path_category: { callback: 1 },
    })
    expect(scorecard.journey_health.snapshot.onboarding_started_users).toBe(1)
    expect(scorecard.integrity.snapshot.counts_by_event.onboarding_completed).toBe(1)
    expect(scorecard.overall.readiness).toBe('degraded')
    expect(scorecard.notes.length).toBeGreaterThan(0)
  })
})
