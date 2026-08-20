/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 50), 500))
  const sb = supabase as any

  const { data: inbox } = await sb
    .from('outreach_reply_inbox')
    .select('id, email, contact_id')
    .eq('user_id', auth.userId)
    .eq('classified_label', 'interested')
    .eq('meeting_signal', true)
    .is('processed_at', null)
    .order('received_at', { ascending: true })
    .limit(limit)

  let booked = 0
  for (const msg of inbox ?? []) {
    let contactId = msg.contact_id as string | null
    if (!contactId) {
      const { data: existingContact } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', auth.userId)
        .eq('email', msg.email)
        .limit(1)
        .maybeSingle()
      contactId = existingContact?.id ?? null

      if (!contactId) {
        const { data: inserted } = await supabase
          .from('contacts')
          .insert({
            user_id: auth.userId,
            name: msg.email,
            email: msg.email,
            status: 'active',
            outreach_status: 'in_conversation',
            channel: 'inbound',
          })
          .select('id')
          .single()
        contactId = inserted?.id ?? null
      }
    }

    if (!contactId) continue

    const scheduled = new Date()
    scheduled.setUTCDate(scheduled.getUTCDate() + 2)
    scheduled.setUTCHours(16, 0, 0, 0)

    await sb.from('meeting_bookings').insert({
      user_id: auth.userId,
      contact_id: contactId,
      email: msg.email,
      full_name: msg.email,
      scheduled_for: scheduled.toISOString(),
      status: 'scheduled',
      source: 'reply_automation',
    })

    await supabase
      .from('contacts')
      .update({ outreach_status: 'meeting_scheduled' })
      .eq('id', contactId)
      .eq('user_id', auth.userId)

    await sb
      .from('outreach_reply_inbox')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', msg.id)
      .eq('user_id', auth.userId)

    booked++
  }

  return NextResponse.json({ ok: true, processed: inbox?.length ?? 0, booked })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
