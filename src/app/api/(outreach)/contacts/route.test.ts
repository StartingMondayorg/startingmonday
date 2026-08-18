import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  contactInsert: vi.fn(),
  contactSelect: vi.fn(),
  contactSingle: vi.fn(),
  logEvent: vi.fn(),
  captureServerEvent: vi.fn(),
  withApiTelemetry: vi.fn((_, handler) => handler),
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

vi.mock('@/lib/telemetry', () => ({
  withApiTelemetry: state.withApiTelemetry,
}))

import { POST } from './route'

describe('contacts route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.contactSingle.mockResolvedValue({ data: { id: 'contact-1', name: 'Ada' }, error: null })
    state.contactSelect.mockReturnValue({ single: state.contactSingle })
    state.contactInsert.mockReturnValue({ select: () => state.contactSelect() })
    state.createClient.mockResolvedValue({ from: () => ({ insert: state.contactInsert }) })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada' }),
    }), {})

    expect(response.status).toBe(401)
  })

  it('rejects missing names', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: '   ' }),
    }), {})

    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Name is required' })
  })

  it('creates a contact and emits telemetry', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/contacts', {
      method: 'POST',
      body: JSON.stringify({ name: 'Ada Lovelace', source: 'manual' }),
    }), {})

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ id: 'contact-1', contact: { id: 'contact-1', name: 'Ada' } })
    expect(state.logEvent).toHaveBeenCalledWith('user-1', 'contact_added', {
      source: 'manual',
      enrichment_source: 'manual',
      has_company_id: false,
    })
    expect(state.captureServerEvent).toHaveBeenCalledWith('user-1', 'contact_added', {
      source: 'manual',
      enrichment_source: 'manual',
      has_company_id: false,
    })
  })
})
