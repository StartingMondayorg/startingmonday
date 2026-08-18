import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_CONTRACT_VERSION,
  ONBOARDING_EVENT_CONTRACTS,
  ONBOARDING_EVENT_NAMES,
  validateOnboardingEventProperties,
} from '@/lib/onboarding/onboarding-agent-contracts'

describe('onboarding agent contracts', () => {
  it('exposes the expected event names and contract version', () => {
    expect(ONBOARDING_CONTRACT_VERSION).toContain('onboarding-contract-v1')
    expect(ONBOARDING_EVENT_NAMES).toEqual([
      'auth_callback_completed',
      'auth_callback_profile_lookup_failed',
      'briefing_viewed',
      'briefing_first_session_guided_viewed',
      'onboarding_started',
      'onboarding_step_completed',
      'onboarding_first_value_ready',
      'onboarding_completed',
    ])
    expect(Object.keys(ONBOARDING_EVENT_CONTRACTS)).toEqual(ONBOARDING_EVENT_NAMES)
  })

  it('accepts a valid auth callback completion payload', () => {
    expect(
      validateOnboardingEventProperties('auth_callback_completed', {
        redirect_path: '/onboarding',
        explicit_next: false,
        requested_next_path: null,
        first_login_needs_onboarding: true,
        auth_method: 'oauth_code',
        new_user_window: true,
      }),
    ).toEqual([])
  })

  it('flags missing and invalid properties deterministically', () => {
    const issues = validateOnboardingEventProperties('briefing_viewed', {
      signals: 3,
      matches: 'two',
      due_today: 1,
      total_companies: 1,
      first_session_guided_state: 'yes',
    })

    expect(issues.map((issue) => issue.code)).toEqual(['type_mismatch', 'type_mismatch'])
    expect(issues[0]?.property_name).toBe('matches')
    expect(issues[1]?.property_name).toBe('first_session_guided_state')
  })
})
