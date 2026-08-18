import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  referenceSelect: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

import { GET } from './route'

describe('companies reference search route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.referenceSelect.mockReturnValue({
      ilike: () => ({
        order: () => ({
          limit: async () => ({ data: [{ id: 'company-1', name: 'Acme', cb_rank: 1 }], error: null }),
        }),
      }),
    })
    state.createClient.mockResolvedValue({
      from: () => ({
        select: () => state.referenceSelect(),
      }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/companies/reference/search?q=ac'))

    expect(response.status).toBe(401)
  })

  it('returns an empty list for short queries', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/companies/reference/search?q=a'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([])
  })

  it('returns ranked reference companies for valid queries', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/companies/reference/search?q=ac'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual([{ id: 'company-1', name: 'Acme', cb_rank: 1 }])
  })
})
