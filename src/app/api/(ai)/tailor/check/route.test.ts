import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  access: vi.fn(),
  stream: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({
  requireFeatureAccess: state.access,
}))

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      stream: state.stream,
    },
  },
  MODELS: { sonnet: 'sonnet-test' },
}))

vi.mock('@/lib/watermark', () => ({
  appendWatermarkToStream: (stream: Response) => stream,
}))

import { POST } from './route'

describe('tailor check route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.access.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.stream.mockResolvedValue((async function* () {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'ATS 87' } }
    })())
  })

  it('returns the access response when the feature is unavailable', async () => {
    state.access.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor/check', {
      method: 'POST',
      body: JSON.stringify({ tailoredResume: 'resume', jobDescription: 'job' }),
    }))

    expect(response.status).toBe(403)
  })

  it('returns 400 for invalid json', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor/check', {
      method: 'POST',
      body: '{',
    }))

    expect(response.status).toBe(400)
  })

  it('streams the scoring response', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor/check', {
      method: 'POST',
      body: JSON.stringify({
        tailoredResume: 'Resume '.repeat(20),
        jobDescription: 'Job description '.repeat(10),
        companyName: 'Acme',
      }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('ATS 87')
    expect(state.stream).toHaveBeenCalledWith(expect.objectContaining({ model: 'sonnet-test' }))
  })
})
