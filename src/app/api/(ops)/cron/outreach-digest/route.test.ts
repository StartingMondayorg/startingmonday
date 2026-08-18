import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  sendEmail: vi.fn(),
  from: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest: state.validateCronRequest }))
vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/owner-email', () => ({ getOwnerEmail: () => 'richard@startingmonday.app' }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: state.from }) }))

import { GET } from './route'

describe('outreach-digest cron route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.validateCronRequest.mockReturnValue(true)
    state.sendEmail.mockResolvedValue({ data: { id: 'msg_1' } })

    state.from.mockImplementation((_table: string) => {
      const chain = {
        select: vi.fn(() => chain),
        gte: vi.fn(() => chain),
        lt: vi.fn(() => chain),
        order: vi.fn(() => chain),
        limit: vi.fn(async () => ({
          data: [
            {
              id: 'log_1',
              recipient_email: 'alex@example.com',
              recipient_name: 'Alex Morgan',
              subject: 'Hello',
              outreach_channel: 'executives',
              fit_tier: null,
              send_mode: 'live',
              delivery_status: 'sent',
              resend_message_id: 'msg_1',
              sent_at: new Date().toISOString(),
            },
          ],
          error: null,
        })),
      }
      return chain
    })
  })

  it('uses richard mailbox in from and reply-to', async () => {
    const req = new NextRequest('https://startingmonday.app/api/cron/outreach-digest')
    const res = await GET(req)

    expect(res.status).toBe(200)
    expect(state.sendEmail).toHaveBeenCalledTimes(1)
    expect(state.sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      from: expect.stringMatching(/richard@startingmonday\.app/i),
      replyTo: 'richard@startingmonday.app',
    }))
  })
})
