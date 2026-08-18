export type ValueLane = 'launch' | 'scale' | 'transform'

export type PricingPlan = {
  plan_code: string
  lane: ValueLane
  monthly_price_usd: number
  included_seats: number
  feature_entitlements: string[]
}

export const VALUE_LANE_PLANS: PricingPlan[] = [
  {
    plan_code: 'partner_launch',
    lane: 'launch',
    monthly_price_usd: 4900,
    included_seats: 25,
    feature_entitlements: ['cohort_console', 'sponsor_snapshots', 'template_packs_basic'],
  },
  {
    plan_code: 'partner_scale',
    lane: 'scale',
    monthly_price_usd: 9900,
    included_seats: 75,
    feature_entitlements: ['cohort_console', 'sponsor_snapshots', 'template_packs_full', 'bulk_provisioning'],
  },
  {
    plan_code: 'partner_transform',
    lane: 'transform',
    monthly_price_usd: 16900,
    included_seats: 150,
    feature_entitlements: ['cohort_console', 'sponsor_snapshots', 'template_packs_full', 'bulk_provisioning', 'migration_playbook'],
  },
]

export function getPlanByCode(planCode: string) {
  return VALUE_LANE_PLANS.find((plan) => plan.plan_code === planCode) ?? null
}

export function hasEntitlement(planCode: string, entitlement: string): boolean {
  const plan = getPlanByCode(planCode)
  if (!plan) return false
  return plan.feature_entitlements.includes(entitlement)
}

export function buildBillingPayload(planCode: string) {
  const plan = getPlanByCode(planCode)
  if (!plan) return null

  return {
    plan_code: plan.plan_code,
    lane: plan.lane,
    amount_usd: plan.monthly_price_usd,
    included_seats: plan.included_seats,
    billing_interval: 'monthly',
    metadata: {
      entitlement_count: plan.feature_entitlements.length,
      feature_entitlements: plan.feature_entitlements,
    },
  }
}
