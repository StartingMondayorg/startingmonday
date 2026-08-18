import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  single: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/events', () => ({
  logEvent: state.logEvent,
}))

vi.mock('@/lib/posthog-server', () => ({
  captureServerEvent: state.captureServerEvent,
}))

import { PMF_EVENTS } from '@/lib/pmf-event-taxonomy'
import { POST } from './route'

describe('companies quick add route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.single.mockResolvedValue({ data: { id: 'company-1', name: 'Acme', stage: 'watching' }, error: null })
    state.select.mockReturnValue({ single: state.single })
    state.insert.mockReturnValue({ select: state.select })
    state.createClient.mockResolvedValue({ from: () => ({ insert: state.insert }) })
  })

  it('returns 400 for missing name', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/companies/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '   ' }),
    }))

    expect(response.status).toBe(400)
    expect(state.createClient).not.toHaveBeenCalled()
  })

  it('creates a company and records activation events', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/companies/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Acme' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'company-1', name: 'Acme', stage: 'watching' })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'company_added', { source: 'quick_add' })
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'company_added', { source: 'quick_add' })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', PMF_EVENTS.activation.first_company_added, {
      source: 'quick_add',
      company_id: 'company-1',
    })
  })

  it('maps duplicate inserts to a conflict response', async () => {
    state.single.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } })

    const response = await POST(new NextRequest('https://startingmonday.app/api/companies/quick-add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Acme' }),
    }))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'already_exists' })
  })
})
