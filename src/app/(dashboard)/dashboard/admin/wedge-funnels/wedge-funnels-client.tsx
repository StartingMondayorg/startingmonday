'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type LoadState<T> =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'ready'; data: T }

type ScorecardResponse = {
  generated_at: string
  lookback_days: number
  shortlist: {
    viewed_users: number
    cta_click_users: number
    checkout_started_users: number
    purchased_users: number
    delivered_users: number
    credit_applied_users: number
    cta_click_through_rate: number
    checkout_start_rate: number
    purchase_rate_from_checkout: number
    delivery_completion_rate: number
    credit_application_rate: number
  }
  pilot: {
    seats_total: number
    seats_active_rate: number
    at_risk_seats: number
    partner_accounts_active: number
    seat_updates_logged: number
  }
  decision: {
    motion1_direct_paid_sprint: 'scale' | 'iterate' | 'stop'
    motion2_partner_pilot: 'scale' | 'iterate' | 'stop'
    summary: 'scale' | 'iterate' | 'stop'
    reasons: string[]
  }
  snapshot_history: Array<{
    week_start: string
    generated_at: string
    lookback_days: number
    shortlist_purchase_rate_from_checkout: number
    shortlist_delivery_completion_rate: number
    pilot_seats_active_rate: number
    pilot_at_risk_seats: number
    decision_summary: string
  }>
  trend: {
    purchase_rate_from_checkout_delta: number
    delivery_completion_rate_delta: number
    seats_active_rate_delta: number
    at_risk_seats_delta: number
  } | null
  cron_runs: Array<{
    triggered_at: string
    finished_at: string | null
    duration_ms: number
    lookback_days: number
    success: boolean
    decision_summary: string | null
    snapshot_history_count: number
    http_status: number
    error_message: string | null
  }>
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(payload.error ?? `Request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

function StatusBadge({ ok, children }: { ok: boolean; children: ReactNode }) {
  return (
    <Badge variant={ok ? 'success' : 'destructive'} className="rounded-full">
      {children}
    </Badge>
  )
}

function DecisionBadge({ decision }: { decision: 'scale' | 'iterate' | 'stop' }) {
  const variant = decision === 'scale' ? 'success' : decision === 'iterate' ? 'warning' : 'destructive'
  return (
    <Badge variant={variant} className="rounded-full">
      {decision}
    </Badge>
  )
}

export default function WedgeFunnelsClient() {
  const [scorecard, setScorecard] = useState<LoadState<ScorecardResponse>>({ status: 'loading' })
  const [persisting, setPersisting] = useState(false)
  const [persistError, setPersistError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadScorecard() {
      const scorecardResult = await fetchJson<ScorecardResponse>('/api/admin/automation/reporting/wedge-funnel-scorecard?lookbackDays=30')
        .then((data) => ({ ok: true as const, data }))
        .catch((error: unknown) => ({ ok: false as const, error }))

      if (cancelled) return

      if (scorecardResult.ok) {
        setScorecard({ status: 'ready', data: scorecardResult.data })
      } else {
        setScorecard({ status: 'error', error: scorecardResult.error instanceof Error ? scorecardResult.error.message : 'Unable to load wedge scorecard.' })
      }
    }

    void loadScorecard()
    return () => {
      cancelled = true
    }
  }, [])

  const systemHealthy = useMemo(() => {
    return scorecard.status === 'ready'
  }, [scorecard.status])

  const shortlistMetrics = scorecard.status === 'ready' ? scorecard.data.shortlist : null
  const pilotMetrics = scorecard.status === 'ready' ? scorecard.data.pilot : null
  const decision = scorecard.status === 'ready' ? scorecard.data.decision : null
  const snapshotHistory = scorecard.status === 'ready' ? scorecard.data.snapshot_history : []
  const trend = scorecard.status === 'ready' ? scorecard.data.trend : null
  const cronRuns = scorecard.status === 'ready' ? scorecard.data.cron_runs : []

  function deltaText(value: number, suffix = ''): string {
    const sign = value > 0 ? '+' : ''
    return `${sign}${value}${suffix}`
  }

  async function persistWeeklySnapshot() {
    setPersisting(true)
    setPersistError(null)

    try {
      const response = await fetch('/api/admin/automation/reporting/wedge-funnel-scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lookbackDays: 30 }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        setPersistError(payload.error ?? 'Unable to persist weekly snapshot.')
        return
      }

      const refreshed = await fetchJson<ScorecardResponse>('/api/admin/automation/reporting/wedge-funnel-scorecard?lookbackDays=30')
      setScorecard({ status: 'ready', data: refreshed })
    } catch {
      setPersistError('Unable to persist weekly snapshot.')
    } finally {
      setPersisting(false)
    }
  }

  return (
    <>
      <Card variant="glass" className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[13px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Unified wedge monitor</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Single pane for shortlist and partner pilot health.</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge ok={systemHealthy}>{systemHealthy ? 'all feeds healthy' : 'attention needed'}</StatusBadge>
            <Button
              type="button"
              variant="outline"
              onClick={persistWeeklySnapshot}
              disabled={persisting}
              className="rounded-full"
            >
              {persisting ? 'Saving...' : 'Save weekly snapshot'}
            </Button>
          </div>
        </div>
        {persistError ? <p className="mt-3 text-[13px] text-destructive">{persistError}</p> : null}

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <a href="/api/admin/automation/reporting/wedge-funnel-scorecard?lookbackDays=30" className="block">
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              Wedge scorecard API
            </Card>
          </a>
          <a href="/api/admin/automation/reporting/shortlist-sprint-funnel?lookbackDays=30" className="block">
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              Shortlist funnel API
            </Card>
          </a>
          <a href="/api/admin/automation/reporting/wedge-epic-closeout?lookbackDays=30" className="block">
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              SMK-395/398/401 closeout artifact API
            </Card>
          </a>
          <a href="/api/cron/wedge-weekly-scorecard" className="block sm:col-span-2">
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              Weekly cron trigger API (requires cron secret)
            </Card>
          </a>
        </div>
      </Card>

      <Card variant="glass" className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Scale or stop decision gate</p>
          {decision ? <DecisionBadge decision={decision.summary} /> : null}
        </div>
        {scorecard.status === 'loading' ? <p className="mt-3 text-[13px] text-muted-foreground">Loading...</p> : null}
        {scorecard.status === 'error' ? <p className="mt-3 text-[13px] text-destructive">{scorecard.error}</p> : null}
        {decision ? (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[13px] text-foreground">
              <p>Direct paid sprint: <span className="font-semibold text-foreground">{decision.motion1_direct_paid_sprint}</span></p>
              <p className="mt-1">Partner pilot: <span className="font-semibold text-foreground">{decision.motion2_partner_pilot}</span></p>
            </Card>
            <ul className="space-y-1.5 text-[13px] text-foreground">
              {decision.reasons.map((reason) => (
                <li key={reason} className="flex gap-2"><span className="text-primary">+</span><span>{reason}</span></li>
              ))}
            </ul>
          </div>
        ) : null}

        {trend ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              <p className="text-muted-foreground">Purchase WoW</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{deltaText(trend.purchase_rate_from_checkout_delta, '%')}</p>
            </Card>
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              <p className="text-muted-foreground">Delivery WoW</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{deltaText(trend.delivery_completion_rate_delta, '%')}</p>
            </Card>
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              <p className="text-muted-foreground">Seats Active WoW</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{deltaText(trend.seats_active_rate_delta, '%')}</p>
            </Card>
            <Card variant="glass" className="border-border bg-background/40 p-3 text-[12px] text-foreground">
              <p className="text-muted-foreground">At-risk Seats WoW</p>
              <p className="mt-1 text-[14px] font-semibold text-foreground">{deltaText(trend.at_risk_seats_delta)}</p>
            </Card>
          </div>
        ) : null}
      </Card>

      <Card variant="glass" className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Weekly snapshot history</p>
          <span className="text-[12px] text-muted-foreground">Latest 8 weeks</span>
        </div>

        {snapshotHistory.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">No snapshots saved yet. Use Save weekly snapshot to persist the current run.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table className="text-left text-[12px] text-foreground">
              <TableHeader>
                <TableRow className="border-border text-muted-foreground">
                  <TableHead className="py-2 pr-4">Week</TableHead>
                  <TableHead className="py-2 pr-4">Purchase rate</TableHead>
                  <TableHead className="py-2 pr-4">Delivery rate</TableHead>
                  <TableHead className="py-2 pr-4">Seats active</TableHead>
                  <TableHead className="py-2 pr-4">At-risk seats</TableHead>
                  <TableHead className="py-2 pr-4">Decision</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshotHistory.map((row) => (
                  <TableRow key={`${row.week_start}-${row.generated_at}`} className="border-border">
                    <TableCell className="py-2 pr-4">{row.week_start}</TableCell>
                    <TableCell className="py-2 pr-4">{row.shortlist_purchase_rate_from_checkout}%</TableCell>
                    <TableCell className="py-2 pr-4">{row.shortlist_delivery_completion_rate}%</TableCell>
                    <TableCell className="py-2 pr-4">{row.pilot_seats_active_rate}%</TableCell>
                    <TableCell className="py-2 pr-4">{row.pilot_at_risk_seats}</TableCell>
                    <TableCell className="py-2 pr-4"><DecisionBadge decision={row.decision_summary as 'scale' | 'iterate' | 'stop'} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <Card variant="glass" className="mt-6 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Cron execution log</p>
          <span className="text-[12px] text-muted-foreground">Latest 8 runs</span>
        </div>

        {cronRuns.length === 0 ? (
          <p className="mt-3 text-[13px] text-muted-foreground">No cron runs logged yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <Table className="text-left text-[12px] text-foreground">
              <TableHeader>
                <TableRow className="border-border text-muted-foreground">
                  <TableHead className="py-2 pr-4">Triggered</TableHead>
                  <TableHead className="py-2 pr-4">Duration</TableHead>
                  <TableHead className="py-2 pr-4">HTTP</TableHead>
                  <TableHead className="py-2 pr-4">Decision</TableHead>
                  <TableHead className="py-2 pr-4">Status</TableHead>
                  <TableHead className="py-2 pr-4">Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cronRuns.map((run) => (
                  <TableRow key={run.triggered_at} className="border-border">
                    <TableCell className="py-2 pr-4">{new Date(run.triggered_at).toISOString()}</TableCell>
                    <TableCell className="py-2 pr-4">{run.duration_ms}ms</TableCell>
                    <TableCell className="py-2 pr-4">{run.http_status}</TableCell>
                    <TableCell className="py-2 pr-4">{run.decision_summary ?? '-'}</TableCell>
                    <TableCell className="py-2 pr-4"><StatusBadge ok={run.success}>{run.success ? 'success' : 'failed'}</StatusBadge></TableCell>
                    <TableCell className="py-2 pr-4">{run.error_message ?? '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Shortlist sprint</p>
            <StatusBadge ok={scorecard.status === 'ready'}>{scorecard.status}</StatusBadge>
          </div>
          {scorecard.status === 'loading' ? <p className="mt-3 text-[13px] text-muted-foreground">Loading...</p> : null}
          {scorecard.status === 'error' ? <p className="mt-3 text-[13px] text-destructive">{scorecard.error}</p> : null}
          {shortlistMetrics ? (
            <div className="mt-3 space-y-2 text-[13px] text-foreground">
              <p>Viewed users: <span className="font-semibold text-foreground">{shortlistMetrics.viewed_users}</span></p>
              <p>CTA click-through: <span className="font-semibold text-foreground">{shortlistMetrics.cta_click_through_rate}%</span></p>
              <p>Checkout start rate: <span className="font-semibold text-foreground">{shortlistMetrics.checkout_start_rate}%</span></p>
              <p>Purchase from checkout: <span className="font-semibold text-foreground">{shortlistMetrics.purchase_rate_from_checkout}%</span></p>
              <p>Delivery completion: <span className="font-semibold text-foreground">{shortlistMetrics.delivery_completion_rate}%</span></p>
              <p>Credit application: <span className="font-semibold text-foreground">{shortlistMetrics.credit_application_rate}%</span></p>
            </div>
          ) : null}
        </Card>

        <Card variant="glass" className="p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Partner pilot</p>
            <StatusBadge ok={scorecard.status === 'ready'}>{scorecard.status}</StatusBadge>
          </div>
          {scorecard.status === 'loading' ? <p className="mt-3 text-[13px] text-muted-foreground">Loading...</p> : null}
          {scorecard.status === 'error' ? <p className="mt-3 text-[13px] text-destructive">{scorecard.error}</p> : null}
          {pilotMetrics ? (
            <div className="mt-3 space-y-2 text-[13px] text-foreground">
              <p>Seats total: <span className="font-semibold text-foreground">{pilotMetrics.seats_total}</span></p>
              <p>Seats active rate: <span className="font-semibold text-foreground">{pilotMetrics.seats_active_rate}%</span></p>
              <p>At-risk seats: <span className="font-semibold text-foreground">{pilotMetrics.at_risk_seats}</span></p>
              <p>Seat updates logged: <span className="font-semibold text-foreground">{pilotMetrics.seat_updates_logged}</span></p>
              <p>Partner accounts active: <span className="font-semibold text-foreground">{pilotMetrics.partner_accounts_active}</span></p>
            </div>
          ) : null}
        </Card>

      </section>
    </>
  )
}
