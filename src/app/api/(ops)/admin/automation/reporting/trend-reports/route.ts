import { type NextRequest, NextResponse } from 'next/server'
import { asLooseSupabaseClient, requireAutomationAccess } from '@/lib/admin-automation-route'

export async function POST(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)

  const [{ data: usageRuns }, { data: healthRuns }, { data: statusReports }] = await Promise.all([
    sb.from('usage_monitor_runs').select('metrics, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
    sb.from('customer_health_checks').select('health_score, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
    sb.from('customer_status_reports').select('report_payload, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(8),
  ])

  const healthRows = Array.isArray(healthRuns) ? healthRuns as Array<{ health_score?: number }> : []
  const avgHealth = healthRows.length > 0
    ? Math.round(healthRows.reduce((sum, h) => sum + Number(h.health_score ?? 0), 0) / healthRows.length)
    : 0

  const trendPayload = {
    generated_at: new Date().toISOString(),
    usage_samples: usageRuns?.length ?? 0,
    health_samples: healthRuns?.length ?? 0,
    status_report_samples: statusReports?.length ?? 0,
    avg_health_score: avgHealth,
  }

  const { data } = await sb
    .from('trend_report_runs')
    .insert({ user_id: userId, trend_payload: trendPayload })
    .select('id')
    .single()

  return NextResponse.json({ ok: true, runId: data?.id, trendPayload })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
