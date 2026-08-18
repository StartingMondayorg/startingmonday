import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  guard: vi.fn(),
  insert: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/public-endpoint-guard', () => ({ enforcePublicEndpointGuard: state.guard }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: () => ({ insert: state.insert }) }) }))
vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/owner-email', () => ({ getOwnerEmail: () => 'owner@example.com' }))

import { POST } from './route'

describe('pilot outreach route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.guard.mockResolvedValue(null)
    state.insert.mockResolvedValue({ error: null })
    state.sendEmail.mockReturnValue({ catch: vi.fn() })
  })

  it('returns the guard response when blocked', async () => {
    state.guard.mockResolvedValueOnce(new Response(JSON.stringify({ ok: false }), { status: 429 }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/pilot-outreach', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', email: 'ada@example.com', company: 'Acme' }),
    }))

    expect(response.status).toBe(429)
  })

  it('rejects missing required fields', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/pilot-outreach', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada', email: 'ada@example.com' }),
    }))

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Missing required fields' })
  })

  it('stores the inquiry and notifies the owner', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/pilot-outreach', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada Lovelace', email: 'ada@example.com', company: 'Acme', message: 'Interested' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
    expect(state.insert).toHaveBeenCalledWith({ name: 'Ada Lovelace', email: 'ada@example.com', company: 'Acme', message: 'Interested' })
    expect(state.sendEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'owner@example.com', subject: 'Pilot Outreach: Ada Lovelace (Acme)' }))
  })
})
