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

  const [{ data: mbr }, { data: trend }, { data: exceptions }] = await Promise.all([
    sb.from('monthly_business_review_runs').select('month_key, review_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('trend_report_runs').select('trend_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    sb.from('exception_list_runs').select('exception_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const prepPayload = {
    generated_at: new Date().toISOString(),
    monthly_review: mbr ?? null,
    trend_report: trend ?? null,
    exception_list: exceptions ?? null,
    discussion_prompts: [
      'What are the top growth constraints this period?',
      'Where did automation reduce cycle time the most?',
      'Which risk areas need owner-level decisions next month?',
    ],
  }

  const { data } = await sb
    .from('council_review_prep_runs')
    .insert({ user_id: userId, prep_payload: prepPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, prepPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
