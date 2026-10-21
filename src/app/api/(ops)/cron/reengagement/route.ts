import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/email'
import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from '@/lib/email/unsubscribe-token'

// One calm message after two weeks away. It reports what changed at the
// user's companies and asks for nothing. Earlier 10-day and 20-day pressure
// variants were retired on 2026-10-20 (docs/strategy/sm-simplification-proposal-2026-10-20.md, R-1).
const INACTIVE_DAYS = 14
const MS_PER_DAY = 86_400_000
export const NUDGE_TYPE = 'reengagement_14d'
const LEGACY_NUDGE_TYPES = ['reengagement_10d', 'reengagement_20d'] as const

const SIGNAL_LABELS: Record<string, string> = {
  funding: 'funding round',
  exec_departure: 'executive departure',
  exec_hire: 'executive hire',
  acquisition: 'acquisition',
  expansion: 'expansion',
  layoffs: 'layoffs',
  ipo: 'IPO filing',
  new_product: 'product launch',
  award: 'award',
  partnership: 'partnership',
}

function emailWrapper(title: string, body: string, userId: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
<tr><td style="background:#0f172a;padding:32px 40px;">
  <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:12px;">Starting Monday</div>
  <div style="color:#ffffff;font-size:20px;font-weight:700;line-height:1.2;">${title}</div>
</td></tr>
<tr><td style="padding:32px 40px 24px 40px;font-size:14px;color:#334155;line-height:1.75;">${body}</td></tr>
<tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">Rich Rothschild<br>Founder, Starting Monday</p>
  <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">
    <a href="${unsubscribeUrl(userId)}" style="color:#94a3b8;">Unsubscribe from these emails</a>
  </p>
</td></tr>
</table></td></tr></table></body></html>`
}

function ctaButton(text: string, href: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
    <tr><td style="background:#0f172a;border-radius:4px;">
      <a href="${href}" style="display:inline-block;color:#ffffff;text-decoration:none;padding:12px 28px;font-size:14px;font-weight:600;">${text} &rarr;</a>
    </td></tr>
  </table>`
}

type SignalEntry = { type: string; count: number }

function signalListHtml(signals: SignalEntry[]): string {
  if (!signals.length) return ''
  const items = signals
    .map(s => {
      const label = SIGNAL_LABELS[s.type] ?? s.type.replace(/_/g, ' ')
      return `<li style="margin-bottom:4px;">${s.count > 1 ? `${s.count} ` : ''}${label}${s.count > 1 ? 's' : ''}</li>`
    })
    .join('')
  return `<ul style="margin:8px 0 16px 0;padding-left:20px;line-height:1.9;">${items}</ul>`
}

