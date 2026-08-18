/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any

    const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: activeContacts },
      { count: pendingFollowups },
      { count: signals7d },
      { data: latestHealth },
      { data: latestUsage },
    ] = await Promise.all([
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
      supabase.from('company_signals').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since7d),
      sb.from('customer_health_checks').select('health_score, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('usage_monitor_runs').select('alert_level, metrics, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    const reportPayload = {
      generated_at: new Date().toISOString(),
      active_contacts: activeContacts ?? 0,
      pending_followups: pendingFollowups ?? 0,
      signals_7d: signals7d ?? 0,
      latest_health: latestHealth ?? null,
      latest_usage: latestUsage ?? null,
    }

    const { data: report } = await sb
      .from('customer_status_reports')
      .insert({ user_id: userId, report_payload: reportPayload })
      .select('id')
      .single()

    return NextResponse.json({ ok: true, reportId: report?.id, reportPayload })
  } catch (error) {
    console.error('[customer-ops.status-reporting] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
