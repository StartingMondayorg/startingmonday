import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { getStripe } from '@/lib/stripe'
import { getOrRecoverStripeCustomerId } from '@/lib/stripe-customer'
import { logEvent } from '@/lib/events'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const customerId = await getOrRecoverStripeCustomerId(auth.userId)
  if (!customerId) {
    return NextResponse.json({ error: 'No billing account found' }, { status: 404 })
  }

  const subs = await getStripe().subscriptions.list({ customer: customerId, limit: 1 })
  const subscription = subs.data[0]
  if (!subscription) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getStripe().subscriptions as any).update(subscription.id, {
      pause_collection: null,
    })

    await logEvent(auth.userId, 'search_resumed', {})
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
