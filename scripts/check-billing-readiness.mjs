#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import ws from 'ws'

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = ws
}

const asJson = process.argv.includes('--json')
const strict = process.argv.includes('--strict')
const skipRows = process.argv.includes('--skip-rows')

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
]

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

function isPresent(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isMissingRelationError(error) {
  if (!error || typeof error !== 'object') return false
  const code = typeof error.code === 'string' ? error.code : ''
  const msg = typeof error.message === 'string' ? error.message : ''
  return code === 'PGRST205' || msg.includes('schema cache') || msg.includes('Could not find the table')
}

function checkEnvVars() {
  const checks = REQUIRED_ENV_VARS.map((name) => ({
    name,
    present: isPresent(process.env[name]),
  }))

  const missing = checks.filter((c) => !c.present).map((c) => c.name)

  return {
    checks,
    missing,
  }
}

async function checkStripeBackedRows() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!isPresent(supabaseUrl) || !isPresent(serviceRoleKey)) {
    return {
      skipped: true,
      reason: 'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for row checks',
      issues: [],
    }
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const [productsRes, pricesRes, bundlesRes] = await Promise.all([
    supabase.from('micro_products').select('id, slug, product_status'),
    supabase.from('micro_product_prices').select('id, micro_product_id, stripe_product_id, stripe_price_id, stripe_coupon_id, is_active, interval'),
    supabase.from('micro_product_bundles').select('id, slug, bundle_status, stripe_product_id, stripe_price_id, stripe_coupon_id'),
  ])

  const relationErrors = [productsRes.error, pricesRes.error, bundlesRes.error].filter(isMissingRelationError)
  if (relationErrors.length > 0) {
    return {
      skipped: true,
      reason: `billing catalog tables unavailable (${relationErrors[0].message})`,
      issues: [],
    }
  }

  for (const res of [productsRes, pricesRes, bundlesRes]) {
    if (res.error) {
      throw new Error(`Supabase query failed: ${res.error.message}`)
    }
  }

  const productSlugById = new Map((productsRes.data ?? []).map((p) => [p.id, p.slug]))
  const activeProductIds = new Set((productsRes.data ?? []).filter((p) => p.product_status === 'active').map((p) => p.id))

  const issues = []

  for (const row of pricesRes.data ?? []) {
    if (!row.is_active) continue
    if (!activeProductIds.has(row.micro_product_id)) continue

    const slug = productSlugById.get(row.micro_product_id) ?? row.micro_product_id

    if (!isPresent(row.stripe_price_id)) {
      issues.push({
        type: 'micro_product_price_missing',
        slug,
        rowId: row.id,
        field: 'stripe_price_id',
      })
    }

    if (!isPresent(row.stripe_product_id)) {
      issues.push({
        type: 'micro_product_product_missing',
        slug,
        rowId: row.id,
        field: 'stripe_product_id',
      })
    }

    if (PLACEHOLDER_IDS.has(row.stripe_price_id ?? '')) {
      issues.push({
        type: 'micro_product_price_placeholder',
        slug,
        rowId: row.id,
        field: 'stripe_price_id',
        value: row.stripe_price_id,
      })
    }

    if (PLACEHOLDER_IDS.has(row.stripe_product_id ?? '')) {
      issues.push({
        type: 'micro_product_product_placeholder',
        slug,
        rowId: row.id,
        field: 'stripe_product_id',
        value: row.stripe_product_id,
      })
    }

    if (row.stripe_coupon_id && PLACEHOLDER_IDS.has(row.stripe_coupon_id)) {
      issues.push({
        type: 'micro_product_coupon_placeholder',
        slug,
        rowId: row.id,
        field: 'stripe_coupon_id',
        value: row.stripe_coupon_id,
      })
    }
  }

  for (const row of bundlesRes.data ?? []) {
    if (row.bundle_status !== 'active') continue

    if (!isPresent(row.stripe_price_id)) {
      issues.push({
        type: 'bundle_price_missing',
        slug: row.slug,
        rowId: row.id,
        field: 'stripe_price_id',
      })
    }

    if (!isPresent(row.stripe_product_id)) {
      issues.push({
        type: 'bundle_product_missing',
        slug: row.slug,
        rowId: row.id,
        field: 'stripe_product_id',
      })
    }

    if (PLACEHOLDER_IDS.has(row.stripe_price_id ?? '')) {
      issues.push({
        type: 'bundle_price_placeholder',
        slug: row.slug,
        rowId: row.id,
        field: 'stripe_price_id',
        value: row.stripe_price_id,
      })
    }

    if (PLACEHOLDER_IDS.has(row.stripe_product_id ?? '')) {
      issues.push({
        type: 'bundle_product_placeholder',
        slug: row.slug,
        rowId: row.id,
        field: 'stripe_product_id',
        value: row.stripe_product_id,
      })
    }

    if (row.stripe_coupon_id && PLACEHOLDER_IDS.has(row.stripe_coupon_id)) {
      issues.push({
        type: 'bundle_coupon_placeholder',
        slug: row.slug,
        rowId: row.id,
        field: 'stripe_coupon_id',
        value: row.stripe_coupon_id,
      })
    }
  }

  return {
    skipped: false,
    reason: null,
    issues,
  }
}

async function main() {
  const env = checkEnvVars()
  const rowChecks = skipRows
    ? { skipped: true, reason: 'row checks skipped (--skip-rows)', issues: [] }
    : await checkStripeBackedRows()

  const failures = []

  for (const missing of env.missing) {
    failures.push({ type: 'env_missing', key: missing })
  }

  for (const issue of rowChecks.issues) {
    failures.push(issue)
  }

  const result = {
    checkedAt: new Date().toISOString(),
    status: failures.length === 0 ? 'PASS' : 'FAIL',
    env,
    rows: rowChecks,
    failures,
  }

  if (asJson) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log('Billing readiness')
    console.log('-----------------')
    console.log(`Status: ${result.status}`)
    console.log(`Missing env vars: ${env.missing.length}`)
    if (env.missing.length > 0) {
      for (const key of env.missing) console.log(`- ${key}`)
    }

    if (rowChecks.skipped) {
      console.log(`Row checks: skipped (${rowChecks.reason})`)
    } else {
      console.log(`Row issues: ${rowChecks.issues.length}`)
      for (const issue of rowChecks.issues) {
        const suffix = issue.value ? ` (${issue.value})` : ''
        console.log(`- ${issue.type}: ${issue.slug} [${issue.field}]${suffix}`)
      }
    }
  }

  if (strict && failures.length > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(`billing readiness fatal error: ${err instanceof Error ? err.message : String(err)}`)
  process.exitCode = 1
})
