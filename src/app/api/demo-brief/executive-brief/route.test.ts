import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => {
  const streamImpl = vi.fn()
  const guard = vi.fn()
  return { streamImpl, guard }
})

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/ai/prompts', () => ({
  PREP_SYSTEM: 'prep-system',
}))

vi.mock('@/lib/ai/anthropic', () => ({
  MODELS: { sonnet: 'sonnet-test' },
  anthropic: {
    messages: {
      stream: state.streamImpl,
    },
  },
}))

import { POST } from './route'

function makeRequest() {
  return new NextRequest('https://startingmonday.app/api/demo-brief/executive-brief', {
    method: 'POST',
  })
}

describe('demo executive brief route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.streamImpl.mockImplementation(() => {
      let onText: ((chunk: string) => void) | null = null
      return {
        on: (event: string, cb: (chunk: string) => void) => {
          if (event === 'text') onText = cb
        },
        finalMessage: async () => {
          onText?.('Generated brief output')
        },
      }
    })
  })

  it('returns guard response when endpoint is blocked', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ error: 'rate limited' }, { status: 429 }))
    const response = await POST(makeRequest())
    expect(response.status).toBe(429)
    expect(state.streamImpl).not.toHaveBeenCalled()
  })

  it('streams generated brief text when anthropic succeeds', async () => {
    const response = await POST(makeRequest())
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')

    const body = await response.text()
    expect(body).toContain('Generated brief output')
    expect(state.streamImpl).toHaveBeenCalledOnce()
  })

  it('falls back to deterministic manager-tools brief on stream failure', async () => {
    state.streamImpl.mockImplementation(() => ({
      on: vi.fn(),
      finalMessage: async () => {
        throw new Error('stream failure')
      },
    }))

    const response = await POST(makeRequest())
    const body = await response.text()
    expect(body).toContain('## Bottom Line')
    expect(body).toContain('## The Situation')
  })
})
