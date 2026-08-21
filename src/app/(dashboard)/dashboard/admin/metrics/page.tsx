import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import {
  ACTION_SCORES,
  compositeScore,
  GROUP_LABELS,
  type ScoreGroup,
} from '@/lib/action-scores'
import { Badge, Card, Separator, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { MetricsCharts, type WeekRow, type EventDetail } from './metrics-charts'

function weekOf(isoDate: string): string {
  const d = new Date(isoDate)
  const day = d.getUTCDay()
  const offset = day === 0 ? 6 : day - 1
  const mon = new Date(d)
  mon.setUTCDate(d.getUTCDate() - offset)
  return mon.toISOString().split('T')[0]
}

function last12Weeks(): string[] {
  const weeks = new Set<string>()
  const now = new Date()
  for (let i = 0; i < 84; i++) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    weeks.add(weekOf(d.toISOString()))
  }
  return [...weeks].sort()
}

function ScoreBadge({ value, highGood }: { value: number; highGood: boolean }) {
  const good = highGood ? value >= 8 : value <= 3
  const mid  = highGood ? value >= 5 : value <= 6
  return (
    <Badge variant={good ? 'success' : mid ? 'warning' : 'destructive'}>
      {value}
    </Badge>
  )
}

export const metadata = { title: 'Action Scores - Admin' }

