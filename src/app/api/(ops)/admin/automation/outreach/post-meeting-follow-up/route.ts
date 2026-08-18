/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { sendEmail } from '@/lib/email'
const OUTREACH_REPLY_TO = 'richard@startingmonday.app'
const DEFAULT_OUTREACH_FROM = `Richard Rothschild <${OUTREACH_REPLY_TO}>`

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const sendLive = body?.sendLive === true
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 50), 200))
  const sb = supabase as any

  const { data: meetings } = await sb
    .from('meeting_bookings')
    .select('id, contact_id, email, full_name, company, scheduled_for')
    .eq('user_id', auth.userId)
    .eq('status', 'completed')
    .is('follow_up_sent_at', null)
    .order('scheduled_for', { ascending: false })
    .limit(limit)

  let prepared = 0
  let sent = 0

  for (const meeting of meetings ?? []) {
    prepared++
    const dueDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    await supabase.from('follow_ups').insert({
      user_id: auth.userId,
      contact_id: meeting.contact_id ?? null,
      due_date: dueDate,
      action: `Post-meeting next step with ${meeting.full_name ?? 'contact'}`,
      status: 'pending',
    })

    if (sendLive && meeting.email) {
      const subject = `Great speaking${meeting.company ? ` about ${meeting.company}` : ''}`
      const html = `<p>Hi ${meeting.full_name ?? 'there'},</p><p>Thanks again for the conversation. As discussed, I am sending a concise summary and recommended next steps so we can keep momentum.</p><p>Best,<br/>Richard</p>`
      const result = await sendEmail({
        to: meeting.email,
        subject,
        html,
        from: process.env.OUTREACH_FROM_ADDRESS ?? DEFAULT_OUTREACH_FROM,
        replyTo: OUTREACH_REPLY_TO,
      })
      if (!result?.error) {
        sent++
        await sb
          .from('meeting_bookings')
          .update({ follow_up_sent_at: new Date().toISOString() })
          .eq('id', meeting.id)
          .eq('user_id', auth.userId)
      }
    }
  }

  return NextResponse.json({ ok: true, prepared, sent, dryRun: !sendLive })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
