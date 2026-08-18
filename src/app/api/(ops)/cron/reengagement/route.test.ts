import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { fromMock, sendEmail } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  sendEmail: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ from: fromMock })),
}))

vi.mock('@/lib/email', () => ({
  sendEmail,
}))

vi.mock('@/lib/config', () => ({
  APP_URL: 'https://example.com',
}))

vi.mock('@/lib/unsubscribe-token', () => ({
  unsubscribeUrl: (userId: string) => `https://example.com/unsubscribe/${userId}`,
}))

import { GET } from './route'

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
})

