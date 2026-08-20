import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)

  const [{ data: issueFlags }, { data: revenueFlags }] = await Promise.all([
    sb.from('support_issue_triage').select('id, severity, category, status, created_at').eq('user_id', userId).eq('status', 'open').order('created_at', { ascending: false }).limit(50),
    sb.from('revenue_mismatch_flags').select('id, severity, category, status, created_at').eq('user_id', userId).eq('status', 'open').order('created_at', { ascending: false }).limit(50),
  ])

  const exceptionPayload = {
    generated_at: new Date().toISOString(),
    support_exceptions: issueFlags ?? [],
    revenue_exceptions: revenueFlags ?? [],
    totals: {
      support: issueFlags?.length ?? 0,
      revenue: revenueFlags?.length ?? 0,
    },
  }

  const { data } = await sb
    .from('exception_list_runs')
    .insert({ user_id: userId, exception_payload: exceptionPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, exceptionPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
