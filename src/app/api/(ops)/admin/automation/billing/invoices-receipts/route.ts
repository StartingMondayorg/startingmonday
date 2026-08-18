/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
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
    const body = await request.json().catch(() => ({}))
    const amountCents = Math.max(0, Number(body?.amountCents ?? 0))
    const currency = (body?.currency ?? 'usd').toString().toLowerCase()
    const reference = `inv-${Date.now()}`

    const payload = {
      amount_cents: amountCents,
      currency,
      line_items: Array.isArray(body?.lineItems) ? body.lineItems.slice(0, 25) : [],
    }

    const { data, error } = await sb
      .from('invoice_receipt_runs')
      .insert({
        user_id: userId,
        invoice_reference: reference,
        receipt_reference: `rcpt-${reference}`,
        status: 'generated',
        payload,
      })
      .select('id, invoice_reference, receipt_reference')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to generate invoice/receipt run' }, { status: 500 })
    return NextResponse.json({ ok: true, runId: data?.id, invoiceReference: data?.invoice_reference, receiptReference: data?.receipt_reference })
  } catch (error) {
    console.error('[billing.invoices-receipts] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
