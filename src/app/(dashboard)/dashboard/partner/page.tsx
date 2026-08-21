import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inferPartnerProgramFromTier, toPercent, type PartnerProgram } from '@/lib/partner-kpi-schema'
import { TIER_DISPLAY_NAMES } from '@/lib/billing/pricing'
import { Badge, Button, Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { SeatPurchase } from './seat-purchase'
import { ExportCsvButton } from './ExportCsvButton'


const TIER_MRR: Record<string, number> = {
  passive:   49,
  active:   199,
  executive: 499,
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://startingmonday.app'

const RANGE_OPTIONS = [
  { value: '7d', label: 'Last 7 days', days: 7 },
  { value: '30d', label: 'Last 30 days', days: 30 },
  { value: '90d', label: 'Last 90 days', days: 90 },
] as const

function parseRange(value: string | undefined): (typeof RANGE_OPTIONS)[number] {
  const found = RANGE_OPTIONS.find((option) => option.value === value)
  return found ?? RANGE_OPTIONS[1]
}

function toCohortKey(isoDate: string): string {
  const dt = new Date(isoDate)
  if (Number.isNaN(dt.getTime())) return 'unknown'
  const month = String(dt.getUTCMonth() + 1).padStart(2, '0')
  return `${dt.getUTCFullYear()}-${month}`
}

function mondayKey(isoDate: string): string {
  const dt = new Date(isoDate)
  if (Number.isNaN(dt.getTime())) return 'unknown'
  const day = dt.getUTCDay()
  const diffToMonday = (day + 6) % 7
  const monday = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate() - diffToMonday))
  return monday.toISOString().slice(0, 10)
}

function formatPct(value: number): string {
  return `${value.toFixed(1)}%`
}

type SearchParams = {
  program?: string
  cohort?: string
  range?: string
}

