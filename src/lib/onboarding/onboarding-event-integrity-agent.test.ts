import { describe, expect, it } from 'vitest'
import { analyzeOnboardingEventIntegrity } from '@/lib/onboarding/onboarding-event-integrity-agent'
import type { OnboardingEventRow } from '@/lib/onboarding/onboarding-agent-contracts'

function event(overrides: Partial<OnboardingEventRow> & Pick<OnboardingEventRow, 'user_id' | 'event_name' | 'created_at'>): OnboardingEventRow {
  return {
    user_id: overrides.user_id,
    event_name: overrides.event_name,
    created_at: overrides.created_at,
    properties: overrides.properties ?? {},
  }
}

describe('onboarding event integrity agent', () => {
  it('flags required property and type issues for critical events', () => {
    const { findings } = analyzeOnboardingEventIntegrity({
      events: [
        event({ user_id: 'u1', event_name: 'auth_callback_completed', created_at: '2026-07-01T00:00:00.000Z', properties: { redirect_path: '/onboarding', explicit_next: 'false', requested_next_path: null, first_login_needs_onboarding: true, auth_method: 'oauth_code', new_user_window: true } }),
        event({ user_id: 'u2', event_name: 'briefing_viewed', created_at: '2026-07-01T00:00:00.000Z', properties: { signals: 1, matches: 0, due_today: 2, total_companies: 1, first_session_guided_state: true } }),
      ],
    })

    expect(findings.some((finding) => finding.event_name === 'auth_callback_completed' && finding.check_name === 'property_type')).toBe(true)
    expect(findings.some((finding) => finding.event_name === 'briefing_viewed' && finding.check_name === 'required_property_completeness')).toBe(false)
  })

  it('detects sequence and redirect anomalies', () => {
    const { findings } = analyzeOnboardingEventIntegrity({
      events: [
        event({ user_id: 'u1', event_name: 'onboarding_completed', created_at: '2026-07-01T00:00:00.000Z', properties: { search_path: 'leadership', search_persona: 'director', employment_status: 'employed_exploring', company_count: 1, onboarding_channel: 'executives', onboarding_low_energy: false, onboarding_elapsed_seconds: 240, onboarding_under_ten_minutes: true, transition_first: true, role_family: 'leadership', role_title: 'manager', role_seniority: 'senior', workflow_variant: 'standard', manual_fields_baseline: 12, manual_fields_required: 8, manual_fields_reduction_rate: 0.33 } }),
        event({ user_id: 'u2', event_name: 'briefing_first_session_guided_viewed', created_at: '2026-07-01T00:10:00.000Z', properties: { total_companies: 1, account_age_hours: 3, rollout_percentage: 50 } }),
        event({ user_id: 'u3', event_name: 'auth_callback_completed', created_at: '2026-07-01T00:00:00.000Z', properties: { redirect_path: '/onboarding', explicit_next: true, requested_next_path: '/dashboard', first_login_needs_onboarding: false, auth_method: 'oauth_code', new_user_window: true } }),
      ],
    })

    expect(findings.some((finding) => finding.check_name === 'sequence_integrity')).toBe(true)
    expect(findings.some((finding) => finding.check_name === 'redirect_integrity')).toBe(true)
  })

  it('raises a critical volume issue when a critical event is zero for consecutive runs', () => {
    const { findings } = analyzeOnboardingEventIntegrity({
      events: [],
      previousCountsByEvent: {
        onboarding_started: 0,
        onboarding_completed: 0,
        briefing_viewed: 0,
        auth_callback_completed: 0,
      },
    })

    expect(findings.filter((finding) => finding.severity === 'critical').length).toBeGreaterThan(0)
  })
})
