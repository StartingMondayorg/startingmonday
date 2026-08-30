import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { ROUTING_THRESHOLDS } from '@/lib/intelligence/lead-scoring'
import { runLeadScoringNow } from './actions'
import { Alert, AlertDescription, Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type LeadRow = {
  id: string
  name: string
  title: string | null
  channel: string | null
  lead_score: number | null
  lead_tier: 'hot' | 'warm' | 'nurture' | null
  lead_queue: 'hot' | 'warm' | 'nurture' | null
  created_at: string
}

type LeadScoringRun = {
  id: string
  trigger: 'admin' | 'cron'
  status: 'success' | 'failed'
  processed: number
  updated: number
  error_message: string | null
  created_at: string
}

function ageBucket(days: number): '0-7d' | '8-30d' | '31-90d' | '91+d' {
  if (days <= 7) return '0-7d'
  if (days <= 30) return '8-30d'
  if (days <= 90) return '31-90d'
  return '91+d'
}

function channelLabel(value: string | null): string {
  if (!value) return 'Unknown'
  const v = value.toLowerCase()
  if (v === 'linkedin') return 'LinkedIn'
  if (v === 'referral') return 'Referral'
  if (v === 'recruiter') return 'Recruiter'
  if (v === 'cold') return 'Cold'
  if (v === 'inbound') return 'Inbound'
  if (v === 'event') return 'Event'
  return value
}

function scoreBadgeVariant(score: number): 'destructive' | 'warning' | 'secondary' {
  if (score >= ROUTING_THRESHOLDS.hot) return 'destructive'
  if (score >= ROUTING_THRESHOLDS.warm) return 'warning'
  return 'secondary'
}

export const metadata = { title: 'CRM - Admin' }

export default async function AdminCrmPage({
  searchParams,
}: {
  searchParams: Promise<{ scored?: string; processed?: string; updated?: string; error?: string }>
}) {
  const { scored, processed, updated, error } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const { data: rawLeads } = await admin
    .from('contacts')
    .select('id, name, title, channel, lead_score, lead_tier, lead_queue, created_at')
    .eq('status', 'active')
    .order('lead_score', { ascending: false })
    .limit(2000)

  const { data: rawRuns } = await admin
    .from('lead_scoring_runs')
    .select('id, trigger, status, processed, updated, error_message, created_at')
    .order('created_at', { ascending: false })
    .limit(8)

  const leads = (rawLeads ?? []) as LeadRow[]
  const runs = (rawRuns ?? []) as LeadScoringRun[]
  const totalLeads = leads.length
  const requestHeaders = await headers()
  const headerTime = Date.parse(requestHeaders.get('date') ?? '')
  const fallbackTime = leads.length > 0 ? new Date(leads[0].created_at).getTime() : 0
  const referenceNow = Number.isNaN(headerTime) ? fallbackTime : headerTime

  const byChannel: Record<string, { count: number; topScore: number }> = {}
  const byAge: Record<'0-7d' | '8-30d' | '31-90d' | '91+d', { count: number; topScore: number; avgScore: number }> = {
    '0-7d': { count: 0, topScore: 0, avgScore: 0 },
    '8-30d': { count: 0, topScore: 0, avgScore: 0 },
    '31-90d': { count: 0, topScore: 0, avgScore: 0 },
    '91+d': { count: 0, topScore: 0, avgScore: 0 },
  }
  const queueCounts: Record<'hot' | 'warm' | 'nurture', number> = { hot: 0, warm: 0, nurture: 0 }

  for (const lead of leads) {
    const score = lead.lead_score ?? 0
    const key = channelLabel(lead.channel)
    if (!byChannel[key]) byChannel[key] = { count: 0, topScore: 0 }
    byChannel[key].count += 1
    byChannel[key].topScore = Math.max(byChannel[key].topScore, score)

    const days = Math.max(0, Math.floor((referenceNow - new Date(lead.created_at).getTime()) / 86_400_000))
    const bucket = ageBucket(days)
    byAge[bucket].count += 1
    byAge[bucket].topScore = Math.max(byAge[bucket].topScore, score)
    byAge[bucket].avgScore += score

    const queue = lead.lead_queue ?? 'nurture'
    queueCounts[queue] += 1
  }

  for (const key of Object.keys(byAge) as Array<keyof typeof byAge>) {
    const row = byAge[key]
    row.avgScore = row.count > 0 ? Math.round(row.avgScore / row.count) : 0
  }

  const topLeads = leads.slice(0, 12)
  const topChannels = Object.entries(byChannel)
    .sort((a, b) => b[1].topScore - a[1].topScore)
    .slice(0, 8)

  const sortedChannelTotals = Object.entries(byChannel)
    .sort((a, b) => b[1].count - a[1].count)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard/admin" className="text-[13px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
            ← Admin
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-bold text-foreground leading-tight">CRM</h1>
            <p className="text-[13px] text-muted-foreground mt-1.5">Lead score, channel mix, and queue routing dashboard.</p>
          </div>
          <form action={runLeadScoringNow}>
            <Button type="submit">
              Run Scoring Now
            </Button>
          </form>
        </div>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <h2 className="sr-only">Quick actions</h2>
          <Link href="/dashboard/contacts">
            <Card variant="glass" className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open contacts</p>
              <p className="text-[13px] text-muted-foreground mt-1">Review active contacts and outreach status.</p>
            </Card>
          </Link>
          <Link href="/dashboard/outreach">
            <Card variant="glass" className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open outreach</p>
              <p className="text-[13px] text-muted-foreground mt-1">Run sends and clear follow-up queue.</p>
            </Card>
          </Link>
          <Link href="/dashboard/admin/outreach-analytics">
            <Card variant="glass" className="p-4 hover:border-border transition-colors">
              <p className="text-[13px] font-semibold text-foreground">Open analytics</p>
              <p className="text-[13px] text-muted-foreground mt-1">Compare delivery and response trends.</p>
            </Card>
          </Link>
        </section>

        {scored === '1' && (
          <Alert variant="success" className="mb-6">
            <AlertDescription>
              Lead scoring completed. Processed {processed ?? '0'} leads and updated {updated ?? '0'} records.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>
              {error === 'forbidden'
                ? 'You do not have permission to run lead scoring.'
                : 'Lead scoring failed. Please try again or check server logs.'}
            </AlertDescription>
          </Alert>
        )}

        <Card variant="glass" id="crm-run-log" className="p-0 mb-6">
          <div className="px-6 py-[14px] border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Scoring execution log</h2>
          </div>
          {runs.length === 0 ? (
            <p className="px-6 py-6 text-[13px] text-muted-foreground">No scoring runs logged yet.</p>
          ) : (
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-6 py-2.5 font-semibold text-muted-foreground">Time</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Trigger</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Status</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground text-right">Processed</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground text-right">Updated</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="px-6 py-3 text-foreground">
                      {new Date(run.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground uppercase tracking-wide text-[13px]">{run.trigger}</TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={run.status === 'success' ? 'success' : 'destructive'}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold text-foreground">{run.processed}</TableCell>
                    <TableCell className="px-4 py-3 text-right font-semibold text-foreground">{run.updated}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground whitespace-normal">{run.error_message ?? 'OK'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        <section id="crm-kpis" className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <Card variant="glass" className="p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Total leads</p>
            <p className="text-[30px] font-bold text-foreground mt-2 leading-none">{totalLeads}</p>
          </Card>
          <Card variant="glass" className="border-destructive/20 bg-destructive/10 p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-destructive">Hot queue</p>
            <p className="text-[30px] font-bold text-destructive mt-2 leading-none">{queueCounts.hot}</p>
          </Card>
          <Card variant="glass" className="border-warning/20 bg-warning/10 p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-warning">Warm queue</p>
            <p className="text-[30px] font-bold text-warning mt-2 leading-none">{queueCounts.warm}</p>
          </Card>
          <Card variant="glass" className="p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Nurture queue</p>
            <p className="text-[30px] font-bold text-foreground mt-2 leading-none">{queueCounts.nurture}</p>
          </Card>
        </section>

        <section id="crm-channel-mix" className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card variant="glass" className="p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Customers by channel</p>
            <div className="space-y-2">
              {sortedChannelTotals.map(([channel, stats]) => (
                <div key={channel} className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground font-medium">{channel}</span>
                  <span className="text-muted-foreground">{stats.count}</span>
                </div>
              ))}
              {sortedChannelTotals.length === 0 && (
                <p className="text-[13px] text-muted-foreground">No leads yet.</p>
              )}
            </div>
          </Card>

          <Card variant="glass" className="p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Top score by channel</p>
            <div className="space-y-2">
              {topChannels.map(([channel, stats]) => (
                <div key={channel} className="flex items-center justify-between text-[13px]">
                  <span className="text-foreground font-medium">{channel}</span>
                  <Badge variant={scoreBadgeVariant(stats.topScore)}>
                    {stats.topScore}
                  </Badge>
                </div>
              ))}
              {topChannels.length === 0 && (
                <p className="text-[13px] text-muted-foreground">No channel scoring data yet.</p>
              )}
            </div>
          </Card>
        </section>

        <Card variant="glass" className="p-5 mb-6">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">Lead age cohorts</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {(Object.keys(byAge) as Array<keyof typeof byAge>).map((bucket) => (
              <Card key={bucket} className="border border-border bg-transparent p-4 text-foreground">
                <p className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">{bucket}</p>
                <p className="text-[24px] font-bold text-foreground mt-1 leading-none">{byAge[bucket].count}</p>
                <p className="text-[13px] text-muted-foreground mt-1">Avg score: {byAge[bucket].avgScore}</p>
                <p className="text-[13px] text-muted-foreground">Top score: {byAge[bucket].topScore}</p>
              </Card>
            ))}
          </div>
        </Card>

        <Card variant="glass" id="crm-top-leads" className="p-0">
          <div className="px-6 py-[14px] border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Top lead scores</h2>
          </div>
          {topLeads.length === 0 ? (
            <p className="px-6 py-8 text-[13px] text-muted-foreground">No scored leads yet.</p>
          ) : (
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="px-6 py-2.5 font-semibold text-muted-foreground">Name</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Title</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Channel</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground">Queue</TableHead>
                  <TableHead className="px-4 py-2.5 font-semibold text-muted-foreground text-right">Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLeads.map((lead) => {
                  const score = lead.lead_score ?? 0
                  return (
                    <TableRow key={lead.id}>
                      <TableCell className="px-6 py-3 font-semibold text-foreground">{lead.name}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{lead.title ?? '\u2014'}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{channelLabel(lead.channel)}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground capitalize">{lead.lead_queue ?? 'nurture'}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Badge variant={scoreBadgeVariant(score)}>
                          {score}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
    </div>
  )
}


