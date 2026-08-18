import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireFeatureAccess: vi.fn(),
  isDemoUser: vi.fn(),
  streamDemoText: vi.fn(),
  trackApiUsage: vi.fn(),
  anthropicStream: vi.fn(),
  profileSingle: vi.fn(),
  companiesLimit: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({ requireFeatureAccess: state.requireFeatureAccess }))
vi.mock('@/lib/demo', () => ({
  isDemoUser: state.isDemoUser,
  streamDemoText: state.streamDemoText,
  DEMO_STRATEGY_BRIEF: 'demo brief',
}))
vi.mock('@/lib/api-usage', () => ({ trackApiUsage: state.trackApiUsage }))
vi.mock('@/lib/watermark', () => ({ encodeUserId: (userId: string) => `encoded:${userId}` }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { stream: state.anthropicStream } }, MODELS: { opus: 'opus-test' } }))
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }))

import { GET } from './route'

function createAnthropicStream(text: string) {
  return {
    on: vi.fn((event: string, handler: (value: string) => void) => {
      if (event === 'text') handler(text)
    }),
    finalMessage: vi.fn().mockResolvedValue({ usage: { input_tokens: 10, output_tokens: 20 } }),
  }
}

describe('strategy route', () => {
  const supabase = { from: vi.fn() }

  beforeEach(() => {
    vi.resetAllMocks()
    state.requireFeatureAccess.mockResolvedValue({ ok: true as const, userId: 'user-1', supabase })
    state.isDemoUser.mockReturnValue(false)
    state.streamDemoText.mockReturnValue('demo strategy')
    state.trackApiUsage.mockResolvedValue(undefined)
    state.anthropicStream.mockReturnValue(createAnthropicStream('Strategy brief'))

    const profileChain = {
      eq: vi.fn().mockReturnThis(),
      single: state.profileSingle,
    }
    const companyChain = {
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: state.companiesLimit,
    }

    state.profileSingle.mockResolvedValue({
      data: {
        full_name: 'Ada Lovelace',
        current_title: 'CIO',
        current_company: 'Acme',
        target_titles: ['CIO'],
        target_sectors: ['software'],
        target_locations: ['remote'],
        positioning_summary: 'Executive leader',
        resume_text: 'resume',
        beyond_resume: 'extra',
        search_status: 'active',
        search_persona: 'csuite',
      },
    })
    state.companiesLimit.mockResolvedValue({ data: [{ name: 'Globex', sector: 'software', stage: 'growth' }], error: null })

    supabase.from.mockImplementation((table: string) => {
      if (table === 'user_profiles') return { select: () => profileChain }
      if (table === 'companies') return { select: () => companyChain }
      return {}
    })
  })

  it('returns the access response when blocked', async () => {
    state.requireFeatureAccess.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/strategy'))

    expect(response.status).toBe(403)
  })

  it('returns monitor mode without streaming', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/strategy?monitor=1'))

    expect(response.status).toBe(202)
    expect(await response.json()).toEqual({ ok: true, mode: 'monitor' })
  })

  it('returns demo content for demo users', async () => {
    state.isDemoUser.mockReturnValueOnce(true)

    const response = await GET(new NextRequest('https://startingmonday.app/api/strategy'))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('demo strategy')
  })

  it('streams a strategy brief and tracks usage', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/strategy'))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Strategy brief')
    expect(state.trackApiUsage).toHaveBeenCalledWith(supabase, 'user-1', 30)
  })
})
