import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const readRepoFile = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

describe('retired placeholder billing offers', () => {
  const migration = readRepoFile('supabase/migrations/179_retire_placeholder_billing_offers.sql')
  const productCheckout = readRepoFile('src/app/api/(billing)/billing/checkout/micro-product/route.ts')
  const bundleCheckout = readRepoFile('src/app/api/(billing)/billing/checkout/micro-product-bundle/route.ts')

  it('retires exactly the three unapproved offer slugs and disables product prices', () => {
    expect(migration).toContain("'exec-interview-narrative-pack'")
    expect(migration).toContain("'board-transition-brief-kit'")
    expect(migration).toContain("'outplacement-accelerator-bundle'")
    expect(migration).toContain("product_status = 'retired'")
    expect(migration).toContain('is_active = false')
    expect(migration).toContain("bundle_status = 'retired'")
    expect(migration).not.toMatch(/\bdelete\s+from\b/i)
    expect(migration).not.toMatch(/stripe_(?:product|price|coupon)_id\s*=/i)
  })

  it('keeps product and bundle checkout fail-closed on inactive catalog state', () => {
    expect(productCheckout).toContain("product.product_status !== 'active'")
    expect(productCheckout).toContain(".eq('is_active', true)")
    expect(bundleCheckout).toContain("bundle.bundle_status !== 'active'")
  })
})