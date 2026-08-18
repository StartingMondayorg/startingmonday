import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  checkBurstLimit: vi.fn(),
  isRateLimited: vi.fn(),
  anthropicCreate: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
  createClient: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/burst-limit', () => ({ checkBurstLimit: state.checkBurstLimit }))
vi.mock('@/lib/api-usage', () => ({ isRateLimited: state.isRateLimited }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { create: state.anthropicCreate } }, MODELS: { sonnet: 'sonnet-test' } }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/posthog-server', () => ({ captureServerEvent: state.captureServerEvent }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))

import { POST } from './route'

describe('linkedin import route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
    state.checkBurstLimit.mockResolvedValue(true)
    state.isRateLimited.mockResolvedValue(false)
    state.logEvent.mockResolvedValue(undefined)
    state.anthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: JSON.stringify({ full_name: 'Ada Lovelace' }) }] })
    state.createClient.mockResolvedValue({})
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new Response(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/linkedin-import', {
      method: 'POST',
      body: JSON.stringify({ text: 'Resume text '.repeat(10) }),
    }))

    expect(response.status).toBe(401)
  })

  it('returns rate limit responses before analysis', async () => {
    state.checkBurstLimit.mockResolvedValueOnce(false)

    const response = await POST(new NextRequest('https://startingmonday.app/api/linkedin-import', {
      method: 'POST',
      body: JSON.stringify({ text: 'Resume text '.repeat(10) }),
    }))

    expect(response.status).toBe(429)
    expect(await response.json()).toEqual({ error: 'Too many requests. Wait a moment.' })
  })

  it('parses the model response and returns structured data', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/linkedin-import', {
      method: 'POST',
      body: JSON.stringify({ text: 'Resume text '.repeat(10) }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ full_name: 'Ada Lovelace' })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'linkedin_imported', { full_parse: true })
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'linkedin_imported', { full_parse: true })
  })
})
