/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { sendEmail } from '@/lib/email'

type MeetingInput = {
  contact_id?: string
  email?: string
  full_name?: string
  company?: string
  scheduled_for?: string
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const meetings = (Array.isArray(body?.meetings) ? body.meetings : []) as MeetingInput[]
  const sb = supabase as any

  let booked = 0
  let remindersSent = 0

  if (meetings.length > 0) {
    const rows = meetings
      .map((m) => {
        const when = m.scheduled_for ? new Date(m.scheduled_for) : null
        if (!when || Number.isNaN(when.getTime())) return null
        return {
          user_id: auth.userId,
          contact_id: m.contact_id ?? null,
          email: m.email ?? null,
          full_name: m.full_name ?? null,
          company: m.company ?? null,
          scheduled_for: when.toISOString(),
          status: 'scheduled',
          source: 'automation_ticket_6',
        }
      })
      .filter(Boolean)

    if (rows.length > 0) {
      const { data: inserted } = await sb.from('meeting_bookings').insert(rows).select('id, scheduled_for, contact_id')
      booked = inserted?.length ?? 0

      for (const meeting of inserted ?? []) {
        const oneDayBefore = new Date(meeting.scheduled_for)
        oneDayBefore.setUTCDate(oneDayBefore.getUTCDate() - 1)
        await supabase.from('follow_ups').insert({
          user_id: auth.userId,
          contact_id: meeting.contact_id ?? null,
          due_date: oneDayBefore.toISOString().slice(0, 10),
          action: 'Meeting reminder automation',
          status: 'pending',
        })
      }
    }
  }

  const nowIso = new Date().toISOString()
  const in24hIso = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const { data: upcoming } = await sb
    .from('meeting_bookings')
    .select('id, full_name, company, scheduled_for')
    .eq('user_id', auth.userId)
    .eq('status', 'scheduled')
    .is('reminder_sent_at', null)
    .gte('scheduled_for', nowIso)
    .lte('scheduled_for', in24hIso)
    .order('scheduled_for', { ascending: true })

  if ((upcoming?.length ?? 0) > 0 && authData.user?.email) {
    const lines = (upcoming ?? []).map((m: any) => {
      const dt = new Date(m.scheduled_for).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
      return `<li>${m.full_name ?? 'Contact'}${m.company ? ` (${m.company})` : ''} - ${dt}</li>`
    })

    const emailResult = await sendEmail({
      to: authData.user.email,
      subject: `Meeting reminders: ${upcoming?.length ?? 0} upcoming`,
      html: `<p>Upcoming meetings in the next 24 hours:</p><ul>${lines.join('')}</ul>`,
    })

    if (!emailResult?.error) {
      const ids = (upcoming ?? []).map((m: any) => m.id)
      if (ids.length > 0) {
        await sb.from('meeting_bookings').update({ reminder_sent_at: new Date().toISOString() }).in('id', ids)
      }
      remindersSent = upcoming?.length ?? 0
    }
  }

  return NextResponse.json({ ok: true, booked, remindersSent })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
