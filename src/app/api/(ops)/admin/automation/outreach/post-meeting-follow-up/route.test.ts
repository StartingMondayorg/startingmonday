import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getStaffMember: vi.fn(),
  sendEmail: vi.fn(),
  meetingFollowUpUpdateEq: vi.fn(async () => ({ error: null })),
  followUpsInsert: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { email: 'owner@startingmonday.app' } } })) },
    from: (table: string) => {
      if (table === 'meeting_bookings') {
        const selectChain = {
          eq: vi.fn(() => selectChain),
          is: vi.fn(() => selectChain),
          order: vi.fn(() => selectChain),
          limit: vi.fn(async () => ({
            data: [
              {
                id: 'mtg_1',
                contact_id: 'ct_1',
                email: 'alex@example.com',
                full_name: 'Alex Morgan',
                company: 'Acme',
                scheduled_for: '2026-05-20T16:00:00.000Z',
              },
            ],
          })),
        }
        const updateChain = {
          eq: vi.fn(() => updateChain),
        }
        return {
          select: vi.fn(() => selectChain),
          update: vi.fn(() => updateChain),
        }
      }
      if (table === 'follow_ups') {
        return {
          insert: state.followUpsInsert,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }),
}))

import { POST } from './route'

describe('post-meeting-follow-up outreach automation route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.getStaffMember.mockResolvedValue({ id: 'staff_1' })
    state.sendEmail.mockResolvedValue({ data: { id: 'msg_1' } })
  })

  it('uses richard mailbox in from and reply-to when sending live', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/outreach/post-meeting-follow-up', {
      method: 'POST',
      body: JSON.stringify({ sendLive: true, limit: 1 }),
      headers: { 'Content-Type': 'application/json' },
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(state.sendEmail).toHaveBeenCalledTimes(1)
    expect(state.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.stringMatching(/richard@startingmonday\.app/i),
      replyTo: 'richard@startingmonday.app',
    }))
  })
})
