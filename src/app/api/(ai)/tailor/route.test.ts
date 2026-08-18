import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireFeatureAccess: vi.fn(),
  streamImpl: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({
  requireFeatureAccess: state.requireFeatureAccess,
}))

vi.mock('@/lib/anthropic', () => ({
  MODELS: { sonnet: 'sonnet-test' },
  anthropic: {
    messages: {
      stream: state.streamImpl,
    },
  },
}))

vi.mock('@/lib/watermark', () => ({
  appendWatermarkToStream: (stream: Response) => stream,
}))

import { POST } from './route'

describe('tailor route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireFeatureAccess.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.streamImpl.mockResolvedValue((async function* () {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Tailored output' } }
    })())
  })

  it('returns the access response when the feature is unavailable', async () => {
    state.requireFeatureAccess.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor', {
      method: 'POST',
      body: JSON.stringify({ resumeText: 'resume', jobDescription: 'job' }),
    }))

    expect(response.status).toBe(403)
  })

  it('returns 400 for invalid json', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor', {
      method: 'POST',
      body: '{',
    }))

    expect(response.status).toBe(400)
  })

  it('streams tailored resume text', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor', {
      method: 'POST',
      body: JSON.stringify({
        resumeText: 'Resume '.repeat(40),
        jobDescription: 'Job description '.repeat(10),
      }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Tailored output')
  })
})
