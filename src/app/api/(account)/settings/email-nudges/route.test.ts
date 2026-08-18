import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: () => ({
      update: (values: Record<string, unknown>) => {
        state.update(values)
        return { eq: state.eq }
      },
    }),
  }),
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('https://startingmonday.app/api/settings/email-nudges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('email-nudges settings route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.eq.mockResolvedValue({ error: null })
  })

  it('returns the auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: new Response('unauthorized', { status: 401 }) })
    const response = await POST(makeRequest({ enabled: true }))
    expect(response.status).toBe(401)
  })

  it('rejects payloads without a boolean enabled flag', async () => {
    const response = await POST(makeRequest({ enabled: 'yes' }))
    expect(response.status).toBe(400)
    expect(state.update).not.toHaveBeenCalled()
  })

  it('clears drip_unsubscribed_at when enabling nudges', async () => {
    const response = await POST(makeRequest({ enabled: true }))
    expect(response.status).toBe(200)
    expect(state.update).toHaveBeenCalledWith({ drip_unsubscribed_at: null })
  })

  it('sets drip_unsubscribed_at when disabling nudges', async () => {
    const response = await POST(makeRequest({ enabled: false }))
    expect(response.status).toBe(200)
    const updated = state.update.mock.calls[0][0]
    expect(typeof updated.drip_unsubscribed_at).toBe('string')
  })

  it('returns 500 when the database update fails', async () => {
    state.eq.mockResolvedValue({ error: { message: 'db down' } })
    const response = await POST(makeRequest({ enabled: false }))
    expect(response.status).toBe(500)
  })
})
