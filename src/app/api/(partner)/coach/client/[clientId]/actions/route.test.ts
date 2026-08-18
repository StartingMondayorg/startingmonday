import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  verifyCoachAccess: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/coach-access', () => ({
  verifyCoachAccess: state.verifyCoachAccess,
  logCoachAccess: vi.fn(),
}))

import { POST, PATCH } from './route'

describe('coach client actions route authz', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({
      ok: true,
      userId: 'coach_1',
      response: NextResponse.json({ ok: true }),
    })
    state.verifyCoachAccess.mockResolvedValue({ hasAccess: true, canWrite: false })
  })

  it('blocks POST for read-only coach seats', async () => {
    const request = new NextRequest('https://startingmonday.app/api/coach/client/client_1/actions', {
      method: 'POST',
    })
    const response = await POST(request, { params: Promise.resolve({ clientId: 'client_1' }) })
    expect(response.status).toBe(403)
  })

  it('blocks PATCH for read-only coach seats', async () => {
    const request = new NextRequest('https://startingmonday.app/api/coach/client/client_1/actions', {
      method: 'PATCH',
    })
    const response = await PATCH(request, { params: Promise.resolve({ clientId: 'client_1' }) })
    expect(response.status).toBe(403)
  })
})
