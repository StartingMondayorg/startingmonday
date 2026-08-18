import { type NextRequest, NextResponse } from 'next/server'
import { validateCronRequest } from '@/lib/cron-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email'
import { APP_URL } from '@/lib/config'
import { unsubscribeUrl } from '@/lib/unsubscribe-token'

type StallPattern = {
  headline: string
  body: string
  actionLabel: string
  actionHref: string
}

function buildEmail(firstName: string, pattern: StallPattern, userId: string): string {
  const unsubUrl = unsubscribeUrl(userId)
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0">
<tr><td align="center" style="padding:40px 20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e2e8f0;">
<tr><td style="padding:32px 40px 24px;">
  <p style="margin:0 0 4px 0;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#f97316;">Starting Monday</p>
  <h1 style="margin:0 0 16px 0;font-size:20px;font-weight:700;color:#0f172a;line-height:1.3;">${pattern.headline}</h1>
  <p style="margin:0 0 20px 0;font-size:15px;color:#334155;line-height:1.7;">${firstName}, ${pattern.body}</p>
  <a href="${APP_URL}${pattern.actionHref}" style="display:inline-block;background:#0f172a;color:#ffffff;font-size:13px;font-weight:700;padding:12px 24px;border-radius:6px;text-decoration:none;">${pattern.actionLabel}</a>
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
  const since70d = new Date(Date.now() - 70 * 24 * 60 * 60 * 1000).toISOString()
  const since14d = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
  const since7d  = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString()

  // Active searchers: have search_started_at >= 14 days ago, not placed, not dismissed in last 7 days
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, search_started_at, positioning_summary, stall_nudge_dismissed_at')
    .not('search_started_at', 'is', null)
    .lte('search_started_at', since14d)
    .is('placed_at', null)

  if (!profiles || profiles.length === 0) return NextResponse.json({ sent: 0 })

  const eligibleProfiles = profiles.filter(p => {
    const dismissed = (p as unknown as { stall_nudge_dismissed_at?: string | null }).stall_nudge_dismissed_at
    if (!dismissed) return true
    return new Date(dismissed) < new Date(since7d)
  })

  if (eligibleProfiles.length === 0) return NextResponse.json({ sent: 0 })

  const userIds = eligibleProfiles.map(p => p.user_id)

  const { data: users } = await supabase
    .from('users')
    .select('id, email, subscription_status')
    .in('id', userIds)
    .in('subscription_status', ['active', 'trialing'])

  const activeUserIds = new Set((users ?? []).map(u => u.id))
  const emailByUserId = new Map((users ?? []).map(u => [u.id, u.email]))

  // Fetch activity data for stall pattern detection
  const [{ data: companies }, { data: contacts }, { data: recentBriefs }] = await Promise.all([
    supabase.from('companies').select('user_id, stage').in('user_id', userIds).is('archived_at', null),
    supabase.from('contacts').select('user_id, created_at').in('user_id', userIds).eq('status', 'active'),
    supabase.from('briefs').select('user_id, created_at').in('user_id', userIds).gte('created_at', since70d),
  ])

  const companiesByUser = new Map<string, { stage: string }[]>()
  for (const c of (companies ?? [])) {
    if (!companiesByUser.has(c.user_id)) companiesByUser.set(c.user_id, [])
    companiesByUser.get(c.user_id)!.push({ stage: c.stage })
  }

  const contactCountByUser = new Map<string, number>()
  for (const c of (contacts ?? [])) {
    contactCountByUser.set(c.user_id, (contactCountByUser.get(c.user_id) ?? 0) + 1)
  }

  const lastActivityByUser = new Map<string, Date>()
  for (const b of (recentBriefs ?? [])) {
    const d = new Date(b.created_at)
    const prev = lastActivityByUser.get(b.user_id)
    if (!prev || d > prev) lastActivityByUser.set(b.user_id, d)
  }
  for (const c of (contacts ?? [])) {
    const d = new Date(c.created_at)
    const prev = lastActivityByUser.get(c.user_id)
    if (!prev || d > prev) lastActivityByUser.set(c.user_id, d)
  }

  // Priority scoring: (days_in_search * 0.4) + (days_since_last_activity * 0.6)
  // Higher score = higher risk = processed first and gets most specific nudge
  function priorityScore(userId: string, searchStartedAt: string | null): number {
    const daysInSearch = searchStartedAt
      ? Math.floor((Date.now() - new Date(searchStartedAt).getTime()) / 86400000)
      : 0
    const lastActivity = lastActivityByUser.get(userId)
    const daysSinceActivity = lastActivity
      ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000)
      : daysInSearch
    return daysInSearch * 0.4 + daysSinceActivity * 0.6
  }

  const sortedProfiles = [...eligibleProfiles].sort(
    (a, b) => priorityScore(b.user_id, b.search_started_at) - priorityScore(a.user_id, a.search_started_at)
  )

  let sent = 0
  for (const p of sortedProfiles) {
    if (!activeUserIds.has(p.user_id)) continue
    const email = emailByUserId.get(p.user_id)
    if (!email) continue

    const firstName = p.full_name?.split(' ')[0] ?? 'there'
    const userCompanies = companiesByUser.get(p.user_id) ?? []
    const contactCount = contactCountByUser.get(p.user_id) ?? 0
    const lastActivity = lastActivityByUser.get(p.user_id)
    const daysSinceLast = lastActivity ? Math.floor((Date.now() - lastActivity.getTime()) / 86400000) : 999
    const hasAdvancedStage = userCompanies.some(c => ['interviewing', 'applied', 'offer'].includes(c.stage))
    const hasSummary = !!(p as unknown as { positioning_summary?: string | null }).positioning_summary
    const daysInSearch = p.search_started_at
      ? Math.floor((Date.now() - new Date(p.search_started_at).getTime()) / 86400000)
      : 0
    const isArc7 = daysInSearch >= 120

    let pattern: StallPattern | null = null

    if (userCompanies.length > 0 && contactCount === 0) {
      pattern = {
        headline: 'Companies tracked. No contacts added.',
        body: isArc7
          ? 'your search is four months in and no contacts are in the system. The list exists. The relationships are not being worked. That is the gap.'
          : 'your target list is built. Adding the people you know at these companies is usually what holds the first outreach back. Even one contact changes the shape of the conversation.',
        actionLabel: 'Add a contact →',
        actionHref: '/dashboard/contacts',
      }
    } else if (contactCount > 0 && !hasAdvancedStage && daysSinceLast >= 14) {
      pattern = {
        headline: isArc7 ? 'Four months in. Nothing has advanced.' : 'No activity in two weeks.',
        body: isArc7
          ? 'a search this long with no stage advances usually means positioning or targeting needs recalibration. A strategy brief will name what is wrong.'
          : hasSummary
            ? 'you have contacts to work but nothing has moved. A strategy brief will surface where the gap is.'
            : 'you have contacts to work but no positioning summary. That is usually what holds the first outreach back. Not knowing what to say.',
        actionLabel: 'Run strategy brief →',
        actionHref: '/dashboard/strategy',
      }
    } else if (userCompanies.length > 0 && !hasAdvancedStage && daysSinceLast >= 21) {
      pattern = {
        headline: isArc7 ? 'Nothing has moved in four months.' : 'Nothing has moved in three weeks.',
        body: isArc7
          ? 'every company is still at watching or researching after four months. The target list or the outreach approach needs to change. A strategy brief will diagnose which.'
          : 'every company is still at watching or researching. Either the target list needs narrowing, or the outreach has not started. Both are diagnosable.',
        actionLabel: 'Run a strategy brief →',
        actionHref: '/dashboard/strategy',
      }
    }

    if (!pattern) continue

    const html = buildEmail(firstName, pattern, p.user_id)
    await sendEmail({ to: email, subject: pattern.headline, html })
    sent++
  }

  return NextResponse.json({ sent })
}
