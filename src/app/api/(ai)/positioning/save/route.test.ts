import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  update: vi.fn(),
  captureServerEvent: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))

import { POST } from './route'

describe('positioning save route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.update.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    })
    state.createClient.mockResolvedValue({
      from: () => ({ update: state.update }),
    })
    state.captureServerEvent.mockReturnValue(undefined)
    state.logEvent.mockResolvedValue(undefined)
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/positioning/save', {
      method: 'POST',
      body: JSON.stringify({ positioning: 'Leader' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects empty positioning text', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/positioning/save', {
      method: 'POST',
      body: JSON.stringify({ positioning: '   ' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Positioning text required.' })
  })

  it('persists the positioning summary and records telemetry', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/positioning/save', {
      method: 'POST',
      body: JSON.stringify({ positioning: 'Senior executive leader' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.update).toHaveBeenCalledWith({ positioning_summary: 'Senior executive leader' })
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'positioning_saved', { length: 'Senior executive leader'.length })
  })
})
