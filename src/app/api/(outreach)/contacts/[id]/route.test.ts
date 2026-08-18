import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  deleteQuery: vi.fn(),
  eq: vi.fn(),
  withApiTelemetry: vi.fn((_, handler) => handler),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/telemetry', () => ({ withApiTelemetry: state.withApiTelemetry }))

import { DELETE } from './route'

describe('contacts id route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.eq.mockReturnValue({ eq: state.eq })
    state.deleteQuery.mockReturnValue({ eq: state.eq })
    state.createClient.mockResolvedValue({
      from: () => ({ delete: state.deleteQuery }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await DELETE(new NextRequest('https://startingmonday.app/api/contacts/abc', {
      method: 'DELETE',
    }), { params: Promise.resolve({ id: 'abc' }) })

    expect(response.status).toBe(401)
  })

  it('returns a deletion confirmation', async () => {
    state.deleteQuery.mockReturnValue({ eq: state.eq.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }) })

    const response = await DELETE(new NextRequest('https://startingmonday.app/api/contacts/abc', {
      method: 'DELETE',
    }), { params: Promise.resolve({ id: 'abc' }) })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, deleted: true })
  })

  it('returns 500 when the delete query fails', async () => {
    state.deleteQuery.mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: { message: 'boom' } }) }) })

    const response = await DELETE(new NextRequest('https://startingmonday.app/api/contacts/abc', {
      method: 'DELETE',
    }), { params: Promise.resolve({ id: 'abc' }) })

    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Failed to delete contact' })
  })
})
