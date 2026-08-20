import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  update: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/events', () => ({
  logEvent: state.logEvent,
}))

import { POST } from './route'

describe('preferences briefing route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    state.createClient.mockResolvedValue({
      from: () => ({
        update: state.update,
      }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/preferences/briefing', {
      method: 'POST',
      body: JSON.stringify({ briefingFrequency: 'weekly' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects invalid daily briefing times', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/preferences/briefing', {
      method: 'POST',
      body: JSON.stringify({ briefingFrequency: 'daily', briefingTime: '9am' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid briefing time for daily mode' })
  })

  it('updates the briefing settings and logs the change', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/preferences/briefing', {
      method: 'POST',
      body: JSON.stringify({ briefingFrequency: 'weekly' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.update).toHaveBeenCalledWith({ briefing_frequency: 'weekly' })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'briefing_configured', {
      briefing_frequency: 'weekly',
      briefing_time: null,
    })
  })
})
