/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any

  const { data: userRow } = await supabase
    .from('users')
    .select('stripe_customer_id, subscription_status, subscription_tier')
    .eq('id', userId)
    .maybeSingle()

  if (!userRow?.stripe_customer_id) {
    await sb.from('revenue_sync_runs').insert({
      user_id: userId,
      status: 'partial',
      details: { reason: 'no_stripe_customer' },
    })
    return NextResponse.json({ ok: true, status: 'partial', reason: 'No Stripe customer id found' })
  }

  const invoices = await getStripe().invoices.list({ customer: userRow.stripe_customer_id, limit: 25 })
  const paidAmount = invoices.data
    .filter(i => i.status === 'paid' || (i.amount_paid ?? 0) > 0)
    .reduce((sum, i) => sum + (i.amount_paid ?? 0), 0)

  const details = {
    invoice_count: invoices.data.length,
    paid_amount_cents: paidAmount,
    supabase_subscription_status: userRow.subscription_status,
    supabase_subscription_tier: userRow.subscription_tier,
  }

  const { data } = await sb
    .from('revenue_sync_runs')
    .insert({ user_id: userId, status: 'synced', details })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, details })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
