import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: state.createAdminClient,
}))

import { POST } from './route'

describe('google calendar disconnect route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
    state.maybeSingle.mockResolvedValue({ data: { id: 'integration-1' }, error: null })
    state.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
    state.createClient.mockResolvedValue({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) } })
    state.createAdminClient.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({ maybeSingle: state.maybeSingle }),
        }),
        update: state.update,
      }),
    })
  })

  it('redirects to login when unauthenticated', async () => {
    state.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    })

    const response = await POST(new NextRequest('https://startingmonday.app/api/google-calendar/disconnect', { method: 'POST' }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://startingmonday.app/login')
  })

  it('returns JSON when the client requests JSON', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/google-calendar/disconnect', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnTo: '/dashboard/coach' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, disconnected: true, returnTo: '/dashboard/coach' })
  })

  it('falls back to a redirect when the request is form-based', async () => {
    const body = new FormData()
    body.set('returnTo', '/dashboard/coach')

    const response = await POST(new NextRequest('https://startingmonday.app/api/google-calendar/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    }))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe('https://startingmonday.app/dashboard/admin/social')
  })
})
