import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  access: vi.fn(),
  anthropicStream: vi.fn(),
  trackApiUsage: vi.fn(),
  recordTraceError: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({ requireFeatureAccess: state.access }))
vi.mock('@/lib/api-usage', () => ({ trackApiUsage: state.trackApiUsage }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { stream: state.anthropicStream } }, MODELS: { sonnet: 'sonnet-test' } }))
vi.mock('@/lib/prompts', () => ({ STRATEGY_SYSTEM: 'system' }))
vi.mock('@/lib/stream-error', () => ({ streamErrorMessage: () => 'stream error' }))
vi.mock('@/lib/trace', () => ({ recordTraceError: state.recordTraceError }))

import { POST } from './route'

describe('strategy followup route', () => {
  const supabase = { from: vi.fn() }

  beforeEach(() => {
    vi.resetAllMocks()
    state.access.mockResolvedValue({ ok: true as const, userId: 'user-1', supabase, response: new NextResponse() })
    state.trackApiUsage.mockResolvedValue(undefined)
    state.anthropicStream.mockReturnValue({
      on: vi.fn((event: string, handler: (value: string) => void) => {
        if (event === 'text') handler('Follow-up guidance')
      }),
      finalMessage: vi.fn().mockResolvedValue({ usage: { input_tokens: 10, output_tokens: 20 } }),
    })
  })

  it('returns the access response when blocked', async () => {
    state.access.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/strategy/followup', {
      method: 'POST',
      body: JSON.stringify({ brief: 'brief', question: 'question' }),
    }))

    expect(response.status).toBe(403)
  })

  it('rejects missing brief or question', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/strategy/followup', {
      method: 'POST',
      body: JSON.stringify({ brief: 'brief' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing brief or question' })
  })

  it('streams follow-up guidance and tracks usage', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/strategy/followup', {
      method: 'POST',
      body: JSON.stringify({ brief: 'brief text', question: 'What should I do next?' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Follow-up guidance')
  })
})
