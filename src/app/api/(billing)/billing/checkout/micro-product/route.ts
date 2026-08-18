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
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : ''

  if (!slug) {
    return NextResponse.json({ error: 'Missing micro-product slug' }, { status: 400 })
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

  const { data: product } = await ops
    .from('micro_products')
    .select('id, slug, name, product_status')
    .eq('slug', slug)
    .maybeSingle()

  if (!product || product.product_status !== 'active') {
    return NextResponse.json({ error: 'Product unavailable' }, { status: 404 })
  }

  const { data: prices } = await ops
    .from('micro_product_prices')
    .select('stripe_price_id, interval, is_active')
    .eq('micro_product_id', product.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)

  const activePrice = prices?.[0]
  if (!activePrice?.stripe_price_id) {
    return NextResponse.json({ error: 'Pricing not configured for this product' }, { status: 500 })
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

  const mode = activePrice.interval === 'one_time' ? 'payment' : 'subscription'

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode,
    billing_address_collection: 'required',
    line_items: [{ price: activePrice.stripe_price_id, quantity: 1 }],
    success_url: `${APP_URL}/settings/billing?addOnSuccess=${encodeURIComponent(product.slug)}`,
    cancel_url: `${APP_URL}/settings/billing?addOnCancel=${encodeURIComponent(product.slug)}`,
    metadata: {
      type: 'micro_product',
      userId,
      microProductId: product.id,
      microProductSlug: product.slug,
    },
    ...(mode === 'subscription'
      ? {
          subscription_data: {
            metadata: {
              type: 'micro_product',
              userId,
              microProductId: product.id,
              microProductSlug: product.slug,
            },
          },
        }
      : {}),
  })

  return NextResponse.json({ url: session.url })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
