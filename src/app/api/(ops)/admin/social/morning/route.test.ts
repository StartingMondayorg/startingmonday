import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  createAdminClient: vi.fn(),
  getSocialPlanForDate: vi.fn(),
  isSocialPostDay: vi.fn(),
  getNoteToken: vi.fn(),
  hashDraftText: vi.fn(),
  fetch: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest: state.validateCronRequest }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/social-posting-plan', () => ({
  getSocialPlanForDate: state.getSocialPlanForDate,
  isSocialPostDay: state.isSocialPostDay,
}))
vi.mock('@/lib/social-council-check', () => ({
  getNoteToken: state.getNoteToken,
  hashDraftText: state.hashDraftText,
}))

import { GET } from './route'

describe('src/app/api/admin/social/morning/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.SOCIAL_AUTO_PUBLISH_ENABLED = 'true'
    process.env.MAKE_WEBHOOK_URL = 'https://example.test/make-webhook'
    state.validateCronRequest.mockReturnValue(true)
    state.isSocialPostDay.mockReturnValue(true)
    state.getSocialPlanForDate.mockReturnValue({
      audience: 'executives',
      pillar: 'search_craft',
      audienceLabel: 'Senior Executives',
      pillarLabel: 'Search Craft',
      recommendedTimeCt: '8:35 AM CT',
      draftText: 'Draft text',
    })
    state.getNoteToken.mockImplementation((notes: unknown, key: string) => {
      if (key === 'council_pass') return 'true'
      if (key === 'council_text_hash') return 'hash'
      if (key === 'emotional_angle') return 'calm'
      return null
    })
    state.hashDraftText.mockReturnValue('hash')
    state.fetch.mockResolvedValue({ ok: false, status: 502, text: async () => 'upstream unavailable' })
    global.fetch = state.fetch as typeof fetch
    state.createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: { id: 'post-1', is_posted: false, draft_text: 'Draft text', notes: 'approval_status=approved | council_pass=true | council_text_hash=hash | emotional_angle=calm', pillar: 'search_craft' }, error: null }),
          }),
        }),
      }),
    })
  })

  afterEach(() => {
    delete process.env.SOCIAL_AUTO_PUBLISH_ENABLED
    delete process.env.MAKE_WEBHOOK_URL
  })

  it('returns 200 when the Make webhook fails so cron-job does not mark the run failed', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/social/morning?secret=test')
    const res = await GET(req)
    const body = await res.json() as { ok?: boolean; sent?: boolean; upstreamStatus?: number }

    expect(res.status).toBe(200)
    expect(body.ok).toBe(false)
    expect(body.sent).toBe(false)
    expect(body.upstreamStatus).toBe(502)
  })
})
