import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'

const state = vi.hoisted(() => ({
  adminRpc: vi.fn(),
  adminFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({ rpc: state.adminRpc, from: state.adminFrom })),
}))

import { isRateLimited, trackApiUsage } from './api-usage'

function usageQuery(row: unknown) {
  const query = {
    select: () => query,
    eq: () => query,
    maybeSingle: async () => ({ data: row, error: null }),
  }
  return query
}

function callerClient() {
  return {
    rpc: vi.fn(async () => ({ data: 0, error: null })),
    from: vi.fn(() => usageQuery(null)),
  }
}

describe('api-usage client selection', () => {
  const originalKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  beforeEach(() => {
    vi.clearAllMocks()
    state.adminRpc.mockResolvedValue({ data: 0, error: null })
    state.adminFrom.mockImplementation(() => usageQuery(null))
  })

  afterEach(() => {
    if (originalKey === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
    else process.env.SUPABASE_SERVICE_ROLE_KEY = originalKey
  })

  it('tracks usage through the service role when the key is configured', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    const caller = callerClient()

    await trackApiUsage(caller as unknown as SupabaseClient, 'user-1', 42)

    expect(state.adminRpc).toHaveBeenCalledWith('increment_api_usage', expect.objectContaining({ p_user_id: 'user-1', p_tokens: 42 }))
    expect(state.adminRpc).toHaveBeenCalledWith('check_and_increment_rate_limit', expect.objectContaining({ p_key: 'user:user-1' }))
    expect(caller.rpc).not.toHaveBeenCalled()
  })

  it('checks limits through the service role when the key is configured', async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    state.adminRpc.mockResolvedValue({ data: 999, error: null })
    const caller = callerClient()

    await expect(isRateLimited(caller as unknown as SupabaseClient, 'user-1')).resolves.toBe(true)
    expect(state.adminRpc).toHaveBeenCalledWith('get_rate_limit_count', expect.objectContaining({ p_key: 'user:user-1' }))
    expect(caller.rpc).not.toHaveBeenCalled()
    expect(caller.from).not.toHaveBeenCalled()
  })

  it('falls back to the caller client when no service key is configured', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY
    const caller = callerClient()

    await trackApiUsage(caller as unknown as SupabaseClient, 'user-1', 7)

    expect(caller.rpc).toHaveBeenCalledWith('increment_api_usage', expect.objectContaining({ p_user_id: 'user-1' }))
    expect(state.adminRpc).not.toHaveBeenCalled()
  })
})
