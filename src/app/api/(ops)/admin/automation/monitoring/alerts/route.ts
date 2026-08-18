import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { asLooseSupabaseClient, parseAutomationBody, requireAutomationAccess } from '@/lib/admin-automation-route'

const updateAlertSchema = z.object({
  alertId: z.string().trim().min(1),
  status: z.enum(['acknowledged', 'resolved']).default('acknowledged'),
})

export async function GET(request: NextRequest) {
  const auth = await requireAutomationAccess(request)
  if (!auth.ok) return auth.response

  const { userId, supabase } = auth
  const sb = asLooseSupabaseClient(supabase)

  const [{ data: open }, { data: recent }, { count: openCount }] = await Promise.all([
    sb.from('automation_alerts').select('id, source_table, alert_code, severity, message, status, created_at').eq('user_id', userId).eq('status', 'open').order('created_at', { ascending: false }).limit(100),
    sb.from('automation_alerts').select('id, source_table, alert_code, severity, message, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(25),
    sb.from('automation_alerts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'open'),
  ])

  const severityRows = Array.isArray(open) ? open as Array<{ severity: string }> : []
  const severityRollup = severityRows.reduce((acc: Record<string, number>, row) => {
    acc[row.severity] = (acc[row.severity] ?? 0) + 1
    return acc
  }, {})

  return NextResponse.json({
    ok: true,
    openCount: openCount ?? 0,
    severityRollup,
    open: open ?? [],
    recent: recent ?? [],
  })
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = asLooseSupabaseClient(supabase)
    const parsedBody = await parseAutomationBody(request, updateAlertSchema)
    if (!parsedBody.ok) return parsedBody.response
    const body = parsedBody.body

    const alertId = body.alertId
    const nextStatus = body.status

    const { data, error } = await sb
      .from('automation_alerts')
      .update({ status: nextStatus, resolved_at: nextStatus === 'resolved' ? new Date().toISOString() : null })
      .eq('id', alertId)
      .eq('user_id', userId)
      .select('id, status')
      .maybeSingle()

    if (error) return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
    if (!data?.id) return NextResponse.json({ error: 'Alert not found' }, { status: 404 })

    return NextResponse.json({ ok: true, alert: data })
  } catch (error) {
    console.error('[monitoring.alerts] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
