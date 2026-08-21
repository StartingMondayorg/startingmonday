import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Alert, AlertDescription, AlertTitle, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type PartnerRow = { id: string; name: string }
type AttributionRow = { partner_id: string; signup_user_id: string; attributed_at: string }
type UserRow = { id: string; email: string; created_at: string }
type UserEventRow = { user_id: string; created_at: string }
type OutreachRow = { user_id: string; sent_at: string }
type BriefRow = { user_id: string; created_at: string }
type FollowUpRow = { user_id: string; due_date: string; status: string; next_action_status: string }

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function toPercent(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Number(((numerator / denominator) * 100).toFixed(1))
}

function statusFromRate(rate: number): 'on_track' | 'watch' | 'needs_attention' {
  if (rate >= 70) return 'on_track'
  if (rate >= 45) return 'watch'
  return 'needs_attention'
}

function cohortKeyFromIso(isoDate: string): string {
  const d = new Date(isoDate)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

function normalizeStatus(value: string | null | undefined): string {
  return String(value ?? '').trim().toLowerCase()
}

export const metadata: Metadata = {
  title: 'Outplacement Operator Console | Starting Monday',
  description: 'Cohort health, exceptions, interventions, and readiness status for outplacement program operators.',
}

/**
 * Outplacement Operator Console - Sprint ITS-4 Ticket 23
 *
 * AC: partner buyers can see operating-system proof, not only docs.
 * This route shows cohort health, exception queue, intervention queue,
 * readiness status, and key program KPIs.
 */
export default async function OutplacementOperatorConsolePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: partnerOwnerRows } = await supabase
    .from('partners')
    .select('id, name')
    .eq('is_active', true)
    .eq('user_id', user.id)

  const { data: pilotRowsRaw } = await supabase
    .from('partner_pilots')
    .select('partner_name')
    .eq('program_owner_user_id', user.id)
    .limit(100)
  const pilotRows = (pilotRowsRaw ?? []) as Array<{ partner_name: string }>

  const pilotNames = Array.from(new Set(pilotRows.map((row) => row.partner_name).filter(Boolean)))
  const { data: pilotPartnerRows } = pilotNames.length > 0
    ? await supabase.from('partners').select('id, name').in('name', pilotNames)
    : { data: [] as PartnerRow[] }

  const partnerMap = new Map<string, PartnerRow>()
  for (const row of (partnerOwnerRows ?? []) as PartnerRow[]) partnerMap.set(row.id, row)
  for (const row of (pilotPartnerRows ?? []) as PartnerRow[]) partnerMap.set(row.id, row)

  const partners = Array.from(partnerMap.values())
  const partnerIds = partners.map((row) => row.id)

  const { data: attributions } = partnerIds.length > 0
    ? await supabase
      .from('referral_attributions')
      .select('partner_id, signup_user_id, attributed_at')
      .in('partner_id', partnerIds)
      .limit(200000)
    : { data: [] as AttributionRow[] }

  const attributedRows = (attributions ?? []) as AttributionRow[]
  const userIds = Array.from(new Set(attributedRows.map((row) => row.signup_user_id)))

  const since30 = isoDaysAgo(30)
  const since14 = isoDaysAgo(14)
  const nowIso = new Date().toISOString()

  const [usersRes, eventsRes, outreachRes, briefsRes, followUpsRes] = userIds.length > 0
    ? await Promise.all([
      supabase.from('users').select('id, email, created_at').in('id', userIds).limit(200000),
      supabase.from('user_events').select('user_id, created_at').in('user_id', userIds).gte('created_at', since30).limit(200000),
      supabase.from('outreach_logs').select('user_id, sent_at').in('user_id', userIds).gte('sent_at', since30).limit(200000),
      supabase.from('briefs').select('user_id, created_at').in('user_id', userIds).in('type', ['prep', 'prep_section']).gte('created_at', since30).limit(200000),
      supabase.from('follow_ups').select('user_id, due_date, status, next_action_status').in('user_id', userIds).limit(200000),
    ])
    : [
      { data: [] as UserRow[] },
      { data: [] as UserEventRow[] },
      { data: [] as OutreachRow[] },
      { data: [] as BriefRow[] },
      { data: [] as FollowUpRow[] },
    ]

  const users = (usersRes.data ?? []) as UserRow[]
  const eventRows = (eventsRes.data ?? []) as UserEventRow[]
  const outreachRows = (outreachRes.data ?? []) as OutreachRow[]
  const briefRows = (briefsRes.data ?? []) as BriefRow[]
  const followUpRows = (followUpsRes.data ?? []) as FollowUpRow[]

  const emailByUser = new Map(users.map((row) => [row.id, row.email]))

  const events14 = new Set(eventRows.filter((row) => row.created_at >= since14).map((row) => row.user_id))
  const outreach14 = new Set(outreachRows.filter((row) => row.sent_at >= since14).map((row) => row.user_id))
  const activeUsers = new Set<string>([...events14, ...outreach14])
  const prepUsers = new Set(briefRows.map((row) => row.user_id))

  const outreachCountByUser = new Map<string, number>()
  for (const row of outreachRows) {
    outreachCountByUser.set(row.user_id, (outreachCountByUser.get(row.user_id) ?? 0) + 1)
  }

  const overdueByUser = new Map<string, number>()
  let closedFollowups = 0
  for (const row of followUpRows) {
    const status = normalizeStatus(row.next_action_status || row.status)
    if (status === 'done' || status === 'completed' || status === 'sent') {
      closedFollowups += 1
      continue
    }
    if (row.due_date < nowIso) {
      overdueByUser.set(row.user_id, (overdueByUser.get(row.user_id) ?? 0) + 1)
    }
  }

  const stalledUsers = new Set(
    userIds.filter((userId) => !events14.has(userId) && !outreach14.has(userId)),
  )

  const totalUsers = userIds.length
  const activationRate = toPercent(activeUsers.size, totalUsers)
  const prepUsageRate = toPercent(prepUsers.size, totalUsers)
  const totalOutreach30 = outreachRows.length
  const actionsPerUserPerWeek = totalUsers > 0 ? Number((totalOutreach30 / totalUsers / (30 / 7)).toFixed(1)) : 0
  const stallCount = stalledUsers.size
  const overdueActions = Array.from(overdueByUser.values()).reduce((sum, value) => sum + value, 0)
  const followupClosureRate = toPercent(closedFollowups, followUpRows.length)

  const partnerNameById = new Map(partners.map((row) => [row.id, row.name]))
  const cohortBuckets = new Map<string, { partnerName: string; cohort: string; users: Set<string> }>()
  for (const row of attributedRows) {
    const partnerName = partnerNameById.get(row.partner_id)
    if (!partnerName) continue
    const cohort = cohortKeyFromIso(row.attributed_at)
    const key = `${row.partner_id}::${cohort}`
    const existing = cohortBuckets.get(key)
    if (existing) {
      existing.users.add(row.signup_user_id)
      continue
    }
    cohortBuckets.set(key, { partnerName, cohort, users: new Set([row.signup_user_id]) })
  }

  const cohortRows = Array.from(cohortBuckets.values())
    .map((bucket) => {
      const scopedUsers = Array.from(bucket.users)
      const scopedCount = scopedUsers.length
      const scopedActive = scopedUsers.filter((id) => activeUsers.has(id)).length
      const scopedOverdue = scopedUsers.reduce((sum, id) => sum + (overdueByUser.get(id) ?? 0), 0)
      const scopedStalls = scopedUsers.filter((id) => stalledUsers.has(id)).length
      const scopedStatus = statusFromRate(toPercent(scopedActive, scopedCount))

      return {
        name: `${bucket.partnerName} · ${bucket.cohort}`,
        participants: scopedCount,
        activationRate: toPercent(scopedActive, scopedCount),
        overdue: scopedOverdue,
        stalls: scopedStalls,
        status: scopedStatus,
      }
    })
    .sort((a, b) => b.participants - a.participants)
    .slice(0, 8)

  const exceptionQueue = userIds
    .flatMap((userId) => {
      const entries: Array<{ participant: string; issue: string; severity: 'high' | 'medium' | 'low'; owner: string }> = []
      const participant = emailByUser.get(userId) ?? `User ${userId.slice(0, 8)}`
      const overdue = overdueByUser.get(userId) ?? 0

      if (stalledUsers.has(userId)) {
        entries.push({
          participant,
          issue: 'No activity in the last 14 days',
          severity: 'high',
          owner: 'Counselor team',
        })
      }
      if (overdue > 0) {
        entries.push({
          participant,
          issue: `${overdue} overdue follow-up action${overdue > 1 ? 's' : ''}`,
          severity: overdue > 1 ? 'high' : 'medium',
          owner: 'Counselor queue',
        })
      }
      if (!prepUsers.has(userId)) {
        entries.push({
          participant,
          issue: 'No prep brief usage in the last 30 days',
          severity: 'low',
          owner: 'Prep coaching lane',
        })
      }

      return entries
    })
    .sort((a, b) => {
      const rank = { high: 0, medium: 1, low: 2 }
      return rank[a.severity] - rank[b.severity]
    })
    .slice(0, 12)

  const LIVE_COHORT_HEALTH = [
    {
      label: 'Activation rate',
      value: `${Math.round(activationRate)}%`,
      status: statusFromRate(activationRate),
      benchmark: '70%+',
    },
    {
      label: 'Signal-driven actions (wk)',
      value: `${actionsPerUserPerWeek.toFixed(1)} avg`,
      status: actionsPerUserPerWeek >= 5 ? 'on_track' : actionsPerUserPerWeek >= 3 ? 'watch' : 'needs_attention',
      benchmark: '5+',
    },
    {
      label: 'Prep brief usage',
      value: `${Math.round(prepUsageRate)}%`,
      status: statusFromRate(prepUsageRate),
      benchmark: '60%+',
    },
    {
      label: 'Stall index',
      value: `${stallCount} of ${totalUsers}`,
      status: stallCount <= 2 ? 'on_track' : stallCount <= 4 ? 'watch' : 'needs_attention',
      benchmark: '<2',
    },
    {
      label: 'Follow-up closure rate',
      value: `${Math.round(followupClosureRate)}%`,
      status: statusFromRate(followupClosureRate),
      benchmark: '65%+',
    },
    {
      label: 'Overdue actions',
      value: `${overdueActions} open`,
      status: overdueActions === 0 ? 'on_track' : overdueActions <= 4 ? 'watch' : 'needs_attention',
      benchmark: '0',
    },
  ]

  const STATUS_ALERT_VARIANT = {
    on_track: 'success',
    watch: 'warning',
    needs_attention: 'destructive',
  } as const

  const EXCEPTION_QUEUE = [
    { participant: 'Exec A', issue: 'No signal action for 7 days', severity: 'high', owner: 'Counselor team' },
    { participant: 'Exec B', issue: 'Pipeline stalled at watching stage (3 weeks)', severity: 'medium', owner: 'Counselor 2' },
    { participant: 'Exec C', issue: 'Narrative drift detected - 3 versions in 2 weeks', severity: 'medium', owner: 'Counselor lead' },
    { participant: 'Exec D', issue: 'Overdue follow-up × 2', severity: 'low', owner: 'Counselor 1' },
    { participant: 'Exec E', issue: 'No brief review in 14 days', severity: 'low', owner: 'Unassigned' },
  ]

  const SEVERITY_ALERT_VARIANT = {
    high: 'destructive',
    medium: 'warning',
    low: 'default',
  } as const

  const SEVERITY_BADGE_VARIANT = {
    high: 'destructive',
    medium: 'warning',
    low: 'secondary',
  } as const

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-semibold text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <nav className="flex items-center gap-4 text-[13px] text-muted-foreground">
            <Link href="/dashboard/outplacement/sponsor-report" className="hover:text-foreground transition-colors">Sponsor report</Link>
            <Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <Card className="px-6 py-5">
          <p className="text-[13px] font-semibold text-primary mb-1">Outplacement operator console</p>
          <h1 className="text-[22px] font-bold text-foreground leading-tight">Program operations overview</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Cohort health, exceptions, and intervention queue for the current program cycle.
          </p>
        </Card>

        {/* Cohort health KPIs */}
        <div>
          <h2 className="text-[13px] font-semibold text-muted-foreground mb-3">Cohort health - current cycle</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {LIVE_COHORT_HEALTH.map((item) => (
              <Alert key={item.label} variant={STATUS_ALERT_VARIANT[item.status as keyof typeof STATUS_ALERT_VARIANT]} className="p-4 block">
                <p className="text-[13px] font-semibold mb-1">{item.label}</p>
                <p className="text-[22px] font-bold leading-none">{item.value}</p>
                <p className="text-[13px] mt-1 opacity-70">Benchmark: {item.benchmark}</p>
              </Alert>
            ))}
          </div>
        </div>

        {/* Exception queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[13px] font-semibold text-muted-foreground">Exception queue ({exceptionQueue.length})</h2>
            <span className="text-[13px] text-muted-foreground">Sorted by severity</span>
          </div>
          <div className="space-y-2">
            {exceptionQueue.length === 0 ? (
              <Alert variant="success">
                <AlertDescription>No active exceptions in your scoped partner cohorts.</AlertDescription>
              </Alert>
            ) : exceptionQueue.map((item) => (
              <Alert key={item.participant} variant={SEVERITY_ALERT_VARIANT[item.severity as keyof typeof SEVERITY_ALERT_VARIANT]} className="flex items-start gap-4 py-3">
                <div className="flex-1 min-w-0">
                  <AlertTitle className="text-foreground">{item.participant}</AlertTitle>
                  <AlertDescription className="mt-0.5">{item.issue}</AlertDescription>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={SEVERITY_BADGE_VARIANT[item.severity as keyof typeof SEVERITY_BADGE_VARIANT]}>{item.severity}</Badge>
                  <p className="text-[13px] text-muted-foreground mt-1">Owner: {item.owner}</p>
                </div>
              </Alert>
            ))}
          </div>
        </div>

        {/* Cohort efficiency summary */}
        <div>
          <h2 className="text-[13px] font-semibold text-muted-foreground mb-3">Cohort efficiency</h2>
          <Card className="py-0 overflow-hidden">
            <Table className="text-[13px]">
              <TableHeader className="bg-muted">
                <TableRow>
                  {['Cohort', 'Participants', 'Activation rate', 'Overdue actions', 'Stall flags', 'Status'].map((h) => (
                    <TableHead key={h} className="px-4 py-3 text-[13px] font-semibold text-muted-foreground">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {cohortRows.length === 0 ? (
                  <TableRow>
                    <TableCell className="px-4 py-4 text-muted-foreground" colSpan={6}>No attributed cohorts found for your partner scope yet.</TableCell>
                  </TableRow>
                ) : cohortRows.map((c) => (
                  <TableRow key={c.name}>
                    <TableCell className="px-4 py-3 font-medium text-foreground">{c.name}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{c.participants}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{Math.round(c.activationRate)}%</TableCell>
                    <TableCell className={`px-4 py-3 font-semibold ${c.overdue > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{c.overdue}</TableCell>
                    <TableCell className={`px-4 py-3 font-semibold ${c.stalls > 0 ? 'text-warning' : 'text-muted-foreground'}`}>{c.stalls}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={c.status === 'on_track' ? 'success' : c.status === 'watch' ? 'warning' : 'destructive'}>
                        {c.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/dashboard/outplacement/firm-admin', label: 'Firm admin view', desc: 'Compare books, cohorts, and counselor load.' },
            { href: '/dashboard/outplacement/counselor', label: 'Counselor view', desc: 'Session prep and intervention queue.' },
            { href: '/dashboard/outplacement/enterprise', label: 'Enterprise view', desc: 'Sponsor-safe reporting and review cadence.' },
            { href: '/dashboard/outplacement/sponsor-report', label: 'Sponsor report', desc: 'Generate monthly sponsor-ready readout' },
            { href: '/for-outplacement/trust-pack', label: 'Trust pack', desc: 'Governance and procurement materials' },
            { href: '/for-outplacement/runbook', label: 'Runbook', desc: 'Operational runbook and escalation rules' },
          ].map(({ href, label, desc }) => (
            <Link key={href} href={href} className="group">
              <Card className="px-4 py-4 hover:border-primary/30 transition-colors">
                <p className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors">{label}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{desc}</p>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
