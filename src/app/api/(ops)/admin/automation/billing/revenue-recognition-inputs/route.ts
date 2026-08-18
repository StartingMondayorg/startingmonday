/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function monthRange(dateIso?: string): { start: string; end: string } {
  const base = dateIso ? new Date(dateIso) : new Date()
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1))
  const end = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0))
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))
    const { start, end } = monthRange(body?.periodDate)

    const { data: invoiceRuns } = await sb
      .from('invoice_receipt_runs')
      .select('payload')
      .eq('user_id', userId)
      .gte('created_at', `${start}T00:00:00.000Z`)
      .lte('created_at', `${end}T23:59:59.999Z`)

    const recognized = (invoiceRuns ?? []).reduce((sum: number, r: { payload?: { amount_cents?: number } }) => {
      return sum + Math.max(0, Number(r.payload?.amount_cents ?? 0))
    }, 0)

    const deferred = Math.round(recognized * 0.15)
    const details = { invoice_run_count: invoiceRuns?.length ?? 0, rule: '15% deferred placeholder rule' }

    const { data, error } = await sb
      .from('revenue_recognition_inputs')
      .insert({
        user_id: userId,
        period_start: start,
        period_end: end,
        recognized_amount_cents: recognized,
        deferred_amount_cents: deferred,
        details,
      })
      .select('id')
      .single()

    if (error) return NextResponse.json({ error: 'Failed to save revenue recognition input' }, { status: 500 })
    return NextResponse.json({ ok: true, inputId: data?.id, periodStart: start, periodEnd: end, recognized, deferred })
  } catch (error) {
    console.error('[billing.revenue-recognition-inputs] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
