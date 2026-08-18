import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  access: vi.fn(),
  anthropicStream: vi.fn(),
  recordTraceError: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({ requireFeatureAccess: state.access }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { stream: state.anthropicStream } }, MODELS: { sonnet: 'sonnet-test' }, TEMP: { balanced: 0.5 } }))
vi.mock('@/lib/stream-error', () => ({ streamErrorMessage: () => 'stream error' }))
vi.mock('@/lib/trace', () => ({ recordTraceError: state.recordTraceError }))

import { POST } from './route'

describe('positioning chat route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.access.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.anthropicStream.mockReturnValue((async function* () {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Positioning help' } }
    })())
  })

  it('returns access responses when blocked', async () => {
    state.access.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/positioning/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [] }),
    }))

    expect(response.status).toBe(403)
  })

  it('streams positioning guidance for a valid request', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/positioning/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [], context: { currentTitle: 'CIO' } }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Positioning help')
  })
})
