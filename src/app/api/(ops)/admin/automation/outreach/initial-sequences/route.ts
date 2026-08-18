/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'
import { sendEmail } from '@/lib/email'
const OUTREACH_REPLY_TO = 'richard@startingmonday.app'
const DEFAULT_OUTREACH_FROM = `Richard Rothschild <${OUTREACH_REPLY_TO}>`

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => values[key] ?? '')
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 25), 100))
  const sendLive = body?.sendLive === true
  const subjectTemplate = (body?.subjectTemplate ?? 'Quick intro from Starting Monday').toString()
  const messageTemplate = (body?.messageTemplate ?? 'Hi {{name}},\n\nI wanted to reach out regarding potential leadership opportunities at {{company}}.\n\nIf helpful, I can share a short market perspective relevant to your team.\n\nBest,\nRichard').toString()

  const sb = supabase as any
  const { data: suppressions } = await sb
    .from('outreach_suppressions')
    .select('email')
    .eq('user_id', auth.userId)
    .eq('active', true)

  const suppressed = new Set((suppressions ?? []).map((s: any) => String(s.email).toLowerCase()))

  const { data: contacts } = await supabase
    .from('contacts')
    .select('id, name, firm, email')
    .eq('user_id', auth.userId)
    .eq('status', 'active')
    .eq('outreach_status', 'prospect')
    .not('email', 'is', null)
    .limit(limit)

  let processed = 0
  let sent = 0
  let skippedSuppressed = 0

  for (const contact of contacts ?? []) {
    const email = (contact.email ?? '').toLowerCase()
    if (!email) continue
    if (suppressed.has(email)) {
      skippedSuppressed++
      continue
    }

    processed++
    const subject = renderTemplate(subjectTemplate, {
      name: contact.name ?? 'there',
      company: contact.firm ?? 'your team',
    })
    const bodyText = renderTemplate(messageTemplate, {
      name: contact.name ?? 'there',
      company: contact.firm ?? 'your team',
    })

    if (sendLive) {
      const result = await sendEmail({
        to: email,
        subject,
        html: `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
        from: process.env.OUTREACH_FROM_ADDRESS ?? DEFAULT_OUTREACH_FROM,
        replyTo: OUTREACH_REPLY_TO,
      })
      if (!result?.error) {
        sent++
        await supabase
          .from('contacts')
          .update({ outreach_status: 'reached_out', contacted_at: new Date().toISOString() })
          .eq('id', contact.id)
          .eq('user_id', auth.userId)

        await sb.from('outreach_logs').insert({
          user_id: auth.userId,
          contact_id: contact.id,
          channel: 'email',
          message_preview: bodyText.slice(0, 200),
          sent_at: new Date().toISOString(),
          webhook_payload: { email_source: 'automation_initial_sequences' },
        })
      }
    }
  }

  return NextResponse.json({ ok: true, processed, sent, skippedSuppressed, dryRun: !sendLive })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
