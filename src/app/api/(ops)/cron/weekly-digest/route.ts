import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from '@/lib/unsubscribe-token'

const SIX_DAYS_MS = 6 * 86_400_000
const SEVEN_DAYS_MS = 7 * 86_400_000

function formatDateLong(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function signalLabel(type: string): string {
  const labels: Record<string, string> = {
    funding: 'Funding',
    exec_departure: 'Executive departure',
    exec_hire: 'Executive hire',
    acquisition: 'Acquisition',
    expansion: 'Expansion',
    layoffs: 'Layoffs',
    ipo: 'IPO',
    new_product: 'New product',
    award: 'Award',
  }
  return labels[type] ?? type
}

type ScanHit = { title?: string; is_match?: boolean }
type Signal = { type: string; summary: string }

function buildDigestEmail(opts: {
  firstName: string
  weekStart: string
  weekEnd: string
  companies: { id: string; name: string }[]
  matchesByCompany: Record<string, string[]>
  signalsByCompany: Record<string, Signal[]>
  userId: string
}): string {
  const { firstName, weekStart, weekEnd, companies, matchesByCompany, signalsByCompany, userId } = opts
  const unsubUrl = unsubscribeUrl(userId)

  const active = companies.filter(c => matchesByCompany[c.id]?.length || signalsByCompany[c.id]?.length)
  const quiet = companies.filter(c => !matchesByCompany[c.id]?.length && !signalsByCompany[c.id]?.length)

  let body = ''

  for (const co of active) {
    const matches = matchesByCompany[co.id] ?? []
    const signals = signalsByCompany[co.id] ?? []

    body += `<div style="margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid #e2e8f0;">`
    body += `<p style="margin:0 0 10px 0;font-size:15px;font-weight:700;color:#0f172a;">${co.name}</p>`

    if (matches.length > 0) {
      body += `<p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#f97316;">Career page matches</p>`
      body += `<ul style="margin:0 0 12px 0;padding-left:18px;">`
      for (const title of matches.slice(0, 5)) {
        body += `<li style="font-size:14px;color:#334155;line-height:1.7;">${title}</li>`
      }
      body += `</ul>`
    }

    if (signals.length > 0) {
      body += `<p style="margin:0 0 6px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Signals</p>`
      for (const sig of signals.slice(0, 3)) {
        body += `<p style="margin:0 0 8px 0;font-size:14px;color:#334155;line-height:1.6;"><span style="font-weight:600;color:#475569;">${signalLabel(sig.type)}:</span> ${sig.summary}</p>`
      }
    }

    body += `</div>`
  }

  if (quiet.length > 0) {
    body += `<p style="font-size:13px;color:#94a3b8;margin:0 0 24px 0;">`
    body += `<span style="font-weight:600;color:#64748b;">No signals this week:</span> ${quiet.map(c => c.name).join(', ')}`
    body += `</p>`
  }

  const cta = `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:8px;">
  <tr><td style="background:#0f172a;border-radius:4px;">
    <a href="${APP_URL}/dashboard" style="display:inline-block;color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;">View your dashboard &rarr;</a>
  </td></tr>
</table>`

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<tr><td style="background:#0f172a;padding:32px 40px;">
  <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:12px;">Starting Monday</div>
  <div style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2;">Weekly intelligence digest</div>
  <div style="color:#475569;font-size:13px;margin-top:6px;">${weekStart} – ${weekEnd}</div>
</td></tr>
<tr><td style="padding:32px 40px 24px 40px;font-size:14px;color:#334155;line-height:1.75;">
  <p style="margin:0 0 24px 0;">${firstName}, here is what moved at your target companies this week.</p>
  ${body}
  ${cta}
</td></tr>
<tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
    Rich Rothschild<br>Founder, Starting Monday
  </p>
  <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">
    <a href="${unsubUrl}" style="color:#94a3b8;">Unsubscribe from these emails</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const now = new Date()
  const weekAgo = new Date(now.getTime() - SEVEN_DAYS_MS)
  const sixDaysAgo = new Date(now.getTime() - SIX_DAYS_MS)

  // Get active/trialing users who haven't unsubscribed
  const { data: allUsers, error: usersErr } = await admin
    .from('users')
    .select('id, email, weekly_digest_sent_at')
    .in('subscription_status', ['active', 'trialing'])
    .is('drip_unsubscribed_at', null)

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })
  if (!allUsers?.length) return NextResponse.json({ sent: 0 })

  const allUserIds = allUsers.map(u => u.id)

  // Filter to weekly briefing users only
  const { data: weeklyProfiles } = await admin
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', allUserIds)
    .eq('briefing_frequency', 'weekly')

  if (!weeklyProfiles?.length) return NextResponse.json({ sent: 0 })

  const weeklyUserIdSet = new Set(weeklyProfiles.map(p => p.user_id))
  const profileByUser: Record<string, string | null> = {}
  for (const p of weeklyProfiles) profileByUser[p.user_id] = p.full_name

  // Filter to users who haven't received digest in last 6 days
  const users = allUsers.filter(u => {
    if (!weeklyUserIdSet.has(u.id)) return false
    if (!u.weekly_digest_sent_at) return true
    return new Date(u.weekly_digest_sent_at) < sixDaysAgo
  })

  if (!users.length) return NextResponse.json({ sent: 0, reason: 'all sent recently' })

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const u of users) {
    const firstName = profileByUser[u.id]?.split(' ')[0] ?? u.email.split('@')[0]

    // Get their active companies
    const { data: companies } = await admin
      .from('companies')
      .select('id, name')
      .eq('user_id', u.id)
      .is('archived_at', null)
      .order('created_at', { ascending: true })

    if (!companies?.length) { skipped++; continue }

    const companyIds = companies.map(c => c.id)

    // Scan matches this week
    const { data: scans } = await admin
      .from('scan_results')
      .select('company_id, raw_hits')
      .in('company_id', companyIds)
      .eq('status', 'success')
      .gte('scanned_at', weekAgo.toISOString())

    // Company signals this week
    const { data: signals } = await admin
      .from('company_signals')
      .select('company_id, signal_type, signal_summary')
      .in('company_id', companyIds)
      .gte('signal_date', weekAgo.toISOString().slice(0, 10))
      .order('signal_date', { ascending: false })

    // Build matches map
    const matchesByCompany: Record<string, string[]> = {}
    for (const scan of scans ?? []) {
      const hits: ScanHit[] = Array.isArray(scan.raw_hits) ? scan.raw_hits as ScanHit[] : []
      const matches = hits
        .filter(h => h.is_match && h.title)
        .map(h => h.title as string)
      if (matches.length > 0) {
        const existing = matchesByCompany[scan.company_id] ?? []
        matchesByCompany[scan.company_id] = [...new Set([...existing, ...matches])]
      }
    }

    // Build signals map
    const signalsByCompany: Record<string, Signal[]> = {}
    for (const sig of signals ?? []) {
      if (!signalsByCompany[sig.company_id]) signalsByCompany[sig.company_id] = []
      signalsByCompany[sig.company_id].push({ type: sig.signal_type, summary: sig.signal_summary })
    }

    const weekStart = formatDateLong(weekAgo)
    const weekEnd = formatDateLong(now)
    const subject = `Your weekly intelligence digest: ${weekEnd}`

    const html = buildDigestEmail({
      firstName,
      weekStart,
      weekEnd,
      companies,
      matchesByCompany,
      signalsByCompany,
      userId: u.id,
    })

    const { error: sendErr } = await sendEmail({ to: u.email, subject, html })
    if (sendErr) {
      errors.push(`${u.email}: ${(sendErr as { message?: string }).message ?? 'send failed'}`)
      continue
    }

    await admin.from('users').update({ weekly_digest_sent_at: now.toISOString() }).eq('id', u.id)
    sent++
  }

  return NextResponse.json({ sent, skipped, users: users.length, errors: errors.slice(0, 10) })
}
