import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  signInWithOAuth: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

import { GET } from './route'

describe('oauth start route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.signInWithOAuth.mockResolvedValue({ data: { url: 'https://provider.example.com/auth' }, error: null })
    state.createClient.mockResolvedValue({
      auth: { signInWithOAuth: state.signInWithOAuth },
    })
  })

  it('redirects to login when the guard blocks the request', async () => {
    state.guard.mockResolvedValue(new Response('blocked', { status: 429 }))

    const response = await GET(new NextRequest('https://startingmonday.app/api/auth/oauth-start?provider=google'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?error=rate_limited')
  })

  it('redirects to login for unsupported providers', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/auth/oauth-start?provider=github'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=oauth_start_failed')
  })

  it('redirects to the provider url for supported providers', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/auth/oauth-start?provider=google&next=/dashboard/profile'))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://provider.example.com/auth')
    expect(state.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'google',
      options: expect.objectContaining({ redirectTo: 'https://startingmonday.app/auth/callback?next=%2Fdashboard%2Fprofile' }),
    }))
  })
})
