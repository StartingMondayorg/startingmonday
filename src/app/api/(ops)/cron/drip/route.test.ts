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

describe('drip cron route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    process.env.CRON_SECRET = 'test-cron-secret'
    state.validateCronRequest.mockReturnValue(true)
    state.sendEmail.mockResolvedValue({ data: { id: 'msg-1' } })
  })

  it('rejects requests without a valid cron secret', async () => {
    state.validateCronRequest.mockReturnValueOnce(false)

    const response = await GET(new NextRequest('https://startingmonday.app/api/cron/drip'))

    expect(response.status).toBe(403)
    expect(await response.json()).toEqual({ error: 'Forbidden' })
  })

  it('returns zero counts when there are no eligible trial users', async () => {
    state.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })

    const response = await GET(new NextRequest('https://startingmonday.app/api/cron/drip', { headers: { 'x-cron-secret': 'test-cron-secret' } }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ sent: 0, skipped: 0 })
    expect(state.sendEmail).not.toHaveBeenCalled()
  })

  it('sends drip mail for a trial user and records the send', async () => {
    const dripInsert = vi.fn().mockResolvedValue({ error: null })
    const usersSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        is: vi.fn().mockResolvedValue({
          data: [
            { id: 'user-1', email: 'user@example.com', created_at: new Date().toISOString(), first_company_added_at: null },
          ],
          error: null,
        }),
      }),
    })
    const sentSelect = vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [], error: null }) })
    const profileSelect = vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [{ user_id: 'user-1', full_name: 'Ada Lovelace' }], error: null }) })
    const companySelect = vi.fn().mockReturnValue({ in: vi.fn().mockReturnValue({ is: vi.fn().mockResolvedValue({ data: [], error: null }) }) })

    state.from.mockImplementation((table: string) => {
      if (table === 'users') return { select: usersSelect }
      if (table === 'drip_sends') return { select: sentSelect, upsert: dripInsert }
      if (table === 'user_profiles') return { select: profileSelect }
      if (table === 'companies') return { select: companySelect }
      return { select: vi.fn(), upsert: dripInsert }
    })

    const response = await GET(new NextRequest('https://startingmonday.app/api/cron/drip', { headers: { 'x-cron-secret': 'test-cron-secret' } }))

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ sent: expect.any(Number), users: 1 })
    expect(state.sendEmail).toHaveBeenCalled()
    expect(dripInsert).toHaveBeenCalled()
  })
})
