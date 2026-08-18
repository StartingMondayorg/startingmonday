import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  insert: vi.fn(),
  captureServerEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/posthog-server', () => ({
  captureServerEvent: state.captureServerEvent,
}))

import { POST } from './route'

describe('guide chat feedback route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.insert.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue({ from: () => ({ insert: state.insert }) })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({ queryId: '123', rating: 'helpful' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects invalid feedback payloads', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({ queryId: '123', rating: 'maybe' }),
    }))

    expect(response.status).toBe(400)
  })

  it('stores valid feedback and emits telemetry', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat/feedback', {
      method: 'POST',
      body: JSON.stringify({
        queryId: '123e4567-e89b-12d3-a456-426614174000',
        rating: 'helpful',
        note: 'Useful answer',
      }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.insert).toHaveBeenCalledWith({
      user_id: 'user-1',
      guide_chat_query_id: '123e4567-e89b-12d3-a456-426614174000',
      rating: 'helpful',
      note: 'Useful answer',
    })
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'guide_chat_feedback_submitted', {
      rating: 'helpful',
      has_note: true,
    })
  })
})
