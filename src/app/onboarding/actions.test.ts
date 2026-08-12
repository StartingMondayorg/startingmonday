import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  captureServerEvent: vi.fn(),
  createClient: vi.fn(),
  logEvent: vi.fn(),
  redirect: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect: state.redirect }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/schemas', () => ({ OnboardingFormSchema: { safeParse: () => ({ success: true }) } }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/onboarding-speed', () => ({
  computeElapsedSeconds: () => 0,
  isTransitionFirstCohort: () => false,
  normalizeOnboardingChannel: () => 'unknown',
}))
vi.mock('@/lib/email', () => ({ sendEmail: vi.fn() }))
vi.mock('@/lib/owner-email', () => ({ getNotifyEmails: () => [] }))
vi.mock('@/lib/role-taxonomy', () => ({
  resolveRoleProfile: () => ({
    searchPersonaLegacy: 'executive',
    roleTypeLegacy: 'executive',
    roleFamily: 'general_management',
    roleTitle: 'Executive',
    roleSeniority: 'executive',
    workflowVariant: 'executive',
  }),
}))

import { completeOnboarding, skipOnboarding } from './actions'

const errorMessage = 'We could not save your setup. Please try again, and contact support@startingmonday.app if it keeps happening.'

function mockProfileWriteFailure() {
  const upsert = vi.fn().mockResolvedValue({ error: { message: 'database unavailable', code: '503' } })
  const supabase = {
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1', email: 'user@example.com' } } }) },
    from: vi.fn(() => ({ upsert })),
  }
  state.createClient.mockResolvedValue(supabase)
  return { supabase, upsert }
}

describe('onboarding completion writes', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.logEvent.mockResolvedValue(undefined)
    state.redirect.mockImplementation((location: string) => {
      throw new Error(`redirect:${location}`)
    })
  })

  it('records and surfaces a profile completion write failure', async () => {
    const { upsert } = mockProfileWriteFailure()
    const formData = new FormData()
    formData.set('full_name', 'Test User')
    formData.set('search_persona', 'executive')
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    await expect(completeOnboarding(formData)).rejects.toThrow('redirect:/onboarding?error=')

    expect(upsert).toHaveBeenCalledOnce()
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'onboarding_completion_write_failed', {
      message: 'database unavailable',
      code: '503',
    })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'onboarding_completion_write_failed', {
      message: 'database unavailable',
      code: '503',
    })
    expect(state.redirect).toHaveBeenCalledWith(`/onboarding?error=${encodeURIComponent(errorMessage)}`)
    expect(errorSpy).toHaveBeenCalledOnce()
  })

  it('records and surfaces a skip write failure', async () => {
    mockProfileWriteFailure()

    await expect(skipOnboarding()).rejects.toThrow('redirect:/onboarding?error=')

    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'onboarding_completion_write_failed', {
      message: 'database unavailable',
      code: '503',
      path: 'skip',
    })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'onboarding_completion_write_failed', {
      message: 'database unavailable',
      code: '503',
      path: 'skip',
    })
    expect(state.redirect).toHaveBeenCalledWith(`/onboarding?error=${encodeURIComponent(errorMessage)}`)
  })
})
