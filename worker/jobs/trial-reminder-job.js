import { getSupabase } from '../lib/supabase.js'
import { logger } from '../lib/logger.js'
import { sendEmail } from '../lib/send-email.js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'
const FROM = process.env.RESEND_FROM_ADDRESS ?? 'briefing@startingmonday.app'

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderTrialEmail({ firstName, daysLeft, email }) {
  const isExpiring = daysLeft === 0
  const subject = isExpiring
    ? 'Your Starting Monday trial ends today'
    : `Your Starting Monday trial ends in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`

  const headline = isExpiring
    ? 'Your trial ends today.'
    : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your trial.`

  const body = isExpiring
    ? `Your free trial expires today. Upgrade now to keep your daily briefings, company scanner, and AI prep briefs running without interruption.`
    : `You have ${daysLeft} day${daysLeft === 1 ? '' : 's'} remaining in your Starting Monday trial. If the daily briefings and company scanner have been useful, upgrade before your trial ends to keep them going.`

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
    <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <tr><td style="background:#0f172a;padding:36px 48px 32px 48px;">
        <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:18px;">Starting Monday</div>
        <div style="color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;margin-bottom:8px;">${esc(headline)}</div>
        <div style="color:#64748b;font-size:13px;">${esc(firstName)}&nbsp;&mdash;&nbsp;${esc(email)}</div>
      </td></tr>

      <tr><td style="padding:40px 48px;">
        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 28px 0;">${esc(body)}</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:36px;">
          <tr>
            <td width="33%" style="padding:20px 16px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px 0 0 4px;">
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:4px;">Intelligence</div>
              <div style="font-size:22px;font-weight:700;color:#0f172a;line-height:1;">$49</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">/month</div>
              <div style="font-size:12px;color:#64748b;margin-top:10px;line-height:1.5;">Daily briefings<br>Company scanner<br>Pipeline tracking</div>
            </td>
            <td width="4px"></td>
            <td width="33%" style="padding:20px 16px;text-align:center;background:#0f172a;border:1px solid #0f172a;border-radius:0;position:relative;">
              <div style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#64748b;margin-bottom:4px;">Most Popular</div>
              <div style="font-size:13px;font-weight:700;color:#ffffff;margin-bottom:4px;">Search</div>
              <div style="font-size:22px;font-weight:700;color:#ffffff;line-height:1;">$129</div>
              <div style="font-size:11px;color:#64748b;margin-top:4px;">/month</div>
              <div style="font-size:12px;color:#94a3b8;margin-top:10px;line-height:1.5;">Everything in Intelligence<br>Interview prep briefs<br>AI chat + outreach drafts</div>
            </td>
            <td width="4px"></td>
            <td width="33%" style="padding:20px 16px;text-align:center;background:#f8fafc;border:1px solid #e2e8f0;border-radius:0 4px 4px 0;">
              <div style="font-size:13px;font-weight:700;color:#0f172a;margin-bottom:20px;">Questions?</div>
              <div style="font-size:12px;color:#64748b;line-height:1.6;">Reply to this email and I'll help you figure out which plan fits where you are in your search.</div>
            </td>
          </tr>
        </table>

        <table cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:#0f172a;border-radius:4px;padding:14px 28px;">
              <a href="${APP_URL}/settings/billing" style="color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;display:block;">
                Upgrade now &rarr;
              </a>
            </td>
          </tr>
        </table>
      </td></tr>

      <tr><td style="padding:24px 48px;border-top:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
          Starting Monday &mdash; AI-powered executive job search.<br>
          <a href="${APP_URL}/settings/billing" style="color:#64748b;">Manage subscription</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html }
}

export async function runTrialReminderJob() {
  const supabase = getSupabase()
  logger.info('trial-reminder-job: starting')

  const now = new Date()
  const todayUTC = now.toISOString().slice(0, 10)

  // T-3: trial_ends_at is exactly 3 days from now (same date)
  const plus3 = new Date(now)
  plus3.setUTCDate(plus3.getUTCDate() + 3)
  const threeDaysOut = plus3.toISOString().slice(0, 10)

  // Fetch trialing users whose trial ends today or in 3 days
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, trial_ends_at')
    .eq('subscription_status', 'trialing')
    .in('trial_ends_at::date', [todayUTC, threeDaysOut])

  if (error) {
    logger.error('trial-reminder-job: failed to fetch users', { error: error.message })
    return
  }

  if (!users?.length) {
    logger.info('trial-reminder-job: no trials ending today or in 3 days')
    return
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name')
    .in('user_id', users.map(u => u.id))

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))

  let sent = 0
  let skipped = 0

  for (const user of users) {
    const endsAt = new Date(user.trial_ends_at)
    const msLeft = endsAt.getTime() - now.getTime()
    const daysLeft = Math.round(msLeft / (1000 * 60 * 60 * 24))

    // Only send for daysLeft = 0 or 3 (avoid re-sending on edge cases)
    if (daysLeft !== 0 && daysLeft !== 3) {
      skipped++
      continue
    }

    const profile = profileMap[user.id]
    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'

    try {
      const { subject, html } = renderTrialEmail({ firstName, daysLeft, email: user.email })
      await sendEmail({ to: user.email, subject, html })
      logger.info('trial-reminder-job: sent', { userId: user.id, daysLeft })
      sent++
    } catch (err) {
      logger.error('trial-reminder-job: send failed', { userId: user.id, error: err.message })
      skipped++
    }
  }

  logger.info('trial-reminder-job: done', { sent, skipped })
}
