import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = {
  allowed: true,
  retryAfter: undefined as number | undefined,
}

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: vi.fn(() => ({ allowed: state.allowed, retryAfter: state.retryAfter })),
}))

import { enforcePublicEndpointGuard, getClientIp } from '@/lib/public-endpoint-guard'

describe('public-endpoint-guard', () => {
  beforeEach(() => {
    state.allowed = true
    state.retryAfter = undefined
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('extracts client IP from proxy headers', () => {
    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
      headers: { 'x-forwarded-for': '10.0.0.1, 10.0.0.2' },
    })

    expect(getClientIp(req)).toBe('10.0.0.2')
  })

  it('returns 429 when rate limit is exceeded', async () => {
    state.allowed = false
    state.retryAfter = 42

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', { method: 'POST' })
    const response = await enforcePublicEndpointGuard({
      request: req,
      rateLimitKey: 'login',
      maxPerMinute: 5,
    })

    expect(response?.status).toBe(429)
    expect(response?.headers.get('Retry-After')).toBe('42')
  })

  it('blocks missing captcha token when captcha is required', async () => {
    vi.stubEnv('TURNSTILE_ENFORCED', '1')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test_secret')

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', { method: 'POST' })
    const response = await enforcePublicEndpointGuard({
      request: req,
      rateLimitKey: 'login',
      maxPerMinute: 5,
      requireCaptcha: true,
    })

    expect(response?.status).toBe(400)
  })

  it('blocks invalid captcha token when verification fails', async () => {
    vi.stubEnv('TURNSTILE_ENFORCED', '1')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test_secret')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: false }),
    } as Response)

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
      headers: { 'x-captcha-token': 'bad_token' },
    })
    const response = await enforcePublicEndpointGuard({
      request: req,
      rateLimitKey: 'login',
      maxPerMinute: 5,
      requireCaptcha: true,
    })

    expect(response?.status).toBe(403)
  })

  it('allows request when captcha verification succeeds', async () => {
    vi.stubEnv('TURNSTILE_ENFORCED', '1')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test_secret')
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
      headers: { 'x-captcha-token': 'good_token' },
    })
    const response = await enforcePublicEndpointGuard({
      request: req,
      rateLimitKey: 'login',
      maxPerMinute: 5,
      requireCaptcha: true,
    })

    expect(response).toBeNull()
  })

  it('skips captcha verification when enforcement flag is disabled', async () => {
    vi.stubEnv('TURNSTILE_ENFORCED', '0')
    vi.stubEnv('TURNSTILE_SECRET_KEY', 'test_secret')

    const req = new NextRequest('https://startingmonday.app/api/auth/verify-and-signin', {
      method: 'POST',
    })
    const response = await enforcePublicEndpointGuard({
      request: req,
      rateLimitKey: 'login',
      maxPerMinute: 5,
      requireCaptcha: true,
    })

    expect(response).toBeNull()
  })
})
