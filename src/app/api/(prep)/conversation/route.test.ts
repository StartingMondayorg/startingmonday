import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  select: vi.fn(),
  maybeSingle: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))

import { DELETE, GET, PUT } from './route'

describe('conversation route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
    state.select.mockReturnValue({
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: state.maybeSingle,
      single: vi.fn().mockResolvedValue({ data: { id: 'conv-1' } }),
    })
    state.update.mockReturnValue({ eq: vi.fn().mockReturnThis() })
    state.insert.mockReturnValue({ select: vi.fn().mockReturnValue({ single: vi.fn().mockResolvedValue({ data: { id: 'conv-new' } }) }) })
    state.delete.mockReturnValue({ eq: vi.fn().mockReturnThis() })
    state.createClient.mockResolvedValue({
      from: () => ({
        select: state.select,
        update: state.update,
        insert: state.insert,
        delete: state.delete,
      }),
    })
  })

  it('returns auth response when unauthenticated', async () => {
    state.requireAuth.mockResolvedValueOnce({ ok: false as const, response: new Response(null, { status: 401 }) })

    const response = await GET(new NextRequest('https://startingmonday.app/api/conversation'))

    expect(response.status).toBe(401)
  })

  it('returns the latest conversation for GET', async () => {
    state.maybeSingle.mockResolvedValue({ data: { id: 'conv-1', messages: [{ role: 'user', content: 'hi' }] } })

    const response = await GET(new NextRequest('https://startingmonday.app/api/conversation'))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'conv-1', messages: [{ role: 'user', content: 'hi' }] })
  })

  it('validates PUT payloads and stores a new conversation', async () => {
    const invalid = await PUT(new NextRequest('https://startingmonday.app/api/conversation', {
      method: 'PUT',
      body: '{',
    }))
    expect(invalid.status).toBe(400)

    const response = await PUT(new NextRequest('https://startingmonday.app/api/conversation', {
      method: 'PUT',
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello there' }] }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ id: 'conv-new' })
  })

  it('updates an existing conversation and rate limits fast repeats', async () => {
    state.maybeSingle.mockResolvedValue({ data: { updated_at: new Date(Date.now() - 100).toISOString() } })

    const limited = await PUT(new NextRequest('https://startingmonday.app/api/conversation', {
      method: 'PUT',
      body: JSON.stringify({ conversationId: 'conv-1', messages: [{ role: 'user', content: 'Hello there' }] }),
    }))

    expect(limited.status).toBe(429)

    state.maybeSingle.mockResolvedValueOnce({ data: { updated_at: new Date(Date.now() - 1000).toISOString() } })
    const updated = await PUT(new NextRequest('https://startingmonday.app/api/conversation', {
      method: 'PUT',
      body: JSON.stringify({ conversationId: 'conv-1', messages: [{ role: 'user', content: 'Hello there' }] }),
    }))

    expect(updated.status).toBe(200)
    expect(await updated.json()).toEqual({ id: 'conv-1' })
  })

  it('deletes a conversation when requested', async () => {
    const response = await DELETE(new NextRequest('https://startingmonday.app/api/conversation', {
      method: 'DELETE',
      body: JSON.stringify({ conversationId: 'conv-1' }),
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true })
  })
})
