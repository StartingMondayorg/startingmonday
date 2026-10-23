import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createAdminClientMock, rpcMock } = vi.hoisted(() => {
  const rpcMock = vi.fn()
  return { rpcMock, createAdminClientMock: vi.fn(() => ({ rpc: rpcMock })) }
})

vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: createAdminClientMock }))

import { __resetBurstWindowsForTests, checkBurstLimit } from './burst-limit'
import { __resetSharedRateLimitWarningForTests } from './rate-limit-store'

describe('burst limiter (in-memory)', () => {
  beforeEach(() => {
    vi.stubEnv('RATE_LIMIT_FORCE_MEMORY', '1')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    __resetBurstWindowsForTests()
  })

  it('allows the first in-memory request', async () => {
    expect(await checkBurstLimit(`test-${Date.now()}`)).toBe(true)
  })

  it('allows 10 requests per minute and blocks the 11th', async () => {
    for (let i = 0; i < 10; i++) {
      expect(await checkBurstLimit('burst-user')).toBe(true)
    }
    expect(await checkBurstLimit('burst-user')).toBe(false)
    expect(rpcMock).not.toHaveBeenCalled()
  })
})

describe('burst limiter (shared Postgres store)', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-test-key')
    vi.stubEnv('RATE_LIMIT_FORCE_MEMORY', '')
    rpcMock.mockReset()
    __resetSharedRateLimitWarningForTests()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
    __resetBurstWindowsForTests()
  })

  it('allows under the limit with a burst-namespaced key and a 60s window of 10', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: true, remaining: 9, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    expect(await checkBurstLimit('user-123')).toBe(true)
    expect(rpcMock).toHaveBeenCalledWith('check_rate_limit', {
      p_key: 'burst:user-123',
      p_window_seconds: 60,
      p_max: 10,
    })
  })

  it('blocks when the shared store reports the limit is exceeded', async () => {
    rpcMock.mockResolvedValue({
      data: [{ allowed: false, remaining: 0, reset_at: '2026-06-03T00:01:00+00:00' }],
      error: null,
    })

    expect(await checkBurstLimit('user-456')).toBe(false)
  })

  it('falls back to the in-memory window and warns once when the RPC errors', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpcMock.mockResolvedValue({ data: null, error: { code: '42883', message: 'function does not exist' } })

    for (let i = 0; i < 10; i++) {
      expect(await checkBurstLimit('fallback-user')).toBe(true)
    }
    expect(await checkBurstLimit('fallback-user')).toBe(false)
    expect(warn).toHaveBeenCalledTimes(1)
  })

  it('falls back to the in-memory window when the RPC throws', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    rpcMock.mockRejectedValue(new Error('network down'))

    expect(await checkBurstLimit('throwing-user')).toBe(true)
  })
})