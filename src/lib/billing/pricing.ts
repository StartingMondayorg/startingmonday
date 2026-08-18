// Single source of truth for all pricing display values.
// Update here when prices change - everything else reads from this file.
// Stripe price IDs live in .env.local (STRIPE_PRICE_*).

export const PRICING = {
  passive: {
    key: 'passive' as const,
    name: 'Monitor',
    monthly: 49,
    quarterly: 132,
    annual: 470,
    annualMonthly: 39,
  },
  active: {
    key: 'active' as const,
    name: 'Active',
    monthly: 199,
    quarterly: 469,
    annual: 2030,
    annualMonthly: 169,
  },
  executive: {
    key: 'executive' as const,
    name: 'Executive',
    monthly: 499,
    quarterly: 1200,
    annual: 4790,
    annualMonthly: 399,
  },
  concierge: {
    key: 'concierge' as const,
    name: 'Concierge',
    monthly: 499,
    quarterly: null,
    annual: 4990,
    annualMonthly: 416,
  },
} as const

export type PricingTier = keyof typeof PRICING

// Single source of truth for all tier display names.
// Import this wherever you need to map a DB tier key to a human-readable label.
export const TIER_DISPLAY_NAMES: Record<string, string> = {
  free:      'Free trial',
  passive:   PRICING.passive.name,    // 'Monitor'
  monitor:   PRICING.passive.name,    // 'Monitor' (legacy alias)
  active:    PRICING.active.name,     // 'Active'
  executive: PRICING.executive.name,  // 'Executive'
  concierge: PRICING.concierge.name,  // 'Concierge'
  campaign:  'Campaign',
  coach:     'Coach',
}

export function fmtPrice(n: number): string {
  return `$${n.toLocaleString('en-US')}`
}
