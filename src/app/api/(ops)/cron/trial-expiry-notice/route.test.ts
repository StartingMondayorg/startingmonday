import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { validateCronRequest, sendEmail, sendSlackDM, from, insert } = vi.hoisted(() => ({
  validateCronRequest: vi.fn(),
  sendEmail: vi.fn(),
  sendSlackDM: vi.fn(),
  from: vi.fn(),
  insert: vi.fn(),
}))

vi.mock('@/lib/cron-auth', () => ({ validateCronRequest }))
vi.mock('@/lib/email/email', () => ({ sendEmail }))
vi.mock('@/lib/slack', () => ({ sendSlackDM }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: vi.fn(() => ({ from })) }))

import { GET, NUDGE_TYPE } from './route'

const CHAIN_METHODS = ['select', 'eq', 'is', 'gte', 'lt', 'in'] as const

type Call = { method: string; args: unknown[] }

function chain(result: unknown, calls: Call[]) {
  // Mirrors the PostgREST builder: every filter returns the builder, and the
  // builder itself is awaitable.
  const builder: Record<string, unknown> = {}
  for (const method of CHAIN_METHODS) {
    builder[method] = vi.fn((...args: unknown[]) => {
      calls.push({ method, args })
      return builder
    })
  }
  builder.insert = insert
  builder.then = (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve)
  return builder
}

/** Queue one result per `from(table)` call, in call order. */
function mockTables(queues: Record<string, unknown[]>) {
  const calls: Record<string, Call[]> = {}
  const cursor: Record<string, number> = {}

  from.mockImplementation((table: string) => {
    calls[table] ??= []
    cursor[table] ??= 0
    const queue = queues[table] ?? []
    const result = queue[Math.min(cursor[table], queue.length - 1)] ?? { data: [], error: null }
    cursor[table] += 1
    return chain(result, calls[table])
  })

  return calls
}

function request() {
  return new NextRequest('https://startingmonday.app/api/cron/trial-expiry-notice')
}

const TRIAL_USER = {
  id: 'user-1',
  email: 'dana@example.com',
  trial_ends_at: '2026-09-14T00:00:00.000Z',
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubEnv('UNSUBSCRIBE_SECRET', 'test-secret')
  vi.stubEnv('TRIAL_EXPIRY_NOTICE_ENABLED', 'true')
  validateCronRequest.mockReturnValue(true)
  sendEmail.mockResolvedValue({ data: { id: 'email-1' }, error: null })
  sendSlackDM.mockResolvedValue({ ok: true })
  insert.mockResolvedValue({ data: null, error: null })
})

