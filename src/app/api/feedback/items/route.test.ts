import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  createAdminClient: vi.fn(),
  sendEmail: vi.fn(),
  getNotifyEmails: vi.fn(),
  anthropicCreate: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/email/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/email/owner-email', () => ({ getNotifyEmails: state.getNotifyEmails }))
vi.mock('@/lib/anthropic', () => ({
  anthropic: { messages: { create: state.anthropicCreate } },
  MODELS: { haiku: 'haiku-test' },
  TEMP: { extract: 0.2 },
}))

import { GET, POST } from './route'

describe('feedback items route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true as const, userId: 'user-1', response: new Response() })
    state.getNotifyEmails.mockReturnValue([])
    state.anthropicCreate.mockResolvedValue({ content: [{ type: 'text', text: 'Sentiment: mixed' }] })
    state.createClient.mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }) },
      from(table: string) {
        if (table === 'feedback_items') {
          return {
            select: vi.fn((_columns: string, options?: { count?: 'exact'; head?: boolean }) => {
              if (options?.head) {
                return { eq: vi.fn().mockReturnValue({ gt: vi.fn().mockResolvedValue({ count: 0 }) }) }
              }
              return {
                eq: vi.fn().mockReturnThis(),
                or: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                range: vi.fn().mockResolvedValue({ data: [{ id: 'item-1', title: 'Great', body: 'Great feature', category: 'feature_request', user_id: 'user-1' }], error: null, count: 1 }),
              }
            }),
            insert: vi.fn().mockReturnValue({ select: () => ({ single: vi.fn().mockResolvedValue({ data: { id: 'item-new', title: 'Great', body: 'Great feature' }, error: null }) }) }),
          }
        }
        if (table === 'feedback_votes') {
          return {
            select: vi.fn(() => ({ in: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: [{ item_id: 'item-1' }], error: null }) }) })),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn().mockReturnValue({ maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Ada Lovelace' }, error: null }) }),
              in: vi.fn().mockResolvedValue({ data: [{ user_id: 'user-1', full_name: 'Ada Lovelace' }], error: null }),
            })),
          }
        }
        return {}
      },
    })
    state.createAdminClient.mockResolvedValue({
      auth: { admin: { getUserById: vi.fn().mockResolvedValue({ data: { user: { email: 'user@example.com' } } }) } },
      from: () => ({ select: () => ({ eq: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: { full_name: 'Ada Lovelace' } }) }) }) }),
    })
  })

  it('returns unauthorized when no user is present', async () => {
    state.createClient.mockResolvedValueOnce({ auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) } })

    const response = await GET(new NextRequest('https://startingmonday.app/api/feedback/items'), {})

    expect(response.status).toBe(401)
  })

  it('returns feedback items with vote state', async () => {
    const response = await GET(new NextRequest('https://startingmonday.app/api/feedback/items?search=Great'), {})

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      items: [{
        id: 'item-1',
        title: 'Great',
        body: 'Great feature',
        category: 'feature_request',
        user_id: 'user-1',
        user_profiles: { full_name: 'Ada Lovelace' },
        user_voted: true,
      }],
      count: 1,
    })
  })

  it('validates and stores feedback submissions', async () => {
    const invalid = await POST(new NextRequest('https://startingmonday.app/api/feedback/items', {
      method: 'POST',
      body: JSON.stringify({ title: 'Bad', body: 'short', category: 'bug' }),
    }), {})

    expect(invalid.status).toBe(400)

    const response = await POST(new NextRequest('https://startingmonday.app/api/feedback/items', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Great feature',
        body: 'This would help a lot and is long enough.',
        category: 'feature_request',
      }),
    }), {})

    expect(response.status).toBe(201)
    const payload = await response.json()
    expect(payload.message).toContain('Thank you for your feedback')
  })
})
