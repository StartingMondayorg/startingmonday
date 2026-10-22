import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  from: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    from: (table: string) => {
      state.from(table)
      return {
        update: (values: Record<string, unknown>) => {
          state.update(values)
          return { eq: state.eq }
        },
      }
    },
  }),
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('https://startingmonday.app/api/settings/weekly-summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('weekly-summary settings route', () => {
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

  it('writes the opt-in flag to the profile row for the authenticated user', async () => {
    const response = await POST(makeRequest({ enabled: true }))
    expect(response.status).toBe(200)
    expect(state.from).toHaveBeenCalledWith('user_profiles')
    expect(state.update).toHaveBeenCalledWith({ weekly_summary_opt_in: true })
    expect(state.eq).toHaveBeenCalledWith('user_id', 'user-1')
  })

  it('clears the opt-in flag when disabling', async () => {
    const response = await POST(makeRequest({ enabled: false }))
    expect(response.status).toBe(200)
    expect(state.update).toHaveBeenCalledWith({ weekly_summary_opt_in: false })
  })

  it('returns 500 when the database update fails', async () => {
    state.eq.mockResolvedValue({ error: { message: 'db down' } })
    const response = await POST(makeRequest({ enabled: true }))
    expect(response.status).toBe(500)
  })
})
