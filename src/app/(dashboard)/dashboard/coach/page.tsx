'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, Badge, Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, Input, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type CommandCenterClient = {
  user_id: string
  name: string | null
  email: string | null
  persona: string | null
  accepted_at: string | null
  last_activity_at: string | null
  risk_score: number
  urgency: 'high' | 'medium' | 'low'
  risk_inputs: {
    momentum_score: number | null
    overdue_actions: number
    days_since_activity: number
    active_pipeline_companies: number
  }
  next_action: {
    action: string | null
    due_date: string | null
    owner: string | null
    status: string | null
  } | null
  weekly_review_summary: {
    week_start: string
    confidence_level: string | null
    momentum_level: string | null
    narrative_drift: boolean
  } | null
}

type CommandCenterResponse = {
  portfolio: {
    total_clients: number
    urgency: { high: number; medium: number; low: number }
    average_risk_score: number
  }
  freshness_sla: {
    stale_clients: number
  }
  pagination: {
    page: number
    page_size: number
    total_clients: number
    total_pages: number
    has_next: boolean
    has_previous: boolean
  }
  monitoring: {
    route: string
    budget_ms: number
    fetch_ms: number
    payload_clients: number
    payload_sessions: number
  }
  upcoming_sessions: Array<{
    user_id: string
    name: string | null
    email: string | null
    scheduled_for: string | null
    owner: string | null
    action: string | null
    urgency: 'high' | 'medium' | 'low'
  }>
  clients: CommandCenterClient[]
}

const PERSONA_LABELS: Record<string, string> = {
  csuite: 'C-Suite',
  vp: 'VP/SVP',
  director: 'Director',
  board: 'Board',
}

