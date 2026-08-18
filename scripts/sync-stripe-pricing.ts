/**
 * Fetches live prices from Stripe and updates src/lib/billing/pricing.ts + src/lib/billing/plans.ts
 * if any values have changed. Exits 0 in both cases; the caller checks git diff.
 *
 * Usage: doppler run -- npx tsx scripts/sync-stripe-pricing.ts
 *
 * Required env vars (set via Doppler or GitHub secrets):
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_MONITOR          (monthly Monitor price ID)
 *   STRIPE_PRICE_MONITOR_ANNUAL   (annual Monitor price ID)
 *   STRIPE_PRICE_ACTIVE           (monthly Active price ID)
 *   STRIPE_PRICE_ACTIVE_ANNUAL    (annual Active price ID)
 *   STRIPE_PRICE_EXECUTIVE        (monthly Executive price ID)
 *   STRIPE_PRICE_EXECUTIVE_ANNUAL (annual Executive price ID)
 */

import Stripe from 'stripe'
import * as fs from 'fs'
import * as path from 'path'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-05-27.dahlia' })

const PRICE_CONFIGS = [
  { env: 'STRIPE_PRICE_MONITOR',          plan: 'passive',    interval: 'monthly' },
  { env: 'STRIPE_PRICE_MONITOR_ANNUAL',   plan: 'passive',    interval: 'annual'  },
  { env: 'STRIPE_PRICE_ACTIVE',           plan: 'active',     interval: 'monthly' },
  { env: 'STRIPE_PRICE_ACTIVE_ANNUAL',    plan: 'active',     interval: 'annual'  },
  { env: 'STRIPE_PRICE_EXECUTIVE',        plan: 'executive',  interval: 'monthly' },
  { env: 'STRIPE_PRICE_EXECUTIVE_ANNUAL', plan: 'executive',  interval: 'annual'  },
] as const

type Plan = 'passive' | 'active' | 'executive'
type Interval = 'monthly' | 'annual'

interface PriceResult {
  plan: Plan
  interval: Interval
  cents: number
  dollars: number
}

async function fetchPrices(): Promise<PriceResult[]> {
  const results: PriceResult[] = []
  for (const cfg of PRICE_CONFIGS) {
    const priceId = process.env[cfg.env]
    if (!priceId) { console.warn(`  Skipping ${cfg.env}: not set`); continue }
    const price = await stripe.prices.retrieve(priceId)
    if (!price.unit_amount) { console.warn(`  Skipping ${cfg.env}: no unit_amount`); continue }
    results.push({ plan: cfg.plan, interval: cfg.interval, cents: price.unit_amount, dollars: price.unit_amount / 100 })
  }
  return results
}

function updateFile(filePath: string, updater: (lines: string[]) => string[]): boolean {
  const lines = fs.readFileSync(filePath, 'utf-8').split('\n')
  const updated = updater(lines)
  const changed = updated.join('\n') !== lines.join('\n')
  if (changed) fs.writeFileSync(filePath, updated.join('\n'))
  return changed
}

function updatePricingTs(prices: PriceResult[]): boolean {
  return updateFile(path.join(process.cwd(), 'src/lib/billing/pricing.ts'), lines => {
    let currentPlan: Plan | null = null
    return lines.map(line => {
      for (const plan of ['passive', 'active', 'executive'] as Plan[]) {
        if (new RegExp(`^\\s+${plan}:`).test(line)) currentPlan = plan
      }
      // Block ends at closing brace
      if (currentPlan && /^\s+\},?\s*$/.test(line)) currentPlan = null

      if (!currentPlan) return line
      const p = prices.find(x => x.plan === currentPlan)
      if (!p) return line

      // monthly: 49,
      if (p.interval === 'monthly') {
        const m = line.match(/^(\s+monthly:\s*)(\d+(?:\.\d+)?)(,\s*)$/)
        if (m) return `${m[1]}${p.dollars}${m[3]}`
      }
      // annual: 470,  (only for annual price entries)
      if (p.interval === 'annual') {
        const mAnnual = line.match(/^(\s+annual:\s*)(\d+(?:\.\d+)?)(,\s*)$/)
        if (mAnnual) return `${mAnnual[1]}${Math.round(p.dollars)}${mAnnual[3]}`
        const mMo = line.match(/^(\s+annualMonthly:\s*)(\d+)(,\s*)$/)
        if (mMo) return `${mMo[1]}${Math.round(p.dollars / 12)}${mMo[3]}`
      }
      return line
    })
  })
}

function updatePlansTs(prices: PriceResult[]): boolean {
  return updateFile(path.join(process.cwd(), 'src/lib/billing/plans.ts'), lines => {
    let currentPlan: Plan | null = null
    return lines.map(line => {
      for (const plan of ['passive', 'active', 'executive'] as Plan[]) {
        if (new RegExp(`^\\s+${plan}:`).test(line)) currentPlan = plan
      }
      if (currentPlan && /^\s+\},?\s*$/.test(line)) currentPlan = null

      if (!currentPlan) return line
      const p = prices.find(x => x.plan === currentPlan)
      if (!p) return line

      if (p.interval === 'monthly') {
        const m = line.match(/^(\s+amount:\s*)(\d+)(,\s*)$/)
        if (m) return `${m[1]}${p.cents}${m[3]}`
      }
      if (p.interval === 'annual') {
        const m = line.match(/^(\s+annualAmount:\s*)(\d+)(,\s*)$/)
        if (m) return `${m[1]}${p.cents}${m[3]}`
      }
      return line
    })
  })
}

async function main() {
  console.log('Fetching prices from Stripe...')
  const prices = await fetchPrices()

  if (prices.length === 0) {
    console.log('No price IDs configured — set STRIPE_PRICE_* env vars.')
    process.exit(0)
  }

  console.log('\nStripe prices:')
  for (const p of prices) console.log(`  ${p.plan} ${p.interval}: $${p.dollars}`)

  const pricingChanged = updatePricingTs(prices)
  const plansChanged   = updatePlansTs(prices)

  if (pricingChanged || plansChanged) {
    const files = [pricingChanged && 'pricing.ts', plansChanged && 'plans.ts'].filter(Boolean).join(', ')
    console.log(`\nUpdated: ${files}`)
  } else {
    console.log('\nNo changes — prices already in sync.')
  }
}

main().catch(err => { console.error(err); process.exit(1) })
