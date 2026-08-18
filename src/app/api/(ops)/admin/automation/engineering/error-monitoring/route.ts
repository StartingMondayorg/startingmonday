import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const errorMonitoringSchema = z.object({
  errorCount: z.number().optional(),
  reportedBy: z.string().optional(),
  topErrors: z.array(z.string()).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, errorMonitoringSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const errorCount = Math.max(0, Number(body.errorCount ?? 0))
    const severity = errorCount >= 20 ? 'high' : errorCount >= 5 ? 'medium' : 'low'
    const details = {
      source: 'ticket48',
      reported_by: (body.reportedBy ?? 'automation').toString(),
      top_errors: Array.isArray(body.topErrors) ? body.topErrors.slice(0, 10) : [],
    }

    const { data } = await sb
      .from('error_monitoring_runs')
      .insert({ user_id: userId, error_count: errorCount, severity, details })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, runId: data?.id, errorCount, severity })
  } catch (error) {
    console.error('[engineering.error-monitoring] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
