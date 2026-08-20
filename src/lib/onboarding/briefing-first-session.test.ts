import { describe, expect, it } from 'vitest'
import {
  chooseDeterministicRolloutBucket,
  isInDeterministicRollout,
  shouldShowFirstSessionGuidedBriefing,
} from '@/lib/onboarding/briefing-first-session'

describe('briefing first-session rollout', () => {
  it('returns stable deterministic buckets for the same seed', () => {
    const a = chooseDeterministicRolloutBucket('user_123', 100)
    const b = chooseDeterministicRolloutBucket('user_123', 100)
    expect(a).toBe(b)
    expect(a).toBeGreaterThanOrEqual(0)
    expect(a).toBeLessThan(100)
  })

  it('honors percentage boundaries', () => {
    expect(isInDeterministicRollout('user_123', 0)).toBe(false)
    expect(isInDeterministicRollout('user_123', 100)).toBe(true)
  })

  it('shows guided state only when all eligibility conditions pass', () => {
    const within48h = new Date(Date.now() - 3 * 3600000).toISOString()
    expect(
      shouldShowFirstSessionGuidedBriefing({
        userId: 'user_abc',
        accountCreatedAt: within48h,
        totalCompanies: 1,
        rolloutEnabled: true,
        rolloutPercentage: 100,
      })
    ).toBe(true)
  })

  it('does not show guided state when account age or company count is outside guardrails', () => {
    const oldAccount = new Date(Date.now() - 72 * 3600000).toISOString()
    expect(
      shouldShowFirstSessionGuidedBriefing({
        userId: 'user_abc',
        accountCreatedAt: oldAccount,
        totalCompanies: 1,
        rolloutEnabled: true,
        rolloutPercentage: 100,
      })
    ).toBe(false)

    const within48h = new Date(Date.now() - 2 * 3600000).toISOString()
    expect(
      shouldShowFirstSessionGuidedBriefing({
        userId: 'user_abc',
        accountCreatedAt: within48h,
        totalCompanies: 2,
        rolloutEnabled: true,
        rolloutPercentage: 100,
      })
    ).toBe(false)
  })
})
