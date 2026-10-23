import { getSupabase } from '../lib/supabase.js'
import { sendEmail } from '../lib/send-email.js'
import { logger } from '../lib/logger.js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Footer for the one activation email. Addresses the EA/admin scenario without being alarmist.
const PRIVATE_NOTE = `
      <tr><td style="padding:24px 48px 8px 48px;border-top:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#94a3b8;margin:0 0 6px 0;line-height:1.7;">
          Your Starting Monday account is private. Your pipeline, briefings, and search activity are visible only to you.
        </p>
        <p style="font-size:12px;color:#94a3b8;margin:0 0 6px 0;line-height:1.7;">
          If an assistant manages your work inbox, consider setting a personal delivery address in your
          <a href="${APP_URL}/dashboard/profile#briefing-email" style="color:#64748b;text-decoration:underline;">profile settings</a>
          so briefings reach you directly.
        </p>
      </td></tr>
      <tr><td style="padding:0 48px 32px 48px;">
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
          Starting Monday &mdash; startingmonday.app
        </p>
      </td></tr>`

function dateDaysAgo(n) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().slice(0, 10)
}

// The single activation message. Sent once, on day 2, only to trial users who
// have not added a company — the one action that makes the product do anything.
// The earlier six-touch sequence (days 1/2/3/5/7/14) was retired on 2026-10-20
// (docs/strategy/sm-simplification-proposal-2026-10-20.md, R-1).
export function buildCompanyNudgeEmail({ firstName }) {
  const subject = 'One thing to do in Starting Monday today'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <tr><td style="background:#0f172a;padding:36px 48px 32px 48px;">
        <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:18px;">Starting Monday</div>
        <div style="color:#ffffff;font-size:24px;font-weight:700;line-height:1.2;">${esc(firstName)}, add your first target company.</div>
      </td></tr>

      <tr><td style="padding:32px 48px 28px 48px;">
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 16px 0;">You haven&apos;t added a company yet. That&apos;s the one action that unlocks everything else — career page scanning, interview prep briefs, signal alerts.</p>
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0;">It takes 30 seconds. Add the name, paste the career page URL, and the scanner starts on its next run.</p>
      </td></tr>

      <tr><td style="padding:0 48px 40px 48px;">
        <a href="${esc(APP_URL + '/dashboard/companies/new')}" style="display:inline-block;background:#f97316;color:#ffffff;font-size:14px;font-weight:700;padding:14px 28px;border-radius:4px;text-decoration:none;">
          Add your first company &rarr;
        </a>
      </td></tr>

      ${PRIVATE_NOTE}

    </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html }
}



export const ACTIVATION_DAY = 2

export async function runActivationReminderJob() {
  const supabase = getSupabase()
  logger.info('activation-reminder-job: starting')

  const targetDate = dateDaysAgo(ACTIVATION_DAY)

  // Trial users who signed up exactly ACTIVATION_DAY days ago and have not opted out of setup email
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, created_at')
    .eq('subscription_status', 'trialing')
    .is('drip_unsubscribed_at', null)
    .gte('created_at', `${targetDate}T00:00:00Z`)
    .lte('created_at', `${targetDate}T23:59:59Z`)

  if (error) {
    logger.error('activation-reminder-job: query failed', { error: error.message })
    return
  }

  if (!users?.length) {
    logger.info('activation-reminder-job: no targets today')
    return
  }

  const targetIds = users.map(u => u.id)

  const [{ data: profiles }, { data: companyRows }] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('user_id, full_name, briefing_email')
      .in('user_id', targetIds),
    supabase
      .from('companies')
      .select('user_id')
      .in('user_id', targetIds)
      .is('archived_at', null),
  ])

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))
  const hasCompany = new Set((companyRows ?? []).map(r => r.user_id))

  let sent = 0
  let skipped = 0

  for (const user of users) {
    if (hasCompany.has(user.id)) {
      skipped++
      continue
    }

    const profile   = profileMap[user.id]
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const deliverTo = profile?.briefing_email ?? user.email

    try {
      const { subject, html } = buildCompanyNudgeEmail({ firstName })
      await sendEmail({ to: deliverTo, subject, html })
      logger.info('activation-reminder-job: sent day-2 company nudge', { userId: user.id })
      sent++
    } catch (err) {
      logger.error('activation-reminder-job: send failed', { userId: user.id, error: err.message })
      skipped++
    }
  }

  logger.info('activation-reminder-job: done', { sent, skipped })
}