import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { OnboardingDraft } from '@/lib/onboarding-state'

const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  profileMaybeSingle: vi.fn(),
  profileUpsert: vi.fn(),
  profileUpdate: vi.fn(),
  completionEq: vi.fn(),
  completionSelect: vi.fn(),
  searchStartedIs: vi.fn(),
  userUpdateEq: vi.fn(),
  companyUpsert: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  redirect: state.redirect,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: state.getUser },
    from: (table: string) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({
            eq: () => ({ maybeSingle: state.profileMaybeSingle }),
          }),
          upsert: state.profileUpsert,
          update: (payload: Record<string, unknown>) => {
            state.profileUpdate(payload)
            if ('onboarding_completed_at' in payload) {
              return {
                eq: (...args: unknown[]) => {
                  state.completionEq(...args)
                  return { select: state.completionSelect }
                },
              }
            }
            return {
              eq: () => ({ is: state.searchStartedIs }),
            }
          },
        }
      }
      if (table === 'companies') return { upsert: state.companyUpsert }
      if (table === 'users') {
        return { update: () => ({ eq: state.userUpdateEq }) }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }),
}))

vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/owner-email', () => ({ getNotifyEmails: () => [] }))

import { completeOnboarding, saveOnboardingProgress, skipOnboarding } from './actions'

const skipErrorMessage = 'We could not save your setup. Please try again, and contact support@startingmonday.app if it keeps happening.'

function draft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    fullName: 'Pilot User',
    searchPersona: 'director',
    roleFamily: 'leadership',
    roleTitle: 'director',
    roleTitles: ['director'],
    employmentStatus: '',
    searchTimeline: '',
    searchDriver: '',
    currentTitle: '',
    currentCompany: '',
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
    ...overrides,
  }
}

function validFormData() {
  const formData = new FormData()
  formData.set('full_name', 'Pilot User')
  formData.set('search_persona', 'director')
  formData.set('company_names', '[]')
  return formData
}

describe('onboarding persistence actions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.getUser.mockResolvedValue({ data: { user: { id: 'pilot-user', email: 'pilot@example.com' } } })
    state.profileMaybeSingle.mockResolvedValue({
      data: { onboarding_completed_at: null, onboarding_current_step: 4 },
      error: null,
    })
    state.profileUpsert.mockResolvedValue({ error: null })
    state.completionSelect.mockResolvedValue({ data: [{ user_id: 'pilot-user' }], error: null })
    state.searchStartedIs.mockResolvedValue({ error: null })
    state.userUpdateEq.mockResolvedValue({ error: null })
    state.companyUpsert.mockResolvedValue({ error: null })
    state.logEvent.mockResolvedValue(undefined)
    state.redirect.mockImplementation((path: string) => {
      throw new Error(`NEXT_REDIRECT:${path}`)
    })
  })

  it('never regresses the persisted resume step', async () => {
    await saveOnboardingProgress(2, draft())

    expect(state.profileUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ onboarding_current_step: 4 }),
      { onConflict: 'user_id' },
    )
  })

  it('completes a planted user with zero target companies and redirects to the dashboard', async () => {
    await expect(completeOnboarding(validFormData())).rejects.toThrow('NEXT_REDIRECT:/dashboard/start')

    expect(state.profileUpdate).toHaveBeenCalledWith(expect.objectContaining({
      onboarding_completed_at: expect.any(String),
      onboarding_current_step: 8,
    }))
    expect(state.companyUpsert).not.toHaveBeenCalled()
    expect(state.logEvent).toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completed',
      expect.objectContaining({ company_count: 0 }),
    )
  })

  it('does not emit completion telemetry or leave onboarding when the marker write fails', async () => {
    state.completionSelect.mockResolvedValueOnce({ data: null, error: { message: 'marker unavailable', code: 'PGRST500' } })

    await expect(completeOnboarding(validFormData())).rejects.toThrow('NEXT_REDIRECT:/onboarding?error=We%20could%20not%20save%20your%20setup.')

    expect(state.logEvent).not.toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completed',
      expect.anything(),
    )
    expect(state.captureServerEvent).toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completion_write_failed',
      { message: 'marker unavailable', code: 'PGRST500' },
    )
  })

  it('treats a completion update that matches no row as a failure', async () => {
    state.completionSelect.mockResolvedValueOnce({ data: [], error: null })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(completeOnboarding(validFormData())).rejects.toThrow('NEXT_REDIRECT:/onboarding?error=We%20could%20not%20save%20your%20setup.')

    expect(state.logEvent).not.toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completed',
      expect.anything(),
    )
    expect(state.captureServerEvent).toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completion_write_failed',
      { message: 'completion update matched no user_profiles row', code: 'no_row_updated' },
    )
    errorSpy.mockRestore()
  })

  it('records a failed profile projection but completes independently', async () => {
    state.profileUpsert.mockResolvedValueOnce({
      error: { message: 'profile unavailable', code: 'PGRST500' },
    })
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(completeOnboarding(validFormData())).rejects.toThrow('NEXT_REDIRECT:/dashboard/start')

    expect(state.completionEq).toHaveBeenCalledWith('user_id', 'pilot-user')
    expect(state.captureServerEvent).toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completion_write_failed',
      { message: 'profile unavailable', code: 'PGRST500', phase: 'profile_projection' },
    )
    expect(state.logEvent).toHaveBeenCalledWith(
      'pilot-user',
      'onboarding_completed',
      expect.objectContaining({ company_count: 0 }),
    )
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('records and surfaces a skip marker failure', async () => {
    state.profileUpsert.mockResolvedValueOnce({
      error: { message: 'database unavailable', code: '503' },
    })

    await expect(skipOnboarding()).rejects.toThrow('NEXT_REDIRECT:/onboarding?error=')

    expect(state.captureServerEvent).toHaveBeenCalledWith('pilot-user', 'onboarding_completion_write_failed', {
      message: 'database unavailable',
      code: '503',
      path: 'skip',
    })
    expect(state.logEvent).toHaveBeenCalledWith('pilot-user', 'onboarding_completion_write_failed', {
      message: 'database unavailable',
      code: '503',
      path: 'skip',
    })
    expect(state.redirect).toHaveBeenCalledWith(`/onboarding?error=${encodeURIComponent(skipErrorMessage)}`)
  })
})
