import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireFeatureAccess: vi.fn(),
  checkRateLimit: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({
  requireFeatureAccess: state.requireFeatureAccess,
}))

vi.mock('@/lib/rate-limit', () => ({
  checkRateLimit: state.checkRateLimit,
}))

import { POST } from './route'

describe('chat route guards', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireFeatureAccess.mockResolvedValue({
      ok: true,
      userId: 'user-1',
      supabase: {},
    })
    state.checkRateLimit.mockReturnValue({ allowed: true })
  })

  it('passes through feature access failures', async () => {
    state.requireFeatureAccess.mockResolvedValue({
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    })

    const req = new NextRequest('https://startingmonday.app/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    })
    const res = await POST(req)

    expect(res.status).toBe(401)
  })

  it('returns 429 with Retry-After when user chat limit is exceeded', async () => {
    state.checkRateLimit.mockReturnValue({ allowed: false, retryAfter: 42 })

    const req = new NextRequest('https://startingmonday.app/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    })
    const res = await POST(req)

    expect(res.status).toBe(429)
    expect(res.headers.get('Retry-After')).toBe('42')
  })
})
