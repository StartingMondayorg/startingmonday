import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

import { POST } from './route'

describe('verify-and-magic-link route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
  })

  it('returns the guard response when throttled', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ ok: false, error: 'rate limited' }, { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/verify-and-magic-link', { method: 'POST' }))

    expect(response.status).toBe(429)
  })

  it('returns a disabled magic link response when allowed', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/verify-and-magic-link', { method: 'POST' }))

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({
      ok: false,
      error: 'Magic link sign-in is disabled. Use password or social sign-in.',
      code: 'MAGIC_LINK_DISABLED',
    })
  })
})