export default async function PartnerDashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const selectedRange = parseRange(filters.range)
  const selectedProgram = (filters.program ?? 'all').trim().toLowerCase()
  const selectedCohort = (filters.cohort ?? 'all').trim()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Check if this user is a registered partner
  const { data: partner } = await admin
    .from('partners')
    .select('id, name, referral_code, commission_pct, created_at, seats_purchased, user_id, is_active, email')
    .eq('email', user.email ?? '')
    .eq('is_active', true)
    .maybeSingle()

  if (!partner) notFound()

  // Self-register user_id on partner record if not yet set
  if (!partner.user_id) {
    await admin.from('partners').update({ user_id: user.id }).eq('id', partner.id)
  }

  const referralLink = `${APP_URL}/signup?ref=${partner.referral_code}`

  // Fetch seat count for coach seat section
  const { count: seatsUsed } = await admin
    .from('team_seats')
    .select('id', { count: 'exact', head: true })
    .eq('owner_id', user.id)

  // Fetch attributions with subscription info
  const { data: attributions } = await admin
    .from('referral_attributions')
    .select('signup_user_id, attributed_at')
    .eq('partner_id', partner.id)
    .order('attributed_at', { ascending: false })

  const attributedUserIds = (attributions ?? []).map(a => a.signup_user_id)

  let subscriberRows: {
    id: string
    subscription_status: string
    subscription_tier: string | null
    created_at: string
  }[] = []
  if (attributedUserIds.length > 0) {
    const { data: users } = await admin
      .from('users')
      .select('id, subscription_status, subscription_tier, created_at')
      .in('id', attributedUserIds)
    subscriberRows = (users ?? []) as typeof subscriberRows
  }

  const totalReferred = subscriberRows.length
  const activeSubscribers = subscriberRows.filter(u => u.subscription_status === 'active')
  const attributedMRR = activeSubscribers.reduce((sum, u) => {
    return sum + (TIER_MRR[u.subscription_tier ?? ''] ?? 0)
  }, 0)
  const estimatedCommission = Math.round(attributedMRR * partner.commission_pct / 100)

  // Build display rows (anonymous - no emails)
  const attrByUserId = Object.fromEntries(
    (attributions ?? []).map(a => [a.signup_user_id, a.attributed_at])
  )
  const displayRows = subscriberRows.map(u => ({
    userId: u.id,
    joinedDate: attrByUserId[u.id] ?? u.created_at,
    tier: u.subscription_tier ?? 'free',
    program: inferPartnerProgramFromTier(u.subscription_tier),
    cohort: toCohortKey(u.created_at),
    status: u.subscription_status,
  })).sort((a, b) => new Date(b.joinedDate).getTime() - new Date(a.joinedDate).getTime())

  const cohortOptions = Array.from(new Set(displayRows.map((row) => row.cohort))).sort((a, b) => (a < b ? 1 : -1))
  const programOptions: PartnerProgram[] = ['intelligence', 'active', 'executive', 'free']

  const scopedRows = displayRows.filter((row) => {
    if (selectedProgram !== 'all' && row.program !== selectedProgram) return false
    if (selectedCohort !== 'all' && row.cohort !== selectedCohort) return false
    return true
  })

  const scopedUserIds = new Set(scopedRows.map((row) => row.userId))

  const now = Date.now()
  const currentWindowStart = new Date(now - selectedRange.days * 24 * 60 * 60 * 1000)
  const previousWindowStart = new Date(now - selectedRange.days * 2 * 24 * 60 * 60 * 1000)
  const trendStart = new Date(now - 56 * 24 * 60 * 60 * 1000)

  const scopedIds = Array.from(scopedUserIds)

  let eventRows: Array<{ user_id: string; created_at: string }> = []
  let prepRowsCurrent: Array<{ user_id: string; created_at: string }> = []
  let followupRowsCurrent: Array<{ user_id: string; status: string | null; created_at: string }> = []
  let pipelineRowsCurrent: Array<{ user_id: string; sent_at: string }> = []
  let trendEvents: Array<{ user_id: string; created_at: string }> = []

  if (scopedIds.length > 0) {
    const [eventsRes, prepRes, followupRes, pipelineRes, trendRes] = await Promise.all([
      admin
        .from('user_events')
        .select('user_id,created_at')
        .in('user_id', scopedIds)
        .gte('created_at', previousWindowStart.toISOString())
        .limit(100000),
      admin
        .from('briefs')
        .select('user_id,created_at')
        .in('user_id', scopedIds)
        .in('type', ['prep', 'prep_section'])
        .gte('created_at', previousWindowStart.toISOString())
        .limit(100000),
      admin
        .from('follow_ups')
        .select('user_id,status,created_at')
        .in('user_id', scopedIds)
        .gte('created_at', previousWindowStart.toISOString())
        .limit(100000),
      admin
        .from('outreach_logs')
        .select('user_id,sent_at')
        .in('user_id', scopedIds)
        .gte('sent_at', previousWindowStart.toISOString())
        .limit(100000),
      admin
        .from('user_events')
        .select('user_id,created_at')
        .in('user_id', scopedIds)
        .gte('created_at', trendStart.toISOString())
        .limit(100000),
    ])

    eventRows = (eventsRes.data ?? []) as typeof eventRows
    prepRowsCurrent = (prepRes.data ?? []) as typeof prepRowsCurrent
    followupRowsCurrent = (followupRes.data ?? []) as typeof followupRowsCurrent
    pipelineRowsCurrent = (pipelineRes.data ?? []) as typeof pipelineRowsCurrent
    trendEvents = (trendRes.data ?? []) as typeof trendEvents
  }

  const currentEventsUsers = new Set(
    eventRows.filter((row) => new Date(row.created_at) >= currentWindowStart).map((row) => row.user_id),
  )
  const previousEventsUsers = new Set(
    eventRows
      .filter((row) => new Date(row.created_at) >= previousWindowStart && new Date(row.created_at) < currentWindowStart)
      .map((row) => row.user_id),
  )

  const currentPrepUsers = new Set(
    prepRowsCurrent.filter((row) => new Date(row.created_at) >= currentWindowStart).map((row) => row.user_id),
  )
  const previousPrepUsers = new Set(
    prepRowsCurrent
      .filter((row) => new Date(row.created_at) >= previousWindowStart && new Date(row.created_at) < currentWindowStart)
      .map((row) => row.user_id),
  )

  const completedStatuses = new Set(['done', 'completed', 'sent'])
  const currentFollowupUsers = new Set(
    followupRowsCurrent
      .filter((row) => new Date(row.created_at) >= currentWindowStart && completedStatuses.has((row.status ?? '').toLowerCase()))
      .map((row) => row.user_id),
  )
  const previousFollowupUsers = new Set(
    followupRowsCurrent
      .filter((row) => {
        const created = new Date(row.created_at)
        return created >= previousWindowStart && created < currentWindowStart && completedStatuses.has((row.status ?? '').toLowerCase())
      })
      .map((row) => row.user_id),
  )

  const currentPipelineUsers = new Set(
    pipelineRowsCurrent.filter((row) => new Date(row.sent_at) >= currentWindowStart).map((row) => row.user_id),
  )
  const previousPipelineUsers = new Set(
    pipelineRowsCurrent
      .filter((row) => {
        const sent = new Date(row.sent_at)
        return sent >= previousWindowStart && sent < currentWindowStart
      })
      .map((row) => row.user_id),
  )

  const denominator = scopedIds.length
  const utilizationRate = toPercent(currentEventsUsers.size, denominator)
  const prepCompletionRate = toPercent(currentPrepUsers.size, denominator)
  const followupCompletionRate = toPercent(currentFollowupUsers.size, denominator)
  const pipelineMovementRate = toPercent(currentPipelineUsers.size, denominator)

  const utilizationDelta = utilizationRate - toPercent(previousEventsUsers.size, denominator)
  const prepCompletionDelta = prepCompletionRate - toPercent(previousPrepUsers.size, denominator)
  const followupCompletionDelta = followupCompletionRate - toPercent(previousFollowupUsers.size, denominator)
  const pipelineMovementDelta = pipelineMovementRate - toPercent(previousPipelineUsers.size, denominator)

  const weeklyMap = new Map<string, { users: Set<string>; events: number }>()
  for (const row of trendEvents) {
    const week = mondayKey(row.created_at)
    if (week === 'unknown') continue
    const existing = weeklyMap.get(week)
    if (existing) {
      existing.users.add(row.user_id)
      existing.events += 1
    } else {
      weeklyMap.set(week, { users: new Set([row.user_id]), events: 1 })
    }
  }

  const weeklyUsageRows = Array.from(weeklyMap.entries())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .slice(0, 8)
    .map(([week, value]) => ({
      week,
      active_users: value.users.size,
      events: value.events,
      active_rate: toPercent(value.users.size, denominator),
    }))

  function formatDelta(value: number): string {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)} pts`
  }

  const tierLabel = TIER_DISPLAY_NAMES
  const statusBadgeVariant: Record<string, 'success' | 'warning' | 'secondary'> = {
    active: 'success',
    trialing: 'warning',
    inactive: 'secondary',
    free: 'secondary',
  }

  // CSV export rows
  const csvRows = displayRows.map(row => ({
    joinedDate: row.joinedDate,
    tier: row.tier,
    status: row.status,
    mrr: row.status === 'active' ? (TIER_MRR[row.tier] ?? 0) : 0,
    commission: row.status === 'active' ? Math.round((TIER_MRR[row.tier] ?? 0) * partner.commission_pct / 100) : 0,
  }))

  // Use a client component for the export button
  // ...existing code...
  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground transition-colors">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Partner Dashboard</h2>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Welcome, {partner.name.split(' ')[0]}.</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Partner since {new Date(partner.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
            Commission rate: {partner.commission_pct}%.
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <h2 className="sr-only">Quick actions</h2>
          <Card variant="default" className="p-0 hover:border-border transition-colors">
            <Link href="/partners#apply" className="block p-4">
              <p className="text-[13px] font-semibold text-foreground">Partnership terms</p>
              <p className="text-[13px] text-muted-foreground mt-1">Review partner program details and commission rules.</p>
            </Link>
          </Card>
          <Card variant="default" className="p-0 hover:border-border transition-colors">
            <Link href="/dashboard/admin/customers" className="block p-4">
              <p className="text-[13px] font-semibold text-foreground">Open customers</p>
              <p className="text-[13px] text-muted-foreground mt-1">Inspect converted subscribers and plan mix.</p>
            </Link>
          </Card>
          <Card variant="default" className="p-0 hover:border-border transition-colors">
            <Link href="/dashboard" className="block p-4">
              <p className="text-[13px] font-semibold text-foreground">Back to dashboard</p>
              <p className="text-[13px] text-muted-foreground mt-1">Return to your main campaign workspace.</p>
            </Link>
          </Card>
        </section>

        {/* Stats */}
        <section id="partner-stats" className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total referred',       value: String(totalReferred) },
            { label: 'Active subscribers',   value: String(activeSubscribers.length) },
            { label: 'Est. commission / mo', value: estimatedCommission > 0 ? `$${estimatedCommission}` : '$0' },
          ].map(({ label, value }) => (
            <Card key={label} variant="default" className="p-5">
              <div className="text-[28px] font-bold text-foreground">{value}</div>
              <div className="text-[13px] text-muted-foreground mt-1">{label}</div>
            </Card>
          ))}
        </section>

        <Card variant="default" id="partner-performance" className="p-6 mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
            <div>
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Partner reporting dashboard v1</h2>
              <p className="text-[13px] text-muted-foreground">Utilization, prep completion, follow-up completion, and pipeline movement for pilot operations.</p>
            </div>
            <p className="text-[13px] text-muted-foreground">Scope users: {denominator}</p>
          </div>

          <form method="get" className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
            <label className="text-[13px] font-semibold text-muted-foreground">
              Partner account
              <Select name="partner" defaultValue="current" disabled>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">{partner.name}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="text-[13px] font-semibold text-muted-foreground">
              Program
              <Select name="program" defaultValue={selectedProgram}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All programs</SelectItem>
                  {programOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="text-[13px] font-semibold text-muted-foreground">
              Cohort
              <Select name="cohort" defaultValue={selectedCohort}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cohorts</SelectItem>
                  {cohortOptions.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <label className="text-[13px] font-semibold text-muted-foreground">
              Date range
              <Select name="range" defaultValue={selectedRange.value}>
                <SelectTrigger className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <Button type="submit" className="sm:col-span-4 w-full sm:w-auto">
              Apply filters
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Utilization', value: utilizationRate, delta: utilizationDelta },
              { label: 'Prep completion', value: prepCompletionRate, delta: prepCompletionDelta },
              { label: 'Follow-up completion', value: followupCompletionRate, delta: followupCompletionDelta },
              { label: 'Pipeline movement', value: pipelineMovementRate, delta: pipelineMovementDelta },
            ].map((metric) => (
              <Card key={metric.label} variant="default" className="p-3 bg-muted">
                <p className="text-[13px] font-semibold text-muted-foreground">{metric.label}</p>
                <p className="text-[24px] font-bold text-foreground mt-1">{formatPct(metric.value)}</p>
                <p className="text-[13px] text-muted-foreground mt-1">vs prior window: {formatDelta(metric.delta)}</p>
              </Card>
            ))}
          </div>

          <div className="border border-border rounded overflow-hidden">
            <div className="px-4 py-3 bg-muted border-b border-border">
              <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Weekly usage tracking</p>
            </div>
            {weeklyUsageRows.length === 0 ? (
              <p className="px-4 py-4 text-[13px] text-muted-foreground">No weekly usage data yet for this filter scope.</p>
            ) : (
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="bg-card border-b border-border">
                    <TableHead className="px-4 py-2 font-semibold text-muted-foreground">Week</TableHead>
                    <TableHead className="px-4 py-2 font-semibold text-muted-foreground">Active users</TableHead>
                    <TableHead className="px-4 py-2 font-semibold text-muted-foreground">Events</TableHead>
                    <TableHead className="px-4 py-2 font-semibold text-muted-foreground">Active rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {weeklyUsageRows.map((row) => (
                    <TableRow key={row.week}>
                      <TableCell className="px-4 py-2 text-muted-foreground">{row.week}</TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">{row.active_users}</TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">{row.events}</TableCell>
                      <TableCell className="px-4 py-2 text-muted-foreground">{formatPct(row.active_rate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>

        {/* Coach seats */}
        <SeatPurchase
          seatsPurchased={partner.seats_purchased ?? 0}
          seatsUsed={seatsUsed ?? 0}
        />

        {/* Referral link */}
        <Card variant="default" id="partner-referral-link" className="p-6 mb-6">
          <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Your referral link</h2>
          <div className="flex items-center gap-3 flex-wrap">
            <code className="flex-1 text-[13px] bg-muted border border-border rounded px-4 py-2.5 text-muted-foreground font-mono min-w-0 truncate">
              {referralLink}
            </code>
            <span className="text-[13px] font-bold bg-muted text-muted-foreground px-2.5 py-1 rounded font-mono">
              {partner.referral_code}
            </span>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">
            Share this link with your clients. When they sign up and convert to a paid plan, you earn {partner.commission_pct}% of their monthly subscription for as long as they remain active.
          </p>
        </Card>

        {/* Export CSV button */}
        <ExportCsvButton rows={csvRows} />

        {/* Subscriber table */}
        <Card variant="default" id="partner-subscribers" className="overflow-hidden mb-6">
          <div className="px-6 py-[18px] border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                Referred Subscribers ({scopedRows.length} in current filter)
            </h2>
          </div>
            {scopedRows.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-muted-foreground">
                No subscribers in this filter scope. Adjust program, cohort, or date range.
            </p>
          ) : (
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted border-b border-border">
                  <TableHead className="px-6 py-2.5 font-semibold text-muted-foreground">Joined</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Plan</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground text-right">MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {scopedRows.map((row, i) => {
                  const mrr = row.status === 'active' ? (TIER_MRR[row.tier] ?? 0) : 0
                  const commission = Math.round(mrr * partner.commission_pct / 100)
                  return (
                    <TableRow key={i}>
                      <TableCell className="px-6 py-3 text-muted-foreground">
                        {new Date(row.joinedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{tierLabel[row.tier] ?? row.tier}</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={statusBadgeVariant[row.status] ?? 'secondary'}>
                          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right text-muted-foreground">
                        {commission > 0 ? `$${commission}/mo` : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Commission explanation */}
        <Card variant="default" id="partner-commission" className="p-6">
          <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">How commissions work</h2>
          <div className="flex flex-col gap-2">
            {[
              'Share your referral link with executives you work with.',
              `When they sign up and start a paid subscription, you earn ${partner.commission_pct}% of their monthly fee.`,
              'Commissions are calculated on the 1st of each month and paid via Stripe.',
              'Monitor tier: $49/mo subscriber = $' + Math.round(49 * partner.commission_pct / 100) + '/mo for you.',
              'Active tier: $199/mo subscriber = $' + Math.round(199 * partner.commission_pct / 100) + '/mo for you.',
            ].map((line, i) => (
              <div key={i} className="flex gap-3 text-[13px] text-muted-foreground">
                <Badge className="shrink-0 mt-0.5 justify-center rounded-full size-5 p-0">{i + 1}</Badge>
                {line}
              </div>
            ))}
          </div>
        </Card>

      </main>
    </div>
  )
}

