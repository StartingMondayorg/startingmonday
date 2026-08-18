/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/require-auth'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

function normalizeEmail(value: unknown): string {
  return (value ?? '').toString().trim().toLowerCase()
}

function fallbackName(email: string): string {
  const local = email.split('@')[0] ?? email
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request)
  if (!auth.ok) return auth.response

  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const staff = await getStaffMember(authData.user?.email ?? '')
  if (!staff) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const days = Math.max(1, Math.min(Number(body?.days ?? 14), 60))
  const limit = Math.max(1, Math.min(Number(body?.limit ?? 500), 2000))
  const dryRun = body?.dryRun === true

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const sb = supabase as any
  const { data: logs, error: logsError } = await sb
    .from('outreach_logs')
    .select('id, user_id, recipient_name, recipient_email, outreach_channel, sent_at, contact_id, send_mode')
    .eq('user_id', auth.userId)
    .eq('send_mode', 'live')
    .not('recipient_email', 'is', null)
    .gte('sent_at', since)
    .order('sent_at', { ascending: true })
    .limit(limit)

  if (logsError) {
    return NextResponse.json({ error: logsError.message }, { status: 500 })
  }

  let scanned = 0
  let createdContacts = 0
  let linkedLogs = 0
  let statusUpdates = 0
  const missingRecipients: Array<{ email: string; name: string | null; sent_at: string }> = []
  const created: Array<{ id: string; email: string; name: string }> = []

  for (const log of logs ?? []) {
    const email = normalizeEmail(log.recipient_email)
    if (!email || !email.includes('@')) continue
    scanned += 1

    const { data: existingContact, error: contactLookupError } = await sb
      .from('contacts')
      .select('id, user_id, email, name, outreach_status, status, contacted_at')
      .eq('user_id', auth.userId)
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    if (contactLookupError) continue

    let contactId = existingContact?.id ?? null

    if (!contactId) {
      missingRecipients.push({
        email,
        name: log.recipient_name ?? null,
        sent_at: log.sent_at,
      })

      if (!dryRun) {
        const insertName = (log.recipient_name ?? '').toString().trim() || fallbackName(email)
        const { data: inserted, error: insertError } = await sb
          .from('contacts')
          .insert({
            user_id: auth.userId,
            name: insertName,
            email,
            firm: null,
            channel: 'cold',
            status: 'active',
            outreach_status: 'reached_out',
            contacted_at: log.sent_at,
          })
          .select('id, email, name')
          .single()

        if (!insertError && inserted?.id) {
          contactId = inserted.id
          createdContacts += 1
          created.push({ id: inserted.id, email: inserted.email, name: inserted.name })
        }
      }
    }

    if (!contactId) continue

    if (!dryRun && !log.contact_id) {
      const { error: linkError } = await sb
        .from('outreach_logs')
        .update({ contact_id: contactId })
        .eq('id', log.id)
        .eq('user_id', auth.userId)

      if (!linkError) linkedLogs += 1
    }

    if (!dryRun && existingContact?.id && existingContact.outreach_status === 'prospect') {
      const updatePayload: Record<string, unknown> = { outreach_status: 'reached_out' }
      if (!existingContact.contacted_at) {
        updatePayload.contacted_at = log.sent_at
      }

      const { error: statusError } = await sb
        .from('contacts')
        .update(updatePayload)
        .eq('id', existingContact.id)
        .eq('user_id', auth.userId)

      if (!statusError) statusUpdates += 1
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    days,
    since,
    scanned,
    createdContacts,
    linkedLogs,
    statusUpdates,
    missingRecipients,
    created,
  })
}


const __councilObservabilitySignal = () => console.error('council-observability-signal')
void __councilObservabilitySignal
