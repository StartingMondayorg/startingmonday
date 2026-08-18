import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  rateLimit: vi.fn(),
  signInWithPassword: vi.fn(),
  getUserSubscription: vi.fn(),
  canAccessFeature: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: state.rateLimit,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/billing/subscription', () => ({
  getUserSubscription: state.getUserSubscription,
  canAccessFeature: state.canAccessFeature,
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  getClientIp: () => '203.0.113.9',
  enforcePublicEndpointGuard: vi.fn(),
}))

import { POST } from './route'

describe('auth login submit route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.rateLimit.mockResolvedValue({ allowed: true })
    state.signInWithPassword.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    state.getUserSubscription.mockResolvedValue({ tier: 'pro' })
    state.canAccessFeature.mockReturnValue(false)
    state.createClient.mockResolvedValue({
      auth: { signInWithPassword: state.signInWithPassword },
    })
  })

  it('redirects to login when the request is rate limited', async () => {
    state.rateLimit.mockResolvedValue({ allowed: false })

    const body = new FormData()
    body.set('email', 'user@example.com')
    body.set('password', 'Password123!')

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/login-submit', {
      method: 'POST',
      body,
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('/login?next=%2Fdashboard&error=rate_limited')
  })

  it('redirects to login when credentials are missing', async () => {
    const body = new FormData()
    body.set('email', 'user@example.com')

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/login-submit', {
      method: 'POST',
      body,
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toContain('error=missing_credentials')
  })

  it('redirects to the coach dashboard when permitted', async () => {
    state.canAccessFeature.mockReturnValue(true)

    const body = new FormData()
    body.set('email', 'user@example.com')
    body.set('password', 'Password123!')

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/login-submit', {
      method: 'POST',
      body,
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://startingmonday.app/dashboard/coach')
  })

  it('redirects a standard returning user to the dashboard', async () => {
    const body = new FormData()
    body.set('email', 'user@example.com')
    body.set('password', 'Password123!')

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/login-submit', {
      method: 'POST',
      body,
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://startingmonday.app/dashboard')
  })
})
