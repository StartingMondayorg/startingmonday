import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  getUser: vi.fn(),
  getStaff: vi.fn(),
  from: vi.fn(),
  evaluate: vi.fn(),
  getNoteToken: vi.fn(),
  setNoteToken: vi.fn(),
  updatePayload: null as Record<string, unknown> | null,
  fromCalls: 0,
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: state.getUser },
  }),
}))
vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: state.from }),
}))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaff }))
vi.mock('@/lib/social-council-check', () => ({
  ALLOWED_EMOTIONAL_ANGLES: ['authority', 'relatable'],
  evaluateShortFormCouncilCheck: state.evaluate,
  getNoteToken: state.getNoteToken,
  setNoteToken: state.setNoteToken,
}))

import { POST } from './route'

describe('admin social council-check route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.updatePayload = null
    state.fromCalls = 0
    state.getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'staff@example.com' } } })
    state.getStaff.mockResolvedValue({ id: 'staff_1' })
    state.evaluate.mockReturnValue({ score: 91, councilPass: true, textHash: 'h1' })
    state.getNoteToken.mockReturnValue('authority')
    state.setNoteToken.mockImplementation((notes: string | null, key: string, value: string) => `${notes ?? ''};${key}=${value}`)

    state.from.mockImplementation(() => {
      state.fromCalls += 1

      if (state.fromCalls === 1) {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
          single: vi.fn(async () => ({
            data: {
              id: 'post_1',
              post_date: '2026-05-20',
              draft_text: 'Existing draft',
              notes: null,
            },
            error: null,
          })),
        }
        return chain
      }

      if (state.fromCalls === 2) {
        const chain = {
          select: vi.fn(() => chain),
          lt: vi.fn(() => chain),
          order: vi.fn(() => chain),
          limit: vi.fn(() => chain),
          maybeSingle: vi.fn(async () => ({ data: null, error: null })),
        }
        return chain
      }

      const chain = {
        update: vi.fn((payload: Record<string, unknown>) => {
          state.updatePayload = payload
          return chain
        }),
        eq: vi.fn(() => chain),
        select: vi.fn(() => chain),
        single: vi.fn(async () => ({
          data: { id: 'post_1', post_date: '2026-05-20', notes: 'n', draft_text: 'New draft' },
          error: null,
        })),
      }
      return chain
    })
  })

  it('returns 401 when there is no user session', async () => {
    state.getUser.mockResolvedValue({ data: { user: null } })
    const req = new NextRequest('https://startingmonday.app/api/admin/social/post_1/council-check', { method: 'POST', body: '{}' })
    const res = await POST(req, { params: Promise.resolve({ id: 'post_1' }) })

    expect(res.status).toBe(401)
  })

  it('returns 400 when emotional angle is invalid', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/social/post_1/council-check', {
      method: 'POST',
      body: JSON.stringify({ draftText: 'hello', emotionalAngle: 'not-valid' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'post_1' }) })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid or missing emotionalAngle' })
  })

  it('updates the post with normalized draft text and council metadata', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/social/post_1/council-check', {
      method: 'POST',
      body: JSON.stringify({ draftText: '  New draft  ', emotionalAngle: 'authority' }),
    })
    const res = await POST(req, { params: Promise.resolve({ id: 'post_1' }) })

    expect(res.status).toBe(200)
    expect(state.updatePayload).toMatchObject({ draft_text: 'New draft' })
    await expect(res.json()).resolves.toMatchObject({ ok: true })
  })
})
