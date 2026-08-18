import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { getOwnerEmail } from '@/lib/owner-email'

const OWNER_EMAIL = getOwnerEmail()
const OUTREACH_REPLY_TO = 'richard@startingmonday.app'
const DEFAULT_OUTREACH_FROM = `Richard Rothschild <${OUTREACH_REPLY_TO}>`

type OutreachLogRow = {
  id: string
  recipient_email: string | null
  recipient_name: string | null
  subject: string | null
  outreach_channel: string | null
  fit_tier: string | null
  send_mode: string | null
  delivery_status: string | null
  resend_message_id: string | null
  sent_at: string
}

function statusBadge(status: string | null): string {
  const s = status ?? 'unknown'
  const color =
    s === 'email.delivered' ? '#15803d' :
    s === 'sent'            ? '#2563eb' :
    s === 'email.bounced'   ? '#dc2626' :
    s === 'email.complained'? '#dc2626' :
    s === 'simulated'       ? '#94a3b8' :
    '#92400e'
  return `<span style="background:${color};color:#fff;font-size:11px;padding:2px 6px;border-radius:3px;font-weight:600;">${s}</span>`
}

function channelLabel(channel: string | null): string {
  const map: Record<string, string> = {
    coaches: 'Coaches',
    search_firms: 'Search Firms',
    outplacement_firms: 'Outplacement',
    executives: 'Executives',
  }
  return map[channel ?? ''] ?? channel ?? '-'
}

