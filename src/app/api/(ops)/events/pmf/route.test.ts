import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))

import { POST } from './route'

describe('pmf events route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new Response(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/events/pmf', {
      method: 'POST',
      body: JSON.stringify({ eventName: 'pmf_activation_profile_completed', properties: {} }),
    }))

    expect(response.status).toBe(401)
  })

  it('returns validation errors for missing fields', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/events/pmf', {
      method: 'POST',
      body: JSON.stringify({ eventName: 'pmf_activation_first_prep_generated', properties: { source: 'ui' } }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toHaveProperty('error')
    expect(state.logEvent).not.toHaveBeenCalled()
  })

  it('logs a valid PMF event', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/events/pmf', {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'pmf_activation_first_prep_generated',
        properties: {
          company_id: 'company-1',
          mode: 'live',
          confidence_band: 'high',
          action_context: 'dashboard',
        },
      }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'pmf_activation_first_prep_generated', expect.objectContaining({
      company_id: 'company-1',
      mode: 'live',
      confidence_band: 'high',
      action_context: 'dashboard',
    }))
    expect(state.captureServerEvent).toHaveBeenCalledTimes(1)
  })
})
