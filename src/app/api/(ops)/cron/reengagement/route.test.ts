import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { fromMock, sendEmail } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: fromMock })),
}))

vi.mock('@/lib/email/email', () => ({
  sendEmail,
}))

vi.mock('@/lib/config', () => ({
  APP_URL: 'https://example.com',
}))

vi.mock('@/lib/email/unsubscribe-token', () => ({
  unsubscribeUrl: (userId: string) => `https://example.com/unsubscribe/${userId}`,
}))

import { GET, NUDGE_TYPE } from './route'

function createRequest(headers: Record<string, string> = {}) {
  return new NextRequest('https://example.com/api/cron/reengagement', { headers })
}

describe('src/app/api/cron/reengagement/route.ts', () => {
  beforeEach(() => {
    fromMock.mockReset()
    sendEmail.mockReset()
    process.env.CRON_SECRET = 'test-cron-secret'
  })

  it('rejects requests without a valid cron secret', async () => {
    const response = await GET(createRequest())

    expect(response.status).toBe(403)
    await expect(response.json()).resolves.toEqual({ error: 'Forbidden' })
    expect(fromMock).not.toHaveBeenCalled()
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('rejects requests with a wrong cron secret', async () => {
    const response = await GET(createRequest({ 'x-cron-secret': 'wrong-secret' }))

    expect(response.status).toBe(403)
    expect(fromMock).not.toHaveBeenCalled()
  })

  it('returns zero counts when there are no eligible trial users', async () => {
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      }),
    })

    const response = await GET(createRequest({ 'x-cron-secret': 'test-cron-secret' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ sent: 0, skipped: 0 })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('returns 500 when the trial user query fails', async () => {
    fromMock.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({ data: null, error: { message: 'db unavailable' } }),
        }),
      }),
    })

    const response = await GET(createRequest({ 'x-cron-secret': 'test-cron-secret' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'db unavailable' })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('sends one calm day-14 message, skipping active and already-contacted users', async () => {
    const users = [
      { id: 'away-with-signals', email: 'away@example.com' },
      { id: 'away-no-company', email: 'empty@example.com' },
      { id: 'active', email: 'active@example.com' },
      { id: 'legacy-contacted', email: 'legacy@example.com' },
    ]
    const inserted: Array<Record<string, unknown>> = []

    fromMock.mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: () => ({ eq: () => ({ is: () => Promise.resolve({ data: users, error: null }) }) }),
        }
      }
      if (table === 'user_profiles') {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [{ user_id: 'away-with-signals', full_name: 'Dana Ortiz' }], error: null }),
          }),
        }
      }
      if (table === 'user_events') {
        return {
          select: () => ({ in: () => ({ gte: () => Promise.resolve({ data: [{ user_id: 'active' }], error: null }) }) }),
        }
      }
      if (table === 'company_signals') {
        return {
          select: () => ({
            in: () => ({
              gte: () =>
                Promise.resolve({
                  data: [
                    { user_id: 'away-with-signals', signal_type: 'exec_departure' },
                    { user_id: 'away-with-signals', signal_type: 'funding' },
                    { user_id: 'away-with-signals', signal_type: 'funding' },
                  ],
                  error: null,
                }),
            }),
          }),
        }
      }
      if (table === 'companies') {
        return {
          select: () => ({
            in: () => ({
              is: () =>
                Promise.resolve({
                  data: [{ user_id: 'away-with-signals' }, { user_id: 'away-with-signals' }, { user_id: 'legacy-contacted' }],
                  error: null,
                }),
            }),
          }),
        }
      }
      if (table === 'inactivity_nudge_logs') {
        return {
          select: () => ({
            in: () => ({
              in: () => Promise.resolve({ data: [{ user_id: 'legacy-contacted', nudge_type: 'reengagement_10d' }], error: null }),
            }),
          }),
          insert: (row: Record<string, unknown>) => {
            inserted.push(row)
            return Promise.resolve({ error: null })
          },
        }
      }
      throw new Error(`unexpected table ${table}`)
    })
    sendEmail.mockResolvedValue({ error: null })

    const response = await GET(createRequest({ 'x-cron-secret': 'test-cron-secret' }))

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ sent: 2, skipped: 2, users: 4, errors: [] })

    expect(sendEmail).toHaveBeenCalledTimes(2)
    type SentEmail = { to: string; subject: string; html: string }
    const byRecipient: Record<string, SentEmail> = Object.fromEntries(
      sendEmail.mock.calls.map(call => {
        const args = call[0] as SentEmail
        return [args.to, args]
      }),
    )

    expect(byRecipient['away@example.com'].subject).toBe('What changed at your companies')
    expect(byRecipient['away@example.com'].html).toContain('Dana, here is what changed while you were away.')
    expect(byRecipient['away@example.com'].html).toContain('2 funding rounds')
    expect(byRecipient['away@example.com'].html).toContain('Nothing here needs a reply.')
    expect(byRecipient['away@example.com'].html).toContain('https://example.com/unsubscribe/away-with-signals')

    expect(byRecipient['empty@example.com'].subject).toBe('One company to start with')
    expect(byRecipient['empty@example.com'].html).toContain('/dashboard/companies/new')

    for (const args of Object.values(byRecipient)) {
      expect(args.html).not.toMatch(/timing is everything|too late|have not been back|have not logged in/i)
    }

    expect(inserted.map(r => [r.user_id, r.nudge_type])).toEqual([
      ['away-with-signals', NUDGE_TYPE],
      ['away-no-company', NUDGE_TYPE],
    ])
  })
})

