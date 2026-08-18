import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  captureServerEvent: vi.fn(),
  readFile: vi.fn(),
  retrieveGuide: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
  single: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({
  requireAuth: state.requireAuth,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: state.createClient,
}))

vi.mock('@/lib/posthog-server', () => ({
  captureServerEvent: state.captureServerEvent,
}))

vi.mock('@/lib/guide-retrieval', () => ({
  retrieveGuide: state.retrieveGuide,
}))

vi.mock('fs/promises', () => ({
  readFile: state.readFile,
}))

import { POST } from './route'

describe('guide chat route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
    state.readFile.mockResolvedValue(JSON.stringify({ generatedAt: '2026-01-01T00:00:00.000Z', entries: [{ id: '1', title: 'Getting Started', body: 'Setup your account', url: '/guide/getting-started', type: 'article' }] }))
    state.retrieveGuide.mockReturnValue({
      intent: 'getting_started',
      ranked: [],
      confidence: 0.1,
      conservative: true,
    })
    state.single.mockResolvedValue({ data: { id: 'query-1' }, error: null })
    state.insert.mockReturnValue({ select: () => ({ single: state.single }) })
    state.createClient.mockResolvedValue({ from: () => ({ insert: state.insert }) })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })

    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'How do I start?' }),
    }))

    expect(response.status).toBe(401)
  })

  it('returns 400 for short questions', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'hi' }),
    }))

    expect(response.status).toBe(400)
  })

  it('returns a no-match response when retrieval is empty', async () => {
    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'How do I start?' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual(expect.objectContaining({
      sources: [],
      conservative: true,
      queryId: null,
    }))
  })

  it('returns an answered guide response when retrieval finds matches', async () => {
    state.retrieveGuide.mockReturnValue({
      intent: 'getting_started',
      ranked: [
        {
          entry: { id: '1', title: 'Getting Started', body: 'Setup your account', url: '/guide/getting-started', type: 'article' },
          score: 10,
          lexicalScore: 5,
          bm25Score: 3,
          semanticScore: 2,
          snippet: 'Setup your account',
        },
      ],
      confidence: 0.9,
      conservative: false,
    })

    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'How do I start?' }),
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.answer).toContain('Start here:')
    expect(body.queryId).toBe('query-1')
  })

  it('states the trial terms in billing answers', async () => {
    state.retrieveGuide.mockReturnValue({
      intent: 'billing',
      ranked: [
        {
          entry: { id: '1', title: 'Billing settings', body: 'Manage your plan', url: '/settings/billing', type: 'page' },
          score: 10,
          lexicalScore: 5,
          bm25Score: 3,
          semanticScore: 2,
          snippet: 'Manage your plan',
        },
      ],
      confidence: 0.9,
      conservative: false,
    })

    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'How does billing and the free trial work?' }),
    }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.answer).toContain('30 days free, no credit card required, cancel anytime')
    expect(body.answer).not.toContain('automation endpoints')
  })

  it('excludes admin routes and raw API endpoints from customer-facing retrieval', async () => {
    state.readFile.mockResolvedValue(JSON.stringify({
      generatedAt: '2026-01-01T00:00:00.000Z',
      entries: [
        { id: '1', title: 'Getting Started', body: 'Setup your account', url: '/guide/getting-started', type: 'article' },
        { id: '2', title: 'Admin Revenue', body: 'Internal revenue ops', url: '/dashboard/admin/revenue', type: 'page' },
        { id: '3', title: 'Billing retries API', body: 'Automation endpoint', url: '/api/admin/automation/billing/failed-payment-retries', type: 'api' },
      ],
    }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'How does billing work?' }),
    }))

    expect(response.status).toBe(200)
    expect(state.retrieveGuide).toHaveBeenCalledTimes(1)
    const entriesPassed = state.retrieveGuide.mock.calls[0][0]
    expect(entriesPassed).toHaveLength(1)
    expect(entriesPassed[0].url).toBe('/guide/getting-started')
  })

  it('returns 503 when only internal entries exist in the index', async () => {
    state.readFile.mockResolvedValue(JSON.stringify({
      generatedAt: '2026-01-01T00:00:00.000Z',
      entries: [
        { id: '2', title: 'Admin Revenue', body: 'Internal revenue ops', url: '/dashboard/admin/revenue', type: 'page' },
      ],
    }))

    const response = await POST(new NextRequest('https://startingmonday.app/api/guide/chat', {
      method: 'POST',
      body: JSON.stringify({ question: 'How does billing work?' }),
    }))

    expect(response.status).toBe(503)
    expect(state.retrieveGuide).not.toHaveBeenCalled()
  })
})
