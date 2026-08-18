import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  isRateLimited: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/api-usage', () => ({ isRateLimited: state.isRateLimited }))
vi.mock('@/lib/supabase/server', () => ({ createClient: async () => ({ from: () => ({ update: () => ({ eq: async () => ({ error: null }) }) }) }) }))
vi.mock('@/lib/anthropic', () => ({ anthropic: { messages: { create: vi.fn() } }, MODELS: { haiku: 'haiku' } }))

import { POST } from './route'

describe('upload-resume route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.isRateLimited.mockResolvedValue(false)
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/profile/upload-resume', { method: 'POST', body: new FormData() })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 429 when usage is rate-limited', async () => {
    state.isRateLimited.mockResolvedValue(true)
    const req = new NextRequest('https://startingmonday.app/api/profile/upload-resume', { method: 'POST', body: new FormData() })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 400 when no file is provided', async () => {
    const req = new NextRequest('https://startingmonday.app/api/profile/upload-resume', { method: 'POST', body: new FormData() })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 415 for unsupported file type', async () => {
    const form = new FormData()
    form.set('file', new File([new Uint8Array([1, 2, 3, 4])], 'resume.txt', { type: 'text/plain' }))
    const req = new NextRequest('https://startingmonday.app/api/profile/upload-resume', { method: 'POST', body: form })
    const res = await POST(req)
    expect(res.status).toBe(415)
  })
})
