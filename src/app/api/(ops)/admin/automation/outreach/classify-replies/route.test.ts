import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  createClient: vi.fn(),
  getStaffMember: vi.fn(),
  getUser: vi.fn(),
  listInbox: vi.fn(),
  updateInbox: vi.fn(),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/supabase/server', () => ({ createClient: state.createClient }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))

import { POST } from './route'

function buildSupabase() {
  return {
    auth: { getUser: state.getUser },
    from: vi.fn((table: string) => {
      if (table !== 'outreach_reply_inbox') throw new Error(`Unexpected table ${table}`)
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            is: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: state.listInbox,
              })),
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: state.updateInbox,
          })),
        })),
      }
    }),
  }
}

describe('src/app/api/admin/automation/outreach/classify-replies/route.ts', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'user-1' })
    state.getUser.mockResolvedValue({ data: { user: { email: 'staff@startingmonday.com' } } })
    state.getStaffMember.mockResolvedValue({ id: 'staff-1' })
    state.listInbox.mockResolvedValue({
      data: [
        { id: 'm1', body: 'Sounds good, lets meet next week.' },
        { id: 'm2', body: 'Please remove me from this list.' },
        { id: 'm3', body: 'Thanks for the note.' },
      ],
    })
    state.updateInbox.mockResolvedValue({ error: null })
    state.createClient.mockResolvedValue(buildSupabase())
  })

  it('returns auth response when requireAuth fails', async () => {
    const denied = NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    state.requireAuth.mockResolvedValue({ ok: false, response: denied })

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/classify-replies', { method: 'POST' }))

    expect(res.status).toBe(401)
    await expect(res.json()).resolves.toMatchObject({ error: 'Unauthorized' })
  })

  it('returns 403 when caller is not staff', async () => {
    state.getStaffMember.mockResolvedValue(null)

    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/classify-replies', { method: 'POST' }))

    expect(res.status).toBe(403)
    await expect(res.json()).resolves.toMatchObject({ error: 'Forbidden' })
  })

  it('classifies replies and returns label counts', async () => {
    const res = await POST(new NextRequest('https://startingmonday.app/api/admin/automation/outreach/classify-replies', {
      method: 'POST',
      body: JSON.stringify({ limit: 20 }),
    }))

    expect(state.updateInbox).toHaveBeenCalledTimes(3)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      processed: 3,
      counts: {
        interested: 1,
        not_interested: 1,
        neutral: 1,
      },
    })
  })
})
