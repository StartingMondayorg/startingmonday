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

vi.mock('@/lib/owner-email', () => ({
  getOwnerEmail: () => 'owner@example.com',
}))

import { GET } from './route'

function createRequest(headers: Record<string, string> = {}) {
  return new NextRequest('https://example.com/api/cron/scores', { headers })
}

function mockEventQuery(data: unknown[]) {
  return {
    select: vi.fn().mockReturnValue({
      gte: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({ data, error: null }),
      }),
    }),
  }
}

describe('src/app/api/cron/scores/route.ts', () => {
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

  it('sends the weekly digest email with score content', async () => {
    fromMock
      .mockReturnValueOnce(mockEventQuery([
        { event_name: 'company_added', created_at: new Date().toISOString() },
      ]))
      .mockReturnValueOnce(mockEventQuery([{ event_name: 'company_added' }]))
    sendEmail.mockResolvedValue({ error: null })

    const response = await GET(createRequest({ 'x-cron-secret': 'test-cron-secret' }))

    expect(response.status).toBe(200)
    expect(sendEmail).toHaveBeenCalledTimes(1)
    const [{ to, subject, html }] = sendEmail.mock.calls[0]
    expect(to).toBe('owner@example.com')
    expect(subject).toContain('Action scores week of')
    expect(html).toContain('Action Scores -')
    expect(html).toContain('Lowest composite - review for friction')
  })

  it('returns 500 when the digest email fails to send', async () => {
    fromMock
      .mockReturnValueOnce(mockEventQuery([]))
      .mockReturnValueOnce(mockEventQuery([]))
    sendEmail.mockResolvedValue({ error: { message: 'smtp down' } })

    const response = await GET(createRequest({ 'x-cron-secret': 'test-cron-secret' }))

    expect(response.status).toBe(500)
    await expect(response.json()).resolves.toEqual({ error: 'smtp down' })
  })
})
