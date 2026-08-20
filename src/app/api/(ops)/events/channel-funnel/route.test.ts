import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: state.getUser } }),
}))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))

import { POST } from './route'

function request(body: unknown) {
  return new NextRequest('http://localhost/api/events/channel-funnel', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('channel funnel dashboard telemetry', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('records authenticated dashboard view events', async () => {
    state.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })

    const response = await POST(request({
      event: 'dashboard_viewed',
      properties: { layout: 'three_zone', is_first_run: true },
    }))

    expect(response.status).toBe(200)
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'dashboard_viewed', {
      layout: 'three_zone',
      is_first_run: true,
    })
  })

  it('accepts anonymous dashboard actions without persisting them', async () => {
    state.getUser.mockResolvedValue({ data: { user: null } })

    const response = await POST(request({ event: 'dashboard_action_clicked', properties: {} }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true, anonymous: true })
    expect(state.logEvent).not.toHaveBeenCalled()
  })

  it('rejects unsupported event names', async () => {
    const response = await POST(request({ event: 'dashboard_score_exposed' }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({ ok: false, error: 'Unsupported event' })
  })
})
