import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  rpc: vi.fn(),
  insert: vi.fn(),
  stream: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    rpc: state.rpc,
    from: () => ({
      insert: state.insert,
    }),
  })),
}))

vi.mock('@/lib/ai/anthropic', () => ({
  anthropic: {
    messages: {
      stream: state.stream,
    },
  },
  MODELS: { sonnet: 'sonnet-test' },
}))

import { POST } from './route'

describe('optimize route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.rpc.mockResolvedValue({ data: true })
    state.insert.mockReturnValue(Promise.resolve())
    state.stream.mockResolvedValue((async function* () {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Optimized profile text' } }
    })())
  })

  it('returns 400 for invalid json', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/optimize', {
      method: 'POST',
      body: '{',
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Invalid request' })
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValue(new Response(JSON.stringify({ error: 'blocked' }), { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/optimize', {
      method: 'POST',
      body: JSON.stringify({ text: 'Resume text '.repeat(20), email: 'coach@example.com' }),
    }))

    expect(response.status).toBe(429)
  })

  it('returns 429 when the daily limit is exceeded', async () => {
    state.rpc.mockResolvedValueOnce({ data: false })

    const response = await POST(new NextRequest('https://startingmonday.app/api/optimize', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.10' },
      body: JSON.stringify({ text: 'Resume text '.repeat(20), email: 'coach@example.com' }),
    }))

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Rate limit reached. You can analyze 3 profiles per day.' })
  })

  it('streams feedback for a valid request and stores the lead email', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/optimize', {
      method: 'POST',
      headers: { 'cf-connecting-ip': '203.0.113.10' },
      body: JSON.stringify({
        text: 'Resume text '.repeat(20),
        email: 'Coach@Example.com ',
      }),
    }))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    expect(await response.text()).toContain('Optimized profile text')
    expect(state.rpc).toHaveBeenCalledWith('check_and_increment_rate_limit', expect.objectContaining({
      p_key: 'ip:203.0.113.10',
      p_limit: 3,
    }))
    expect(state.insert).toHaveBeenCalledWith({ email: 'coach@example.com', ip: '203.0.113.10' })
    expect(state.stream).toHaveBeenCalledWith(expect.objectContaining({
      model: 'sonnet-test',
    }))
  })
})
