/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any

    const { data: userRow } = await supabase
      .from('users')
      .select('stripe_customer_id, subscription_status')
      .eq('id', userId)
      .maybeSingle()

    let mismatchCount = 0
    const details: Record<string, unknown> = { has_stripe_customer: !!userRow?.stripe_customer_id }

    if (userRow?.stripe_customer_id) {
      const invoices = await getStripe().invoices.list({ customer: userRow.stripe_customer_id, limit: 20 })
      const paidInvoices = invoices.data.filter(i => i.status === 'paid' || (i.amount_paid ?? 0) > 0)
      const openInvoices = invoices.data.filter(i => i.status === 'open')
      if (userRow.subscription_status === 'active' && openInvoices.length > 3) mismatchCount += 1
      details.paid_invoices = paidInvoices.length
      details.open_invoices = openInvoices.length
    } else {
      mismatchCount += 1
      details.reason = 'stripe_customer_missing'
    }

    const status = mismatchCount === 0 ? 'ok' : 'mismatch'
    const { data } = await sb
      .from('payment_reconciliation_checks')
      .insert({ user_id: userId, status, mismatch_count: mismatchCount, details })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, checkId: data?.id, status, mismatchCount, details })
  } catch (error) {
    console.error('[billing.payment-reconciliation-checks] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
