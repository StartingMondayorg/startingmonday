import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  logsLimit: vi.fn(),
  logsOrder: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

import { GET } from './route'

describe('client coach access activity route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'client-1', response: new NextResponse() })
    state.logsLimit.mockResolvedValue({ data: [{ id: 'log-1', table_name: 'companies', action: 'update', created_at: '2026-01-01T00:00:00.000Z' }], error: null })
    state.logsOrder.mockReturnValue({ limit: state.logsLimit })
    state.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            eq: () => ({
              order: () => ({
                limit: state.logsLimit,
              }),
            }),
          }),
        }),
      }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1/activity'), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(401)
  })

  it('returns coach activity rows', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1/activity'), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      data: [{ id: 'log-1', table_name: 'companies', action: 'update', created_at: '2026-01-01T00:00:00.000Z' }],
    })
  })

  it('returns a failure payload when the log query fails', async () => {
    state.logsLimit.mockResolvedValue({ data: [], error: { message: 'db down' } })

    const response = await GET(new NextRequest('https://startingmonday.app/api/client/coach-access/coach-1/activity'), { params: Promise.resolve({ coachId: 'coach-1' }) })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to load coach activity' })
  })
})
