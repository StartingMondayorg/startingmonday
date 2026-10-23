'use server'

import { revalidatePath } from 'next/cache'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { numOrNull, str } from '@/lib/form-utils'

function createOpsClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireStaff() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const staff = await getStaffMember(user)
  if (!staff) return null
  return { user, staff }
}

function canWrite(role: string): boolean {
  return role === 'owner' || role === 'admin'
}

export async function createCatalogProduct(formData: FormData) {
  const auth = await requireStaff()
  if (!auth || !canWrite(auth.staff.role)) return

  const slug = str(formData, 'slug')
  const name = str(formData, 'name')
  const summary = str(formData, 'summary')
  const channel = str(formData, 'channel')
  const persona = str(formData, 'persona')
  const productStatus = str(formData, 'product_status') || 'draft'
  const billingType = str(formData, 'billing_type') || 'one_time'
  const defaultInterval = str(formData, 'default_interval') || 'one_time'
  const displayOrder = numOrNull(formData, 'display_order') ?? 100

  if (!slug || !name || !summary || !channel) return

  const ops = createOpsClient()
  await ops.from('micro_products').insert({
    slug,
    name,
    summary,
    channel,
    persona: persona || null,
    product_status: productStatus,
    billing_type: billingType,
    default_interval: defaultInterval,
    display_order: displayOrder,
  })

  revalidatePath('/dashboard/admin/product/catalog')
}

export async function setCatalogProductStatus(formData: FormData) {
  const auth = await requireStaff()
  if (!auth || !canWrite(auth.staff.role)) return

  const id = str(formData, 'id')
  const productStatus = str(formData, 'product_status')
  if (!id || !productStatus) return

  const ops = createOpsClient()
  await ops
    .from('micro_products')
    .update({ product_status: productStatus, updated_at: new Date().toISOString() })
    .eq('id', id)

  revalidatePath('/dashboard/admin/product/catalog')
}

export async function createCatalogPrice(formData: FormData) {
  const auth = await requireStaff()
  if (!auth || !canWrite(auth.staff.role)) return

  const microProductId = str(formData, 'micro_product_id')
  const stripeProductId = str(formData, 'stripe_product_id')
  const stripePriceId = str(formData, 'stripe_price_id')
  const stripeCouponId = str(formData, 'stripe_coupon_id')
  const interval = str(formData, 'interval') || 'one_time'
  const unitAmountCents = numOrNull(formData, 'unit_amount_cents')

  if (!microProductId || !stripeProductId || !stripePriceId || !unitAmountCents) return

  const ops = createOpsClient()
  await ops.from('micro_product_prices').insert({
    micro_product_id: microProductId,
    stripe_product_id: stripeProductId,
    stripe_price_id: stripePriceId,
    stripe_coupon_id: stripeCouponId || null,
    interval,
    unit_amount_cents: unitAmountCents,
    is_active: true,
  })

  revalidatePath('/dashboard/admin/product/catalog')
}

export async function createBundleTemplate(formData: FormData) {
  const auth = await requireStaff()
  if (!auth || !canWrite(auth.staff.role)) return

  const slug = str(formData, 'slug')
  const name = str(formData, 'name')
  const audience = str(formData, 'audience') || 'b2b'
  const bundleStatus = str(formData, 'bundle_status') || 'draft'
  const seatMin = numOrNull(formData, 'seat_min') ?? 1

  if (!slug || !name) return

  const ops = createOpsClient()
  await ops.from('micro_product_bundles').insert({
    slug,
    name,
    audience,
    bundle_status: bundleStatus,
    seat_min: seatMin,
    stripe_product_id: str(formData, 'stripe_product_id') || null,
    stripe_price_id: str(formData, 'stripe_price_id') || null,
    stripe_coupon_id: str(formData, 'stripe_coupon_id') || null,
  })

  revalidatePath('/dashboard/admin/product/catalog')
}

export async function addBundleItem(formData: FormData) {
  const auth = await requireStaff()
  if (!auth || !canWrite(auth.staff.role)) return

  const bundleId = str(formData, 'bundle_id')
  const microProductId = str(formData, 'micro_product_id')
  const entitlementKey = str(formData, 'entitlement_key')

  if (!bundleId || !microProductId || !entitlementKey) return

  const ops = createOpsClient()
  await ops.from('micro_product_bundle_items').upsert({
    bundle_id: bundleId,
    micro_product_id: microProductId,
    entitlement_key: entitlementKey,
    included: true,
  }, { onConflict: 'bundle_id,micro_product_id' })

  revalidatePath('/dashboard/admin/product/catalog')
}

export async function assignBundleToPartner(formData: FormData) {
  const auth = await requireStaff()
  if (!auth || !canWrite(auth.staff.role)) return

  const partnerEmail = str(formData, 'partner_email')
  const bundleId = str(formData, 'bundle_id')
  const seatLimit = numOrNull(formData, 'seat_limit') ?? 1

  if (!partnerEmail || !bundleId) return

  const ops = createOpsClient()
  const { data: partner } = await ops
    .from('partners')
    .select('id')
    .eq('email', partnerEmail)
    .eq('is_active', true)
    .maybeSingle()

  if (!partner) return

  const { data: bundleItems } = await ops
    .from('micro_product_bundle_items')
    .select('micro_product_id, entitlement_key')
    .eq('bundle_id', bundleId)

  if (!bundleItems || bundleItems.length === 0) return

  const rows = bundleItems.map((item: { micro_product_id: string; entitlement_key: string }) => ({
    partner_id: partner.id,
    micro_product_id: item.micro_product_id,
    source_bundle_id: bundleId,
    entitlement_key: item.entitlement_key,
    seat_limit: seatLimit,
    status: 'active',
  }))

  await ops.from('account_entitlements').insert(rows)

  revalidatePath('/dashboard/admin/product/catalog')
}
