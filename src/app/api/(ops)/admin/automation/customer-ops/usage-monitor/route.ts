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
    const [{ count: companyCount }, { count: contactCount }, { count: followupCount }, { count: eventCount }] = await Promise.all([
      supabase.from('companies').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('archived_at', null),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since7d),
      supabase.from('user_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since7d),
    ])

    const metrics = {
      companies_active: companyCount ?? 0,
      contacts_active: contactCount ?? 0,
      followups_7d: followupCount ?? 0,
      events_7d: eventCount ?? 0,
    }

    const alertLevel =
      metrics.events_7d >= 12 || metrics.followups_7d >= 4
        ? 'normal'
        : metrics.events_7d >= 5
          ? 'watch'
          : 'risk'

    await sb.from('usage_monitor_runs').insert({ user_id: userId, metrics, alert_level: alertLevel })

    return NextResponse.json({ ok: true, alertLevel, metrics })
  } catch (error) {
    console.error('[customer-ops.usage-monitor] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
