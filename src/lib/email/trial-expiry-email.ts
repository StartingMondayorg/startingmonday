import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from './unsubscribe-token'

// Rich signs and receives replies to this one, so it does not use the
// briefing@ system default. See SMK-468.
export const TRIAL_EXPIRY_FROM = 'Richard Rothschild <richard@startingmonday.app>'
export const TRIAL_EXPIRY_REPLY_TO = 'richard@startingmonday.app'

// Copy approved by Rich 2026-08-25. His chosen subject used an em dash, which the
// repo's no-restricted-syntax lint rule rejects in string copy ("use a regular
// hyphen or reword"), so it is punctuated with a colon instead. Wording, length
// and reading order are otherwise unchanged.
export const TRIAL_EXPIRY_SUBJECT = 'Your Starting Monday trial: 10 days left'

export function formatTrialEndDate(trialEndsAt: string | Date): string {
  const date = trialEndsAt instanceof Date ? trialEndsAt : new Date(trialEndsAt)
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function shell(title: string, body: string, userId: string): string {
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

export function buildTrialExpiryEmail({
  firstName,
  trialEndsAt,
  userId,
}: {
  firstName: string
  trialEndsAt: string | Date
  userId: string
}): { subject: string; html: string } {
  const upgradeLink = `${APP_URL}/settings/billing`
  const feedbackLink = `${APP_URL}/feedback`
  const endDate = formatTrialEndDate(trialEndsAt)

  const body = [
    `<p style="margin:0 0 16px 0;">Hi ${firstName},</p>`,
    `<p style="margin:0 0 16px 0;">Your Starting Monday trial has about 10 days left. It ends on ${endDate}.</p>`,
    `<p style="margin:0 0 16px 0;">If it has been useful, you can keep your pipeline, briefs, and outreach history going without interruption by <a href="${upgradeLink}" style="color:#0f172a;font-weight:600;">choosing a plan</a>.</p>`,
    `<p style="margin:0 0 16px 0;">And if something has not clicked, I would genuinely like to know. Reply to this email or <a href="${feedbackLink}" style="color:#0f172a;font-weight:600;">share feedback here</a>. I read every note.</p>`,
    `<p style="margin:0 0 16px 0;">Either way, thanks for giving Starting Monday a look during what I know is a demanding stretch.</p>`,
    ctaButton('Choose a plan', upgradeLink),
  ].join('')

  return {
    subject: TRIAL_EXPIRY_SUBJECT,
    html: shell('10 days left in your trial', body, userId),
  }
}
