import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { sendEmail } from '@/lib/email'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type Stripe from 'stripe'
import { APP_URL } from '@/lib/config'
import { mapStripeStatus } from '@/lib/stripe-status'
import { getOwnerEmail } from '@/lib/owner-email'
import { captureServerEvent } from '@/lib/posthog-server'

const VALID_PLANS = new Set(['free', 'passive', 'active', 'executive', 'campaign', 'coach'])
const OWNER_EMAIL = getOwnerEmail()

// current_period_end is present on Stripe.Subscription at runtime but not typed
// in the SDK version pinned in this project.
type StripeSubWithPeriodEnd = Stripe.Subscription & { current_period_end: number }

function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function isStripeWebhookEventsTableMissing(message: string): boolean {
  return /does not exist/i.test(message) || /could not find the table/i.test(message)
}

async function persistStripeWebhookReceipt(
  supabase: ReturnType<typeof createAdminClient>,
  event: Stripe.Event,
  receivedAtIso: string,
  rawPayload: string,
) {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .upsert(
      {
        event_id: event.id,
        event_type: event.type,
        received_at: receivedAtIso,
        payload: { raw_body: rawPayload },
        processing_error: null,
      },
      { onConflict: 'event_id' },
    )

  if (!error) return
  if (isStripeWebhookEventsTableMissing(error.message)) return

  console.warn('[stripe-webhook] failed to persist receipt row', {
    eventId: event.id,
    error: error.message,
  })
}

