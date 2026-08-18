import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getUserSubscription: vi.fn(),
  canAccessFeature: vi.fn(),
  checkBurstLimit: vi.fn(),
  isRateLimited: vi.fn(),
  anthropicCreate: vi.fn(),
  recordTrace: vi.fn(),
  recordTraceError: vi.fn(),
  profileSingle: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/subscription', () => ({
  getUserSubscription: state.getUserSubscription,
  canAccessFeature: state.canAccessFeature,
}))
vi.mock('@/lib/burst-limit', () => ({ checkBurstLimit: state.checkBurstLimit }))
vi.mock('@/lib/api-usage', () => ({ isRateLimited: state.isRateLimited }))
vi.mock('@/lib/anthropic', () => ({
  anthropic: { messages: { create: state.anthropicCreate } },
  MODELS: { sonnet: 'sonnet-test' },
}))
vi.mock('@/lib/trace', () => ({ recordTrace: state.recordTrace, recordTraceError: state.recordTraceError }))

import { GET } from './route'

describe('suggestions route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
    state.createClient.mockResolvedValue({
      from: () => ({
        select: () => ({ eq: () => ({ single: state.profileSingle }) }),
      }),
    })
    state.getUserSubscription.mockResolvedValue({ tier: 'active', status: 'active', isActive: true })
    state.canAccessFeature.mockReturnValue(true)
    state.checkBurstLimit.mockResolvedValue(true)
    state.isRateLimited.mockResolvedValue(false)
    state.profileSingle.mockResolvedValue({
      data: {
        current_title: 'CIO',
        current_company: 'Acme',
        target_titles: ['CIO'],
        target_sectors: ['software'],
        target_locations: ['remote'],
        positioning_summary: 'Executive technology leader',
      },
    })
    state.anthropicCreate.mockResolvedValue({
      content: [{ type: 'text', text: JSON.stringify({ companies: ['Acme'], recruiters: [{ name: 'Heidrick', focus: 'technology' }] }) }],
      usage: { input_tokens: 10, output_tokens: 20 },
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new Response(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/suggestions'))

    expect(response.status).toBe(401)
  })

  it('returns empty results when feature access is denied', async () => {
    state.canAccessFeature.mockReturnValueOnce(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/suggestions'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ companies: [], recruiters: [] })
  })

  it('returns rate limit responses before generation', async () => {
    state.checkBurstLimit.mockResolvedValueOnce(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/suggestions'))

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Too many requests. Wait a moment.' })
  })

  it('returns parsed companies and recruiters from the model response', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/suggestions'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      companies: ['Acme'],
      recruiters: [{ name: 'Heidrick', focus: 'technology' }],
    })
    expect(state.recordTrace).toHaveBeenCalledWith(expect.objectContaining({
      feature: 'suggestions',
      model: 'sonnet-test',
    }))
  })
})
