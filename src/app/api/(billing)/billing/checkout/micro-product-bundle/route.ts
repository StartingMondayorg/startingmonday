import { type NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStripe } from '@/lib/stripe'
import { APP_URL } from '@/lib/config'

function createOpsClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const body = await request.json().catch(() => ({}))
  const bundleSlug = typeof body?.bundleSlug === 'string' ? body.bundleSlug.trim() : ''
  const rawDiscountCode = typeof body?.discountCode === 'string' ? body.discountCode.trim() : ''
  const discountCode = rawDiscountCode.toUpperCase()

  if (!bundleSlug) {
    return NextResponse.json({ error: 'Missing bundle slug' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single()

  if (!user?.email) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const ops = createOpsClient()

  const { data: bundle } = await ops
    .from('micro_product_bundles')
    .select('id, slug, name, audience, bundle_status, stripe_price_id, stripe_coupon_id')
    .eq('slug', bundleSlug)
    .maybeSingle()

  if (!bundle || bundle.bundle_status !== 'active') {
    return NextResponse.json({ error: 'Bundle unavailable' }, { status: 404 })
  }

  if (!bundle.stripe_price_id) {
    return NextResponse.json({ error: 'Pricing not configured for this bundle' }, { status: 500 })
  }

  let customerId = user.stripe_customer_id
  if (!customerId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single()

    const customer = await getStripe().customers.create(
      {
        email: user.email,
        ...(profile?.full_name ? { name: profile.full_name } : {}),
        metadata: { userId },
      },
      { idempotencyKey: `customer-${userId}` },
    )

    customerId = customer.id
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
  }

  let discounts: Array<{ coupon?: string; promotion_code?: string }> | undefined
  let discountMetadata: string | undefined

  if (discountCode) {
    const promotionCodes = await getStripe().promotionCodes.list({
      code: discountCode,
      active: true,
      limit: 1,
    })

    const promo = promotionCodes.data?.[0]
    if (!promo?.id) {
      return NextResponse.json({ error: 'Invalid or inactive discount code' }, { status: 400 })
    }

    discounts = [{ promotion_code: promo.id }]
    discountMetadata = discountCode
  } else if (bundle.stripe_coupon_id) {
    discounts = [{ coupon: bundle.stripe_coupon_id }]
    discountMetadata = bundle.stripe_coupon_id
  }

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    billing_address_collection: 'required',
    line_items: [{ price: bundle.stripe_price_id, quantity: 1 }],
    ...(discounts ? { discounts } : {}),
    success_url: `${APP_URL}/settings/billing?bundleSuccess=${encodeURIComponent(bundle.slug)}`,
    cancel_url: `${APP_URL}/settings/billing?bundleCancel=${encodeURIComponent(bundle.slug)}`,
    metadata: {
      type: 'micro_product_bundle',
      userId,
      bundleId: bundle.id,
      bundleSlug: bundle.slug,
      ...(discountMetadata ? { discountCode: discountMetadata } : {}),
    },
  })

  return NextResponse.json({ url: session.url })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
