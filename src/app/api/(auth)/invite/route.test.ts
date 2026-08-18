import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  single: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('crypto', () => ({
  randomBytes: () => ({ toString: () => 'invite-code-123' }),
}))

import { GET } from './route'

describe('invite route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
    state.single.mockResolvedValue({ data: { invite_code: 'existing-code' }, error: null })
    state.select.mockReturnValue({ eq: () => ({ single: state.single }) })
    state.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    state.createClient.mockResolvedValue({
      from: () => ({
        select: state.select,
        update: state.update,
      }),
    })
  })

  it('returns the existing invite code when present', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/invite'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      code: 'existing-code',
      url: 'https://startingmonday.app/invite/existing-code',
    })
  })

  it('creates a code when one is missing', async () => {
    state.single.mockResolvedValue({ data: { invite_code: null }, error: null })

    const response = await GET(new NextRequest('https://startingmonday.app/api/invite'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      code: 'invite-code-123',
      url: 'https://startingmonday.app/invite/invite-code-123',
    })
    expect(state.update).toHaveBeenCalled()
  })

  it('returns the auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new Response(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/invite'))

    expect(response.status).toBe(401)
  })
})
