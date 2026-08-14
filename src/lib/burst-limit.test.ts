import { describe, expect, it, vi } from 'vitest'
import { checkBurstLimit } from './burst-limit'

describe('burst limiter', () => {
  it('allows the first in-memory request', async () => {
    vi.stubEnv('RATE_LIMIT_FORCE_MEMORY', '1')
    expect(await checkBurstLimit(`test-${Date.now()}`)).toBe(true)
  })
})
