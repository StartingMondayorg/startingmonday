import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { insert, createAdminClient } = vi.hoisted(() => {
  const insert = vi.fn()
  return {
    insert,
    createAdminClient: vi.fn(() => ({ from: vi.fn(() => ({ insert })) })),
  }
})

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient }))

import { buildBotSignalRow, recordBotSignal } from '@/lib/bot-signal-recorder'

const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

function headersOf(entries: Record<string, string>) {
  const map = new Map(Object.entries(entries).map(([key, value]) => [key.toLowerCase(), value]))
  return { get: (name: string) => map.get(name.toLowerCase()) ?? null }
}

function inputOf(overrides: Partial<Parameters<typeof buildBotSignalRow>[0]> = {}) {
  return {
    headers: headersOf({ 'user-agent': CHROME_UA, 'sec-fetch-site': 'same-origin', 'accept-language': 'en', origin: 'https://startingmonday.app' }),
    method: 'POST',
    route: '/api/auth/verify-and-signup',
    rateLimitKey: 'signup',
    ip: '203.0.113.42',
    outcome: 'allowed' as const,
    ...overrides,
  }
}

describe('buildBotSignalRow', () => {
  it('captures route, key and outcome verbatim', () => {
    const row = buildBotSignalRow(inputOf({ outcome: 'rate_limited' }))

    expect(row.route).toBe('/api/auth/verify-and-signup')
    expect(row.rate_limit_key).toBe('signup')
    expect(row.outcome).toBe('rate_limited')
  })

  it('never stores the raw IP address', () => {
    const row = buildBotSignalRow(inputOf())

    expect(JSON.stringify(row)).not.toContain('203.0.113.42')
    expect(row.ip_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row.ip_prefix_hash).toMatch(/^[0-9a-f]{64}$/)
    expect(row.ip_hash).not.toBe(row.ip_prefix_hash)
  })

  it('leaves hashes null when the IP is unknown', () => {
    const row = buildBotSignalRow(inputOf({ ip: 'unknown' }))

    expect(row.ip_hash).toBeNull()
    expect(row.ip_prefix_hash).toBeNull()
  })

  it('truncates an overlong user agent so one client cannot bloat the table', () => {
    const row = buildBotSignalRow(inputOf({ headers: headersOf({ 'user-agent': 'x'.repeat(5000) }) }))

    expect(row.user_agent).toHaveLength(256)
  })

  it('records a null user agent rather than an empty string', () => {
    const row = buildBotSignalRow(inputOf({ headers: headersOf({}) }))

    expect(row.user_agent).toBeNull()
    expect(row.ua_class).toBe('empty')
  })

  it('carries the classification score and reasons through', () => {
    const row = buildBotSignalRow(inputOf({ headers: headersOf({ 'user-agent': 'curl/8.4.0' }) }))

    expect(row.ua_class).toBe('scripted')
    expect(row.bot_score).toBeGreaterThan(0)
    expect((row.details as { reasons: string[] }).reasons).toContain('scripted_user_agent')
  })

  it('records the country when the CDN provides it', () => {
    const row = buildBotSignalRow(inputOf({ headers: headersOf({ 'user-agent': CHROME_UA, 'cf-ipcountry': 'GB' }) }))

    expect(row.country).toBe('GB')
  })
})

describe('recordBotSignal', () => {
  const originalNodeEnv = process.env.NODE_ENV

  beforeEach(() => {
    insert.mockReset()
    insert.mockResolvedValue({ error: null })
    createAdminClient.mockClear()
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test')
  })

  it('does nothing under test so suites never write telemetry', async () => {
    vi.stubEnv('NODE_ENV', 'test')

    await recordBotSignal(inputOf())

    expect(insert).not.toHaveBeenCalled()
  })

  it('writes a row when enabled', async () => {
    vi.stubEnv('NODE_ENV', 'production')

    await recordBotSignal(inputOf())

    expect(insert).toHaveBeenCalledTimes(1)
    expect(insert.mock.calls[0][0]).toMatchObject({ route: '/api/auth/verify-and-signup', outcome: 'allowed' })
  })

  it('honours the BOT_SIGNAL_RECORDING kill switch', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('BOT_SIGNAL_RECORDING', '0')

    await recordBotSignal(inputOf())

    expect(insert).not.toHaveBeenCalled()
  })

  it('skips silently when Supabase is not configured', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '')

    await recordBotSignal(inputOf())

    expect(insert).not.toHaveBeenCalled()
  })

  it('swallows database errors so telemetry can never break a request', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    insert.mockRejectedValue(new Error('connection refused'))

    await expect(recordBotSignal(inputOf())).resolves.toBeUndefined()
  })
})
