import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from '@/lib/unsubscribe-token'

const DAYS_10 = 10
const DAYS_20 = 20
const MS_PER_DAY = 86_400_000

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

function build10DayEmail(
  firstName: string,
  userId: string,
  signals: SignalEntry[],
  companyCount: number,
): { subject: string; html: string } {
  const dashboard = `${APP_URL}/dashboard`
  const hasSignals = signals.length > 0
  const compWord = companyCount === 1 ? 'company' : 'companies'

  const body = [
    `<p style="margin:0 0 16px 0;">You have not been back in ten days. That matters in a market where timing is everything.</p>`,
    companyCount > 0
      ? `<p style="margin:0 0 ${hasSignals ? '8' : '16'}px 0;">Your ${compWord} ${companyCount === 1 ? 'is' : 'are'} still being monitored.${hasSignals ? ' Here is what came in while you were away:' : ''}</p>`
      : `<p style="margin:0 0 16px 0;">You have not added any target companies yet, so the scanners have not started. Add companies where you already have a contact. Those are the ones where timing matters.</p>`,
    hasSignals ? signalListHtml(signals) : '',
    `<p style="margin:0 0 16px 0;">The window between when a signal fires and when a search goes public is narrow. Acting within 48 hours is what separates the candidates who get the call from the ones who find out too late.</p>`,
    `<p style="margin:0 0 4px 0;">Log in and see what came in. Reply to this email if you have questions.</p>`,
    ctaButton("See what you've missed", dashboard),
  ].join('')

  return {
    subject: hasSignals
      ? `Signals fired at your target ${compWord}. You have not seen them yet.`
      : `Ten days away. Your search is still running, ${firstName}.`,
    html: emailWrapper(`${firstName}, the market kept moving.`, body, userId),
  }
}

