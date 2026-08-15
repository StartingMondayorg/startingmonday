import { describe, expect, it } from 'vitest'
import { computeElapsedSeconds, isTransitionFirstCohort, normalizeOnboardingChannel } from './onboarding-speed'

describe('onboarding speed helpers', () => {
  it('normalizes channels, cohort state, and elapsed time', () => {
    expect(normalizeOnboardingChannel('unknown')).toBe('executives')
    expect(normalizeOnboardingChannel('coaches')).toBe('coaches')
    expect(isTransitionFirstCohort('between_roles', 'later')).toBe(true)
    expect(computeElapsedSeconds('2026-01-01T00:00:00.000Z', '2026-01-01T00:01:05.000Z')).toBe(65)
  })
})
