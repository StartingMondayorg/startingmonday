import { describe, expect, it } from 'vitest'
import { createLiveBriefDeliveryToken, hashLiveBriefDeliveryToken, LIVE_BRIEF_DELIVERY_TTL_SECONDS } from './live-brief-delivery'

describe('live brief delivery tokens', () => {
  it('creates high-entropy URL-safe tokens and fixed-length digests', () => {
    const token = createLiveBriefDeliveryToken()
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(token.length).toBeGreaterThanOrEqual(40)
    expect(hashLiveBriefDeliveryToken(token)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('uses a seven-day default expiry window', () => {
    expect(LIVE_BRIEF_DELIVERY_TTL_SECONDS).toBe(604800)
  })
})