describe('trial expiry notice cron', () => {
  it('rejects an unauthenticated cron request', async () => {
    validateCronRequest.mockReturnValue(false)

    const response = await GET(request())

    expect(response.status).toBe(403)
    expect(from).not.toHaveBeenCalled()
  })

  it('emails a user whose trial ends inside the window and logs the nudge', async () => {
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [{ user_id: 'user-1', full_name: 'Dana Reyes' }], error: null }],
      inactivity_nudge_logs: [{ data: [], error: null }],
    })

    const response = await GET(request())

    expect(await response.json()).toEqual({ dryRun: false, sent: 1, skipped: 0, errors: [] })
    expect(sendEmail).toHaveBeenCalledTimes(1)

    const payload = sendEmail.mock.calls[0][0]
    expect(payload.to).toBe('dana@example.com')
    expect(payload.from).toContain('richard@startingmonday.app')
    expect(payload.replyTo).toBe('richard@startingmonday.app')
    expect(payload.html).toContain('Hi Dana,')

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: 'user-1', nudge_type: NUDGE_TYPE }),
    )
  })

  it('only selects trialing users who have not unsubscribed, inside a one-day window', async () => {
    const calls = mockTables({
      users: [{ data: [], error: null }],
    })

    await GET(request())

    const byMethod = (method: string) => calls.users.filter(c => c.method === method)
    expect(byMethod('eq')[0].args).toEqual(['subscription_status', 'trialing'])
    expect(byMethod('is')[0].args).toEqual(['drip_unsubscribed_at', null])

    const start = new Date(byMethod('gte')[0].args[1] as string).getTime()
    const end = new Date(byMethod('lt')[0].args[1] as string).getTime()
    expect(end - start).toBe(86_400_000)

    const daysUntilStart = (start - Date.now()) / 86_400_000
    expect(daysUntilStart).toBeGreaterThan(8.9)
    expect(daysUntilStart).toBeLessThan(9.1)
  })

  it('does not email a user who was already sent this notice', async () => {
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [], error: null }],
      inactivity_nudge_logs: [
        { data: [{ user_id: 'user-1' }], error: null },
        { data: [], error: null },
      ],
    })

    const response = await GET(request())

    expect(await response.json()).toEqual({ dryRun: false, sent: 0, skipped: 1, errors: [] })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not stack on top of a recent re-engagement nudge', async () => {
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [], error: null }],
      inactivity_nudge_logs: [
        { data: [], error: null },
        { data: [{ user_id: 'user-1' }], error: null },
      ],
    })

    const response = await GET(request())

    expect(await response.json()).toEqual({ dryRun: false, sent: 0, skipped: 1, errors: [] })
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('does not mark a user notified when the send fails, and alerts Slack', async () => {
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [], error: null }],
      inactivity_nudge_logs: [{ data: [], error: null }],
    })
    sendEmail.mockResolvedValue({ data: null, error: { message: 'Blocked by email council gate' } })

    const response = await GET(request())

    expect(await response.json()).toEqual({
      dryRun: false,
      sent: 0,
      skipped: 0,
      errors: ['dana@example.com: Blocked by email council gate'],
    })
    expect(insert).not.toHaveBeenCalled()
    expect(sendSlackDM).toHaveBeenCalledTimes(1)
    expect(sendSlackDM.mock.calls[0][0].text).toContain('Blocked by email council gate')
  })

  it('does not mark a user notified when policy suppresses the send', async () => {
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [], error: null }],
      inactivity_nudge_logs: [{ data: [], error: null }],
    })
    sendEmail.mockResolvedValue({ data: null, error: null, suppressed: true })

    const response = await GET(request())

    expect(await response.json()).toEqual({ dryRun: false, sent: 0, skipped: 1, errors: [] })
    expect(insert).not.toHaveBeenCalled()
    expect(sendSlackDM).not.toHaveBeenCalled()
  })

  it('alerts and fails loudly when the user query errors', async () => {
    mockTables({ users: [{ data: null, error: { message: 'connection reset' } }] })

    const response = await GET(request())

    expect(response.status).toBe(500)
    expect(sendSlackDM).toHaveBeenCalledTimes(1)
    expect(sendSlackDM.mock.calls[0][0].text).toContain('connection reset')
  })
})

describe('dry run', () => {
  function seedOneEligibleUser() {
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [], error: null }],
      inactivity_nudge_logs: [{ data: [], error: null }],
    })
  }

  it('sends nothing until TRIAL_EXPIRY_NOTICE_ENABLED is set', async () => {
    vi.stubEnv('TRIAL_EXPIRY_NOTICE_ENABLED', '')
    seedOneEligibleUser()

    const response = await GET(request())

    expect(await response.json()).toEqual({
      dryRun: true,
      wouldSend: ['dana@example.com'],
      sent: 0,
      skipped: 0,
      errors: [],
    })
    expect(sendEmail).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })

  it('treats any value other than the literal "true" as disabled', async () => {
    vi.stubEnv('TRIAL_EXPIRY_NOTICE_ENABLED', '1')
    seedOneEligibleUser()

    const response = await GET(request())

    expect((await response.json()).dryRun).toBe(true)
    expect(sendEmail).not.toHaveBeenCalled()
  })

  it('honours ?dryRun=1 even when sending is enabled', async () => {
    seedOneEligibleUser()

    const response = await GET(
      new NextRequest('https://startingmonday.app/api/cron/trial-expiry-notice?dryRun=1'),
    )

    expect(await response.json()).toEqual({
      dryRun: true,
      wouldSend: ['dana@example.com'],
      sent: 0,
      skipped: 0,
      errors: [],
    })
    expect(sendEmail).not.toHaveBeenCalled()
    expect(insert).not.toHaveBeenCalled()
  })

  it('still applies the already-notified guard while reporting', async () => {
    vi.stubEnv('TRIAL_EXPIRY_NOTICE_ENABLED', '')
    mockTables({
      users: [{ data: [TRIAL_USER], error: null }],
      user_profiles: [{ data: [], error: null }],
      inactivity_nudge_logs: [
        { data: [{ user_id: 'user-1' }], error: null },
        { data: [], error: null },
      ],
    })

    const response = await GET(request())

    expect(await response.json()).toEqual({
      dryRun: true,
      wouldSend: [],
      sent: 0,
      skipped: 1,
      errors: [],
    })
  })
})
