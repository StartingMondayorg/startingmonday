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
  logCompanyWatch: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/events', () => ({
  logEvent: state.logEvent,
  logCompanyWatch: state.logCompanyWatch,
}))

vi.mock('@/lib/posthog-server', () => ({
  captureServerEvent: state.captureServerEvent,
}))

import { POST } from './route'

describe('companies route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.single.mockResolvedValue({ data: { id: 'company-1' }, error: null })
    state.select.mockReturnValue({ single: state.single })
    state.insert.mockReturnValue({ select: state.select })
    state.createClient.mockResolvedValue({ from: () => ({ insert: state.insert }) })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/companies', { method: 'POST', body: '{}' }))

    expect(response.status).toBe(401)
  })

  it('returns validation errors for missing company names', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/companies', {
      method: 'POST',
      body: JSON.stringify({ name: '   ' }),
    }))

    expect(response.status).toBe(400)
  })

  it('creates a company and logs activation events', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/companies', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', sector: 'software', fit_score: 8, source: 'manual' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'company-1' })
    expect(state.logEvent).toHaveBeenCalled()
    expect(state.captureServerEvent).toHaveBeenCalled()
    expect(state.logCompanyWatch).toHaveBeenCalledWith('user-1', 'company-1', expect.objectContaining({ fitScore: 8 }))
  })

  it('maps duplicate inserts to a conflict response', async () => {
    state.single.mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate' } })

    const response = await POST(new NextRequest('https://startingmonday.app/api/companies', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme' }),
    }))

    expect(response.status).toBe(409)
    expect(await response.json()).toEqual({ error: 'duplicate' })
  })
})
