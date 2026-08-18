import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  verifyCoachAccess: vi.fn(),
  logCoachAccess: vi.fn(),
  signalsData: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/coach-access', () => ({
  verifyCoachAccess: state.verifyCoachAccess,
  logCoachAccess: state.logCoachAccess,
}))

import { GET } from './route'

describe('coach client signals route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'coach-1', response: new NextResponse() })
    state.verifyCoachAccess.mockResolvedValue({ hasAccess: true })
    state.signalsData.mockResolvedValue({ data: [{ id: 'signal-1', signal_type: 'funding' }], error: null })
    state.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => ({
              limit: state.signalsData,
            }),
          }),
        }),
      }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/client/client-1/signals'), { params: Promise.resolve({ clientId: 'client-1' }) })

    expect(response.status).toBe(401)
  })

  it('returns access denied when the coach relationship is missing', async () => {
    state.verifyCoachAccess.mockResolvedValue({ hasAccess: false })

    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/client/client-1/signals'), { params: Promise.resolve({ clientId: 'client-1' }) })

    expect(response.status).toBe(403)
  })

  it('returns client signals for authorized coaches', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/coach/client/client-1/signals'), { params: Promise.resolve({ clientId: 'client-1' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ data: [{ id: 'signal-1', signal_type: 'funding' }] })
    expect(state.logCoachAccess).toHaveBeenCalledWith('coach-1', 'client-1', 'company_signals', 'client-1', 'view')
  })
})
