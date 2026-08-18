import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: state.getUser },
  }),
}))

vi.mock('@/lib/events', () => ({
  logEvent: state.logEvent,
}))

import { POST } from './route'

describe('daily momentum event route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.getUser.mockResolvedValue({ data: { user: { id: 'user_1' } } })
  })

  it('rejects unauthenticated requests', async () => {
    state.getUser.mockResolvedValue({ data: { user: null } })

    const response = await POST(new Request('https://startingmonday.app/api/events/daily-momentum', {
      method: 'POST',
      body: JSON.stringify({ eventName: 'emi_daily_loop_loaded' }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(401)
  })

  it('logs allowed daily momentum events into canonical user_events', async () => {
    const response = await POST(new Request('https://startingmonday.app/api/events/daily-momentum', {
      method: 'POST',
      body: JSON.stringify({
        eventName: 'emi_action_completed',
        properties: { action_id: 'relationship-action', date_key: '2026-05-25', completed_count: 2 },
      }),
      headers: { 'Content-Type': 'application/json' },
    }))

    expect(response.status).toBe(200)
    expect(state.logEvent).toHaveBeenCalledWith('user_1', 'emi_action_completed', {
      action_id: 'relationship-action',
      date_key: '2026-05-25',
      completed_count: 2,
    })
  })
})