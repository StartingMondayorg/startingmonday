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

function buildReactivationEmail({ firstName, referralUrl, unsubscribeUrl }) {
  const subject = 'One year later.'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>One year later.</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <tr><td style="background:#0f172a;padding:36px 48px 32px 48px;">
        <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:18px;">Starting Monday</div>
        <div style="color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;">${esc(firstName)}, it has been a year.</div>
      </td></tr>

      <tr><td style="padding:40px 48px;">

        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 24px 0;">
          At the executive level, the best searches happen before anyone knows they are looking. The relationships, the positioning, the market awareness &mdash; those take time to build, and they are most valuable when built well before the need arises.
        </p>

        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 32px 0;">
          If anyone in your network is navigating a transition now, Starting Monday is here: <a href="${esc(referralUrl)}" style="color:#0f172a;font-weight:600;">${esc(referralUrl)}</a>
        </p>

        <p style="font-size:14px;color:#94a3b8;margin:0;line-height:1.6;">
          Wishing you well in year two.
        </p>

      </td></tr>

      <tr><td style="padding:24px 48px;border-top:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
          Starting Monday &mdash; startingmonday.app<br>
          <a href="${esc(unsubscribeUrl)}" style="color:#94a3b8;">Unsubscribe</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html }
}

export async function runReactivationJob() {
  const supabase = getSupabase()
  logger.info('reactivation-job: starting')

  // Target users whose offer was accepted exactly 365 days ago (within today's UTC date)
  const yearAgo = new Date()
  yearAgo.setFullYear(yearAgo.getFullYear() - 1)
  const targetDate = yearAgo.toISOString().slice(0, 10)

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .gte('offer_accepted_at', `${targetDate}T00:00:00Z`)
    .lte('offer_accepted_at', `${targetDate}T23:59:59Z`)
    .is('marketing_unsubscribed_at', null)

  if (error) {
    logger.error('reactivation-job: query failed', { error: error.message })
    return
  }

  if (!users?.length) {
    logger.info('reactivation-job: no anniversaries today')
    return
  }

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, invite_code')
    .in('user_id', users.map(u => u.id))

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.user_id, p]))

  let sent = 0
  let skipped = 0

  for (const user of users) {
    const profile = profileMap[user.id]
    const inviteCode = profile?.invite_code
    if (!inviteCode) {
      // No invite code means the offer email was never sent; skip reactivation
      skipped++
      continue
    }

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const referralUrl = `${APP_URL}/invite/${inviteCode}`
    const unsubscribeUrl = `${APP_URL}/unsubscribe/${inviteCode}`

    try {
      const { subject, html } = buildReactivationEmail({ firstName, referralUrl, unsubscribeUrl })
      await sendEmail({ to: user.email, subject, html })
      logger.info('reactivation-job: sent', { userId: user.id })
      sent++
    } catch (err) {
      logger.error('reactivation-job: send failed', { userId: user.id, error: err.message })
      skipped++
    }
  }

  logger.info('reactivation-job: done', { sent, skipped })
}
