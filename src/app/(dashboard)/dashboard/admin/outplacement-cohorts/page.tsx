'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Alert, AlertDescription, Badge, Button, Card, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
type Cohort = {
  cohortId: string
  partnerId: string
  partnerName: string
  cohortKey: string
  program: string
  rosterSize: number
  milestones: Array<{ id: string; label: string; completionRate: number; completedUsers: number }>
  sponsorSnapshot: {
    status: 'on_track' | 'needs_attention' | 'at_risk'
    fields: {
      roster_size: number
      active_seats: number
      milestone_completion_rate: number
      cadence_adherence_rate: number
    }
  }
}

type CohortResponse = {
  ok: boolean
  summary: {
    cohort_count: number
    roster_users: number
    on_track: number
    needs_attention: number
    at_risk: number
  }
  cohorts: Cohort[]
}

export default function OutplacementCohortsAdminPage() {
  const [data, setData] = useState<CohortResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [cohortForm, setCohortForm] = useState({ partnerId: '', partnerName: '', cohortKey: '' })

  async function loadCohorts() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/automation/reporting/outplacement-cohort-admin', { method: 'GET' })
      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error ?? 'Failed to load cohorts')
      setData(json)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load cohorts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadCohorts()
  }, [])

  async function createCohort(event: React.FormEvent) {
    event.preventDefault()
    if (!cohortForm.partnerId.trim() || !cohortForm.cohortKey.trim()) return

    setCreating(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/automation/reporting/outplacement-cohort-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_cohort',
          cohortId: `${cohortForm.partnerId.trim()}-${cohortForm.cohortKey.trim()}`,
          partnerId: cohortForm.partnerId.trim(),
          partnerName: cohortForm.partnerName.trim() || 'Manual cohort',
          cohortKey: cohortForm.cohortKey.trim(),
          note: 'Created from admin console',
        }),
      })

      const json = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(json.error ?? 'Failed to create cohort')

      setData((current) => current ? { ...current, cohorts: json.cohorts, summary: json.summary } : current)
      setCohortForm({ partnerId: '', partnerName: '', cohortKey: '' })
      setMessage('Cohort created and audited.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to create cohort')
    } finally {
      setCreating(false)
    }
  }

  async function markMilestone(c: Cohort, milestoneId: string) {
    const completedUsers = c.rosterSize
    const response = await fetch('/api/admin/automation/reporting/outplacement-cohort-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_milestone',
        cohortId: c.cohortId,
        milestoneId,
        completedUsers,
        note: `Set ${milestoneId} to full completion from admin console`,
      }),
    })

    const json = await response.json().catch(() => ({}))
    if (!response.ok) {
      setMessage(json.error ?? 'Failed to update milestone')
      return
    }

    setData((current) => current ? { ...current, cohorts: json.cohorts, summary: json.summary } : current)
    setMessage(`Milestone ${milestoneId} updated.`)
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/dashboard/admin" className="text-[13px] text-muted-foreground hover:text-foreground">← Admin</Link>
          <h1 className="text-[16px] font-bold text-foreground">Outplacement Cohorts</h1>
          <Button type="button" variant="outline" onClick={() => void loadCohorts()}>
            Refresh
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {message && (
          <Alert>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Card variant="default" className="p-4 grid sm:grid-cols-5 gap-3">
          <div>
            <p className="text-[13px] tracking-[0.08em] text-muted-foreground">Cohorts</p>
            <p className="text-[24px] font-bold text-foreground">{data?.summary.cohort_count ?? 0}</p>
          </div>
          <div>
            <p className="text-[13px] tracking-[0.08em] text-muted-foreground">Roster users</p>
            <p className="text-[24px] font-bold text-foreground">{data?.summary.roster_users ?? 0}</p>
          </div>
          <div>
            <p className="text-[13px] tracking-[0.08em] text-muted-foreground">On track</p>
            <p className="text-[24px] font-bold text-success">{data?.summary.on_track ?? 0}</p>
          </div>
          <div>
            <p className="text-[13px] tracking-[0.08em] text-muted-foreground">Needs attention</p>
            <p className="text-[24px] font-bold text-warning">{data?.summary.needs_attention ?? 0}</p>
          </div>
          <div>
            <p className="text-[13px] tracking-[0.08em] text-muted-foreground">At risk</p>
            <p className="text-[24px] font-bold text-destructive">{data?.summary.at_risk ?? 0}</p>
          </div>
        </Card>

        <Card variant="default" className="p-4">
          <h2 className="text-[13px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">Create cohort</h2>
          <form className="grid sm:grid-cols-4 gap-3" onSubmit={createCohort}>
            <div className="grid gap-1.5">
              <Label htmlFor="cohort-partner-id">partner_id</Label>
              <Input
                id="cohort-partner-id"
                value={cohortForm.partnerId}
                onChange={(event) => setCohortForm((current) => ({ ...current, partnerId: event.target.value }))}
                placeholder="partner_id"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cohort-partner-name">partner_name</Label>
              <Input
                id="cohort-partner-name"
                value={cohortForm.partnerName}
                onChange={(event) => setCohortForm((current) => ({ ...current, partnerName: event.target.value }))}
                placeholder="partner_name"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="cohort-key">YYYY-MM</Label>
              <Input
                id="cohort-key"
                value={cohortForm.cohortKey}
                onChange={(event) => setCohortForm((current) => ({ ...current, cohortKey: event.target.value }))}
                placeholder="YYYY-MM"
              />
            </div>
            <Button type="submit" disabled={creating} className="self-end">
              {creating ? 'Creating...' : 'Create cohort'}
            </Button>
          </form>
        </Card>

        <Card variant="default" className="overflow-hidden">
          {loading ? (
            <div className="px-4 py-8 text-[13px] text-muted-foreground text-center">Loading cohorts...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-[13px] tracking-[0.08em] text-muted-foreground">Cohort</TableHead>
                  <TableHead className="text-[13px] tracking-[0.08em] text-muted-foreground">Program</TableHead>
                  <TableHead className="text-center text-[13px] tracking-[0.08em] text-muted-foreground">Roster</TableHead>
                  <TableHead className="text-center text-[13px] tracking-[0.08em] text-muted-foreground">Completion</TableHead>
                  <TableHead className="text-center text-[13px] tracking-[0.08em] text-muted-foreground">Status</TableHead>
                  <TableHead className="text-right text-[13px] tracking-[0.08em] text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(data?.cohorts ?? []).map((cohort) => (
                  <TableRow key={cohort.cohortId}>
                    <TableCell>
                      <p className="text-[13px] font-semibold text-foreground">{cohort.partnerName}</p>
                      <p className="text-[13px] text-muted-foreground">{cohort.cohortKey}</p>
                    </TableCell>
                    <TableCell className="text-[13px] text-muted-foreground">{cohort.program}</TableCell>
                    <TableCell className="text-center text-[13px] font-semibold text-foreground tabular-nums">{cohort.rosterSize}</TableCell>
                    <TableCell className="text-center text-[13px] font-semibold text-foreground tabular-nums">{cohort.sponsorSnapshot.fields.milestone_completion_rate.toFixed(2)}%</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={
                          cohort.sponsorSnapshot.status === 'on_track'
                            ? 'success'
                            : cohort.sponsorSnapshot.status === 'needs_attention'
                              ? 'warning'
                              : 'destructive'
                        }
                      >
                        {cohort.sponsorSnapshot.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="link"
                        onClick={() => void markMilestone(cohort, 'prep_ready')}
                      >
                        Mark prep ready
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </main>
    </div>
  )
}
