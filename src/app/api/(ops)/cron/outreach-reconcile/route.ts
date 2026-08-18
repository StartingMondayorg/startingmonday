/* eslint-disable @typescript-eslint/no-explicit-any */
import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'

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

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient() as any
  const limit = Math.max(1, Math.min(Number(request.nextUrl.searchParams.get('limit') ?? 500), 2000))
  const days = Math.max(1, Math.min(Number(request.nextUrl.searchParams.get('days') ?? 14), 90))
  const dryRun = request.nextUrl.searchParams.get('dryRun') === 'true'
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const { data: logs, error: logsError } = await admin
    .from('outreach_logs')
    .select('id, user_id, recipient_name, recipient_email, outreach_channel, sent_at, contact_id, send_mode')
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

  for (const log of logs ?? []) {
    const userId = log.user_id as string
    const email = normalizeEmail(log.recipient_email)
    if (!userId || !email || !email.includes('@')) continue
    scanned += 1

    const { data: existingContact, error: contactLookupError } = await admin
      .from('contacts')
      .select('id, user_id, outreach_status, contacted_at')
      .eq('user_id', userId)
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    if (contactLookupError) continue

    let contactId = existingContact?.id ?? null

    if (!contactId && !dryRun) {
      const insertName = (log.recipient_name ?? '').toString().trim() || fallbackName(email)
      const { data: inserted, error: insertError } = await admin
        .from('contacts')
        .insert({
          user_id: userId,
          name: insertName,
          email,
          firm: null,
          channel: 'cold',
          status: 'active',
          outreach_status: 'reached_out',
          contacted_at: log.sent_at,
        })
        .select('id')
        .single()

      if (!insertError && inserted?.id) {
        contactId = inserted.id
        createdContacts += 1
      }
    }

    if (!contactId) continue

    if (!dryRun && !log.contact_id) {
      const { error: linkError } = await admin
        .from('outreach_logs')
        .update({ contact_id: contactId })
        .eq('id', log.id)

      if (!linkError) linkedLogs += 1
    }

    if (!dryRun && existingContact?.id && existingContact.outreach_status === 'prospect') {
      const patch: Record<string, unknown> = { outreach_status: 'reached_out' }
      if (!existingContact.contacted_at) patch.contacted_at = log.sent_at
      const { error: statusError } = await admin
        .from('contacts')
        .update(patch)
        .eq('id', existingContact.id)
        .eq('user_id', userId)
      if (!statusError) statusUpdates += 1
    }
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    days,
    since,
    limit,
    scanned,
    createdContacts,
    linkedLogs,
    statusUpdates,
  })
}