function buildAwayEmail(
  firstName: string,
  userId: string,
  signals: SignalEntry[],
  companyCount: number,
): { subject: string; html: string } {
  const hasSignals = signals.length > 0
  const compWord = companyCount === 1 ? 'company' : 'companies'

  if (companyCount === 0) {
    const body = [
      `<p style="margin:0 0 16px 0;">You have not added a company yet, so nothing is being watched for you.</p>`,
      `<p style="margin:0 0 16px 0;">Add one company you would say yes to and we start watching it today. That is the whole first step.</p>`,
      ctaButton('Add a company', `${APP_URL}/dashboard/companies/new`),
    ].join('')
    return {
      subject: 'One company to start with',
      html: emailWrapper(`${firstName}, one thing when you are ready.`, body, userId),
    }
  }

  const body = [
    hasSignals
      ? `<p style="margin:0 0 8px 0;">Your ${companyCount} ${compWord} kept being watched. Since your last visit:</p>${signalListHtml(signals)}`
      : `<p style="margin:0 0 16px 0;">Your ${companyCount} ${compWord} ${companyCount === 1 ? 'is' : 'are'} still being watched. Nothing new fired in the last two weeks. Quiet is information too.</p>`,
    `<p style="margin:0 0 16px 0;">Nothing here needs a reply. Your next briefing arrives as usual.</p>`,
    ctaButton(hasSignals ? 'See what changed' : 'Open your dashboard', `${APP_URL}/dashboard`),
  ].join('')

  return {
    subject: hasSignals ? 'What changed at your companies' : 'Quiet two weeks at your companies',
    html: emailWrapper(`${firstName}, here is what changed while you were away.`, body, userId),
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const cutoff = new Date(now - INACTIVE_DAYS * MS_PER_DAY).toISOString()

  const { data: trialUsers, error: usersErr } = await admin
    .from('users')
    .select('id, email')
    .eq('subscription_status', 'trialing')
    .is('drip_unsubscribed_at', null)

  if (usersErr) return NextResponse.json({ error: usersErr.message }, { status: 500 })
  if (!trialUsers?.length) return NextResponse.json({ sent: 0, skipped: 0 })

  const userIds = trialUsers.map(u => u.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adminAny = admin as any

  const [
    { data: profiles },
    { data: eventRows },
    { data: signalRows },
    { data: companyRows },
  ] = await Promise.all([
    admin.from('user_profiles').select('user_id, full_name').in('user_id', userIds),
    admin
      .from('user_events')
      .select('user_id')
      .in('user_id', userIds)
      .gte('created_at', cutoff),
    admin
      .from('company_signals')
      .select('user_id, signal_type')
      .in('user_id', userIds)
      .gte('signal_date', cutoff.split('T')[0]),
    admin.from('companies').select('user_id').in('user_id', userIds).is('archived_at', null),
  ])

  // inactivity_nudge_logs is not in the generated types, use adminAny
  const { data: nudgeLogs } = await adminAny
    .from('inactivity_nudge_logs')
    .select('user_id, nudge_type')
    .in('user_id', userIds)
    .in('nudge_type', [NUDGE_TYPE, ...LEGACY_NUDGE_TYPES])

  const nameByUser: Record<string, string> = {}
  for (const p of profiles ?? []) {
    if (p.full_name) nameByUser[p.user_id] = p.full_name.split(' ')[0]
  }

  const activeUsers = new Set((eventRows ?? []).map(e => e.user_id))

  // Anyone already touched by this or a legacy re-engagement message is never touched again.
  const alreadyContacted = new Set(
    ((nudgeLogs ?? []) as Array<{ user_id: string }>).map(n => n.user_id),
  )

  const signalsByUser: Record<string, Record<string, number>> = {}
  for (const s of signalRows ?? []) {
    if (!signalsByUser[s.user_id]) signalsByUser[s.user_id] = {}
    signalsByUser[s.user_id][s.signal_type] = (signalsByUser[s.user_id][s.signal_type] ?? 0) + 1
  }

  const companyCountByUser: Record<string, number> = {}
  for (const c of companyRows ?? []) {
    companyCountByUser[c.user_id] = (companyCountByUser[c.user_id] ?? 0) + 1
  }

  let sent = 0
  let skipped = 0
  const errors: string[] = []

  for (const u of trialUsers) {
    if (activeUsers.has(u.id) || alreadyContacted.has(u.id)) {
      skipped++
      continue
    }

    const firstName = nameByUser[u.id] ?? u.email.split('@')[0]
    const companyCount = companyCountByUser[u.id] ?? 0
    const signals: SignalEntry[] = Object.entries(signalsByUser[u.id] ?? {})
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const { subject, html } = buildAwayEmail(firstName, u.id, signals, companyCount)
    const { error: sendErr } = await sendEmail({ to: u.email, subject, html })
    if (sendErr) {
      errors.push(`${u.email}: ${(sendErr as { message?: string }).message ?? 'send failed'}`)
      continue
    }
    await adminAny.from('inactivity_nudge_logs').insert({
      user_id: u.id,
      nudge_type: NUDGE_TYPE,
      details: { inactivity_days: INACTIVE_DAYS, signal_count: signals.length, company_count: companyCount },
    })
    sent++
  }

  return NextResponse.json({ sent, skipped, users: trialUsers.length, errors: errors.slice(0, 10) })
}