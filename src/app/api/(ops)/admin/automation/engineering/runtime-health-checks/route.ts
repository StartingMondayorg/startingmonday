import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const runtimeHealthSchema = z.object({
  p95LatencyMs: z.number().optional(),
  errorRatePercent: z.number().optional(),
  queueLagSeconds: z.number().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, runtimeHealthSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const p95LatencyMs = Math.max(0, Number(body.p95LatencyMs ?? 0))
    const errorRatePercent = Math.max(0, Number(body.errorRatePercent ?? 0))
    const queueLagSeconds = Math.max(0, Number(body.queueLagSeconds ?? 0))

    const status =
      p95LatencyMs > 2000 || errorRatePercent > 3 || queueLagSeconds > 300
        ? 'critical'
        : p95LatencyMs > 1000 || errorRatePercent > 1 || queueLagSeconds > 90
          ? 'warning'
          : 'healthy'

    const details = { p95_latency_ms: p95LatencyMs, error_rate_percent: errorRatePercent, queue_lag_seconds: queueLagSeconds }
    const { data } = await sb
      .from('runtime_health_check_runs')
      .insert({ user_id: userId, status, details })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, status, details })
  } catch (error) {
    console.error('[engineering.runtime-health-checks] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
