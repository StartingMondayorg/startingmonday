import { describe, it, expect } from 'vitest'
import { canAccessFeature, type UserSubscription } from '@/lib/billing/subscription'

function makeSub(overrides: Partial<UserSubscription> = {}): UserSubscription {
  return {
    tier: 'active',
    status: 'active',
    trialEndsAt: null,
    periodEnd: null,
    isActive: true,
    isPaid: true,
    isPaused: false,
    ...overrides,
  }
}

describe('canAccessFeature', () => {
  it('blocks everything when subscription is inactive', () => {
    const sub = makeSub({ isActive: false, status: 'inactive' })
    expect(canAccessFeature(sub, 'pipeline')).toBe(false)
    expect(canAccessFeature(sub, 'ai_chat')).toBe(false)
    expect(canAccessFeature(sub, 'prep_brief')).toBe(false)
  })

  it('grants pipeline access to all active tiers', () => {
    const tiers = ['free', 'passive', 'active', 'executive', 'campaign'] as const
    for (const tier of tiers) {
      expect(canAccessFeature(makeSub({ tier }), 'pipeline')).toBe(true)
    }
  })

  it('grants contacts access to all active tiers', () => {
    expect(canAccessFeature(makeSub({ tier: 'free' }), 'contacts')).toBe(true)
    expect(canAccessFeature(makeSub({ tier: 'passive' }), 'contacts')).toBe(true)
  })

  it('blocks scan for free tier, allows passive and above', () => {
    expect(canAccessFeature(makeSub({ tier: 'free' }), 'scan')).toBe(false)
    expect(canAccessFeature(makeSub({ tier: 'passive' }), 'scan')).toBe(true)
    expect(canAccessFeature(makeSub({ tier: 'active' }), 'scan')).toBe(true)
  })

  it('blocks all AI features for free tier', () => {
    const sub = makeSub({ tier: 'free' })
    expect(canAccessFeature(sub, 'ai_chat')).toBe(false)
    expect(canAccessFeature(sub, 'prep_brief')).toBe(false)
    expect(canAccessFeature(sub, 'strategy_brief')).toBe(false)
    expect(canAccessFeature(sub, 'resume_tailor')).toBe(false)
    expect(canAccessFeature(sub, 'outreach_draft')).toBe(false)
  })

  it('blocks all AI features for passive tier', () => {
    const sub = makeSub({ tier: 'passive' })
    expect(canAccessFeature(sub, 'ai_chat')).toBe(false)
    expect(canAccessFeature(sub, 'prep_brief')).toBe(false)
  })

  it('grants all AI features for active tier', () => {
    const sub = makeSub({ tier: 'active' })
    expect(canAccessFeature(sub, 'ai_chat')).toBe(true)
    expect(canAccessFeature(sub, 'prep_brief')).toBe(true)
    expect(canAccessFeature(sub, 'strategy_brief')).toBe(true)
    expect(canAccessFeature(sub, 'resume_tailor')).toBe(true)
    expect(canAccessFeature(sub, 'outreach_draft')).toBe(true)
    expect(canAccessFeature(sub, 'daily_briefing')).toBe(true)
  })

  it('grants all features during trial regardless of stored tier', () => {
    // Trialing users get all features via the status === 'trialing' branch
    const sub = makeSub({ tier: 'free', status: 'trialing', isActive: true })
    expect(canAccessFeature(sub, 'ai_chat')).toBe(true)
    expect(canAccessFeature(sub, 'prep_brief')).toBe(true)
    expect(canAccessFeature(sub, 'strategy_brief')).toBe(true)
  })

  it('blocks paused users (isActive is false when paused)', () => {
    const sub = makeSub({ status: 'paused', isActive: false, isPaused: true })
    expect(canAccessFeature(sub, 'pipeline')).toBe(false)
    expect(canAccessFeature(sub, 'ai_chat')).toBe(false)
  })

  it('returns false for unknown feature name', () => {
    expect(canAccessFeature(makeSub(), 'nonexistent_feature')).toBe(false)
  })

  it('grants executive-only features to executive tier', () => {
    const sub = makeSub({ tier: 'executive' })
    expect(canAccessFeature(sub, 'daily_scan')).toBe(true)
    expect(canAccessFeature(sub, 'salary_intelligence')).toBe(true)
    expect(canAccessFeature(sub, 'recruiter_enhancements')).toBe(true)
  })

  it('blocks executive-only features for active tier', () => {
    const sub = makeSub({ tier: 'active' })
    expect(canAccessFeature(sub, 'daily_scan')).toBe(false)
    expect(canAccessFeature(sub, 'salary_intelligence')).toBe(false)
    expect(canAccessFeature(sub, 'recruiter_enhancements')).toBe(false)
  })

  it('blocks executive-only features for trialing users (trial grants active-tier, not executive)', () => {
    const sub = makeSub({ tier: 'free', status: 'trialing', isActive: true })
    expect(canAccessFeature(sub, 'daily_scan')).toBe(false)
    expect(canAccessFeature(sub, 'salary_intelligence')).toBe(false)
    expect(canAccessFeature(sub, 'recruiter_enhancements')).toBe(false)
  })

  it('maps legacy monitor tier to passive for feature gating', () => {
    // getUserSubscription converts 'monitor' → 'passive' before returning
    const sub = makeSub({ tier: 'passive' })
    expect(canAccessFeature(sub, 'scan')).toBe(true)
    expect(canAccessFeature(sub, 'ai_chat')).toBe(false)
  })
})
