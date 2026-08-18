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
  const stallDays = Math.max(2, Math.min(Number(body?.stallDays ?? 6), 30))
  const sendLive = body?.sendLive === true
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 100), 500))

  const stallIso = new Date(Date.now() - stallDays * 24 * 60 * 60 * 1000).toISOString()
  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, email, contacted_at')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .eq('outreach_status', 'reached_out')
    .lte('contacted_at', stallIso)
    .not('email', 'is', null)
    .limit(limit)

  let nudgesQueued = 0
  let nudgesSent = 0

  for (const contact of contacts ?? []) {
    const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    await supabase.from('follow_ups').insert({
      user_id: auth.userId,
      contact_id: contact.id,
      due_date: dueDate,
      action: `Nudge ${contact.name}`,
      status: 'pending',
    })
    nudgesQueued++

    if (sendLive && contact.email) {
      const result = await sendEmail({
        to: contact.email,
        subject: 'Quick follow-up',
        html: `<p>Hi ${contact.name},</p><p>Following up in case this got buried. Happy to share a concise next-step recommendation for your current search priorities.</p>`,
        from: process.env.OUTREACH_FROM_ADDRESS ?? DEFAULT_OUTREACH_FROM,
        replyTo: OUTREACH_REPLY_TO,
      })
      if (!result?.error) nudgesSent++
    }
  }

  return NextResponse.json({ ok: true, evaluated: contacts?.length ?? 0, nudgesQueued, nudgesSent, dryRun: !sendLive })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
