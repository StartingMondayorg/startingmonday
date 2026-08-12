import { describe, expect, it } from 'vitest'
import {
  ONBOARDING_FINAL_STEP,
  resolveOnboardingDestination,
  resolveOnboardingStartStep,
} from '@/lib/onboarding-state'

describe('explicit onboarding state', () => {
  it('routes a completed user with zero target companies to the dashboard', () => {
    expect(resolveOnboardingDestination({
      completedAt: '2026-08-12T00:31:29.913Z',
      companyCount: 0,
    })).toBe('/dashboard')
  })

  it('resumes an incomplete user at the stored step', () => {
    expect(resolveOnboardingStartStep({
      completedAt: null,
      currentStep: 6,
    })).toBe(6)
  })

  it('keeps completed users out of every onboarding step', () => {
    expect(resolveOnboardingStartStep({
      completedAt: '2026-08-12T00:31:29.913Z',
      currentStep: 2,
    })).toBe(ONBOARDING_FINAL_STEP)
  })
})