import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  access: vi.fn(),
  anthropicStream: vi.fn(),
}))

vi.mock('@/lib/require-feature-access', () => ({ requireFeatureAccess: state.access }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { stream: state.anthropicStream } }, MODELS: { sonnet: 'sonnet-test' } }))
vi.mock('@/lib/watermark', () => ({ appendWatermarkToStream: (stream: Response) => stream }))

import { POST } from './route'

describe('tailor strengthen route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.access.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.anthropicStream.mockReturnValue((async function* () {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Strengthened resume' } }
    })())
  })

  it('returns the access response when blocked', async () => {
    state.access.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 403 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor/strengthen', {
      method: 'POST',
      body: JSON.stringify({ tailoredResume: 'resume', weakBullets: 'bullet' }),
    }))

    expect(response.status).toBe(403)
  })

  it('rejects invalid json', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor/strengthen', {
      method: 'POST',
      body: '{',
    }))

    expect(response.status).toBe(400)
  })

  it('streams strengthened resume text', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/tailor/strengthen', {
      method: 'POST',
      body: JSON.stringify({
        tailoredResume: 'Resume '.repeat(20),
        weakBullets: 'BULLET: weak bullet\nFIX: stronger bullet',
        jobDescription: 'Job description '.repeat(10),
      }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Strengthened resume')
  })
})
