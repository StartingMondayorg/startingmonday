import Stripe from 'stripe'

const STRIPE_API_VERSION = '2026-05-27.dahlia' as const

let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY is not set')
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: STRIPE_API_VERSION })
  }
  return _stripe
}

// Throws immediately if the env var is missing rather than silently using ''
// which would produce a cryptic "No such price" error from Stripe.
export function getPriceId(plan: string, interval: 'monthly' | 'annual' = 'monthly'): string {
  const envKey = interval === 'annual'
    ? `STRIPE_PRICE_${plan.toUpperCase()}_ANNUAL`
    : `STRIPE_PRICE_${plan.toUpperCase()}`
  const id = process.env[envKey]
  // Backward compat: 'passive' plan was previously named 'monitor' in env vars
  if (!id && plan === 'passive') {
    const legacyKey = envKey.replace('PASSIVE', 'MONITOR')
    const legacyId = process.env[legacyKey]
    if (legacyId) return legacyId
  }
  if (!id) throw new Error(`${envKey} is not set`)
  return id
}
