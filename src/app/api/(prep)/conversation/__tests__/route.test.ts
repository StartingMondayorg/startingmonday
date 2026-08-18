import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

vi.mock('@/lib/require-auth')
vi.mock('@/lib/supabase/server')

import { PUT, DELETE, GET } from '../route'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'

const mockRequireAuth = vi.mocked(requireAuth)
const mockCreateClient = vi.mocked(createClient)

function authedRequest(body: unknown, method = 'PUT') {
  return new NextRequest('https://startingmonday.app/api/conversation', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'assistant',
    content: `message ${i}`,
  }))
}

function makeSupabase() {
  const mockSingle = vi.fn().mockResolvedValue({ data: { id: 'conv-id-1' } })
  const mockSelectForInsert = vi.fn().mockReturnValue({ single: mockSingle })
  const mockInsert = vi.fn().mockReturnValue({ select: mockSelectForInsert })
  const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null })
  // Self-referential chain that responds to .eq(), .select(), .order(), .limit(), .maybeSingle()
  const chain: Record<string, unknown> = {}
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.select = vi.fn().mockReturnValue(chain)
  chain.order = vi.fn().mockReturnValue(chain)
  chain.limit = vi.fn().mockReturnValue(chain)
  chain.maybeSingle = mockMaybeSingle
  chain.update = vi.fn().mockReturnValue(chain)
  chain.delete = vi.fn().mockReturnValue(chain)
  chain.insert = mockInsert
  const mockFrom = vi.fn().mockReturnValue(chain)
  return { from: mockFrom, mockFrom, mockInsert, mockSingle } as unknown as Awaited<ReturnType<typeof createClient>> & {
    mockFrom: typeof mockFrom
    mockInsert: typeof mockInsert
    mockSingle: typeof mockSingle
  }
}

beforeEach(() => {
  vi.resetAllMocks()
  mockRequireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new NextResponse() })
})

// ─── 200-message cap ────────────────────────────────────────────────────────

describe('PUT /api/conversation - message count validation', () => {
  it('returns 400 when messages array has 201 items', async () => {
    const req = authedRequest({ messages: makeMessages(201) })
    const res = await PUT(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Too many messages')
  })

  it('returns 400 when messages array has 300 items', async () => {
    const req = authedRequest({ messages: makeMessages(300) })
    const res = await PUT(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toBe('Too many messages')
  })

  it('accepts exactly 200 messages', async () => {
    const supabase = makeSupabase()
    mockCreateClient.mockResolvedValue(supabase)
    const req = authedRequest({ messages: makeMessages(200) })
    const res = await PUT(req)
    expect(res.status).not.toBe(400)
  })

  it('accepts 1 message', async () => {
    const supabase = makeSupabase()
    mockCreateClient.mockResolvedValue(supabase)
    const req = authedRequest({ messages: makeMessages(1) })
    const res = await PUT(req)
    expect(res.status).not.toBe(400)
  })
})

// ─── Structural validation ────────────────────────────────────────────────────

describe('PUT /api/conversation - input validation', () => {
  it('returns 400 when messages is not an array', async () => {
    const req = authedRequest({ messages: 'not an array' })
    const res = await PUT(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/array/)
  })

  it('returns 400 for invalid JSON body', async () => {
    const req = new NextRequest('https://startingmonday.app/api/conversation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json{{{',
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when a message is missing role or content', async () => {
    const req = authedRequest({ messages: [{ role: 'user' }] })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when a message content exceeds 20k characters', async () => {
    const req = authedRequest({
      messages: [{ role: 'user', content: 'x'.repeat(20_001) }],
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 401 when unauthenticated', async () => {
    mockRequireAuth.mockResolvedValue({ ok: false as const, response: new NextResponse(null, { status: 401 }) })
    const req = authedRequest({ messages: makeMessages(1) })
    const res = await PUT(req)
    expect(res.status).toBe(401)
  })
})

// ─── Success path ────────────────────────────────────────────────────────────

describe('PUT /api/conversation - success path', () => {
  it('creates a new conversation and returns the id', async () => {
    const supabase = makeSupabase()
    mockCreateClient.mockResolvedValue(supabase)
    const req = authedRequest({ messages: makeMessages(2) })
    const res = await PUT(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe('conv-id-1')
  })
})
