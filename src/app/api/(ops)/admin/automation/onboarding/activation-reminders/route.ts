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
    const sendLive = body?.sendLive === true

    const { data: milestone } = await sb
      .from('activation_milestones')
      .select('status, first_alert_at, first_brief_at, first_action_at, created_at')
      .eq('user_id', userId)
      .maybeSingle()

    if (!milestone) {
      return NextResponse.json({ ok: true, reminded: false, reason: 'No milestone row found' })
    }
    if (milestone.status === 'completed') {
      return NextResponse.json({ ok: true, reminded: false, reason: 'Already completed' })
    }

    const missing: string[] = []
    if (!milestone.first_alert_at) missing.push('first alert')
    if (!milestone.first_brief_at) missing.push('first brief')
    if (!milestone.first_action_at) missing.push('first action')

    let sent = false
    if (sendLive && userEmail) {
      const result = await sendEmail({
        to: userEmail,
        subject: 'Activation reminder: complete your first milestones',
        html: `<p>You are close to activation. Remaining steps: ${missing.join(', ')}.</p>`,
      })
      sent = !result?.error
    }

    await sb.from('activation_reminder_logs').insert({
      user_id: userId,
      reminder_type: 'activation_progress',
      details: { missing, send_live: sendLive, sent },
    })

    return NextResponse.json({ ok: true, reminded: sent, missing, dryRun: !sendLive })
  } catch (error) {
    console.error('[onboarding.activation-reminders] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
