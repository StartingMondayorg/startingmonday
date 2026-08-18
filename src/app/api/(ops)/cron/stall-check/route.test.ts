import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const state = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  from: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest: state.validateCronRequest }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({ from: state.from }) }))
vi.mock('@/lib/email', () => ({ sendEmail: state.sendEmail }))
vi.mock('@/lib/config', () => ({ APP_URL: 'https://startingmonday.app' }))
vi.mock('@/lib/unsubscribe-token', () => ({ unsubscribeUrl: (userId: string) => `https://example.com/unsubscribe/${userId}` }))

import { GET } from './route'

describe('stall check cron route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
    state.validateCronRequest.mockReturnValue(true)
    state.sendEmail.mockResolvedValue({ data: { id: 'msg-1' } })
  })

  it('rejects requests without a valid cron secret', async () => {
    state.validateCronRequest.mockReturnValueOnce(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/cron/stall-check'))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns zero sent when there are no stalled users', async () => {
    state.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        not: vi.fn().mockReturnValue({
          lte: vi.fn().mockReturnValue({
            is: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        }),
      }),
    })

    const response = await GET(new NextRequest('https://startingmonday.app/api/cron/stall-check', { headers: { 'x-cron-secret': 'test-cron-secret' } }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ sent: 0 })
    expect(state.sendEmail).not.toHaveBeenCalled()
  })
})
