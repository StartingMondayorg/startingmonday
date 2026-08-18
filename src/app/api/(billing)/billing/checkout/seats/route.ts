import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStripe } from '@/lib/stripe'
import { APP_URL } from '@/lib/config'

function getSeatPriceId(plan: string): string {
  const envKey = `STRIPE_PRICE_PARTNER_${plan.toUpperCase()}`
  const id = process.env[envKey]
  if (!id) throw new Error(`${envKey} is not set`)
  return id
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response
  const { userId } = auth

  const body = await request.json().catch(() => ({}))
  const plan = (body?.plan ?? '').toString().trim().toLowerCase()
  const quantity = Math.max(1, Math.min(20, parseInt(String(body?.quantity ?? '1'), 10)))

  if (!plan || !['passive', 'active'].includes(plan)) {
    return NextResponse.json({ error: 'plan must be passive or active' }, { status: 400 })
  }

  let priceId: string
  try {
    priceId = getSeatPriceId(plan)
  } catch {
    return NextResponse.json({ error: `Seat pricing not configured for ${plan}` }, { status: 500 })
  }

  const admin = createAdminClient()

  const { data: user } = await admin
    .from('users')
    .select('email, stripe_customer_id')
    .eq('id', userId)
    .single()
  if (!user?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: partner } = await admin
    .from('partners')
    .select('id, user_id')
    .eq('email', user.email)
    .eq('is_active', true)
    .maybeSingle()
  if (!partner) return NextResponse.json({ error: 'Not a registered partner' }, { status: 403 })

  // Self-register user_id on the partner record if not yet set
  if (!partner.user_id) {
    await admin.from('partners').update({ user_id: userId }).eq('id', partner.id)
  }

  let customerId = user.stripe_customer_id
  if (!customerId) {
    const { data: profile } = await admin
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
    await admin.from('users').update({ stripe_customer_id: customerId }).eq('id', userId)
  }

  let session
  try {
    session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      billing_address_collection: 'required',
      line_items: [{
        price: priceId,
        quantity,
        adjustable_quantity: { enabled: true, minimum: 1, maximum: 20 },
      }],
      success_url: `${APP_URL}/dashboard/partner?seats=1`,
      cancel_url: `${APP_URL}/dashboard/partner`,
      metadata: {
        type: 'coach_seats',
        partnerId: partner.id,
        userId,
        plan,
        quantity: String(quantity),
      },
      subscription_data: {
        metadata: {
          type: 'coach_seats',
          partnerId: partner.id,
          userId,
          plan,
        },
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
