import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  getStaffMember: vi.fn(),
  sendEmail: vi.fn(),
  outreachLogsInsert: vi.fn(async () => ({ error: null })),
  contactsUpdateEq: vi.fn(async () => ({ error: null })),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { email: 'owner@startingmonday.app' } } })) },
    from: (table: string) => {
      if (table === 'outreach_suppressions') {
        const chain = {
          select: vi.fn(() => chain),
          eq: vi.fn(() => chain),
        }
        return chain
      }
      if (table === 'contacts') {
        const selectChain = {
          eq: vi.fn(() => selectChain),
          not: vi.fn(() => selectChain),
          limit: vi.fn(async () => ({
            data: [
              { id: 'ct_1', name: 'Alex Morgan', firm: 'Acme', email: 'alex@example.com' },
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
      if (table === 'outreach_logs') {
        return {
          insert: state.outreachLogsInsert,
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    },
  }),
}))

import { POST } from './route'

describe('initial-sequences outreach automation route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.getStaffMember.mockResolvedValue({ id: 'staff_1' })
    state.sendEmail.mockResolvedValue({ data: { id: 'msg_1' } })
  })

  it('uses richard mailbox in from and reply-to when sending live', async () => {
    const req = new NextRequest('https://startingmonday.app/api/admin/automation/outreach/initial-sequences', {
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