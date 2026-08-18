/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { requireAuth } from '@/lib/require-auth'
import { requireStaffAutomationAccess } from '@/lib/admin-automation-auth'

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

    const { data: userRow } = await supabase
      .from('users')
      .select('subscription_period_end, trial_ends_at, subscription_tier')
      .eq('id', userId)
      .maybeSingle()

    const target = userRow?.subscription_period_end ?? userRow?.trial_ends_at ?? null
    if (!target) return NextResponse.json({ ok: true, shouldSend: false, reason: 'No renewal date available' })

    const daysLeft = Math.ceil((new Date(target).getTime() - Date.now()) / 86_400_000)
    const shouldSend = daysLeft >= 0 && daysLeft <= 14

    let sent = false
    if (shouldSend && sendLive && userEmail) {
      const result = await sendEmail({
        to: userEmail,
        subject: `Billing renewal in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`,
        html: `<p>Your ${userRow?.subscription_tier ?? 'current'} plan renews in ${daysLeft} day${daysLeft === 1 ? '' : 's'}.</p>`,
      })
      sent = !result?.error
    }

    await sb.from('billing_renewal_reminder_logs').insert({
      user_id: userId,
      reminder_type: 'billing_t_minus_14',
      target_date: target.slice(0, 10),
      details: { should_send: shouldSend, sent, send_live: sendLive, days_left: daysLeft },
    })

    return NextResponse.json({ ok: true, shouldSend, sent, dryRun: !sendLive, daysLeft })
  } catch (error) {
    console.error('[billing.renewal-reminders] request failed', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
