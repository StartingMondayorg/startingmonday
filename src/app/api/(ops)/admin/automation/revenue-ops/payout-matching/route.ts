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

  const { data: userRow } = await supabase.from('users').select('stripe_customer_id').eq('id', userId).maybeSingle()
  if (!userRow?.stripe_customer_id) {
    await sb.from('payout_matching_runs').insert({
      user_id: userId,
      matched_count: 0,
      unmatched_count: 1,
      details: { reason: 'no_stripe_customer' },
    })
    return NextResponse.json({ ok: true, matched: 0, unmatched: 1 })
  }

  const invoices = await getStripe().invoices.list({ customer: userRow.stripe_customer_id, limit: 50 })
  const paid = invoices.data.filter(i => i.status === 'paid' || (i.amount_paid ?? 0) > 0)
  const unpaid = invoices.data.filter(i => i.status !== 'paid' && (i.amount_paid ?? 0) === 0)

  const { data } = await sb
    .from('payout_matching_runs')
    .insert({
      user_id: userId,
      matched_count: paid.length,
      unmatched_count: unpaid.length,
      details: {
        paid_ids: paid.slice(0, 20).map(i => i.id),
        unpaid_ids: unpaid.slice(0, 20).map(i => i.id),
      },
    })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, matched: paid.length, unmatched: unpaid.length })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
