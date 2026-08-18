import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  burstLimit: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/burst-limit', () => ({
  checkBurstLimit: state.burstLimit,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: state.insert,
    }),
  }),
}))

vi.mock('@/lib/email/owner-email', () => ({
  getNotifyEmails: () => [],
}))

vi.mock('@/lib/email/email', () => ({
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/anthropic', () => ({
  anthropic: { messages: { create: vi.fn() } },
  MODELS: { haiku: 'haiku-test' },
  TEMP: { extract: 0.2 },
}))

import { POST } from './route'

describe('feedback route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.burstLimit.mockResolvedValue(true)
    state.insert.mockResolvedValue({ error: null })
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'This is feedback' }),
    }))

    expect(response.status).toBe(429)
  })

  it('rejects short feedback text before saving', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'ok' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Too short' })
    expect(state.insert).not.toHaveBeenCalled()
  })

  it('returns 429 when the burst limit is exceeded', async () => {
    state.burstLimit.mockResolvedValueOnce(false)

    const response = await POST(new NextRequest('https://startingmonday.app/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
        'user-agent': 'Vitest',
      },
      body: JSON.stringify({ text: 'This is valid feedback' }),
    }))

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Too many requests. Wait a moment.' })
    expect(state.insert).not.toHaveBeenCalled()
  })

  it('stores valid feedback and returns ok', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '203.0.113.10',
        'user-agent': 'Vitest',
        host: 'staging.local',
      },
      body: JSON.stringify({ text: 'This is valid feedback about the product.', invite_code: 'INVITE-1' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.insert).toHaveBeenCalledWith({
      invite_code: 'INVITE-1',
      body: 'This is valid feedback about the product.',
    })
  })
})
