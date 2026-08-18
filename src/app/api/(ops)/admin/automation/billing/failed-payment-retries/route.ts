import { type NextRequest, NextResponse } from 'next/server'
import { type SupabaseClient } from '@supabase/supabase-js'
import { getStripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth as { userId: string; supabase: SupabaseClient }
    const body = await request.json().catch(() => ({}))
    const retryNow = body?.retryNow === true

    const { data: userRow } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_status')
      .eq('id', userId)
      .maybeSingle()

    if (!userRow?.stripe_customer_id) {
      await (supabase.from('failed_payment_retry_runs') as any).insert({
        user_id: userId,
        status: 'no_action',
        details: { reason: 'missing_stripe_customer' },
      })
      return NextResponse.json({ ok: true, retried: false, reason: 'No Stripe customer found' })
    }

    const invoices = await getStripe().invoices.list({ customer: userRow.stripe_customer_id, status: 'open', limit: 10 })
    const targetInvoice = invoices.data.find(inv => inv.attempted && inv.status === 'open') ?? null

    if (!targetInvoice) {
      await (supabase.from('failed_payment_retry_runs') as any).insert({
        user_id: userId,
        status: 'no_action',
        attempts: 0,
        details: { reason: 'no_open_failed_invoice' },
      })
      return NextResponse.json({ ok: true, retried: false, reason: 'No eligible failed invoice found' })
    }

    let status: 'retried' | 'failed' = 'failed'
    if (retryNow) {
      try {
        await getStripe().invoices.pay(targetInvoice.id)
        status = 'retried'
      } catch {
        status = 'failed'
      }
    }

    await (supabase.from('failed_payment_retry_runs') as any).insert({
      user_id: userId,
      stripe_invoice_id: targetInvoice.id,
      status,
      attempts: (targetInvoice.attempt_count ?? 0) + (retryNow ? 1 : 0),
      details: { retry_now: retryNow, subscription_status: userRow.subscription_status },
    })

    return NextResponse.json({ ok: true, retried: status === 'retried', invoiceId: targetInvoice.id, dryRun: !retryNow })
  } catch (error) {
    console.error('[billing.failed-payment-retries] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
