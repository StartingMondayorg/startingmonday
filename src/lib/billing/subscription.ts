import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'

export type SubscriptionStatus = 'inactive' | 'trialing' | 'active' | 'paused' | 'past_due' | 'canceled'
export type SubscriptionTier = 'free' | 'passive' | 'active' | 'executive' | 'campaign' | 'coach'

export interface UserSubscription {
  tier: SubscriptionTier
  status: SubscriptionStatus
  trialEndsAt: Date | null
  periodEnd: Date | null
  isActive: boolean   // trialing or paid active (paused users lose feature access)
  isPaid: boolean     // paid subscription exists (active or paused - hides plan cards)
  isPaused: boolean
}

const FEATURE_TIERS: Record<string, SubscriptionTier[]> = {
  pipeline:                ['free', 'passive', 'active', 'executive', 'campaign'],
  contacts:                ['free', 'passive', 'active', 'executive', 'campaign'],
  scan:                    ['passive', 'active', 'executive', 'campaign'],
  ai_chat:                 ['active', 'executive', 'campaign'],
  prep_brief:              ['active', 'executive', 'campaign'],
  strategy_brief:          ['active', 'executive', 'campaign'],
  outreach_draft:          ['active', 'executive', 'campaign'],
  daily_briefing:          ['active', 'executive', 'campaign'],
  resume_tailor:           ['active', 'executive', 'campaign'],
  positioning_coach:       ['active', 'executive', 'campaign'],
  daily_scan:              ['executive', 'campaign'],
  salary_intelligence:     ['executive', 'campaign'],
  recruiter_enhancements:  ['executive', 'campaign'],
  coach_dashboard:         ['coach'],
  coach_client_seats:      ['coach'],
}

export async function getUserSubscription(userId: string, supabase?: SupabaseClient): Promise<UserSubscription> {
  const client = supabase ?? await createClient()
  const { data } = await client
    .from('users')
    .select('subscription_tier, subscription_status, trial_ends_at, subscription_period_end')
    .eq('id', userId)
    .single()

  const rawTier = data?.subscription_tier ?? 'free'
  const tier = (rawTier === 'monitor' ? 'passive' : rawTier) as SubscriptionTier
  const status = (data?.subscription_status ?? 'inactive') as SubscriptionStatus
  const trialEndsAt = data?.trial_ends_at ? new Date(data.trial_ends_at) : null
  const periodEnd = data?.subscription_period_end ? new Date(data.subscription_period_end) : null

  const trialActive = status === 'trialing' && trialEndsAt != null && trialEndsAt > new Date()
  const paidActive = status === 'active'
  const isPaused = status === 'paused'
  const isActive = trialActive || paidActive

  return { tier, status, trialEndsAt, periodEnd, isActive, isPaid: paidActive || isPaused, isPaused }
}

export function canAccessFeature(sub: UserSubscription, feature: string): boolean {
  if (!sub.isActive) return false
  const allowed = FEATURE_TIERS[feature]
  if (!allowed) return false
  // Trialing users get Active-tier access, not unconditional access to all tiers.
  // Prevents a trialing user (whose DB tier is 'free') from reaching executive-only features.
  // Coach tier is not included in trial access - it requires an active paid subscription
  const effectiveTier = (sub.status === 'trialing' && sub.tier !== 'coach') ? 'active' : sub.tier
  return allowed.includes(effectiveTier)
}
