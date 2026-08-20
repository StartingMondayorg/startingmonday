import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  signInWithPassword: vi.fn(),
  upsert: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({ enforcePublicEndpointGuard: state.guard }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: { signInWithPassword: state.signInWithPassword },
    from: () => ({ upsert: state.upsert }),
  }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { POST } from './route'

describe('verify-and-signin route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.upsert.mockResolvedValue({ error: null })
    state.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' }, session: { access_token: 't' } }, error: null })
    state.logEvent.mockResolvedValue(undefined)
  })

  it('returns guard response when throttled', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 }))
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid field types', async () => {
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
      body: JSON.stringify({ email: 123, password: true }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 for invalid credentials', async () => {
    state.signInWithPassword.mockResolvedValue({ data: {}, error: { message: 'Invalid login credentials' } })
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'badpass' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ code: 'INVALID_CREDENTIALS' })
  })

  it('returns 200 for successful signin', async () => {
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'StrongPass123!' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(state.upsert).toHaveBeenCalled()
    expect(state.logEvent).toHaveBeenCalledWith(
      'u1',
      'auth_path_routed',
      expect.objectContaining({
        route: 'verify-and-signin',
        path_category: 'direct_password',
        auth_method: 'password',
      })
    )
  })
})
