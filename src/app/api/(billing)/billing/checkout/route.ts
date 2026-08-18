import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStripe, getPriceId } from '@/lib/stripe'
import { PLANS, type PlanKey } from '@/lib/plans'
import { APP_URL } from '@/lib/config'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const { userId } = auth
  const body = await request.json().catch(() => ({}))
  // Normalize legacy 'monitor' to 'passive' (backward compat with old billing client)
  const rawPlan = body?.plan
  const plan = (rawPlan === 'monitor' ? 'passive' : rawPlan) as PlanKey | undefined
  const interval: 'monthly' | 'annual' = body?.interval === 'annual' ? 'annual' : 'monthly'

  if (!plan || !(plan in PLANS)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const supabase = await createClient()
  const [{ data: user }, { data: profile }] = await Promise.all([
    supabase.from('users').select('email, stripe_customer_id').eq('id', userId).single(),
    supabase.from('user_profiles').select('full_name').eq('user_id', userId).single(),
  ])

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Reuse existing Stripe customer or create one.
  // Idempotency key on customer creation prevents duplicate customers if two
  // checkout requests race (both see stripe_customer_id = null simultaneously).
  let customerId = user.stripe_customer_id
  if (!customerId) {
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
  } else if (profile?.full_name) {
    // Update name on existing customer so receipt shows their name
    getStripe().customers.update(customerId, { name: profile.full_name }).catch(() => {})
  }

  const baseUrl = APP_URL

  let session
  try {
    session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      billing_address_collection: 'required',
      line_items: [{ price: getPriceId(plan, interval), quantity: 1 }],
      success_url: `${baseUrl}/dashboard?upgraded=1`,
      cancel_url: `${baseUrl}/settings/billing`,
      metadata: { userId, plan },
      subscription_data: {
        metadata: { userId, plan },
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
