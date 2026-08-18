import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  user: { id: 'user_1' } as { id: string } | null,
  logEvent: vi.fn(),
  enqueueOnboardingVideoRunForMilestoneEvent: vi.fn(),
  createAdminClient: vi.fn(() => ({})),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({ data: { user: state.user } })),
    },
  })),
}))

vi.mock('@/lib/events', () => ({
  logEvent: state.logEvent,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

vi.mock('@/lib/onboarding-video-queue', () => ({
  enqueueOnboardingVideoRunForMilestoneEvent: state.enqueueOnboardingVideoRunForMilestoneEvent,
}))

import { POST } from './route'

describe('onboarding events route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.user = { id: 'user_1' }
    state.createAdminClient.mockReturnValue({})
    state.logEvent.mockResolvedValue(undefined)
    state.enqueueOnboardingVideoRunForMilestoneEvent.mockResolvedValue(undefined)
  })

  it('fans out canonical start events for legacy onboarding_started', async () => {
    const request = new Request('https://startingmonday.app/api/onboarding/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'onboarding_started',
        properties: { source: 'test' },
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true })

    expect(state.logEvent).toHaveBeenCalledWith('user_1', 'onboarding_started', { source: 'test' })
    expect(state.logEvent).toHaveBeenCalledWith('user_1', 'emi_assessment_started', { source: 'test' })
    expect(state.logEvent).toHaveBeenCalledWith('user_1', 'emi_onboarding_started', { source: 'test' })
  })

  it('fans out canonical completion event for onboarding_first_value_ready', async () => {
    const request = new Request('https://startingmonday.app/api/onboarding/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventName: 'onboarding_first_value_ready',
        properties: { elapsed_seconds: 500 },
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({ ok: true })

    expect(state.logEvent).toHaveBeenCalledWith('user_1', 'onboarding_first_value_ready', { elapsed_seconds: 500 })
    expect(state.logEvent).toHaveBeenCalledWith('user_1', 'emi_assessment_completed', { elapsed_seconds: 500 })
  })
})
