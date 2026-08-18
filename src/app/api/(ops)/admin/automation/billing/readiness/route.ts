import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

const REQUIRED_ENV_VARS = [
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PRICE_MONITOR',
  'STRIPE_PRICE_MONITOR_ANNUAL',
  'STRIPE_PRICE_ACTIVE',
  'STRIPE_PRICE_ACTIVE_ANNUAL',
  'STRIPE_PRICE_EXECUTIVE',
  'STRIPE_PRICE_EXECUTIVE_ANNUAL',
  'STRIPE_PRICE_PARTNER_PASSIVE',
  'STRIPE_PRICE_PARTNER_ACTIVE',
] as const

const PLACEHOLDER_IDS = new Set([
  'price_exec_interview_narrative_pack',
  'price_board_transition_brief_kit_monthly',
  'price_outplacement_accelerator_bundle_monthly',
  'prod_exec_interview_narrative_pack',
  'prod_board_transition_brief_kit',
  'prod_outplacement_accelerator_bundle',
  'coupon_exec_launch_2026',
  'coupon_board_launch_2026',
  'coupon_outplacement_pilot_2026',
])

function isPresent(value: string | undefined) {
  return typeof value === 'string' && value.trim().length > 0
}

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { supabase } = auth

    const missingEnvVars = REQUIRED_ENV_VARS.filter((name) => !isPresent(process.env[name]))

    const [productsRes, pricesRes, bundlesRes] = await Promise.all([
      supabase.from('micro_products').select('id, slug, product_status'),
      supabase
        .from('micro_product_prices')
        .select('id, micro_product_id, stripe_product_id, stripe_price_id, stripe_coupon_id, is_active'),
      supabase
        .from('micro_product_bundles')
        .select('id, slug, bundle_status, stripe_product_id, stripe_price_id, stripe_coupon_id'),
    ])

    if (productsRes.error || pricesRes.error || bundlesRes.error) {
      return NextResponse.json({ error: 'Failed to query billing inventory' }, { status: 500 })
    }

    const products = (productsRes.data ?? []) as Array<{ id: string; slug: string; product_status: string }>
    const prices = (pricesRes.data ?? []) as Array<{
      id: string
      micro_product_id: string
      stripe_product_id: string | null
      stripe_price_id: string | null
      stripe_coupon_id: string | null
      is_active: boolean
    }>
    const bundles = (bundlesRes.data ?? []) as Array<{
      id: string
      slug: string
      bundle_status: string
      stripe_product_id: string | null
      stripe_price_id: string | null
      stripe_coupon_id: string | null
    }>

    const activeProductIds = new Set(products.filter((p) => p.product_status === 'active').map((p) => p.id))
    const productSlugById = new Map(products.map((p) => [p.id, p.slug]))

    const unresolvedRows: Array<{
      type: string
      slug: string
      field: string
      value: string | null
      rowId: string
    }> = []

    for (const row of prices) {
      if (!row.is_active) continue
      if (!activeProductIds.has(row.micro_product_id)) continue

      const slug = productSlugById.get(row.micro_product_id) ?? row.micro_product_id

      if (!isPresent(row.stripe_price_id ?? undefined)) {
        unresolvedRows.push({ type: 'micro_product_price_missing', slug, field: 'stripe_price_id', value: row.stripe_price_id, rowId: row.id })
      } else if (PLACEHOLDER_IDS.has(row.stripe_price_id ?? '')) {
        unresolvedRows.push({ type: 'micro_product_price_placeholder', slug, field: 'stripe_price_id', value: row.stripe_price_id, rowId: row.id })
      }

      if (!isPresent(row.stripe_product_id ?? undefined)) {
        unresolvedRows.push({ type: 'micro_product_product_missing', slug, field: 'stripe_product_id', value: row.stripe_product_id, rowId: row.id })
      } else if (PLACEHOLDER_IDS.has(row.stripe_product_id ?? '')) {
        unresolvedRows.push({ type: 'micro_product_product_placeholder', slug, field: 'stripe_product_id', value: row.stripe_product_id, rowId: row.id })
      }

      if (row.stripe_coupon_id && PLACEHOLDER_IDS.has(row.stripe_coupon_id)) {
        unresolvedRows.push({ type: 'micro_product_coupon_placeholder', slug, field: 'stripe_coupon_id', value: row.stripe_coupon_id, rowId: row.id })
      }
    }

    for (const row of bundles) {
      if (row.bundle_status !== 'active') continue

      if (!isPresent(row.stripe_price_id ?? undefined)) {
        unresolvedRows.push({ type: 'bundle_price_missing', slug: row.slug, field: 'stripe_price_id', value: row.stripe_price_id, rowId: row.id })
      } else if (PLACEHOLDER_IDS.has(row.stripe_price_id ?? '')) {
        unresolvedRows.push({ type: 'bundle_price_placeholder', slug: row.slug, field: 'stripe_price_id', value: row.stripe_price_id, rowId: row.id })
      }

      if (!isPresent(row.stripe_product_id ?? undefined)) {
        unresolvedRows.push({ type: 'bundle_product_missing', slug: row.slug, field: 'stripe_product_id', value: row.stripe_product_id, rowId: row.id })
      } else if (PLACEHOLDER_IDS.has(row.stripe_product_id ?? '')) {
        unresolvedRows.push({ type: 'bundle_product_placeholder', slug: row.slug, field: 'stripe_product_id', value: row.stripe_product_id, rowId: row.id })
      }

      if (row.stripe_coupon_id && PLACEHOLDER_IDS.has(row.stripe_coupon_id)) {
        unresolvedRows.push({ type: 'bundle_coupon_placeholder', slug: row.slug, field: 'stripe_coupon_id', value: row.stripe_coupon_id, rowId: row.id })
      }
    }

    return NextResponse.json({
      ok: true,
      unresolved: {
        env: missingEnvVars,
        rows: unresolvedRows,
      },
      counts: {
        env: missingEnvVars.length,
        rows: unresolvedRows.length,
        total: missingEnvVars.length + unresolvedRows.length,
      },
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[billing.readiness] failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
