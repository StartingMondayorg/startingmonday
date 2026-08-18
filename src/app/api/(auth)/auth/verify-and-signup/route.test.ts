import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  createUser: vi.fn(),
  logEvent: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({ enforcePublicEndpointGuard: state.guard }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signUp: state.signUp,
      signInWithPassword: state.signInWithPassword,
    },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ auth: { admin: { createUser: state.createUser } } }),
}))
vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { POST } from './route'

describe('verify-and-signup route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.signUp.mockResolvedValue({ data: { user: { id: 'u1' }, session: null }, error: null })
    state.signInWithPassword.mockResolvedValue({ data: { user: { id: 'u1' }, session: { access_token: 'token' } }, error: null })
    state.createUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null })
    state.logEvent.mockResolvedValue(undefined)
  })

  it('returns guard response when throttled', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 }))
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid body', async () => {
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', { method: 'POST', body: '{' })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing fields', async () => {
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns ok for valid signup payload', async () => {
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'StrongPass123!' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(state.signUp).toHaveBeenCalled()
  })

  it('falls back to admin-created user when public signups are disabled', async () => {
    state.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Signups not allowed for this instance' },
    })

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'StrongPass123!' }),
    })

    const res = await POST(req)

    expect(res.status).toBe(200)
    expect(state.createUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'StrongPass123!',
      email_confirm: true,
    })
    expect(state.signInWithPassword).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'StrongPass123!',
    })
    expect(state.logEvent).toHaveBeenCalledWith(
      'u1',
      'auth_path_routed',
      expect.objectContaining({
        route: 'verify-and-signup',
        path_category: 'direct_admin',
        auth_method: 'admin_created_password',
      })
    )
  })
})
