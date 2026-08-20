import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { canAccessFeature, getUserSubscription } from './subscription'

function makeSupabaseUserRow(row: {
  subscription_tier?: string | null
  subscription_status?: string | null
  trial_ends_at?: string | null
  subscription_period_end?: string | null
}) {
  return {
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: row }),
        }),
      }),
    }),
  } as unknown as SupabaseClient
}

describe('getUserSubscription', () => {
  it('normalizes monitor tier to passive', async () => {
    const sub = await getUserSubscription(
      'u1',
      makeSupabaseUserRow({
        subscription_tier: 'monitor',
        subscription_status: 'active',
      }),
    )

    expect(sub.tier).toBe('passive')
    expect(sub.isActive).toBe(true)
  })

  it('marks valid trial as active but not paid', async () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    const sub = await getUserSubscription(
      'u1',
      makeSupabaseUserRow({
        subscription_tier: 'free',
        subscription_status: 'trialing',
        trial_ends_at: future,
      }),
    )

    expect(sub.isActive).toBe(true)
    expect(sub.isPaid).toBe(false)
  })
})

describe('canAccessFeature', () => {
  it('grants active-tier trial access but still blocks executive-only features', () => {
    const trial = {
      tier: 'free',
      status: 'trialing',
      trialEndsAt: null,
      periodEnd: null,
      isActive: true,
      isPaid: false,
      isPaused: false,
    } as const

    expect(canAccessFeature(trial, 'ai_chat')).toBe(true)
    expect(canAccessFeature(trial, 'salary_intelligence')).toBe(false)
  })
})
