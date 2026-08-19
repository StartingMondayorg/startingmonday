import { describe, expect, it } from 'vitest'
import {
  normalizeOnboardingDraft,
  ONBOARDING_FINAL_STEP,
  resolveOnboardingDestination,
  resolveOnboardingStartStep,
} from '@/lib/onboarding/onboarding-state'

describe('explicit onboarding state', () => {
  it('routes a completed user with zero target companies to the dashboard', () => {
    expect(resolveOnboardingDestination({
      completedAt: '2026-08-12T00:31:29.913Z',
      companyCount: 0,
    })).toBe('/dashboard')
  })

  it('keeps an incomplete user in onboarding even when target companies exist', () => {
    expect(resolveOnboardingDestination({
      completedAt: null,
      companyCount: 3,
    })).toBe('/onboarding')
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

  it.each([
    { currentStep: null, expected: 0 },
    { currentStep: 2.5, expected: 0 },
    { currentStep: -4, expected: 0 },
    { currentStep: 99, expected: ONBOARDING_FINAL_STEP },
  ])('bounds an incomplete resume step of $currentStep to $expected', ({ currentStep, expected }) => {
    expect(resolveOnboardingStartStep({ completedAt: null, currentStep })).toBe(expected)
  })

  it('builds a safe default draft from profile fallbacks', () => {
    expect(normalizeOnboardingDraft({
      full_name: 'Pilot User',
      current_title: 'CIO',
      current_company: 'Example Co',
      onboarding_draft: ['invalid'],
    })).toEqual({
      fullName: 'Pilot User',
      searchPersona: '',
      searchPosture: 'not_looking',
      roleFamily: '',
      roleTitle: '',
      roleTitles: [],
      employmentStatus: '',
      searchTimeline: '',
      searchDriver: '',
      currentTitle: 'CIO',
      currentCompany: 'Example Co',
      resumeText: '',
      positioningSummary: '',
      beyondResume: '',
      targetTitles: '',
      linkedinUrl: '',
      companyNames: [],
      briefingTime: '07:00',
      briefingFrequency: 'daily',
      emailNudgesOptIn: false,
      targetLocations: [],
      targetSectors: [],
      compPreference: [],
      positioningStyle: [],
      advancedSetup: false,
    })
  })

  it('restores a persisted onboarding draft and filters malformed array entries', () => {
    expect(normalizeOnboardingDraft({
      full_name: 'Old Name',
      current_title: 'Old Title',
      current_company: 'Old Company',
      onboarding_draft: {
        fullName: 'Restored User',
        searchPersona: 'director',
        roleFamily: 'leadership',
        roleTitle: 'senior_director',
        roleTitles: ['senior_director', 7],
        employmentStatus: 'between_roles',
        searchTimeline: 'immediately',
        searchDriver: 'growth',
        currentTitle: 'VP Technology',
        currentCompany: 'Restored Co',
        resumeText: 'Resume text',
        positioningSummary: 'Positioning',
        beyondResume: 'Additional context',
        targetTitles: 'CIO, CTO',
        linkedinUrl: 'https://www.linkedin.com/in/pilot',
        companyNames: ['Alpha', null, 'Beta'],
        briefingTime: '08:30',
        briefingFrequency: 'weekly',
        emailNudgesOptIn: true,
        targetLocations: ['Chicago', false],
        targetSectors: ['Healthcare'],
        compPreference: ['equity'],
        positioningStyle: ['operator'],
        advancedSetup: true,
      },
    })).toEqual({
      fullName: 'Restored User',
      searchPersona: 'director',
      searchPosture: 'active',
      roleFamily: 'leadership',
      roleTitle: 'senior_director',
      roleTitles: ['senior_director'],
      employmentStatus: 'between_roles',
      searchTimeline: 'immediately',
      searchDriver: 'growth',
      currentTitle: 'VP Technology',
      currentCompany: 'Restored Co',
      resumeText: 'Resume text',
      positioningSummary: 'Positioning',
      beyondResume: 'Additional context',
      targetTitles: 'CIO, CTO',
      linkedinUrl: 'https://www.linkedin.com/in/pilot',
      companyNames: ['Alpha', 'Beta'],
      briefingTime: '08:30',
      briefingFrequency: 'weekly',
      emailNudgesOptIn: true,
      targetLocations: ['Chicago'],
      targetSectors: ['Healthcare'],
      compPreference: ['equity'],
      positioningStyle: ['operator'],
      advancedSetup: true,
    })
  })
})