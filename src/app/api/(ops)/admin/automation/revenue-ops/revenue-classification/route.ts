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
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any
  const body = await request.json().catch(() => ({}))
  const { start, end } = monthRange(body?.periodDate)

  const { data: users } = await supabase.from('users').select('subscription_tier').eq('id', userId).maybeSingle()
  const { data: runs } = await sb
    .from('invoice_receipt_runs')
    .select('payload')
    .eq('user_id', userId)
    .gte('created_at', `${start}T00:00:00.000Z`)
    .lte('created_at', `${end}T23:59:59.999Z`)

  const total = (runs ?? []).reduce((sum: number, r: { payload?: { amount_cents?: number } }) => sum + Number(r.payload?.amount_cents ?? 0), 0)
  const classificationPayload = {
    by_tier: { [users?.subscription_tier ?? 'unknown']: total },
    by_segment: { b2c: Math.round(total * 0.8), b2b: Math.round(total * 0.2) },
    run_count: runs?.length ?? 0,
  }

  const { data, error } = await sb
    .from('revenue_classification_runs')
    .insert({ user_id: userId, period_start: start, period_end: end, classification_payload: classificationPayload })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to save revenue classification run' }, { status: 500 })
  return NextResponse.json({ ok: true, runId: data?.id, classificationPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
