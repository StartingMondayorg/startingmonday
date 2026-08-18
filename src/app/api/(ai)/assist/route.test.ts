import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  burstLimit: vi.fn(),
  insert: vi.fn(),
  getUser: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({
  enforcePublicEndpointGuard: state.guard,
}))

vi.mock('@/lib/burst-limit', () => ({
  checkBurstLimit: state.burstLimit,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: state.getUser },
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({
    from: () => ({
      insert: state.insert,
    }),
  }),
}))

vi.mock('@/lib/owner-email', () => ({
  getNotifyEmails: () => ['richard@startingmonday.app'],
}))

vi.mock('@/lib/email', () => ({
  sendEmail: state.sendEmail,
}))

import { POST } from './route'

function makeRequest(body: unknown) {
  return new NextRequest('https://startingmonday.app/api/assist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('assist route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.burstLimit.mockResolvedValue(true)
    state.insert.mockResolvedValue({ error: null })
    state.getUser.mockResolvedValue({ data: { user: null } })
    state.sendEmail.mockResolvedValue({ data: { id: 'msg_1' } })
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValue(new Response(JSON.stringify({ ok: false }), { status: 429 }))
    const response = await POST(makeRequest({ kind: 'feedback', message: 'This is real feedback' }))
    expect(response.status).toBe(429)
  })

  it('rejects messages under 10 characters', async () => {
    const response = await POST(makeRequest({ kind: 'question', message: 'short' }))
    expect(response.status).toBe(400)
    expect(state.insert).not.toHaveBeenCalled()
  })

  it('rejects messages over 2000 characters', async () => {
    const response = await POST(makeRequest({ kind: 'feedback', message: 'x'.repeat(2001) }))
    expect(response.status).toBe(400)
    expect(state.insert).not.toHaveBeenCalled()
  })

  it('returns 429 when the burst limit is exceeded', async () => {
    state.burstLimit.mockResolvedValueOnce(false)
    const response = await POST(makeRequest({ kind: 'feedback', message: 'This is real feedback' }))
    expect(response.status).toBe(429)
  })

  it('stores anonymous submissions and notifies by email', async () => {
    const response = await POST(makeRequest({
      kind: 'question',
      message: 'How does the trial billing work exactly?',
      email: 'visitor@example.com',
      page: '/pricing',
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.insert).toHaveBeenCalledTimes(1)
    const inserted = state.insert.mock.calls[0][0]
    expect(inserted.body).toContain('[Question]')
    expect(inserted.body).toContain('/pricing')
    expect(inserted.body).toContain('visitor@example.com')

    // fire-and-forget notify: flush microtasks
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(state.sendEmail).toHaveBeenCalledTimes(1)
    const emailArgs = state.sendEmail.mock.calls[0][0]
    expect(JSON.stringify(emailArgs.to)).toContain('richard@startingmonday.app')
  })

  it('stores authenticated submissions on the feedback board', async () => {
    state.getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'member@example.com' } } })

    const response = await POST(makeRequest({
      kind: 'feedback',
      message: 'The briefing timing feature is excellent.',
      page: '/dashboard',
    }))

    expect(response.status).toBe(200)
    expect(state.insert).toHaveBeenCalledTimes(1)
    const inserted = state.insert.mock.calls[0][0]
    expect(inserted.user_id).toBe('user-1')
    expect(inserted.type).toBe('feedback')
    expect(inserted.category).toBe('other')
    expect(inserted.title).toContain('Feedback:')
  })

  it('falls back to the public store when the board insert fails', async () => {
    state.getUser.mockResolvedValue({ data: { user: { id: 'user-1', email: 'member@example.com' } } })
    state.insert
      .mockResolvedValueOnce({ error: { message: 'rls violation' } })
      .mockResolvedValueOnce({ error: null })

    const response = await POST(makeRequest({
      kind: 'feedback',
      message: 'The briefing timing feature is excellent.',
    }))

    expect(response.status).toBe(200)
    expect(state.insert).toHaveBeenCalledTimes(2)
  })
})