function buildDigestHtml(
  sends24h: OutreachLogRow[],
  stuck: OutreachLogRow[],
  bounced: OutreachLogRow[],
  since: string,
): string {
  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  function tableRows(rows: OutreachLogRow[], showStatus = true) {
    if (rows.length === 0) return '<tr><td colspan="5" style="padding:12px;color:#94a3b8;font-size:13px;">None</td></tr>'
    return rows.map(r => `
      <tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:8px 12px;font-size:13px;color:#0f172a;">${r.recipient_name ?? '-'}</td>
        <td style="padding:8px 12px;font-size:12px;color:#475569;">${r.recipient_email ?? '-'}</td>
        <td style="padding:8px 12px;font-size:12px;color:#475569;">${channelLabel(r.outreach_channel)}</td>
        <td style="padding:8px 12px;font-size:12px;color:#475569;">${r.subject ?? '-'}</td>
        ${showStatus ? `<td style="padding:8px 12px;">${statusBadge(r.delivery_status)}</td>` : ''}
      </tr>`).join('')
  }

  const alertBanner = (bounced.length > 0 || stuck.length > 0)
    ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
        <span style="font-size:13px;font-weight:600;color:#dc2626;">
          ALERT Action needed: ${bounced.length} bounce${bounced.length !== 1 ? 's' : ''}, 
          ${stuck.length} send${stuck.length !== 1 ? 's' : ''} unconfirmed after 24h
        </span>
       </div>`
    : `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:12px 16px;margin-bottom:20px;">
        <span style="font-size:13px;font-weight:600;color:#15803d;">[x] All recent sends confirmed delivered</span>
       </div>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:24px;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;">
  <tr><td style="background:#0f172a;padding:20px 24px;">
    <div style="color:#fff;font-size:18px;font-weight:700;">Outreach Send Digest</div>
    <div style="color:#94a3b8;font-size:13px;margin-top:4px;">${dateLabel}</div>
  </td></tr>
  <tr><td style="padding:20px 24px;">
    ${alertBanner}

    <div style="font-size:14px;font-weight:700;color:#0f172a;margin-bottom:8px;">
      Sends in last 24h (${sends24h.length})
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:4px;margin-bottom:24px;">
      <thead>
        <tr style="background:#f8fafc;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;">NAME</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;">EMAIL</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;">CHANNEL</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;">SUBJECT</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:600;">STATUS</th>
        </tr>
      </thead>
      <tbody>${tableRows(sends24h)}</tbody>
    </table>

    ${bounced.length > 0 ? `
    <div style="font-size:14px;font-weight:700;color:#dc2626;margin-bottom:8px;">
      Bounces / Complaints (${bounced.length})
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fecaca;border-radius:4px;margin-bottom:24px;">
      <thead>
        <tr style="background:#fef2f2;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;">NAME</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;">EMAIL</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;">CHANNEL</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;">SUBJECT</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#dc2626;font-weight:600;">STATUS</th>
        </tr>
      </thead>
      <tbody>${tableRows(bounced)}</tbody>
    </table>` : ''}

    ${stuck.length > 0 ? `
    <div style="font-size:14px;font-weight:700;color:#92400e;margin-bottom:8px;">
      Unconfirmed after 24h (${stuck.length}) - verify in Resend dashboard
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fde68a;border-radius:4px;margin-bottom:24px;">
      <thead>
        <tr style="background:#fffbeb;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#92400e;font-weight:600;">NAME</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#92400e;font-weight:600;">EMAIL</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#92400e;font-weight:600;">CHANNEL</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#92400e;font-weight:600;">SUBJECT</th>
          <th style="padding:8px 12px;text-align:left;font-size:11px;color:#92400e;font-weight:600;">STATUS</th>
        </tr>
      </thead>
      <tbody>${tableRows(stuck)}</tbody>
    </table>` : ''}

    <p style="font-size:11px;color:#94a3b8;margin-top:16px;">
      Outreach send digest  -  startingmonday.app  -  Since ${since}
    </p>
  </td></tr>
</table>
</body></html>`
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!OWNER_EMAIL) {
    return NextResponse.json({ error: 'OWNER_EMAIL not configured' }, { status: 500 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
  const since48h = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString()
  const sinceLabel = new Date(since24h).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  })

  const { data: sends24h, error: sendsError } = await admin
    .from('outreach_logs')
    .select('id, recipient_email, recipient_name, subject, outreach_channel, fit_tier, send_mode, delivery_status, resend_message_id, sent_at')
    .gte('sent_at', since24h)
    .order('sent_at', { ascending: false })
    .limit(100)

  if (sendsError) {
    console.error(JSON.stringify({ ts: now.toISOString(), event: 'outreach_digest_query_error', message: sendsError.message }))
    return NextResponse.json({ error: sendsError.message }, { status: 500 })
  }

  const rows = (sends24h ?? []) as unknown as OutreachLogRow[]
  const liveRows = rows.filter(r => r.send_mode === 'live')

  const bounced = liveRows.filter(r =>
    r.delivery_status === 'email.bounced' || r.delivery_status === 'email.complained',
  )

  // Emails sent before 24h ago that still show only 'sent' (no Resend delivery confirmation)
  const { data: stuckRows } = await admin
    .from('outreach_logs')
    .select('id, recipient_email, recipient_name, subject, outreach_channel, fit_tier, send_mode, delivery_status, resend_message_id, sent_at')
    .lt('sent_at', since24h)
    .gte('sent_at', since48h)
    .order('sent_at', { ascending: false })
    .limit(50)

  const stuck = ((stuckRows ?? []) as unknown as OutreachLogRow[])
    .filter(r => r.send_mode === 'live' && r.delivery_status === 'sent')

  if (liveRows.length === 0 && stuck.length === 0) {
    return NextResponse.json({ ok: true, sent: false, reason: 'No outreach activity in last 24h' })
  }

  const subject = bounced.length > 0 || stuck.length > 0
    ? `ALERT Outreach alert: ${bounced.length} bounce, ${stuck.length} unconfirmed - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
    : `Outreach digest: ${liveRows.length} send${liveRows.length !== 1 ? 's' : ''} - ${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  const html = buildDigestHtml(liveRows, stuck, bounced, sinceLabel)

  const result = await sendEmail({
    to: OWNER_EMAIL,
    subject,
    html,
    from: process.env.OUTREACH_FROM_ADDRESS ?? DEFAULT_OUTREACH_FROM,
    replyTo: OUTREACH_REPLY_TO,
  })

  if ((result as { error?: { message?: string } } | null)?.error) {
    const msg = (result as { error?: { message?: string } }).error?.message ?? 'send failed'
    console.error(JSON.stringify({ ts: now.toISOString(), event: 'outreach_digest_send_error', message: msg }))
    return NextResponse.json({ error: msg }, { status: 502 })
  }

  console.info(JSON.stringify({
    ts: now.toISOString(),
    event: 'outreach_digest_sent',
    sends24h: liveRows.length,
    bounced: bounced.length,
    stuck: stuck.length,
    to: OWNER_EMAIL,
  }))

  return NextResponse.json({ ok: true, sends24h: liveRows.length, bounced: bounced.length, stuck: stuck.length })
}
