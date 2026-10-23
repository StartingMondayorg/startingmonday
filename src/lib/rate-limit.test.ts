import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, rpcMock } = vi.hoisted(() => {
  const rpcMock = vi.fn()
  return { rpcMock, createAdminClientMock: vi.fn(() => ({ rpc: rpcMock })) }
})

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: createAdminClientMock }))

import { __resetRateLimitBucketsForTests, checkRateLimit } from '@/lib/rate-limit'
import { __resetSharedRateLimitWarningForTests } from '@/lib/rate-limit-store'

describe('checkRateLimit (in-memory)', () => {
  beforeEach(() => {
    vi.stubEnv('RATE_LIMIT_FORCE_MEMORY', '1')
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    __resetRateLimitBucketsForTests()
  })

  it('allows requests until the limit and then blocks with retryAfter', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T00:00:00.000Z'))

    await expect(checkRateLimit('user-1', 2, 60_000)).resolves.toEqual({ allowed: true })
    await expect(checkRateLimit('user-1', 2, 60_000)).resolves.toEqual({ allowed: true })

    const blocked = await checkRateLimit('user-1', 2, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBe(60)
  })

  it('resets the bucket after the window elapses', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T00:00:00.000Z'))

    await expect(checkRateLimit('user-2', 1, 60_000)).resolves.toEqual({ allowed: true })
    await expect(checkRateLimit('user-2', 1, 60_000)).resolves.toMatchObject({ allowed: false })

    vi.advanceTimersByTime(60_001)

    await expect(checkRateLimit('user-2', 1, 60_000)).resolves.toEqual({ allowed: true })
  })

  it('keeps buckets isolated per key', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T00:00:00.000Z'))

    await expect(checkRateLimit('user-a', 1, 60_000)).resolves.toEqual({ allowed: true })
    await expect(checkRateLimit('user-b', 1, 60_000)).resolves.toEqual({ allowed: true })

    await expect(checkRateLimit('user-a', 1, 60_000)).resolves.toMatchObject({ allowed: false })
    await expect(checkRateLimit('user-b', 1, 60_000)).resolves.toMatchObject({ allowed: false })
  })

  it('does not call the shared store', async () => {
    await checkRateLimit('user-c', 1, 60_000)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

describe('checkRateLimit (shared Postgres store)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
    vi.stubEnv('RATE_LIMIT_FORCE_MEMORY', '')
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-03T00:00:15.000Z'))
    rpcMock.mockReset()
    createAdminClientMock.mockClear()
    __resetSharedRateLimitWarningForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    __resetRateLimitBucketsForTests()
  })

  it('allows a request under the limit through check_rate_limit with a namespaced key', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: true, remaining: 7, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    await expect(checkRateLimit('login_submit:203.0.113.9', 8, 60_000)).resolves.toEqual({ allowed: true })
    expect(rpcMock).toHaveBeenCalledWith('check_rate_limit', {
      p_key: 'rl:login_submit:203.0.113.9',
      p_window_seconds: 60,
      p_max: 8,
    })
  })

  it('blocks over the limit and derives retryAfter from reset_at', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: false, remaining: 0, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    await expect(checkRateLimit('signup:203.0.113.9', 5)).resolves.toEqual({ allowed: false, retryAfter: 45 })
  })

  it('shares state across instances: a block from the store wins over a fresh local bucket', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: false, remaining: 0, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    const result = await checkRateLimit('fresh-key-on-this-replica', 20)
    expect(result.allowed).toBe(false)
  })

  it('hashes email addresses before they reach the shared store', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: true, remaining: 1, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    await checkRateLimit('magic-link:Person@Example.com', 2)
    const storedKey = rpcMock.mock.calls[0][1].p_key as string
    expect(storedKey).toMatch(/^rl:magic-link:email_sha256:[0-9a-f]{32}$/)
    expect(storedKey.toLowerCase()).not.toContain('example.com')

    await checkRateLimit('magic-link:person@example.com', 2)
    expect(rpcMock.mock.calls[1][1].p_key).toBe(storedKey)
  })

  it('hashes oversized keys without scanning them for email addresses', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: true, remaining: 1, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    // The previous unbounded regex took tens of seconds here, past the test timeout.
    const hostileForwardedFor = 'a'.repeat(200_000)
    await checkRateLimit(hostileForwardedFor, 2)
    expect(rpcMock.mock.calls[0][1].p_key).toMatch(/^rl:sha256:[0-9a-f]{64}$/)
  })

  it('falls back to the in-memory limiter and warns once when the RPC errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpcMock.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.check_rate_limit' },
    })

    await expect(checkRateLimit('fallback-key', 2, 60_000)).resolves.toEqual({ allowed: true })
    await expect(checkRateLimit('fallback-key', 2, 60_000)).resolves.toEqual({ allowed: true })
    const blocked = await checkRateLimit('fallback-key', 2, 60_000)
    expect(blocked.allowed).toBe(false)
    expect(blocked.retryAfter).toBe(60)

    expect(warn).toHaveBeenCalledTimes(1)
    expect(String(warn.mock.calls[0][1])).toContain('PGRST202')
  })

  it('falls back to the in-memory limiter when the RPC throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpcMock.mockRejectedValue(new TypeError('fetch failed'))

    await expect(checkRateLimit('throw-key', 1, 60_000)).resolves.toEqual({ allowed: true })
    await expect(checkRateLimit('throw-key', 1, 60_000)).resolves.toMatchObject({ allowed: false })
  })

  it('falls back when the RPC returns an unexpected shape', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpcMock.mockResolvedValue({ data: true, error: null })

    await expect(checkRateLimit('shape-key', 1, 60_000)).resolves.toEqual({ allowed: true })
    await expect(checkRateLimit('shape-key', 1, 60_000)).resolves.toMatchObject({ allowed: false })
  })
})