export default function CoachDashboard() {
  const [commandCenter, setCommandCenter] = useState<CommandCenterResponse | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSent, setInviteSent] = useState<string | null>(null)
  const [homeLoadMs, setHomeLoadMs] = useState<number | null>(null)

  useEffect(() => {
    const startedAt = performance.now()
    setLoading(true)
    fetch(`/api/coach/command-center?page=${page}&pageSize=25`)
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.clients) && data.portfolio) {
          setCommandCenter(data)
          setHomeLoadMs(Math.round(performance.now() - startedAt))
        }
        else setError('Could not load client data.')
      })
      .catch(() => setError('Could not load client data.'))
      .finally(() => setLoading(false))
  }, [page])

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteEmail.trim() || inviting) return
    setInviting(true)
    setInviteError('')
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      })
      if (res.ok) {
        setInviteSent(inviteEmail.trim())
        setInviteEmail('')
      } else {
        const json = await res.json().catch(() => ({}))
        setInviteError(json.error ?? 'Failed to send invite.')
      }
    } catch {
      setInviteError('Something went wrong.')
    } finally {
      setInviting(false)
    }
  }

  const clients = commandCenter?.clients ?? []
  const atRisk = clients.filter(c => c.urgency === 'high')
  const overdue = clients.filter(c => c.risk_inputs.overdue_actions > 0)
  const actionQueue = clients
    .filter(c => c.next_action?.action)
    .sort((a, b) => {
      const urgencyWeight = { high: 3, medium: 2, low: 1 }
      const urgencyDelta = urgencyWeight[b.urgency] - urgencyWeight[a.urgency]
      if (urgencyDelta !== 0) return urgencyDelta
      const dueA = a.next_action?.due_date ?? '9999-12-31'
      const dueB = b.next_action?.due_date ?? '9999-12-31'
      return dueA.localeCompare(dueB)
    })
    .slice(0, 8)

  const reviewsWithState = clients
    .map((client) => client.weekly_review_summary)
    .filter((review): review is NonNullable<CommandCenterClient['weekly_review_summary']> => Boolean(review))
  const confidenceCounts = {
    low: reviewsWithState.filter((review) => review.confidence_level === 'low').length,
    steady: reviewsWithState.filter((review) => review.confidence_level === 'steady').length,
    strong: reviewsWithState.filter((review) => review.confidence_level === 'strong').length,
  }
  const momentumCounts = {
    slowing: reviewsWithState.filter((review) => review.momentum_level === 'slowing').length,
    building: reviewsWithState.filter((review) => review.momentum_level === 'building').length,
    accelerating: reviewsWithState.filter((review) => review.momentum_level === 'accelerating').length,
  }
  const narrativeDriftCount = reviewsWithState.filter((review) => review.narrative_drift).length

  function urgencyBadgeVariant(urgency: 'high' | 'medium' | 'low'): 'destructive' | 'warning' | 'success' {
    if (urgency === 'high') return 'destructive'
    if (urgency === 'medium') return 'warning'
    return 'success'
  }

  return (
    <div className="min-h-screen bg-card/85 font-sans text-foreground">
      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            &larr; Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6 rounded-2xl border border-border bg-muted/40 px-5 py-5 shadow-xl backdrop-blur-md">
          <div className="text-[13px] font-bold tracking-[0.14em] uppercase text-primary mb-1">Coach</div>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Portfolio Command Center</h1>
          <p className="text-[13px] text-foreground mt-1">
            {clients.length} client{clients.length !== 1 ? 's' : ''} under your account.
          </p>
        </div>

        {!loading && commandCenter && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="rounded-2xl border border-border bg-muted/40 p-3 shadow-xl backdrop-blur-md">
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Total clients</p>
              <p className="text-[24px] font-bold text-foreground mt-1 tabular-nums">{commandCenter.portfolio.total_clients}</p>
            </div>
            <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-3 shadow-xl backdrop-blur-md">
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-destructive">High risk</p>
              <p className="text-[24px] font-bold text-destructive mt-1 tabular-nums">{commandCenter.portfolio.urgency.high}</p>
            </div>
            <div className="rounded-2xl border border-warning/20 bg-warning/10 p-3 shadow-xl backdrop-blur-md">
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-warning">Stale data</p>
              <p className="text-[24px] font-bold text-warning mt-1 tabular-nums">{commandCenter.freshness_sla.stale_clients}</p>
            </div>
            <div className="rounded-2xl border border-border bg-muted/40 p-3 shadow-xl backdrop-blur-md">
              <p className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Avg risk</p>
              <p className="text-[24px] font-bold text-foreground mt-1 tabular-nums">{commandCenter.portfolio.average_risk_score}</p>
            </div>
          </div>
        )}

        {!loading && commandCenter?.monitoring && (
          <div className="rounded-2xl border border-border bg-muted/40 p-4 mb-6 shadow-xl backdrop-blur-md">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-2">Route performance</h2>
            <div className="grid sm:grid-cols-5 gap-3">
              <div>
                <p className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground">Route fetch</p>
                <p className="text-[14px] font-semibold text-foreground tabular-nums">{commandCenter.monitoring.fetch_ms}ms</p>
              </div>
              <div>
                <p className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground">Home load</p>
                <p className="text-[14px] font-semibold text-foreground tabular-nums">{homeLoadMs ?? '-'}ms</p>
              </div>
              <div>
                <p className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground">Budget</p>
                <p className="text-[14px] font-semibold text-foreground tabular-nums">{commandCenter.monitoring.budget_ms}ms</p>
              </div>
              <div>
                <p className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground">Client rows</p>
                <p className="text-[14px] font-semibold text-foreground tabular-nums">{commandCenter.monitoring.payload_clients}</p>
              </div>
              <div>
                <p className="text-[13px] uppercase tracking-[0.08em] text-muted-foreground">Upcoming rows</p>
                <p className="text-[14px] font-semibold text-foreground tabular-nums">{commandCenter.monitoring.payload_sessions}</p>
              </div>
            </div>
          </div>
        )}

        {!loading && (atRisk.length > 0 || overdue.length > 0) && (
          <Alert variant="warning" className="mb-6 backdrop-blur-md">
            <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-warning mb-2">Needs Attention</h2>
            {atRisk.length > 0 && (
              <AlertDescription className="text-foreground mb-1">
                <span className="font-semibold">{atRisk.length}</span> client{atRisk.length !== 1 ? 's' : ''} in high-risk status.
              </AlertDescription>
            )}
            {overdue.length > 0 && (
              <AlertDescription className="text-foreground">
                <span className="font-semibold">{overdue.length}</span> client{overdue.length !== 1 ? 's' : ''} with overdue actions.
              </AlertDescription>
            )}
          </Alert>
        )}

        {!loading && commandCenter && (
          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <Collapsible className="rounded-2xl border border-border bg-muted/40 p-4 shadow-xl backdrop-blur-md">
              <CollapsibleTrigger className="group flex w-full items-center cursor-pointer text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">
                <span className="group-data-panel-open:hidden">▶ Upcoming sessions</span>
                <span className="hidden group-data-panel-open:inline">▼ Upcoming sessions</span>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                {commandCenter.upcoming_sessions.length === 0 ? (
                  <p className="text-[13px] text-muted-foreground">No upcoming sessions or due touchpoints in the current window.</p>
                ) : (
                  <div className="space-y-3">
                    {commandCenter.upcoming_sessions.slice(0, 6).map(session => (
                      <div key={`${session.user_id}-${session.scheduled_for}`} className="border border-border rounded-lg bg-background/30 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[13px] font-semibold text-foreground truncate">{session.name ?? session.email ?? 'Client'}</p>
                          <Badge variant={urgencyBadgeVariant(session.urgency)} className="uppercase tracking-[0.08em]">{session.urgency}</Badge>
                        </div>
                        <p className="text-[13px] text-muted-foreground mt-0.5">Due {session.scheduled_for ?? 'TBD'}{session.owner ? ` · Owner: ${session.owner}` : ''}</p>
                        {session.action && <p className="text-[13px] text-foreground mt-1">{session.action}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-xl backdrop-blur-md">
              <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Priority action queue</h2>
              {actionQueue.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No open actions. Weekly review queue is clear.</p>
              ) : (
                <div className="space-y-3">
                  {actionQueue.map(client => (
                    <div key={client.user_id} className="border border-border rounded-lg bg-background/30 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-[13px] font-semibold text-foreground truncate">{client.name ?? client.email ?? 'Client'}</p>
                        <Badge variant={urgencyBadgeVariant(client.urgency)} className="uppercase tracking-[0.08em]">{client.urgency}</Badge>
                      </div>
                      <p className="text-[13px] text-foreground mt-1">{client.next_action?.action}</p>
                      <p className="text-[13px] text-muted-foreground mt-0.5">Due {client.next_action?.due_date ?? 'TBD'}{client.next_action?.owner ? ` · Owner: ${client.next_action.owner}` : ''}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-muted/40 p-4 shadow-xl backdrop-blur-md">
              <h2 className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Weekly review state</h2>
              {reviewsWithState.length === 0 ? (
                <p className="text-[13px] text-muted-foreground">No saved weekly reviews with state signals yet.</p>
              ) : (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded border border-border bg-background/30 px-2 py-2">
                      <p className="text-[11px] text-muted-foreground">Low</p>
                      <p className="text-[15px] font-bold text-foreground tabular-nums">{confidenceCounts.low}</p>
                    </div>
                    <div className="rounded border border-border bg-background/30 px-2 py-2">
                      <p className="text-[11px] text-muted-foreground">Steady</p>
                      <p className="text-[15px] font-bold text-foreground tabular-nums">{confidenceCounts.steady}</p>
                    </div>
                    <div className="rounded border border-border bg-background/30 px-2 py-2">
                      <p className="text-[11px] text-muted-foreground">Strong</p>
                      <p className="text-[15px] font-bold text-foreground tabular-nums">{confidenceCounts.strong}</p>
                    </div>
                  </div>
                  <p className="text-[12px] text-muted-foreground">
                    Momentum: {momentumCounts.slowing} slowing, {momentumCounts.building} building, {momentumCounts.accelerating} accelerating.
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Narrative drift flagged for <span className="font-semibold text-foreground tabular-nums">{narrativeDriftCount}</span> client{narrativeDriftCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-[12px] text-muted-foreground">
                    Coverage: {reviewsWithState.length}/{clients.length} active clients.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <Card variant="glass" className="gap-0 overflow-hidden mb-8 py-0 shadow-xl">
          {loading ? (
            <div className="px-6 py-10 text-center text-[13px] text-muted-foreground">Loading clients...</div>
          ) : error ? (
            <div className="px-6 py-10 text-center text-[13px] text-destructive">{error}</div>
          ) : clients.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[14px] text-foreground mb-1">No clients yet.</p>
              <p className="text-[13px] text-muted-foreground">Invite a client below to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border hover:bg-transparent">
                  <TableHead className="text-left text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-6 py-3">Client</TableHead>
                  <TableHead className="text-left text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-4 py-3">Level</TableHead>
                  <TableHead className="text-center text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-4 py-3">Risk</TableHead>
                  <TableHead className="text-center text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-4 py-3">Urgency</TableHead>
                  <TableHead className="text-center text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-4 py-3">Overdue</TableHead>
                  <TableHead className="text-left text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-4 py-3">Next action + activity</TableHead>
                  <TableHead className="text-right text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground px-6 py-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border">
                {clients.map(client => (
                  <TableRow key={client.user_id} className={`border-border hover:bg-muted/40 ${client.urgency === 'high' || client.risk_inputs.overdue_actions > 0 ? 'bg-warning/10' : 'bg-background/20'}`}>
                    <TableCell className="whitespace-normal px-6 py-4">
                      <p className="text-[14px] font-semibold text-foreground">{client.name ?? '(not onboarded)'}</p>
                      <p className="text-[13px] text-muted-foreground">{client.email ?? '-'}</p>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className="text-[13px] text-muted-foreground">{client.persona ? (PERSONA_LABELS[client.persona] ?? client.persona) : '-'}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <span className="text-[13px] font-bold text-foreground tabular-nums">{client.risk_score}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      <Badge variant={urgencyBadgeVariant(client.urgency)} className="uppercase tracking-[0.08em]">{client.urgency}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4 text-center">
                      {client.risk_inputs.overdue_actions > 0
                        ? <Badge variant="destructive" className="tabular-nums">{client.risk_inputs.overdue_actions}</Badge>
                        : <span className="text-[13px] text-muted-foreground">-</span>
                      }
                    </TableCell>
                    <TableCell className="whitespace-normal px-4 py-4">
                      {client.next_action?.action ? (
                        <div className="space-y-0.5">
                          <p className="text-[13px] font-semibold text-foreground truncate max-w-[220px]">{client.next_action.action}</p>
                          <p className="text-[13px] text-muted-foreground">
                            {client.next_action.owner ? `Owner: ${client.next_action.owner}` : 'Owner: unassigned'}
                          </p>
                          <p className={`text-[13px] ${client.next_action.due_date && client.next_action.due_date < new Date().toISOString().split('T')[0] ? 'text-destructive' : 'text-muted-foreground'}`}>
                            Due {client.next_action.due_date ?? 'TBD'}{client.next_action.status ? ` · ${client.next_action.status}` : ''}
                          </p>
                          <p className="text-[13px] text-muted-foreground">
                            Last activity {client.last_activity_at ? client.last_activity_at.slice(0, 10) : 'none'} · lag {client.risk_inputs.days_since_activity}d
                          </p>
                        </div>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {client.user_id ? (
                        <Link
                          href={`/dashboard/coach/${client.user_id}`}
                          className="text-[13px] font-semibold text-muted-foreground hover:text-foreground underline underline-offset-2"
                        >
                          View Data
                        </Link>
                      ) : (
                        <span className="text-[13px] text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!loading && commandCenter?.pagination && commandCenter.pagination.total_pages > 1 && (
            <div className="border-t border-border px-6 py-3 flex items-center justify-between">
              <p className="text-[13px] text-muted-foreground">
                Page {commandCenter.pagination.page} of {commandCenter.pagination.total_pages} · {commandCenter.pagination.total_clients} clients
              </p>
              <Pagination className="mx-0 w-auto justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (commandCenter.pagination.has_previous) setPage((prev) => Math.max(1, prev - 1)) }}
                      aria-disabled={!commandCenter.pagination.has_previous}
                      className={`text-foreground border-border ${!commandCenter.pagination.has_previous ? 'pointer-events-none opacity-40' : ''}`}
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => { e.preventDefault(); if (commandCenter.pagination.has_next) setPage((prev) => prev + 1) }}
                      aria-disabled={!commandCenter.pagination.has_next}
                      className={`text-foreground border-border ${!commandCenter.pagination.has_next ? 'pointer-events-none opacity-40' : ''}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </Card>

        <Card variant="glass" className="p-6 shadow-xl">
          <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">Invite a client</p>
          <form onSubmit={sendInvite} className="flex gap-3 items-start">
            <Input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              placeholder="client@email.com"
              className="flex-1 border-border text-foreground bg-background/70"
            />
            <Button
              type="submit"
              disabled={inviting || !inviteEmail.trim()}
              className="shrink-0"
            >
              {inviting ? 'Sending...' : 'Send invite'}
            </Button>
          </form>
          {inviteSent && (
            <Alert variant="success" className="mt-2">
              <AlertDescription>Invite sent to {inviteSent}.</AlertDescription>
            </Alert>
          )}
          {inviteError && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{inviteError}</AlertDescription>
            </Alert>
          )}
          <p className="text-[13px] text-muted-foreground mt-3">
            Your client will receive an email to create their account under your coaching relationship. Up to {Math.max(0, 10 - clients.length)} seat{Math.max(0, 10 - clients.length) !== 1 ? 's' : ''} remaining.
          </p>
        </Card>

      </main>
    </div>
  )
}

