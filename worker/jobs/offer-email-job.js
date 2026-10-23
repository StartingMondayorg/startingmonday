import { randomBytes } from 'crypto'
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

function buildOfferEmail({ firstName, referralUrl, feedbackUrl }) {
  const subject = 'You did it.'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You did it.</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
  <tr><td align="center" style="padding:40px 16px;">
    <table width="540" cellpadding="0" cellspacing="0" border="0" style="max-width:540px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

      <tr><td style="background:#0f172a;padding:36px 48px 32px 48px;">
        <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:18px;">Starting Monday</div>
        <div style="color:#ffffff;font-size:26px;font-weight:700;line-height:1.2;">${esc(firstName)}, you did it.</div>
      </td></tr>

      <tr><td style="padding:40px 48px;">

        <p style="font-size:15px;color:#334155;line-height:1.7;margin:0 0 32px 0;">
          The hard part is behind you. We hope Starting Monday made the process a little more manageable.
        </p>

        <p style="font-size:13px;font-weight:700;color:#0f172a;text-transform:uppercase;letter-spacing:0.08em;margin:0 0 8px 0;">Two quick asks</p>

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:32px;">
          <tr>
            <td style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;margin-bottom:12px;">
              <p style="font-size:14px;font-weight:600;color:#0f172a;margin:0 0 6px 0;">1. Is anyone in your network in search?</p>
              <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 14px 0;">If so, send them here. They get 30 days free, no credit card required.</p>
              <a href="${esc(referralUrl)}" style="font-size:13px;font-weight:600;color:#0f172a;text-decoration:underline;">${esc(referralUrl)}</a>
            </td>
          </tr>
          <tr><td style="height:12px;"></td></tr>
          <tr>
            <td style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:4px;">
              <p style="font-size:14px;font-weight:600;color:#0f172a;margin:0 0 6px 0;">2. One sentence you would share with someone else in search.</p>
              <p style="font-size:13px;color:#64748b;line-height:1.6;margin:0 0 14px 0;">That is all we are asking. No star ratings, no forms, no follow-up.</p>
              <a href="${esc(feedbackUrl)}" style="font-size:13px;font-weight:600;color:#0f172a;text-decoration:underline;">Leave a sentence &rarr;</a>
            </td>
          </tr>
        </table>

        <p style="font-size:14px;color:#94a3b8;margin:0;line-height:1.6;">
          Best of luck with what comes next.
        </p>

      </td></tr>

      <tr><td style="padding:24px 48px;border-top:1px solid #e2e8f0;">
        <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.6;">
          Starting Monday &mdash; startingmonday.app
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`

  return { subject, html }
}

export async function runOfferEmailJob() {
  const supabase = getSupabase()
  logger.info('offer-email-job: starting')

  // Users who accepted an offer but have not yet received the offer email
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, offer_accepted_at')
    .not('offer_accepted_at', 'is', null)
    .is('offer_email_sent_at', null)

  if (error) {
    logger.error('offer-email-job: query failed', { error: error.message })
    return
  }

  if (!users?.length) {
    logger.info('offer-email-job: no pending offer emails')
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

    // Generate invite_code if the user does not have one yet
    let inviteCode = profile?.invite_code
    if (!inviteCode) {
      inviteCode = randomBytes(6).toString('hex')
      await supabase
        .from('user_profiles')
        .update({ invite_code: inviteCode })
        .eq('user_id', user.id)
    }

    const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
    const referralUrl = `${APP_URL}/invite/${inviteCode}`
    const feedbackUrl = `${APP_URL}/feedback?code=${inviteCode}`

    try {
      const { subject, html } = buildOfferEmail({ firstName, referralUrl, feedbackUrl })
      await sendEmail({ to: user.email, subject, html })

      await supabase
        .from('users')
        .update({ offer_email_sent_at: new Date().toISOString() })
        .eq('id', user.id)

      logger.info('offer-email-job: sent', { userId: user.id })
      sent++
    } catch (err) {
      logger.error('offer-email-job: send failed', { userId: user.id, error: err.message })
      skipped++
    }
  }

  logger.info('offer-email-job: done', { sent, skipped })
}
