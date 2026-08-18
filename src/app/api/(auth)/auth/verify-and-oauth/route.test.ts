import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  signInWithOAuth: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({
    auth: {
      signInWithOAuth: state.signInWithOAuth,
    },
  }),
}))

vi.mock('next/headers', () => ({
  cookies: async () => ({
    getAll: () => [],
    set: vi.fn(),
  }),
}))

import { POST } from './route'

describe('verify-and-oauth route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.signInWithOAuth.mockResolvedValue({ data: { url: 'https://oauth.example.com/start' }, error: null })
  })

  it('returns the guard response when rate limited', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/verify-and-oauth', { method: 'POST', body: '{}' }))

    expect(response.status).toBe(429)
  })

  it('rejects invalid request bodies', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/verify-and-oauth', { method: 'POST', body: '{' }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'Invalid request body' })
  })

  it('starts oauth for supported providers', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/verify-and-oauth', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', redirectTo: 'https://startingmonday.app/auth/callback' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, url: 'https://oauth.example.com/start' })
    expect(state.signInWithOAuth).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'https://startingmonday.app/auth/callback' } })
  })
})