function build20DayEmail(
  firstName: string,
  userId: string,
  signals: SignalEntry[],
  companyCount: number,
  daysLeftOnTrial: number,
): { subject: string; html: string } {
  const dashboard = `${APP_URL}/dashboard`
  const billing = `${APP_URL}/settings/billing`
  const hasSignals = signals.length > 0
  const trialEnd =
    daysLeftOnTrial > 1
      ? `ends in ${daysLeftOnTrial} days`
      : daysLeftOnTrial === 1
        ? 'ends tomorrow'
        : 'has ended'

  const body = [
    `<p style="margin:0 0 16px 0;">${firstName}, your trial ${trialEnd}. You have not logged in for twenty days.</p>`,
    hasSignals
      ? `<p style="margin:0 0 8px 0;">In that time, your tracked companies generated signals you have not seen:</p>${signalListHtml(signals)}`
      : companyCount > 0
        ? `<p style="margin:0 0 16px 0;">Your tracked ${companyCount === 1 ? 'company' : `${companyCount} companies`} ${companyCount === 1 ? 'has' : 'have'} been generating signals. You have not been back to see them.</p>`
        : '',
    `<p style="margin:0 0 16px 0;">If the search is serious, this is the moment. The intelligence built here on your target companies does not transfer anywhere else. There is no export. When the trial ends, it is gone.</p>`,
    `<p style="margin:0 0 16px 0;">Starting Monday is $199 a month. If you need more time or have questions, reply here. I read everything.</p>`,
    ctaButton('Reopen your search', dashboard),
    `<p style="margin:20px 0 0 0;font-size:13px;color:#64748b;">Or <a href="${billing}" style="color:#64748b;">convert to a paid plan</a> to keep your search running.</p>`,
  ].join('')

  return {
    subject: `Your trial ${trialEnd}. You have not logged in for 20 days.`,
    html: emailWrapper('Twenty days.', body, userId),
  }
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const now = Date.now()
  const cutoff10d = new Date(now - DAYS_10 * MS_PER_DAY).toISOString()
  const cutoff20d = new Date(now - DAYS_20 * MS_PER_DAY).toISOString()

  const { data: trialUsers, error: usersErr } = await admin
    .from('users')
    .select('id, email, trial_ends_at')
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
      .select('user_id, created_at')
      .in('user_id', userIds)
      .gte('created_at', cutoff20d)
      .order('created_at', { ascending: false }),
    admin
      .from('company_signals')
      .select('user_id, signal_type')
      .in('user_id', userIds)
      .gte('signal_date', cutoff20d.split('T')[0]),
    admin.from('companies').select('user_id').in('user_id', userIds).is('archived_at', null),
  ])

  // inactivity_nudge_logs is not in the generated types, use adminAny
  const { data: nudgeLogs } = await adminAny
    .from('inactivity_nudge_logs')
    .select('user_id, nudge_type')
    .in('user_id', userIds)
    .in('nudge_type', ['reengagement_10d', 'reengagement_20d'])

  const nameByUser: Record<string, string> = {}
  for (const p of profiles ?? []) {
    if (p.full_name) nameByUser[p.user_id] = p.full_name.split(' ')[0]
  }

  // Most recent event per user (within the last 20 days)
  const lastEventByUser: Record<string, Date> = {}
  for (const e of eventRows ?? []) {
    if (!lastEventByUser[e.user_id]) lastEventByUser[e.user_id] = new Date(e.created_at)
  }

  const sentNudges = new Set(
    ((nudgeLogs ?? []) as Array<{ user_id: string; nudge_type: string }>).map(
      n => `${n.user_id}:${n.nudge_type}`,
    ),
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
  const cutoff10dDate = new Date(cutoff10d)

  for (const u of trialUsers) {
    const lastEvent = lastEventByUser[u.id]
    // No event in last 20 days → inactive20d (also inactive10d)
    // Event exists but older than 10d cutoff → inactive10d only
    const inactive20d = !lastEvent
    const inactive10d = !lastEvent || lastEvent < cutoff10dDate

    if (!inactive10d) {
      skipped++
      continue
    }

    const firstName = nameByUser[u.id] ?? u.email.split('@')[0]
    const companyCount = companyCountByUser[u.id] ?? 0
    const daysLeftOnTrial = u.trial_ends_at
      ? Math.max(0, Math.floor((new Date(u.trial_ends_at).getTime() - now) / MS_PER_DAY))
      : 0

    const signals: SignalEntry[] = Object.entries(signalsByUser[u.id] ?? {})
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    if (inactive20d && !sentNudges.has(`${u.id}:reengagement_20d`)) {
      const { subject, html } = build20DayEmail(firstName, u.id, signals, companyCount, daysLeftOnTrial)
      const { error: sendErr } = await sendEmail({ to: u.email, subject, html })
      if (sendErr) {
        errors.push(`${u.email} 20d: ${(sendErr as { message?: string }).message ?? 'send failed'}`)
        continue
      }
      await adminAny.from('inactivity_nudge_logs').insert({
        user_id: u.id,
        nudge_type: 'reengagement_20d',
        details: {
          inactivity_days: 20,
          signal_count: signals.length,
          company_count: companyCount,
          days_left_on_trial: daysLeftOnTrial,
        },
      })
      sent++
      continue
    }

    // Send 10d nudge only if neither 10d nor 20d has been sent yet
    if (!sentNudges.has(`${u.id}:reengagement_10d`) && !sentNudges.has(`${u.id}:reengagement_20d`)) {
      const { subject, html } = build10DayEmail(firstName, u.id, signals, companyCount)
      const { error: sendErr } = await sendEmail({ to: u.email, subject, html })
      if (sendErr) {
        errors.push(`${u.email} 10d: ${(sendErr as { message?: string }).message ?? 'send failed'}`)
        continue
      }
      await adminAny.from('inactivity_nudge_logs').insert({
        user_id: u.id,
        nudge_type: 'reengagement_10d',
        details: { inactivity_days: 10, signal_count: signals.length, company_count: companyCount },
      })
      sent++
      continue
    }

    skipped++
  }

  return NextResponse.json({ sent, skipped, users: trialUsers.length, errors: errors.slice(0, 10) })
}
