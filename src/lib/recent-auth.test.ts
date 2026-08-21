import { describe, expect, it } from 'vitest'
import { hasRecentAuthentication, RECENT_AUTH_MAX_AGE_SECONDS } from './recent-auth'

describe('hasRecentAuthentication', () => {
  const now = 1_700_000_000

  it('accepts a current authentication method reference', () => {
    expect(hasRecentAuthentication([{ method: 'password', timestamp: now - 30 }], now)).toBe(true)
  })

  it('rejects missing, stale, malformed, and implausibly future references', () => {
    expect(hasRecentAuthentication(undefined, now)).toBe(false)
    expect(hasRecentAuthentication([{ timestamp: now - RECENT_AUTH_MAX_AGE_SECONDS - 1 }], now)).toBe(false)
    expect(hasRecentAuthentication([{ timestamp: 'recent' }], now)).toBe(false)
    expect(hasRecentAuthentication([{ timestamp: now + 61 }], now)).toBe(false)
  })
})