async function persistStripeWebhookProcessingResult(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  processingError: string | null,
) {
  const { error } = await supabase
    .from('stripe_webhook_events')
    .update({
      processed_at: new Date().toISOString(),
      processing_error: processingError,
    })
    .eq('event_id', eventId)

  if (!error) return
  if (isStripeWebhookEventsTableMissing(error.message)) return

  console.warn('[stripe-webhook] failed to persist processing result', {
    eventId,
    error: error.message,
  })
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('[stripe-webhook] signature verification failed', { error: (err as Error).message })
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const receivedAtIso = new Date().toISOString()

  // Non-blocking persistence for Stripe webhook backlog observability.
  await persistStripeWebhookReceipt(supabase, event, receivedAtIso, body)

  // Idempotency: skip events we've already processed (handles Stripe retries)
  const { error: dupError } = await supabase
    .from('processed_stripe_events')
    .insert({ event_id: event.id })
  if (dupError) {
    // Unique violation = already processed
    if (dupError.code === '23505') {
      await persistStripeWebhookProcessingResult(supabase, event.id, null)
      return NextResponse.json({ received: true })
    }
    // Any other insert error: fail so Stripe retries
    await persistStripeWebhookProcessingResult(supabase, event.id, `idempotency_insert_failed: ${dupError.message}`)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  let updateError: { message: string } | null = null

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      const type = session.metadata?.type

      if (type === 'micro_product') {
        const microProductId = session.metadata?.microProductId
        const microProductSlug = session.metadata?.microProductSlug
        if (userId && microProductId) {
          const { error } = await supabase.from('account_entitlements').insert({
            user_id: userId,
            micro_product_id: microProductId,
            source_bundle_id: null,
            entitlement_key: `${microProductSlug ?? 'micro_product'}_access`,
            seat_limit: 1,
            status: 'active',
          })
          updateError = error
        }
        break
      }

      if (type === 'coach_seats') {
        // Coach purchased a seat bundle: credit seats to the partner record
        const partnerId = session.metadata?.partnerId
        const quantity = parseInt(session.metadata?.quantity ?? '0', 10)
        const subId = typeof session.subscription === 'string'
          ? session.subscription
          : (session.subscription as Stripe.Subscription | null)?.id ?? null
        if (partnerId && quantity > 0) {
          const { error } = await supabase.from('partners').update({
            seats_purchased: quantity,
            ...(subId ? { seats_subscription_id: subId } : {}),
            ...(userId ? { user_id: userId } : {}),
          }).eq('id', partnerId)
          updateError = error
        }
        break
      }

      if (userId && plan && VALID_PLANS.has(plan)) {
        const customerId = typeof session.customer === 'string'
          ? session.customer
          : (session.customer as Stripe.Customer | null)?.id ?? null
        const { data: updatedUser, error } = await supabase.from('users').update({
          subscription_tier: plan,
          subscription_status: 'active',
          trial_ends_at: null,
          ...(customerId ? { stripe_customer_id: customerId } : {}),
        }).eq('id', userId).select('email').single()
        updateError = error
        captureServerEvent(userId, 'trial_converted', { plan })
        if (updatedUser?.email) {
          sendEmail({
            to: OWNER_EMAIL ?? '',
            subject: `New paid subscriber: ${updatedUser.email}`,
            html: `<p style="font-family:sans-serif;font-size:14px;color:#0f172a;"><strong>${updatedUser.email}</strong> just converted to a paid ${plan} plan.</p>`,
          }).catch(() => {})
        }
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as StripeSubWithPeriodEnd
      const userId = sub.metadata?.userId
      const type = sub.metadata?.type

      if (type === 'micro_product') {
        const microProductId = sub.metadata?.microProductId
        if (userId && microProductId) {
          const entitlementStatus =
            sub.status === 'active' || sub.status === 'trialing'
              ? 'active'
              : sub.status === 'canceled'
                ? 'expired'
                : 'revoked'
          const { error } = await supabase
            .from('account_entitlements')
            .update({
              status: entitlementStatus,
              ends_at: entitlementStatus === 'active' ? null : new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('micro_product_id', microProductId)
            .eq('status', 'active')
          updateError = error
        }
        break
      }

      if (type === 'coach_seats') {
        // Sync seat quantity when the coach changes their seat count
        const partnerId = sub.metadata?.partnerId
        if (partnerId) {
          const quantity = sub.items?.data?.[0]?.quantity ?? 0
          const isActive = sub.status === 'active'
          const { error } = await supabase.from('partners').update({
            seats_purchased: isActive ? quantity : 0,
          }).eq('id', partnerId)
          updateError = error
        }
        break
      }

      if (!userId) break
      const status = mapStripeStatus(sub.status, sub.pause_collection)
      const rawPlan = sub.metadata?.plan ?? 'free'
      const plan = VALID_PLANS.has(rawPlan) ? rawPlan : 'free'
      const update: Record<string, string | null> = {
        subscription_tier: status === 'active' || status === 'trialing' ? plan : 'free',
        subscription_status: status,
        subscription_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      }
      // Clear trial_ends_at when subscription converts from trial to paid
      if (status === 'active' && sub.trial_end) {
        update.trial_ends_at = null
      }
      const { error } = await supabase.from('users').update(update).eq('id', userId)
      updateError = error
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as StripeSubWithPeriodEnd
      const type = sub.metadata?.type

      if (type === 'micro_product') {
        const userId = sub.metadata?.userId
        const microProductId = sub.metadata?.microProductId
        if (userId && microProductId) {
          const { error } = await supabase
            .from('account_entitlements')
            .update({ status: 'expired', ends_at: new Date().toISOString() })
            .eq('user_id', userId)
            .eq('micro_product_id', microProductId)
            .eq('status', 'active')
          updateError = error
        }
        break
      }

      if (type === 'coach_seats') {
        const partnerId = sub.metadata?.partnerId
        if (partnerId) {
          const { error } = await supabase.from('partners').update({
            seats_purchased: 0,
            seats_subscription_id: null,
          }).eq('id', partnerId)
          updateError = error
        }
        break
      }

      const userId = sub.metadata?.userId
      if (!userId) break
      const { error } = await supabase.from('users').update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
        subscription_period_end: sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null,
      }).eq('id', userId)
      updateError = error

      // Downgrade seat members and offer each one an individual subscription
      const { data: seats } = await supabase
        .from('team_seats')
        .select('member_user_id')
        .eq('owner_id', userId)
        .eq('status', 'accepted')
        .not('member_user_id', 'is', null)
      const memberIds = (seats ?? []).map(s => s.member_user_id as string)
      if (memberIds.length > 0) {
        const { data: memberUsers } = await supabase
          .from('users')
          .select('id, email')
          .in('id', memberIds)
        await supabase.from('users').update({
          subscription_tier: 'free',
          subscription_status: 'inactive',
        }).in('id', memberIds)
        for (const member of (memberUsers ?? [])) {
          if (!member.email) continue
          sendEmail({
            to: member.email,
            subject: 'Your Starting Monday team access has ended',
            html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#334155;">
<p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 12px 0;">Your team access has ended.</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px 0;">The organization account that gave you access to Starting Monday has been canceled.</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 12px 0;">Your account is intact. Your companies, contacts, and research history are all still there.</p>
<p style="font-size:14px;line-height:1.6;margin:0 0 24px 0;">To keep your search moving, you can subscribe directly. The Monitor plan is $49/mo and includes daily company signals and briefings.</p>
<p style="margin:0 0 24px 0;">
  <a href="${APP_URL}/settings/billing" style="display:inline-block;background:#0f172a;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600;">Keep my subscription</a>
</p>
<p style="font-size:13px;color:#64748b;margin:0 0 8px 0;">Reply to this email if you have questions. I read everything.</p>
<p style="font-size:13px;color:#334155;margin:0;">Rich Rothschild<br>Founder, Starting Monday</p>
<p style="font-size:12px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;">Starting Monday -- startingmonday.app</p>
</body></html>`,
          }).catch(() => {})
        }
      }
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = typeof invoice.customer === 'string'
        ? invoice.customer
        : (invoice.customer as Stripe.Customer | null)?.id
      if (!customerId) break
      const { data: userData, error } = await supabase
        .from('users')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)
        .select('email')
        .single()
      updateError = error

      // Notify the user their payment failed so they can update their card
      if (userData?.email) {
        await sendEmail({
          to: userData.email,
          subject: 'Action required: your Starting Monday payment failed',
          html: `<!DOCTYPE html><html><body style="font-family:sans-serif;max-width:560px;margin:40px auto;padding:0 16px;color:#334155">
<p style="font-size:16px;font-weight:700;color:#0f172a">Payment failed</p>
<p>Your most recent Starting Monday payment could not be processed. Your account has been marked past due and AI features may be restricted.</p>
<p><a href="${APP_URL}/settings/billing" style="display:inline-block;background:#0f172a;color:#fff;padding:10px 20px;border-radius:4px;text-decoration:none;font-size:14px;font-weight:600">Update payment method</a></p>
<p style="font-size:13px;color:#64748b">If you believe this is an error, reply to this email and we will sort it out.</p>
</body></html>`,
        }).catch(() => {/* non-fatal; DB is already updated */})
      }
      break
    }

    case 'customer.deleted': {
      const customer = event.data.object as Stripe.Customer
      const { error } = await supabase.from('users').update({
        stripe_customer_id: null,
        subscription_status: 'inactive',
        subscription_tier: 'free',
      }).eq('stripe_customer_id', customer.id)
      updateError = error
      break
    }
  }

  if (updateError) {
    // Tell Stripe the event wasn't processed so it retries
    await persistStripeWebhookProcessingResult(supabase, event.id, updateError.message)
    return NextResponse.json({ error: 'Database update failed' }, { status: 500 })
  }

  await persistStripeWebhookProcessingResult(supabase, event.id, null)

  return NextResponse.json({ received: true })
}
