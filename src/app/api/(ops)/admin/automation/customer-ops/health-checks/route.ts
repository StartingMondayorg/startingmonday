/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

function toStatus(score: number): 'healthy' | 'watch' | 'risk' {
  if (score >= 70) return 'healthy'
  if (score >= 45) return 'watch'
  return 'risk'
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, supabase } = auth
    const sb = supabase as any

    const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [{ count: events14d }, { count: pendingFollowups }, { count: activeContacts }, { count: recentSignals }] = await Promise.all([
      supabase.from('user_events').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since14d),
      supabase.from('follow_ups').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
      supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'active'),
      supabase.from('company_signals').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since14d),
    ])

    const score = Math.max(
      0,
      Math.min(
        100,
        (events14d ?? 0) * 3 +
          (recentSignals ?? 0) * 6 +
          Math.min(activeContacts ?? 0, 20) * 2 -
          Math.min(pendingFollowups ?? 0, 20) * 2,
      ),
    )

    const status = toStatus(score)
    const evidence = {
      events_14d: events14d ?? 0,
      pending_followups: pendingFollowups ?? 0,
      active_contacts: activeContacts ?? 0,
      signals_14d: recentSignals ?? 0,
    }

    await sb.from('customer_health_checks').insert({ user_id: userId, health_score: score, status, evidence })
    return NextResponse.json({ ok: true, score, status, evidence })
  } catch (error) {
    console.error('[customer-ops.health-checks] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
