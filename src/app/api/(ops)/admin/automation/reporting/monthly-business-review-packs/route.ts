/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function monthKey(date?: string): string {
  const d = date ? new Date(date) : new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAuth(request)
  if (!authCheck.ok) return authCheck.response

  const auth = await requireStaffAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = supabase as any
  const body = await request.json().catch(() => ({}))

  const key = monthKey(body?.referenceDate)
  const [{ data: weekly }, { data: exceptions }, { data: trends }] = await Promise.all([
    sb.from('weekly_kpi_summary_runs').select('summary_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(4),
    sb.from('exception_list_runs').select('exception_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    sb.from('trend_report_runs').select('trend_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
  ])

  const reviewPayload = {
    month_key: key,
    generated_at: new Date().toISOString(),
    weekly_kpis: weekly ?? [],
    latest_exception_list: exceptions?.[0] ?? null,
    latest_trend_report: trends?.[0] ?? null,
  }

  const { data } = await sb
    .from('monthly_business_review_runs')
    .insert({ user_id: userId, month_key: key, review_payload: reviewPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, monthKey: key, reviewPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
