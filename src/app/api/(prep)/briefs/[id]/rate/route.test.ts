import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  update: vi.fn(),
  captureServerEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))

import { PATCH } from './route'

describe('brief rating route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.createClient.mockResolvedValue({
      from: () => ({
        update: () => ({
          eq: () => ({
            eq: () => ({
              select: () => ({
                single: vi.fn().mockResolvedValue({ data: { type: 'prep' }, error: null }),
              }),
            }),
          }),
        }),
      }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await PATCH(new NextRequest('https://startingmonday.app/api/briefs/brief-1/rate', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 1 }),
    }), { params: Promise.resolve({ id: 'brief-1' }) })

    expect(response.status).toBe(401)
  })

  it('rejects invalid ratings', async () => {
    const response = await PATCH(new NextRequest('https://startingmonday.app/api/briefs/brief-1/rate', {
      method: 'PATCH',
      body: JSON.stringify({ rating: 0 }),
    }), { params: Promise.resolve({ id: 'brief-1' }) })

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid rating' })
  })

  it('records a negative rating and returns ok', async () => {
    const response = await PATCH(new NextRequest('https://startingmonday.app/api/briefs/brief-1/rate', {
      method: 'PATCH',
      body: JSON.stringify({ rating: -1, feedback: 'Needs more specificity' }),
    }), { params: Promise.resolve({ id: 'brief-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'brief_rated_negative', expect.objectContaining({ brief_id: 'brief-1', brief_type: 'prep', has_feedback: true }))
  })
})
