import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { evaluateBotTrafficAlerts, getBotTrafficSnapshot } from '@/lib/bot-detection/bot-traffic-report'
import { ADMIN_DARK_PAGE_BG } from '../../admin-dark-theme'
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
import { BotTrafficChart } from './bot-traffic-chart'

export const dynamic = 'force-dynamic'

const SEVERITY_BADGE_VARIANT: Record<string, 'destructive' | 'warning' | 'secondary'> = {
  high: 'destructive',
  medium: 'warning',
  low: 'secondary',
}

function percent(value: number): string {
  return `${Math.round(value * 100)}%`
}

function shortHash(hash: string): string {
  return hash.slice(0, 10)
}

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

export default async function BotTrafficPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const admin = createAdminClient() as any
  const snapshot = await getBotTrafficSnapshot(admin)
  const alerts = evaluateBotTrafficAlerts(snapshot)

  const statCards = [
    { label: 'Requests (24h)', value: snapshot.totalRequests24h.toLocaleString() },
    { label: 'Suspected bot (24h)', value: `${snapshot.botRequests24h.toLocaleString()} / ${percent(snapshot.botShare24h)}` },
    { label: 'Rate limited (24h)', value: snapshot.rateLimited24h.toLocaleString() },
    { label: 'Networks seen (24h)', value: snapshot.distinctPrefixes24h.toLocaleString() },
  ]

  return (
    <div className={ADMIN_DARK_PAGE_BG}>
      <header className="bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <Link href="/dashboard/admin/operations" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">← Operations</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-8">
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Bot Traffic</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Captcha enforcement is intentionally paused. This page is how we tell whether that stays the right call.
          </p>
          <p className="text-[13px] text-muted-foreground mt-1">
            Snapshot generated {new Date(snapshot.generatedAt).toLocaleString()}. IP addresses are never stored -- networks are identified by a salted hash.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {statCards.map((card) => (
            <Card key={card.label} variant="glass" className="p-4">
              <div className="text-[24px] font-bold text-foreground leading-none">{card.value}</div>
              <div className="text-[13px] text-muted-foreground mt-1.5 tracking-[0.07em] uppercase">{card.label}</div>
            </Card>
          ))}
        </div>

        {/* The number that actually decides anything. Volume the rate limiter
            absorbs is noise; requests that reach the signup handler are not. */}
        <Card variant="glass" className="p-5 mb-6">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">The number that matters</p>
          <div className="flex flex-wrap items-baseline gap-3">
            <span className={`text-[32px] font-bold leading-none ${snapshot.botAllowedOnSignup1h > 0 ? 'text-destructive' : 'text-foreground'}`}>
              {snapshot.botAllowedOnSignup1h}
            </span>
            <span className="text-[13px] text-muted-foreground">
              high-confidence bot requests reached the signup handler in the last hour
            </span>
          </div>
          <p className="text-[13px] text-muted-foreground mt-3 leading-relaxed">
            Raw bot volume that the rate limiter turns away is not a problem worth acting on. Requests that get past it and
            reach signup are. If this number is regularly above zero, that is the evidence that would justify revisiting
            captcha as its own piece of work.
          </p>
        </Card>

        <Card variant="glass" className="p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Hourly volume (7 days)</p>
            <p className="text-[13px] text-muted-foreground">
              Baseline: {snapshot.baselineHourlyMedian} suspected-bot req/hour (median)
            </p>
          </div>
          <BotTrafficChart data={snapshot.hourly} />
        </Card>

        <Card variant="glass" className="p-5 mb-6">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Alert conditions right now</p>
          {alerts.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">
              Nothing is firing. Last hour saw {snapshot.botRequests1h} suspected-bot requests against a baseline of {snapshot.baselineHourlyMedian}.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.code} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{alert.message}</p>
                    <p className="text-[13px] text-muted-foreground mt-1">{alert.detail}</p>
                  </div>
                  <Badge variant={SEVERITY_BADGE_VARIANT[alert.severity]} className="shrink-0">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card variant="glass" className="overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Most active networks (last hour)</p>
          </div>
          {snapshot.topPrefixes.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">No requests in the last hour.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="bg-muted/40 text-muted-foreground">
                    <TableHead className="text-left px-5 font-bold tracking-[0.07em] uppercase">Network</TableHead>
                    <TableHead className="text-right px-3 font-bold tracking-[0.07em] uppercase">Requests</TableHead>
                    <TableHead className="text-right px-3 font-bold tracking-[0.07em] uppercase">Bot</TableHead>
                    <TableHead className="text-left px-3 font-bold tracking-[0.07em] uppercase">Routes</TableHead>
                    <TableHead className="text-left px-5 font-bold tracking-[0.07em] uppercase">User agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border">
                  {snapshot.topPrefixes.map((prefix) => (
                    <TableRow key={prefix.ipPrefixHash}>
                      <TableCell className="px-5 py-2.5 font-mono text-muted-foreground">
                        {shortHash(prefix.ipPrefixHash)}
                        {prefix.country ? <span className="ml-2 text-muted-foreground">{prefix.country}</span> : null}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-right text-foreground font-semibold">{prefix.requests}</TableCell>
                      <TableCell className={`px-3 py-2.5 text-right font-semibold ${prefix.botRequests > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {prefix.botRequests}
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-muted-foreground">{prefix.routes.join(', ')}</TableCell>
                      <TableCell className="px-5 py-2.5 text-muted-foreground max-w-[280px] truncate" title={prefix.userAgent ?? ''}>
                        {prefix.userAgent ?? '(none sent)'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>

        <Card variant="glass" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-muted-foreground">Recent rejections</p>
          </div>
          {snapshot.recentRejections.length === 0 ? (
            <p className="px-5 py-4 text-[13px] text-muted-foreground">No requests have been turned away recently.</p>
          ) : (
            <div className="divide-y divide-border">
              {snapshot.recentRejections.map((rejection, index) => (
                <div key={`${rejection.occurredAt}-${index}`} className="px-5 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-foreground font-mono">{rejection.route}</p>
                    <p className="text-[13px] text-muted-foreground mt-1 truncate" title={rejection.userAgent ?? ''}>
                      {rejection.userAgent ?? '(no user agent)'}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13px] text-muted-foreground">{rejection.outcome}</p>
                    <p className="text-[13px] text-muted-foreground mt-1">score {rejection.botScore} - {timeAgo(rejection.occurredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </div>
  )
}
