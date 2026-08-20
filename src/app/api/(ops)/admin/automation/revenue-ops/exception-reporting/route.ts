/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any

  const [{ data: flags }, { data: checks }, { data: retries }] = await Promise.all([
    sb.from('revenue_mismatch_flags').select('id, category, severity, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    sb.from('payment_reconciliation_checks').select('id, status, mismatch_count, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    sb.from('failed_payment_retry_runs').select('id, status, attempts, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
  ])

  const reportPayload = {
    generated_at: new Date().toISOString(),
    open_flags: (flags ?? []).filter((f: { status: string }) => f.status === 'open').length,
    recent_checks: checks ?? [],
    recent_retry_runs: retries ?? [],
  }

  const { data } = await sb
    .from('revenue_exception_reports')
    .insert({ user_id: userId, report_payload: reportPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, reportId: data?.id, reportPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
