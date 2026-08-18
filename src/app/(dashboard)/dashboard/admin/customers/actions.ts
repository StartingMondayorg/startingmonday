'use server'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { sendEmail } from '@/lib/email/email'
import { APP_URL } from '@/lib/config'
import { TIER_DISPLAY_NAMES } from '@/lib/pricing'

const TIER_NAMES = TIER_DISPLAY_NAMES

function escHtml(s: string): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function welcomeEmailHtml(firstName: string, tierName: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
<tr><td align="center" style="padding:40px 16px;">
<table width="560" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

<tr><td style="background:#0f172a;padding:32px 40px;">
  <div style="color:#334155;font-size:10px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;margin-bottom:12px;">Starting Monday</div>
  <div style="color:#ffffff;font-size:22px;font-weight:700;line-height:1.2;">Good to have you here, ${escHtml(firstName)}.</div>
</td></tr>

<tr><td style="padding:36px 40px 28px 40px;font-size:15px;color:#334155;line-height:1.75;">
  <p style="margin:0 0 18px 0;">Most executives in active search spend too much time on the wrong signals. Updating the resume one more time. Refreshing LinkedIn. Waiting for a recruiter to call.</p>
  <p style="margin:0 0 18px 0;">Starting Monday tracks what actually creates timing: leadership changes, funding events, regulatory shifts, board moves. The intelligence that lets you reach out before anyone knows to post the role.</p>
  <p style="margin:0 0 18px 0;">To make your morning briefing useful from day one, add the companies where you already have a contact or a relationship. That is where timing matters most, and where the platform works hardest for you.</p>
  <p style="margin:0 0 24px 0;">You are on the ${escHtml(tierName)} plan. If the platform is not clicking after a week, reply to this email. I read everything.</p>
  <table cellpadding="0" cellspacing="0" border="0">
    <tr><td style="background:#0f172a;border-radius:4px;">
      <a href="${APP_URL}/dashboard" style="display:inline-block;color:#ffffff;text-decoration:none;padding:13px 32px;font-size:14px;font-weight:600;letter-spacing:0.03em;">Open your dashboard &nbsp;&rarr;</a>
    </td></tr>
  </table>
</td></tr>

<tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
    Rich Rothschild<br>
    Founder, Starting Monday
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}

export async function sendWelcomeEmail(userId: string, currentFilter: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const staff = await getStaffMember(user.email ?? '')
  if (!staff) redirect('/login')

  const admin = createAdminClient()
  const { data: targetUser } = await admin
    .from('users')
    .select('email, subscription_tier')
    .eq('id', userId)
    .single()

  if (!targetUser?.email) return

  const { data: profile } = await admin
    .from('user_profiles')
    .select('full_name')
    .eq('user_id', userId)
    .maybeSingle()

  const fullName = profile?.full_name ?? targetUser.email
  const firstName = fullName.includes(' ') ? fullName.split(' ')[0] : fullName.split('@')[0]
  const tierName = TIER_NAMES[targetUser.subscription_tier ?? 'free'] ?? 'Free'

  await sendEmail({
    to: targetUser.email,
    subject: `You're in, ${firstName}. Here is where to start.`,
    html: welcomeEmailHtml(firstName, tierName),
  })

  redirect(`/dashboard/admin/customers?filter=${currentFilter}&sent=${userId}`)
}
