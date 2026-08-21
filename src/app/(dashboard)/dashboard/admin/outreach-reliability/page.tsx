import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getStaffMember } from '@/lib/staff'
import { loadReliabilitySnapshotFromDb } from '@/lib/outreach/reliability-metrics'
import { Alert, AlertDescription, AlertTitle, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
function pct(value: number): string {
  return `${value.toFixed(1)}%`
}

function alertVariant(level: 'info' | 'warning' | 'critical'): 'info' | 'warning' | 'destructive' {
  if (level === 'critical') return 'destructive'
  if (level === 'warning') return 'warning'
  return 'info'
}

function confidenceBadgeVariant(band: 'high' | 'medium' | 'low'): 'success' | 'warning' | 'destructive' {
  if (band === 'high') return 'success'
  if (band === 'medium') return 'warning'
  return 'destructive'
}

export default async function OutreachReliabilityPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const admin = createAdminClient()
  const snapshot = await loadReliabilitySnapshotFromDb(admin as any, { windowDays: 14 })

  const latestDay = snapshot.daily.at(-1)
  const last7 = snapshot.daily.slice(-7)
  const last7Total = last7.reduce((sum, row) => sum + row.total, 0)
  const last7Accepted = last7.reduce((sum, row) => sum + row.acceptedLike, 0)
  const last7AcceptedRate = last7Total > 0 ? (last7Accepted / last7Total) * 100 : 0

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-primary">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-primary-foreground">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/admin" className="text-[13px] font-semibold text-primary-foreground transition-colors">Admin</Link>
            <Link href="/dashboard/admin/outreach-analytics" className="text-[13px] font-semibold text-primary-foreground transition-colors">Outreach Performance</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-6">
        <section>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Outreach Reliability Confidence</h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            Hard daily reliability numbers from queue states, retries, and webhook advancement. Window: {snapshot.windowDays} days.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Confidence Score</h2>
            <p className="text-[28px] font-bold text-foreground">{snapshot.confidence.score}</p>
            <Badge variant={confidenceBadgeVariant(snapshot.confidence.band)} className="mt-1 capitalize">
              {snapshot.confidence.band} confidence
            </Badge>
          </Card>
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Accepted Rate (7d)</h2>
            <p className="text-[28px] font-bold text-foreground">{pct(last7AcceptedRate)}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Threshold: {snapshot.thresholds.minAcceptedRatePct}%</p>
          </Card>
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Negative Outcomes</h2>
            <p className="text-[28px] font-bold text-foreground">{pct(snapshot.totals.negativeOutcomeRatePct)}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Threshold: {snapshot.thresholds.maxNegativeOutcomeRatePct}% max</p>
          </Card>
          <Card variant="default" className="p-5">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Queue Health</h2>
            <p className="text-[28px] font-bold text-foreground">{snapshot.queueHealth.queuedStaleCount + snapshot.queueHealth.sendingStaleCount}</p>
            <p className="text-[13px] text-muted-foreground mt-1">Stale queued + stale sending jobs</p>
          </Card>
        </section>

        <Card variant="default" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Alert Thresholds</h2>
            <span className="text-[13px] text-muted-foreground">Updated {new Date(snapshot.generatedAt).toLocaleString()}</span>
          </div>
          <div className="px-5 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-[13px] text-muted-foreground">
            <div className="border border-border rounded p-3">Accepted rate floor: <span className="font-semibold">{snapshot.thresholds.minAcceptedRatePct}%</span></div>
            <div className="border border-border rounded p-3">Negative outcome cap: <span className="font-semibold">{snapshot.thresholds.maxNegativeOutcomeRatePct}%</span></div>
            <div className="border border-border rounded p-3">Hard failure cap: <span className="font-semibold">{snapshot.thresholds.maxHardFailureRatePct}%</span></div>
            <div className="border border-border rounded p-3">Retry cap: <span className="font-semibold">{snapshot.thresholds.maxRetryRatePct}%</span></div>
            <div className="border border-border rounded p-3">Queue stale max: <span className="font-semibold">{snapshot.thresholds.maxQueueStaleMinutes}m</span></div>
            <div className="border border-border rounded p-3">Sending lock max: <span className="font-semibold">{snapshot.thresholds.maxSendingLockMinutes}m</span></div>
            <div className="border border-border rounded p-3">Webhook lag max: <span className="font-semibold">{snapshot.thresholds.maxWebhookLagMinutes}m</span></div>
            <div className="border border-border rounded p-3">Today volume: <span className="font-semibold">{latestDay?.total ?? 0} jobs</span></div>
          </div>
        </Card>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Active Alerts</h2>
            </div>
            <div className="px-5 py-4 space-y-2">
              {snapshot.alerts.length === 0 ? (
                <p className="text-[13px] text-success">No active reliability alerts.</p>
              ) : (
                snapshot.alerts.map(alert => (
                  <Alert key={alert.code} variant={alertVariant(alert.level)}>
                    <AlertTitle>{alert.title}</AlertTitle>
                    <AlertDescription>{alert.detail}</AlertDescription>
                  </Alert>
                ))
              )}
            </div>
          </Card>

          <Card variant="default" className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Domain Reliability</h2>
            </div>
            <div className="px-5 py-4">
              {snapshot.domainBreakdown.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No sends in the selected window.</p>
              ) : (
                <Table className="text-[13px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-muted-foreground">Bucket</TableHead>
                      <TableHead className="text-right text-muted-foreground">Jobs</TableHead>
                      <TableHead className="text-right text-muted-foreground">Accepted</TableHead>
                      <TableHead className="text-right text-muted-foreground">Hard Fail</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {snapshot.domainBreakdown.map(row => (
                      <TableRow key={row.domainBucket}>
                        <TableCell className="text-muted-foreground capitalize">{row.domainBucket}</TableCell>
                        <TableCell className="text-right text-foreground font-semibold">{row.total}</TableCell>
                        <TableCell className="text-right text-foreground font-semibold">{pct(row.acceptedRatePct)}</TableCell>
                        <TableCell className="text-right text-foreground font-semibold">{pct(row.hardFailureRatePct)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </section>

        <Card variant="default" className="overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-[13px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Daily Reliability Trend</h2>
          </div>
          <div className="px-5 py-4 overflow-x-auto">
            {snapshot.daily.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">No daily records yet.</p>
            ) : (
              <Table className="text-[13px] min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-muted-foreground">Date</TableHead>
                    <TableHead className="text-right text-muted-foreground">Jobs</TableHead>
                    <TableHead className="text-right text-muted-foreground">Accepted</TableHead>
                    <TableHead className="text-right text-muted-foreground">Delivered</TableHead>
                    <TableHead className="text-right text-muted-foreground">Replied</TableHead>
                    <TableHead className="text-right text-muted-foreground">Negative</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {snapshot.daily.map(day => (
                    <TableRow key={day.date}>
                      <TableCell className="text-muted-foreground">{day.date}</TableCell>
                      <TableCell className="text-right text-foreground font-semibold">{day.total}</TableCell>
                      <TableCell className="text-right text-foreground font-semibold">{pct(day.acceptedRatePct)}</TableCell>
                      <TableCell className="text-right text-foreground font-semibold">{day.delivered}</TableCell>
                      <TableCell className="text-right text-foreground font-semibold">{day.replied}</TableCell>
                      <TableCell className="text-right text-foreground font-semibold">{pct(day.negativeOutcomeRatePct)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </main>
    </div>
  )
}

