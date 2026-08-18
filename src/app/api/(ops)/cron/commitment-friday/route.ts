import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from '@/lib/unsubscribe-token'

function buildEmail(firstName: string, goal: number, done: number, userId: string): string {
  const unsubUrl = unsubscribeUrl(userId)
  const hit = done >= goal
  const remaining = Math.max(0, goal - done)

  const headline = hit
    ? `${done} of ${goal}. Strong week.`
    : done > 0
      ? `${done} of ${goal} so far.`
      : `No outreach drafted yet this week.`

  const body = hit
    ? `You hit your goal. That consistency is what separates searches that close in 90 days from ones that drag past 180. Keep the same pace next week.`
    : remaining === goal
      ? `You still have today to start. Even one conversation sets the week apart from zero. Draft one outreach now.`
      : `${remaining} more this afternoon gets you to ${goal}. If not today, that's context for next week's goal.`

  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;">
<tr><td style="padding:32px 40px 24px;">
  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f97316;">Starting Monday</p>
  <h1 style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;">${headline}</h1>
  <p style="margin:0 0 24px 0;font-size:15px;color:#334155;line-height:1.7;">${firstName}, ${body}</p>
  <a href="${APP_URL}/dashboard/contacts" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;">
    ${hit ? 'View your pipeline' : 'Draft outreach now'}
  </a>
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

  const activeProfiles = (profiles ?? []).filter(p => (p as unknown as { weekly_goal?: number | null }).weekly_goal)
  if (activeProfiles.length === 0) return NextResponse.json({ sent: 0 })

  const userIds = activeProfiles.map(p => p.user_id)

  const { data: users } = await supabase
    .from('users')
    .select('id, email, subscription_status')
    .in('id', userIds)
    .in('subscription_status', ['active', 'trialing'])

  const activeUserIds = new Set((users ?? []).map(u => u.id))
  const emailByUserId = new Map((users ?? []).map(u => [u.id, u.email]))

  const monday = new Date()
  const day = monday.getDay()
  monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day))
  monday.setHours(0, 0, 0, 0)
  const mondayISO = monday.toISOString()

  const { data: briefs } = await supabase
    .from('briefs')
    .select('user_id')
    .in('user_id', userIds)
    .eq('type', 'outreach')
    .gte('created_at', mondayISO)

  const outreachCountByUser = new Map<string, number>()
  for (const b of (briefs ?? [])) {
    outreachCountByUser.set(b.user_id, (outreachCountByUser.get(b.user_id) ?? 0) + 1)
  }

  let sent = 0
  for (const p of activeProfiles) {
    if (!activeUserIds.has(p.user_id)) continue
    const email = emailByUserId.get(p.user_id)
    if (!email) continue
    const goal = (p as unknown as { weekly_goal?: number | null }).weekly_goal!
    const done = outreachCountByUser.get(p.user_id) ?? 0
    const firstName = p.full_name?.split(' ')[0] ?? 'there'
    const html = buildEmail(firstName, goal, done, p.user_id)
    await sendEmail({ to: email, subject: `${done} of ${goal} this week`, html })
    sent++
  }

  return NextResponse.json({ sent })
}