export default async function MetricsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const now = Date.now()
  const since7d  = new Date(now - 7  * 86_400_000).toISOString()
  const since30d = new Date(now - 30 * 86_400_000).toISOString()
  const since84d = new Date(now - 84 * 86_400_000).toISOString()

  const { data: rows84d } = await admin
    .from('user_events')
    .select('event_name, created_at')
    .gte('created_at', since84d)
    .limit(50000)

  const rows = rows84d ?? []

  // Per-event counts
  const counts30d: Record<string, number> = {}
  const counts7d:  Record<string, number> = {}
  for (const e of rows) {
    if (e.created_at >= since30d) counts30d[e.event_name] = (counts30d[e.event_name] ?? 0) + 1
    if (e.created_at >= since7d)  counts7d[e.event_name]  = (counts7d[e.event_name]  ?? 0) + 1
  }

  // Scored event list
  const allScored = Object.entries(ACTION_SCORES).map(([name, score]) => ({
    event_name: name,
    ...score,
    count30d: counts30d[name] ?? 0,
    count7d:  counts7d[name]  ?? 0,
    composite: compositeScore(score),
  }))

  const byCScore = [...allScored].sort((a, b) => b.composite - a.composite)
  const top3    = byCScore.slice(0, 3)
  const bottom3 = byCScore.slice(-3).reverse()

  const byGroup: Record<string, typeof allScored> = {}
  for (const item of allScored) {
    if (!byGroup[item.group]) byGroup[item.group] = []
    byGroup[item.group].push(item)
  }

  // Weekly time-series by group
  const weekKeys = last12Weeks()
  type Counts = Record<string, number>
  const weekly: Record<string, Counts> = {}
  for (const w of weekKeys) {
    weekly[w] = { onboarding: 0, pipeline: 0, intelligence: 0, signals: 0, communication: 0, profile: 0 }
  }
  for (const e of rows) {
    const w = weekOf(e.created_at)
    if (!weekly[w]) continue
    const score = ACTION_SCORES[e.event_name]
    if (!score) continue
    weekly[w][score.group] = (weekly[w][score.group] ?? 0) + 1
  }
  const weeklyData: WeekRow[] = weekKeys.map(w => ({
    week: w.slice(5),
    onboarding:    weekly[w].onboarding    ?? 0,
    pipeline:      weekly[w].pipeline      ?? 0,
    intelligence:  weekly[w].intelligence  ?? 0,
    signals:       weekly[w].signals       ?? 0,
    communication: weekly[w].communication ?? 0,
    profile:       weekly[w].profile       ?? 0,
  }))

  // groupDetails for drill-down
  const groupDetails: Record<string, EventDetail[]> = {}
  for (const [group, items] of Object.entries(byGroup)) {
    groupDetails[group] = items.map(i => ({
      event_name:     i.event_name,
      label:          i.label,
      count30d:       i.count30d,
      count7d:        i.count7d,
      emotion:        i.emotion,
      cognitive_load: i.cognitive_load,
      retention:      i.retention,
      composite:      i.composite,
    }))
  }

  const GROUP_ORDER: ScoreGroup[] = [
    'onboarding', 'pipeline', 'intelligence', 'signals', 'communication', 'profile',
  ]

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-primary-foreground transition-colors">
              ← Admin
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Action Scores</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5 max-w-xl">
            Every tracked user action rated on three dimensions. Composite = emotion + retention &minus; cognitive load.
            Faded rows have zero events in the last 30 days.
          </p>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <h2 className="sr-only">Quick actions</h2>
          <Link href="/dashboard/admin/crm">
            <Card className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open CRM</p>
              <p className="text-[13px] text-muted-foreground mt-1">Compare lead routing against score movement.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin/onboarding/qa">
            <Card className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open onboarding QA scorecard</p>
              <p className="text-[13px] text-muted-foreground mt-1">Review Sprint 6 implementation speed and low-energy mode adoption.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin/channel-benchmarks">
            <Card className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open channel benchmarks</p>
              <p className="text-[13px] text-muted-foreground mt-1">Review channel entry and persona routing by segment.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin/outreach-analytics">
            <Card className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open outreach analytics</p>
              <p className="text-[13px] text-muted-foreground mt-1">Review channel outcomes and delivery quality.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin" className="sm:col-span-3">
            <Card className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Back to admin</p>
              <p className="text-[13px] text-muted-foreground mt-1">Return to operational dashboard controls.</p>
            </Card>
          </Link>
        </section>

        {/* Score methodology */}
        <Card id="metrics-definitions" className="p-5 mb-6">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Score definitions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {[
              { label: 'Emotion',       desc: 'Does this action make the user feel something? 1 = administrative, 10 = peak emotional moment (offer accepted, first prep brief).' },
              { label: 'Cognitive load', desc: 'Mental effort to complete the action (NASA-TLX simplified). 1 = one click, 10 = complex form with judgment required. Lower is better UX.' },
              { label: 'Retention',     desc: 'Impact on subscription renewal probability. 1 = no influence, 10 = strong predictor of continued payment.' },
            ].map(({ label, desc }) => (
              <div key={label}>
                <p className="text-[13px] font-bold text-foreground mb-1">{label}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </Card>

        {/* Top and bottom */}
        <section id="metrics-high-low" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Card className="border-success/30 p-5">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-success mb-3">Highest composite</h2>
            {top3.map((row, index) => (
              <div key={row.event_name}>
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{row.label}</p>
                    <p className="text-[13px] text-muted-foreground">{GROUP_LABELS[row.group as ScoreGroup]} &middot; {row.count30d} last 30d</p>
                  </div>
                  <span className="text-[22px] font-bold text-success ml-4 shrink-0">{row.composite}</span>
                </div>
                {index < top3.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
          <Card className="border-destructive/30 p-5">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-destructive mb-3">Lowest composite - review for friction or low impact</h2>
            {bottom3.map((row, index) => (
              <div key={row.event_name}>
                <div className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{row.label}</p>
                    <p className="text-[13px] text-muted-foreground">{GROUP_LABELS[row.group as ScoreGroup]} &middot; {row.count30d} last 30d</p>
                  </div>
                  <span className="text-[22px] font-bold text-destructive ml-4 shrink-0">{row.composite}</span>
                </div>
                {index < bottom3.length - 1 && <Separator />}
              </div>
            ))}
          </Card>
        </section>

        {/* Full report by group */}
        <section id="metrics-groups">
        {GROUP_ORDER.map(group => {
          const items = byGroup[group]
          if (!items) return null
          const sorted = [...items].sort((a, b) => b.composite - a.composite)
          return (
            <Card key={group} className="overflow-hidden mb-4">
              <div className="px-6 py-[14px] border-b border-border">
                <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
                  {GROUP_LABELS[group]}
                </h2>
              </div>
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="px-6 font-semibold text-muted-foreground">Action</TableHead>
                    <TableHead className="px-4 font-semibold text-muted-foreground text-right">30d</TableHead>
                    <TableHead className="px-4 font-semibold text-muted-foreground text-right">7d</TableHead>
                    <TableHead className="px-4 font-semibold text-muted-foreground text-right">Emotion</TableHead>
                    <TableHead className="px-4 font-semibold text-muted-foreground text-right">Cog load</TableHead>
                    <TableHead className="px-4 font-semibold text-muted-foreground text-right">Retention</TableHead>
                    <TableHead className="px-4 font-semibold text-muted-foreground text-right">Composite</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map(row => (
                    <TableRow key={row.event_name} className={row.count30d === 0 ? 'opacity-40' : ''}>
                      <TableCell className="px-6 py-3 text-muted-foreground font-medium">{row.label}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold text-foreground">{row.count30d}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-muted-foreground">{row.count7d}</TableCell>
                      <TableCell className="px-4 py-3 text-right"><ScoreBadge value={row.emotion} highGood /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><ScoreBadge value={row.cognitive_load} highGood={false} /></TableCell>
                      <TableCell className="px-4 py-3 text-right"><ScoreBadge value={row.retention} highGood /></TableCell>
                      <TableCell className="px-4 py-3 text-right font-bold text-foreground">{row.composite}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        })}
        </section>

        {/* Trend dashboard */}
        <Card id="metrics-trends" className="p-6 mt-6">
          <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-1">
            Weekly Event Volume by Group (12 weeks)
          </h2>
          <p className="text-[13px] text-muted-foreground mb-6">
            Click a group button below the chart to drill into event-level detail.
          </p>
          <MetricsCharts weeklyData={weeklyData} groupDetails={groupDetails} />
        </Card>

      </main>
    </div>
  )
}

