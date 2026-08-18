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

  const { data: inputs } = await sb
    .from('revenue_recognition_inputs')
    .select('recognized_amount_cents, deferred_amount_cents')
    .eq('user_id', userId)
    .eq('period_start', start)
    .eq('period_end', end)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const recognized = Number(inputs?.recognized_amount_cents ?? 0)
  const deferred = Number(inputs?.deferred_amount_cents ?? 0)
  const entriesPayload = [
    { account: 'Revenue', debit_cents: 0, credit_cents: recognized },
    { account: 'Deferred Revenue', debit_cents: deferred, credit_cents: 0 },
  ]

  const { data, error } = await sb
    .from('bookkeeping_entry_preparation_runs')
    .insert({ user_id: userId, period_start: start, period_end: end, entries_payload: entriesPayload })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: 'Failed to prepare bookkeeping entries' }, { status: 500 })
  return NextResponse.json({ ok: true, runId: data?.id, entriesPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
