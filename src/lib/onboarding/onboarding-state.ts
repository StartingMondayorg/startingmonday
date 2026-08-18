import type { RoleFamily, RoleTitle } from '@/lib/role-taxonomy'

export const ONBOARDING_FINAL_STEP = 8

export type OnboardingDestination = '/dashboard' | '/onboarding'

export type OnboardingDraft = {
  fullName: string
  searchPersona: string
  roleFamily: RoleFamily | ''
  roleTitle: RoleTitle | ''
  roleTitles: RoleTitle[]
  employmentStatus: string
  searchTimeline: string
  searchDriver: string
  currentTitle: string
  currentCompany: string
  resumeText: string
  positioningSummary: string
  beyondResume: string
  targetTitles: string
  linkedinUrl: string
  companyNames: string[]
  briefingTime: string
  briefingFrequency: 'daily' | 'weekly'
  emailNudgesOptIn: boolean
  targetLocations: string[]
  targetSectors: string[]
  compPreference: string[]
  positioningStyle: string[]
  advancedSetup: boolean
}

export type OnboardingProfileSeed = {
  full_name?: string | null
  current_title?: string | null
  current_company?: string | null
  onboarding_completed_at?: string | null
  onboarding_current_step?: number | null
  onboarding_draft?: unknown
}

function stringValue(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

export function normalizeOnboardingDraft(profile: OnboardingProfileSeed | null): OnboardingDraft {
  const draft = profile?.onboarding_draft && typeof profile.onboarding_draft === 'object' && !Array.isArray(profile.onboarding_draft)
    ? profile.onboarding_draft as Record<string, unknown>
    : {}

  return {
    fullName: stringValue(draft.fullName, profile?.full_name ?? ''),
    searchPersona: stringValue(draft.searchPersona),
    roleFamily: stringValue(draft.roleFamily) as RoleFamily | '',
    roleTitle: stringValue(draft.roleTitle) as RoleTitle | '',
    roleTitles: stringArray(draft.roleTitles) as RoleTitle[],
    employmentStatus: stringValue(draft.employmentStatus),
    searchTimeline: stringValue(draft.searchTimeline),
    searchDriver: stringValue(draft.searchDriver),
    currentTitle: stringValue(draft.currentTitle, profile?.current_title ?? ''),
    currentCompany: stringValue(draft.currentCompany, profile?.current_company ?? ''),
    resumeText: stringValue(draft.resumeText),
    positioningSummary: stringValue(draft.positioningSummary),
    beyondResume: stringValue(draft.beyondResume),
    targetTitles: stringValue(draft.targetTitles),
    linkedinUrl: stringValue(draft.linkedinUrl),
    companyNames: stringArray(draft.companyNames),
    briefingTime: stringValue(draft.briefingTime, '07:00'),
    briefingFrequency: draft.briefingFrequency === 'weekly' ? 'weekly' : 'daily',
    emailNudgesOptIn: draft.emailNudgesOptIn === true,
    targetLocations: stringArray(draft.targetLocations),
    targetSectors: stringArray(draft.targetSectors),
    compPreference: stringArray(draft.compPreference),
    positioningStyle: stringArray(draft.positioningStyle),
    advancedSetup: draft.advancedSetup === true,
  }
}

export function resolveOnboardingDestination(input: {
  completedAt: string | null | undefined
  companyCount?: number | null
}): OnboardingDestination {
  return input.completedAt ? '/dashboard' : '/onboarding'
}

export function resolveOnboardingStartStep(input: {
  completedAt: string | null | undefined
  currentStep: number | null | undefined
}): number {
  if (input.completedAt) return ONBOARDING_FINAL_STEP
  if (!Number.isInteger(input.currentStep)) return 0
  return Math.min(ONBOARDING_FINAL_STEP, Math.max(0, input.currentStep ?? 0))
}