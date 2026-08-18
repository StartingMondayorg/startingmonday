import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getUserSubscription: vi.fn(),
  canAccessFeature: vi.fn(),
  isRateLimited: vi.fn(),
  anthropicCreate: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/subscription', () => ({ getUserSubscription: state.getUserSubscription, canAccessFeature: state.canAccessFeature }))
vi.mock('@/lib/api-usage', () => ({ isRateLimited: state.isRateLimited }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { create: state.anthropicCreate } }, MODELS: { sonnet: 'sonnet-test' } }))

import { POST } from './route'

describe('offer synthesis route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.createClient.mockResolvedValue({})
    state.getUserSubscription.mockResolvedValue({ isActive: true, tier: 'active', status: 'active' })
    state.canAccessFeature.mockReturnValue(true)
    state.isRateLimited.mockResolvedValue(false)
    state.anthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: 'Offer synthesis' }] })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/offer-synthesis', {
      method: 'POST',
      body: JSON.stringify({ offers: [] }),
    }))

    expect(response.status).toBe(401)
  })

  it('validates offers input', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/offer-synthesis', {
      method: 'POST',
      body: JSON.stringify({ offers: [] }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'offers array required' })
  })

  it('returns a synthesized offer summary', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/offer-synthesis', {
      method: 'POST',
      body: JSON.stringify({ offers: [{ name: 'Acme', offer_base: 200000, offer_bonus_pct: 20 }] }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ synthesis: 'Offer synthesis' })
  })
})
