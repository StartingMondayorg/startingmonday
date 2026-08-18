/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'
import { sendEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request)
    if (!authCheck.ok) return authCheck.response

    const auth = await requireStaffAutomationAccess(request)
    if (!auth.ok) return auth.response

    const { userId, userEmail, supabase } = auth
    const sb = supabase as any
    const body = await request.json().catch(() => ({}))
    const inactivityDays = Math.max(3, Math.min(Number(body?.inactivityDays ?? 7), 60))
    const sendLive = body?.sendLive === true

    const since = new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000).toISOString()
    const { count: recentEvents } = await supabase
      .from('user_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', since)

    const isInactive = (recentEvents ?? 0) === 0
    let sent = false

    if (isInactive && sendLive && userEmail) {
      const result = await sendEmail({
        to: userEmail,
        subject: 'Quick nudge to restart your search momentum',
        html: '<p>Noticed lower activity recently. Open your dashboard for one quick action to restore momentum.</p>',
      })
      sent = !result?.error
    }

    await sb.from('inactivity_nudge_logs').insert({
      user_id: userId,
      nudge_type: 'activity_reactivation',
      details: { inactivity_days: inactivityDays, recent_events: recentEvents ?? 0, sent, send_live: sendLive },
    })

    return NextResponse.json({ ok: true, isInactive, sent, dryRun: !sendLive })
  } catch (error) {
    console.error('[customer-ops.inactivity-nudges] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
