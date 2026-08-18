import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  sendEmail: vi.fn(),
  getNotifyEmails: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/email', () => ({
  sendEmail: state.sendEmail,
}))

vi.mock('@/lib/owner-email', () => ({
  getNotifyEmails: state.getNotifyEmails,
}))

import { POST } from './route'

describe('notify new user route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.getNotifyEmails.mockReturnValue(['owner@example.com'])
    state.sendEmail.mockResolvedValue(undefined)
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValue(NextResponse.json({ error: 'rate limited' }, { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/notify/new-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com' }),
    }))

    expect(response.status).toBe(429)
  })

  it('returns ok when there is no email or no notify recipients', async () => {
    state.getNotifyEmails.mockReturnValue([])

    const response = await POST(new NextRequest('https://startingmonday.app/api/notify/new-user', {
      method: 'POST',
      body: JSON.stringify({ email: '' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.sendEmail).not.toHaveBeenCalled()
  })

  it('sends a registration email to notify recipients', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/notify/new-user', {
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', username: 'New User', tier: 'executive', source: 'landing', is_staging: true }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'owner@example.com',
      subject: 'New User Registered! - staging',
      bypassCouncil: true,
    }))
  })
})
