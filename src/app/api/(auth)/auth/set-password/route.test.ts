import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  withAuthCookies: vi.fn((response: NextResponse) => response),
  createClient: vi.fn(),
  updateUser: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
  withAuthCookies: state.withAuthCookies,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

import { POST } from './route'

describe('set password route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.createClient.mockResolvedValue({ auth: { updateUser: state.updateUser } })
    state.updateUser.mockResolvedValue({ error: null })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'Password123!' }),
    }))

    expect(response.status).toBe(401)
  })

  it('rejects short passwords', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'short' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ ok: false, error: 'Password must be at least 8 characters.' })
  })

  it('updates the password and returns a success message', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'Password123!' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true })
    expect(state.updateUser).toHaveBeenCalledWith({ password: 'Password123!' })
  })
})
