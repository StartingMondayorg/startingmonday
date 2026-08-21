import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { Alert, AlertDescription, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type OutreachLogRow = {
  sent_at: string
  delivery_status: string | null
  outreach_channel: string | null
  send_mode: string | null
  recipient_email: string | null
  recipient_name: string | null
  subject: string | null
  webhook_payload?: {
    template_source?: string | null
    campaign_step?: string | null
    template_step?: string | null
  } | null
}

type ContactRow = {
  outreach_status: string | null
}

type SocialPostRow = {
  post_date: string
  is_posted: boolean
  notes: string | null
  like_count: number
  comment_count: number
  impression_count: number
  engagement_synced_at: string | null
  linkedin_post_urn: string | null
}

type UserRow = {
  id: string
  email: string | null
  created_at: string
  subscription_status: string
  subscription_tier: string | null
  signup_source: string | null
}

function channelLabel(value: string | null): string {
  const map: Record<string, string> = {
    executives: 'Executives',
    search_firms: 'Search Firms',
    coaches: 'Coaches',
    outplacement_firms: 'Outplacement',
  }
  return map[value ?? ''] ?? (value ?? 'Unknown')
}

function parseEngagementFromNotes(notes: string | null): { likes: number; comments: number } | null {
  if (!notes) return null
  const likesMatch = notes.match(/(\d+)\s*likes?/i)
  const commentsMatch = notes.match(/(\d+)\s*comments?/i)
  if (!likesMatch && !commentsMatch) return null
  return {
    likes: likesMatch ? Number(likesMatch[1]) : 0,
    comments: commentsMatch ? Number(commentsMatch[1]) : 0,
  }
}

export default async function OutreachAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const now = new Date()
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: outreach7d },
    { data: outreach30d },
    { data: contacts },
    { data: socialPosts },
    { data: newUsers30d },
    { count: trialingCount },
    { count: activeCount },
    { count: activeMonitorCount },
    { count: activeSearchCount },
    { count: activeExecutiveCount },
  ] = await Promise.all([
    admin
      .from('outreach_logs')
      .select('sent_at, delivery_status, outreach_channel, send_mode, recipient_email, recipient_name, subject, webhook_payload')
      .gte('sent_at', since7d)
      .order('sent_at', { ascending: false })
      .limit(5000),
    admin
      .from('outreach_logs')
      .select('sent_at, delivery_status, outreach_channel, send_mode, recipient_email, recipient_name, subject, webhook_payload')
      .gte('sent_at', since30d)
      .order('sent_at', { ascending: false })
      .limit(5000),
    admin
      .from('contacts')
      .select('outreach_status')
      .eq('status', 'active')
      .limit(10000),
    admin
      .from('social_posts')
      .select('post_date, is_posted, notes, like_count, comment_count, impression_count, engagement_synced_at, linkedin_post_urn')
      .gte('post_date', since30d.slice(0, 10))
      .order('post_date', { ascending: true })
      .limit(200),
    admin
      .from('users')
      .select('id, email, created_at, subscription_status, subscription_tier, signup_source')
      .gte('created_at', since30d)
      .order('created_at', { ascending: false })
      .limit(5000),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'trialing'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').eq('subscription_tier', 'passive'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').eq('subscription_tier', 'active'),
    admin.from('users').select('id', { count: 'exact', head: true }).eq('subscription_status', 'active').eq('subscription_tier', 'executive'),
  ])

  const typed7d = (outreach7d ?? []) as unknown as OutreachLogRow[]
  const typed30d = (outreach30d ?? []) as unknown as OutreachLogRow[]
  const typedContacts = (contacts ?? []) as ContactRow[]
  const typedSocial = (socialPosts ?? []) as unknown as SocialPostRow[]
  const typedUsers30d = (newUsers30d ?? []) as UserRow[]

  const live7d = typed7d.filter(r => r.send_mode === 'live')
  const delivered7d = live7d.filter(r => r.delivery_status === 'email.delivered').length
  const bounced7d = live7d.filter(r => r.delivery_status === 'email.bounced' || r.delivery_status === 'email.complained').length
  const sent7d = live7d.length
  const unconfirmed7d = live7d.filter(r => r.delivery_status === 'sent' && r.sent_at < since24h).length
  const deliveryRate7d = sent7d > 0 ? Math.round((delivered7d / sent7d) * 100) : 0

  const channelMap = new Map<string, { sent: number; delivered: number; bounced: number }>()
  for (const row of live7d) {
    const key = row.outreach_channel ?? 'unknown'
    const agg = channelMap.get(key) ?? { sent: 0, delivered: 0, bounced: 0 }
    agg.sent += 1
    if (row.delivery_status === 'email.delivered') agg.delivered += 1
    if (row.delivery_status === 'email.bounced' || row.delivery_status === 'email.complained') agg.bounced += 1
    channelMap.set(key, agg)
  }
  const channelRows = Array.from(channelMap.entries())
    .map(([channel, values]) => ({ channel, ...values }))
    .sort((a, b) => b.sent - a.sent)

  const byStatus = {
    prospect: typedContacts.filter(c => (c.outreach_status ?? 'prospect') === 'prospect').length,
    reached_out: typedContacts.filter(c => c.outreach_status === 'reached_out').length,
    in_conversation: typedContacts.filter(c => c.outreach_status === 'in_conversation').length,
    meeting_scheduled: typedContacts.filter(c => c.outreach_status === 'meeting_scheduled').length,
    closed: typedContacts.filter(c => c.outreach_status === 'closed').length,
  }

  const contactedTotal = byStatus.reached_out + byStatus.in_conversation + byStatus.meeting_scheduled + byStatus.closed
  const responsesTotal = byStatus.in_conversation + byStatus.meeting_scheduled
  const responseRate = contactedTotal > 0 ? Math.round((responsesTotal / contactedTotal) * 100) : 0
  const meetingRate = contactedTotal > 0 ? Math.round((byStatus.meeting_scheduled / contactedTotal) * 100) : 0

  const postedSocial = typedSocial.filter(p => p.is_posted)
  const postsWithUrn = postedSocial.filter(p => p.linkedin_post_urn)
  const postsSynced = postedSocial.filter(p => p.engagement_synced_at)
  const totalLikes = postedSocial.reduce((sum, p) => sum + (p.like_count ?? 0), 0)
  const totalComments = postedSocial.reduce((sum, p) => sum + (p.comment_count ?? 0), 0)
  const totalImpressions = postedSocial.reduce((sum, p) => sum + (p.impression_count ?? 0), 0)
  const avgEngagementRate = postsSynced.length > 0
    ? Math.round(postsSynced.reduce((sum, p) => {
        const imp = p.impression_count ?? 0
        if (imp === 0) return sum
        return sum + ((p.like_count + p.comment_count) / imp) * 100
      }, 0) / postsSynced.filter(p => (p.impression_count ?? 0) > 0).length * 10) / 10
    : 0

  // Engagement trend chart data (last 30d posted, ascending order)
  const chartPosts = postedSocial.slice(-20)
  const maxEngagement = Math.max(...chartPosts.map(p => (p.like_count ?? 0) + (p.comment_count ?? 0)), 1)

  // Fallback: parse manual notes only when API data not yet synced
  let parsedLikes = 0
  let parsedComments = 0
  let parsedEngagementPosts = 0
  const unsynced = postedSocial.filter(p => !p.engagement_synced_at)
  for (const post of unsynced) {
    const parsed = parseEngagementFromNotes(post.notes)
    if (!parsed) continue
    parsedEngagementPosts += 1
    parsedLikes += parsed.likes
    parsedComments += parsed.comments
  }

  const newTrialUsers30d = typedUsers30d.filter(u => u.subscription_status === 'trialing').length
  const newPaidUsers30d = typedUsers30d.filter(u => u.subscription_status === 'active').length
  const newPaidByTier = {
    monitor: typedUsers30d.filter(u => u.subscription_status === 'active' && u.subscription_tier === 'passive').length,
    search: typedUsers30d.filter(u => u.subscription_status === 'active' && u.subscription_tier === 'active').length,
    executive: typedUsers30d.filter(u => u.subscription_status === 'active' && u.subscription_tier === 'executive').length,
  }

  const outreachEmails30d = new Set(
    typed30d
      .filter(r => r.send_mode === 'live')
      .map(r => (r.recipient_email ?? '').trim().toLowerCase())
      .filter(Boolean),
  )

  const outreachAttributed30d = typedUsers30d.filter(u => {
    const email = (u.email ?? '').trim().toLowerCase()
    return email && outreachEmails30d.has(email)
  }).length

  const topSignupSources = Object.entries(
    typedUsers30d.reduce<Record<string, number>>((acc, userRow) => {
      const source = (userRow.signup_source ?? 'direct').trim() || 'direct'
      acc[source] = (acc[source] ?? 0) + 1
      return acc
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  const recentFailures = live7d
    .filter(r => r.delivery_status === 'email.bounced' || r.delivery_status === 'email.complained')
    .slice(0, 20)

  const bulkFollowups30d = typed30d
    .filter(r => r.send_mode === 'live')
    .filter(r => (r.webhook_payload?.campaign_step ?? '') === 'followup_bulk_v1')

  const followupTemplateCounts = bulkFollowups30d.reduce<Record<string, number>>((acc, row) => {
    const source = (row.webhook_payload?.template_source ?? 'unknown').trim() || 'unknown'
    acc[source] = (acc[source] ?? 0) + 1
    return acc
  }, {})

  const latestTemplateCount = followupTemplateCounts.latest_template_engine ?? 0
  const customInputCount = followupTemplateCounts.custom_input ?? 0
  const unknownTemplateCount = followupTemplateCounts.unknown ?? 0
  const latestTemplateRate = bulkFollowups30d.length > 0
    ? Math.round((latestTemplateCount / bulkFollowups30d.length) * 100)
    : 0

  const followupTemplateRows = bulkFollowups30d.slice(0, 20)

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground transition-colors">Admin</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
<div>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Outreach Performance</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">Outbound metrics and growth.</p>
        </div>

        <section id="kpis" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Live Sends (7d)</h2>
            <p className="text-[24px] font-bold text-foreground">{sent7d}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Delivery rate: {deliveryRate7d}%</p>
          </Card>
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Delivery Issues (7d)</h2>
            <p className="text-[24px] font-bold text-foreground">{bounced7d + unconfirmed7d}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Bounced: {bounced7d} · Unconfirmed: {unconfirmed7d}</p>
          </Card>
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Response Rate</h2>
            <p className="text-[24px] font-bold text-foreground">{responseRate}%</p>
            <p className="text-[13px] text-muted-foreground mt-1">Conversations + meetings / contacted</p>
          </Card>
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Meetings Set Rate</h2>
            <p className="text-[24px] font-bold text-foreground">{meetingRate}%</p>
            <p className="text-[13px] text-muted-foreground mt-1">Meetings / contacted prospects</p>
          </Card>
        </section>

        <section id="outreach-funnel" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Outreach Funnel</h2>
            </div>
            <div className="px-5 py-4 text-[13px] text-muted-foreground grid grid-cols-2 gap-y-2">
              <div>Prospects</div><div className="font-semibold text-right">{byStatus.prospect}</div>
              <div>Reached out</div><div className="font-semibold text-right">{byStatus.reached_out}</div>
              <div>In conversation</div><div className="font-semibold text-right">{byStatus.in_conversation}</div>
              <div>Meetings scheduled</div><div className="font-semibold text-right">{byStatus.meeting_scheduled}</div>
              <div>Closed</div><div className="font-semibold text-right">{byStatus.closed}</div>
            </div>
          </Card>

          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Sends by Channel (7d)</h2>
            </div>
            <div className="px-5 py-4">
              {channelRows.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No live sends in the last 7 days.</p>
              ) : (
                <Table className="text-[13px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Channel</TableHead>
                      <TableHead className="text-right text-muted-foreground">Sent</TableHead>
                      <TableHead className="text-right text-muted-foreground">Delivered</TableHead>
                      <TableHead className="text-right text-muted-foreground">Bounced</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {channelRows.map(row => (
                      <TableRow key={row.channel}>
                        <TableCell className="text-muted-foreground">{channelLabel(row.channel)}</TableCell>
                        <TableCell className="text-right text-foreground font-semibold">{row.sent}</TableCell>
                        <TableCell className="text-right text-foreground font-semibold">{row.delivered}</TableCell>
                        <TableCell className="text-right text-foreground font-semibold">{row.bounced}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </section>

        <section id="customer-growth" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">New Customers (30d)</h2>
            </div>
            <div className="px-5 py-4 text-[13px] text-muted-foreground grid grid-cols-2 gap-y-2">
              <div>New trial users</div><div className="font-semibold text-right">{newTrialUsers30d}</div>
              <div>New paid users</div><div className="font-semibold text-right">{newPaidUsers30d}</div>
              <div>New paid · Monitor</div><div className="font-semibold text-right">{newPaidByTier.monitor}</div>
              <div>New paid · Search</div><div className="font-semibold text-right">{newPaidByTier.search}</div>
              <div>New paid · Executive</div><div className="font-semibold text-right">{newPaidByTier.executive}</div>
              <div>Potential outreach-attributed signups</div><div className="font-semibold text-right">{outreachAttributed30d}</div>
            </div>
            <div className="px-5 pb-4 text-[13px] text-muted-foreground">Outreach attribution is email-match based and directional.</div>
          </Card>

          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Current Customer Base</h2>
            </div>
            <div className="px-5 py-4 text-[13px] text-muted-foreground grid grid-cols-2 gap-y-2">
              <div>Trialing now</div><div className="font-semibold text-right">{trialingCount ?? 0}</div>
              <div>Active paid now</div><div className="font-semibold text-right">{activeCount ?? 0}</div>
              <div>Active · Monitor</div><div className="font-semibold text-right">{activeMonitorCount ?? 0}</div>
              <div>Active · Search</div><div className="font-semibold text-right">{activeSearchCount ?? 0}</div>
              <div>Active · Executive</div><div className="font-semibold text-right">{activeExecutiveCount ?? 0}</div>
            </div>

            <div className="px-5 pb-4">
              <p className="text-[13px] text-muted-foreground mb-2">Top signup sources (30d)</p>
              <div className="flex flex-wrap gap-2">
                {topSignupSources.length === 0 ? (
                  <span className="text-[13px] text-muted-foreground">No recent signups.</span>
                ) : topSignupSources.map(([source, count]) => (
                  <Badge key={source} variant="secondary">{source}: {count}</Badge>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <section id="linkedin-engagement" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">LinkedIn Engagement (30d)</h2>
              {postsSynced.length > 0 && (
                <Badge variant="success">API synced</Badge>
              )}
            </div>
            <div className="px-5 py-4 text-[13px] text-muted-foreground grid grid-cols-2 gap-y-2">
              <div>Posts published</div><div className="font-semibold text-right">{postedSocial.length}</div>
              <div>Posts with LinkedIn URN</div><div className="font-semibold text-right">{postsWithUrn.length}</div>
              <div>Posts with API engagement</div><div className="font-semibold text-right">{postsSynced.length}</div>
              <div>Total likes</div><div className="font-semibold text-right">{totalLikes + parsedLikes}</div>
              <div>Total comments</div><div className="font-semibold text-right">{totalComments + parsedComments}</div>
              {totalImpressions > 0 && (
                <>
                  <div>Total impressions</div><div className="font-semibold text-right">{totalImpressions.toLocaleString()}</div>
                  <div>Avg engagement rate</div><div className="font-semibold text-right">{avgEngagementRate}%</div>
                </>
              )}
              {parsedEngagementPosts > 0 && (
                <>
                  <div className="text-muted-foreground">Manual notes (unsynced)</div>
                  <div className="font-semibold text-right text-muted-foreground">{parsedEngagementPosts} posts</div>
                </>
              )}
            </div>
            {postsWithUrn.length === 0 && (
              <div className="px-5 pb-4">
                <Alert variant="warning">
                  <AlertDescription>
                    No LinkedIn URNs stored yet. Update your Make.com scenario to return{' '}
                    <code className="font-mono">&#123;&quot;linkedin_post_urn&quot;: &quot;urn:li:ugcPost:...&quot;&#125;</code>{' '}
                    in the HTTP response module, then add <code className="font-mono">LINKEDIN_ACCESS_TOKEN</code> to env.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {postsWithUrn.length > 0 && postsSynced.length === 0 && (
              <div className="px-5 pb-4">
                <Alert variant="warning">
                  <AlertDescription>
                    URNs stored but no sync yet. Add <code className="font-mono">LINKEDIN_ACCESS_TOKEN</code> env var
                    (requires <code className="font-mono">r_member_social</code> or <code className="font-mono">r_organization_social</code> scope).
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </Card>

          {/* Engagement trend bar chart - inline SVG, no client bundle needed */}
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Engagement Trend (last 20 posts)</h2>
            </div>
            <div className="px-5 py-5">
              {chartPosts.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No posted data yet.</p>
              ) : (
                <svg viewBox={`0 0 ${chartPosts.length * 22} 80`} className="w-full h-20">
                  {chartPosts.map((p, i) => {
                    const total = (p.like_count ?? 0) + (p.comment_count ?? 0)
                    const likeH = Math.round(((p.like_count ?? 0) / maxEngagement) * 64)
                    const commentH = Math.round(((p.comment_count ?? 0) / maxEngagement) * 64)
                    const barH = Math.max(likeH + commentH, total > 0 ? 2 : 0)
                    const x = i * 22 + 3
                    return (
                      <g key={p.post_date}>
                        {barH > 0 && (
                          <>
                            <rect x={x} y={72 - likeH} width={16} height={likeH} fill="#6366f1" rx={2} />
                            <rect x={x} y={72 - likeH - commentH} width={16} height={commentH} fill="#f97316" rx={2} />
                          </>
                        )}
                        {barH === 0 && (
                          <rect x={x} y={71} width={16} height={1} fill="#e2e8f0" />
                        )}
                        <text x={x + 8} y={80} textAnchor="middle" fontSize={7} fill="#94a3b8">
                          {p.post_date.slice(5)}
                        </text>
                      </g>
                    )
                  })}
                </svg>
              )}
              <div className="flex items-center gap-4 mt-2">
                <Badge variant="outline" className="text-[13px] text-muted-foreground gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-info" />Likes
                </Badge>
                <Badge variant="outline" className="text-[13px] text-muted-foreground gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-primary" />Comments
                </Badge>
                {postsSynced.length === 0 && (
                  <span className="text-[13px] text-muted-foreground ml-auto">Awaiting API sync</span>
                )}
              </div>
            </div>
          </Card>
        </section>

        <section id="delivery-failures" className="grid grid-cols-1 gap-4">
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Recent Delivery Failures (7d)</h2>
            </div>
            <div className="px-5 py-4">
              {recentFailures.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No bounced or complaint events in the last 7 days.</p>
              ) : (
                <Table className="text-[13px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Recipient</TableHead>
                      <TableHead className="text-muted-foreground">Channel</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentFailures.map((row, idx) => (
                      <TableRow key={`${row.recipient_email ?? 'na'}-${idx}`}>
                        <TableCell className="text-muted-foreground">{row.recipient_name || row.recipient_email || 'Unknown'}</TableCell>
                        <TableCell className="text-muted-foreground">{channelLabel(row.outreach_channel)}</TableCell>
                        <TableCell className="text-foreground font-semibold">{row.delivery_status ?? 'unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </section>

        <section id="followup-template-source" className="grid grid-cols-1 gap-4">
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Follow-up Template Source Verification (30d)</h2>
            </div>
            <div className="px-5 py-4 text-[13px] text-muted-foreground grid grid-cols-2 lg:grid-cols-4 gap-y-2">
              <div>Total bulk follow-up sends</div><div className="font-semibold text-right">{bulkFollowups30d.length}</div>
              <div>Latest template engine</div><div className="font-semibold text-right">{latestTemplateCount}</div>
              <div>Custom input</div><div className="font-semibold text-right">{customInputCount}</div>
              <div>Unknown source</div><div className="font-semibold text-right">{unknownTemplateCount}</div>
              <div>Latest-template rate</div><div className="font-semibold text-right">{latestTemplateRate}%</div>
            </div>
            <div className="px-5 pb-4 text-[13px] text-muted-foreground">
              Bulk follow-up sends are expected to use template_source latest_template_engine.
            </div>
          </Card>

          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Recent Bulk Follow-up Template Source Rows</h2>
            </div>
            <div className="px-5 py-4">
              {followupTemplateRows.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No bulk follow-up live sends found in the last 30 days.</p>
              ) : (
                <Table className="text-[13px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Recipient</TableHead>
                      <TableHead className="text-muted-foreground">Channel</TableHead>
                      <TableHead className="text-muted-foreground">Template Source</TableHead>
                      <TableHead className="text-muted-foreground">Template Step</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followupTemplateRows.map((row, idx) => (
                      <TableRow key={`${row.recipient_email ?? 'na'}-${idx}`}>
                        <TableCell className="text-muted-foreground">{row.recipient_name || row.recipient_email || 'Unknown'}</TableCell>
                        <TableCell className="text-muted-foreground">{channelLabel(row.outreach_channel)}</TableCell>
                        <TableCell className="text-foreground font-semibold">{row.webhook_payload?.template_source ?? 'unknown'}</TableCell>
                        <TableCell className="text-muted-foreground">{row.webhook_payload?.template_step ?? 'n/a'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/dashboard/outreach">
            <Card variant="default" className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open Outreach Hub</p>
              <p className="text-[13px] text-muted-foreground mt-1">Manage queue, send messages, and update statuses.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin/social">
            <Card variant="default" className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open LinkedIn Social</p>
              <p className="text-[13px] text-muted-foreground mt-1">Review drafts, posting history, and engagement notes.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin/customers">
            <Card variant="default" className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open Customers</p>
              <p className="text-[13px] text-muted-foreground mt-1">Inspect trial and paid customer details.</p>
            </Card>
          </Link>
        </section>
      </main>
    </div>
  )
}


