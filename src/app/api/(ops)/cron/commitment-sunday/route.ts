import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from '@/lib/unsubscribe-token'

function buildEmail(firstName: string, goal: number, userId: string, warmPaths: { contactName: string; companyName: string }[]): string {
  const unsubUrl = unsubscribeUrl(userId)
  const warmHtml = warmPaths.length > 0
    ? `<p style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;">Warm paths this week</p>
       <ul style="margin:0 0 20px 0;padding-left:18px;">
         ${warmPaths.slice(0, 5).map(wp =>
           `<li style="font-size:14px;color:#334155;line-height:1.8;">${wp.contactName} at ${wp.companyName}</li>`
         ).join('')}
       </ul>`
    : ''

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;">
<tr><td style="padding:32px 40px 24px;">
  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f97316;">Starting Monday</p>
  <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">This week, aim for ${goal}.</h1>
  <p style="margin:0 0 20px 0;font-size:15px;color:#334155;line-height:1.7;">
    ${firstName}, you set a goal of ${goal} outreach conversation${goal === 1 ? '' : 's'} per week.
    The week starts today. Pick your ${goal === 1 ? 'person' : `${goal} people`} now while the week is open.
  </p>
  ${warmHtml}
  <a href="${APP_URL}/dashboard/contacts" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;">Go to contacts</a>
</td></tr>
<tr><td style="padding:20px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;">
  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">Rich Rothschild<br>Founder, Starting Monday</p>
  <p style="margin:8px 0 0 0;font-size:11px;color:#94a3b8;">
    <a href="${unsubUrl}" style="color:#94a3b8;">Unsubscribe</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`
}

export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, weekly_goal')
    .not('weekly_goal', 'is', null)
    .is('placed_at', null)

  const activeProfiles = (profiles ?? []).filter(p => (p as unknown as { weekly_goal?: number | null }).weekly_goal)

  if (activeProfiles.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  const userIds = activeProfiles.map(p => p.user_id)

  const { data: users } = await supabase
    .from('users')
    .select('id, email, subscription_status')
    .in('id', userIds)
    .in('subscription_status', ['active', 'trialing'])

  const activeUserIds = new Set((users ?? []).map(u => u.id))
  const emailByUserId = new Map((users ?? []).map(u => [u.id, u.email]))

  const signalsSince7d = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]
  const { data: signals } = await supabase
    .from('company_signals')
    .select('user_id, company_id, companies(name)')
    .in('user_id', userIds)
    .gte('signal_date', signalsSince7d)
    .neq('signal_type', 'pattern_alert')

  const { data: contacts } = await supabase
    .from('contacts')
    .select('user_id, company_id, name')
    .in('user_id', userIds)
    .eq('status', 'active')
    .not('company_id', 'is', null)

  let sent = 0
  for (const p of activeProfiles) {
    if (!activeUserIds.has(p.user_id)) continue
    const email = emailByUserId.get(p.user_id)
    if (!email) continue
    const goal = (p as unknown as { weekly_goal?: number | null }).weekly_goal!
    const firstName = p.full_name?.split(' ')[0] ?? 'there'

    const signalCompanyIds = new Set(
      (signals ?? []).filter(s => s.user_id === p.user_id).map(s => s.company_id)
    )
    const warmPaths = (contacts ?? [])
      .filter(c => c.user_id === p.user_id && c.company_id && signalCompanyIds.has(c.company_id))
      .map(c => {
        const sig = (signals ?? []).find(s => s.user_id === p.user_id && s.company_id === c.company_id)
        const co = sig?.companies as unknown as { name: string } | null
        return { contactName: c.name, companyName: co?.name ?? '' }
      })
      .filter(wp => wp.companyName)

    const html = buildEmail(firstName, goal, p.user_id, warmPaths)
    await sendEmail({ to: email, subject: `This week, aim for ${goal}`, html })
    sent++
  }

  return NextResponse.json({ sent })
}
