import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { validateCronRequest, fromLt } = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  fromLt: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({
  validateCronRequest,
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        gte: vi.fn(() => ({
          lt: fromLt,
        })),
      })),
    })),
  })),
}))

vi.mock('@/lib/anthropic', () => ({
  anthropic: {
    messages: {
      create: vi.fn(),
    },
  },
  MODELS: {
    haiku: 'test-haiku',
  },
}))

import { GET } from './route'

describe('src/app/api/cron/ideas-monthly/route.ts', () => {
  const originalSlackToken = process.env.SLACK_USER_TOKEN

  beforeEach(() => {
    validateCronRequest.mockReset()
    fromLt.mockReset()
    validateCronRequest.mockReturnValue(true)
    fromLt.mockResolvedValue({ data: [], error: null })
    delete process.env.SLACK_USER_TOKEN
  })

  afterEach(() => {
    if (originalSlackToken === undefined) {
      delete process.env.SLACK_USER_TOKEN
    } else {
      process.env.SLACK_USER_TOKEN = originalSlackToken
    }
  })

  it('returns success when Slack is not configured and there are no submissions', async () => {
    const response = await GET(new Request('https://example.com/api/cron/ideas-monthly') as never)
    const payload = await response.json() as { ok: boolean; count: number; slack_skipped: boolean }

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.count).toBe(0)
    expect(payload.slack_skipped).toBe(true)
    expect(validateCronRequest).toHaveBeenCalledTimes(1)
    expect(fromLt).toHaveBeenCalledTimes(1)
  })
})
