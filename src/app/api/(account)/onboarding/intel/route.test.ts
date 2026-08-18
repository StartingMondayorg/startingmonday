import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  checkBurstLimit: vi.fn(),
  isRateLimited: vi.fn(),
  anthropicStream: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/burst-limit', () => ({ checkBurstLimit: state.checkBurstLimit }))
vi.mock('@/lib/api-usage', () => ({ isRateLimited: state.isRateLimited }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { stream: state.anthropicStream } }, MODELS: { haiku: 'haiku-test' } }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))

import { POST } from './route'

describe('onboarding intel route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.checkBurstLimit.mockResolvedValue(true)
    state.isRateLimited.mockResolvedValue(false)
    state.anthropicStream.mockReturnValue((async function* () {
      yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Intel preview' } }
    })())
    state.createClient.mockResolvedValue({})
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/onboarding/intel', {
      method: 'POST',
      body: JSON.stringify({ companyName: 'Acme' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects missing company names', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/onboarding/intel', {
      method: 'POST',
      body: JSON.stringify({ persona: 'csuite' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'companyName required' })
  })

  it('streams an intel preview for a valid request', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/onboarding/intel', {
      method: 'POST',
      body: JSON.stringify({ companyName: 'Acme', persona: 'csuite' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.text()).toContain('Intel preview')
  })
})
