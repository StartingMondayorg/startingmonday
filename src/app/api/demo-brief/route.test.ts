import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  streamImpl: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
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

describe('demo brief route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.streamImpl.mockImplementation(() => ({
      on: vi.fn(),
      finalMessage: async () => undefined,
    }))
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ error: 'rate limited' }, { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/demo-brief', {
      method: 'POST',
      body: JSON.stringify({ company: 'Acme', role: 'CIO' }),
    }))

    expect(response.status).toBe(429)
  })

  it('streams generated brief content when the model succeeds', async () => {
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

    const response = await POST(new NextRequest('https://startingmonday.app/api/demo-brief', {
      method: 'POST',
      body: JSON.stringify({ company: 'Acme', role: 'CIO' }),
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toContain('Generated brief output')
  })

  it('falls back to the deterministic brief on stream failure', async () => {
    state.streamImpl.mockImplementation(() => ({
      on: vi.fn(),
      finalMessage: async () => { throw new Error('stream failed') },
    }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/demo-brief', {
      method: 'POST',
      body: JSON.stringify({ company: 'Acme', role: 'CIO' }),
    }))

    expect(await response.text()).toContain('## What Acme Is Navigating Right Now')
  })
})
