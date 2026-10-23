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

  it('returns 503 SIGNUPS_DISABLED without creating a user when public signups are disabled', async () => {
    state.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Signups not allowed for this instance' },
    })

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'victim@example.com', password: 'StrongPass123!' }),
    })

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(503)
    expect(body).toEqual({
      ok: false,
      error: 'Email signup is temporarily unavailable. Use Google or Apple, or try again later.',
      code: 'SIGNUPS_DISABLED',
    })
    expect(state.createUser).not.toHaveBeenCalled()
    expect(state.signInWithPassword).not.toHaveBeenCalled()
    expect(state.logEvent).not.toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('"event":"signup_disabled_rejected"'))
    expect(consoleError).not.toHaveBeenCalledWith(expect.stringContaining('victim@example.com'))
    consoleError.mockRestore()
  })

  it('returns 400 with the provider message for other signUp errors', async () => {
    state.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Password should be at least 8 characters' },
    })

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signup', {
      method: 'POST',
      body: JSON.stringify({ email: 'user@example.com', password: 'short' }),
    })

    const res = await POST(req)

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toEqual({ ok: false, error: 'Password should be at least 8 characters' })
    expect(state.createUser).not.toHaveBeenCalled()
  })
})