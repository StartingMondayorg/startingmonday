import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  access: vi.fn(),
  anthropicStream: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
  recordTraceError: vi.fn(),
  appendWatermarkToStream: vi.fn((stream: Response) => stream),
  contactSingle: vi.fn(),
  profileSingle: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({ requireFeatureAccess: state.access }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { stream: state.anthropicStream } }, MODELS: { sonnet: 'sonnet-test' }, OUTREACH_SYSTEM: 'system' }))
vi.mock('@/lib/stream-error', () => ({ streamErrorMessage: () => 'stream error' }))
vi.mock('@/lib/trace', () => ({ recordTraceError: state.recordTraceError }))
vi.mock('@/lib/schemas', () => ({ OutreachDraftBodySchema: { safeParse: (raw: unknown) => {
  if (raw && typeof raw === 'object' && 'contactId' in raw) return { success: true, data: raw }
  return { success: false, error: { issues: [{ message: 'Invalid input' }] } }
} }, firstZodError: () => 'Invalid input' }))
vi.mock('@/lib/watermark', () => ({ appendWatermarkToStream: state.appendWatermarkToStream }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))
vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn(async () => ({
  from(table: string) {
    if (table === 'contacts') return { select: () => ({ eq: () => ({ eq: () => ({ single: state.contactSingle }) }) }) }
    if (table === 'user_profiles') return { select: () => ({ eq: () => ({ single: state.profileSingle }) }) }
    return {}
  },
})) }))

import { POST } from './route'

describe('outreach draft route', () => {
  const supabase = {
    from: vi.fn(),
  }

  beforeEach(() => {
    vi.resetAllMocks()
    state.access.mockResolvedValue({ ok: true as const, userId: 'user-1', supabase })
    state.contactSingle.mockResolvedValue({ data: { name: 'Ada', title: 'VP Engineering', firm: 'Acme', channel: 'conference', notes: 'Met at summit', companies: [{ name: 'Acme' }] } })
    state.profileSingle.mockResolvedValue({ data: { full_name: 'Rich Rothschild', positioning_summary: 'Senior executive', target_titles: ['CIO'], target_sectors: ['software'], beyond_resume: 'Board experience' } })
    state.anthropicStream.mockResolvedValue((async function* () { yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Draft message' } } })())
    state.logEvent.mockReturnValue({ catch: vi.fn() })

    const contactChain = {
      eq: vi.fn().mockReturnThis(),
      single: state.contactSingle,
    }
    const profileChain = {
      eq: vi.fn().mockReturnThis(),
      single: state.profileSingle,
    }

    supabase.from.mockImplementation((table: string) => {
      if (table === 'contacts') return { select: () => contactChain }
      if (table === 'user_profiles') return { select: () => profileChain }
      return {}
    })
  })

  it('returns the access response when blocked', async () => {
    state.access.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/outreach/draft', { method: 'POST', body: JSON.stringify({}) }))

    expect(response.status).toBe(403)
  })

  it('rejects invalid payloads', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/outreach/draft', { method: 'POST', body: '{' }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid JSON' })
  })

  it('streams a draft message and records telemetry', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/outreach/draft', {
      method: 'POST',
      body: JSON.stringify({ contactId: 'contact-1', goal: 'Ask for a conversation' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Draft message')
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'outreach_draft_generated', expect.objectContaining({ contact_id: 'contact-1', is_refinement: false }))
    expect(state.captureServerEvent).toHaveBeenCalledTimes(1)
  })
})
