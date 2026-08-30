'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card } from '@/components/ui'
type Seat = {
  owner: string
  activeClients: number
  weeklyActions: number
  status: 'Active' | 'At risk'
  lastUpdatedAt: string | null
}

type SummaryResponse = {
  ok: boolean
  generated_at: string
  summary: {
    seats_total: number
    seats_active_rate: number
    at_risk_seats: number
    weekly_actions_total: number
    active_clients_total: number
    partner_accounts_active: number
  }
  seats: Seat[]
}

export default function PartnerPilotAdminClient() {
  const [seats, setSeats] = useState<Seat[]>([])
  const [summary, setSummary] = useState<SummaryResponse['summary'] | null>(null)
  const [loading, setLoading] = useState(true)
  const [savingSeat, setSavingSeat] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/partners/pilot-admin/summary', { cache: 'no-store' })
      if (!response.ok) {
        if (response.status === 401) {
          setError('Sign in to access pilot admin reporting and seat controls.')
          setSeats([])
          setSummary(null)
          return
        }

        const payload = await response.json().catch(() => ({})) as { error?: string }
        setError(payload.error ?? 'Unable to load pilot summary.')
        return
      }

      const payload = await response.json() as SummaryResponse
      setSeats(payload.seats)
      setSummary(payload.summary)
    } catch {
      setError('Unable to load pilot summary.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const hasSeats = useMemo(() => seats.length > 0, [seats])

  async function updateSeatStatus(seat: Seat, nextStatus: 'active' | 'at_risk') {
    const currentStatus = seat.status === 'At risk' ? 'at_risk' : 'active'
    if (currentStatus === nextStatus) return

    setSavingSeat(seat.owner)
    setError(null)

    try {
      const response = await fetch('/api/partners/pilot-admin/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seatOwner: seat.owner,
          previousStatus: currentStatus,
          nextStatus,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: string }
        setError(payload.error ?? 'Unable to update seat status.')
        return
      }

      await load()
    } catch {
      setError('Unable to update seat status.')
    } finally {
      setSavingSeat(null)
    }
  }

  return (
    <>
      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card variant="glass" className="rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-primary">Seats total</p>
          <p className="mt-2 text-[24px] font-semibold text-foreground">{summary?.seats_total ?? 0}</p>
        </Card>
        <Card variant="glass" className="rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-primary">Seats active rate</p>
          <p className="mt-2 text-[24px] font-semibold text-foreground">{summary?.seats_active_rate ?? 0}%</p>
        </Card>
        <Card variant="glass" className="rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-primary">At-risk seats</p>
          <p className="mt-2 text-[24px] font-semibold text-foreground">{summary?.at_risk_seats ?? 0}</p>
        </Card>
        <Card variant="glass" className="rounded-xl p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-primary">Weekly actions total</p>
          <p className="mt-2 text-[24px] font-semibold text-foreground">{summary?.weekly_actions_total ?? 0}</p>
        </Card>
      </section>

      {loading ? <p className="mt-5 text-[13px] text-muted-foreground">Loading seat activity...</p> : null}
      {error ? <p className="mt-5 text-[13px] text-destructive">{error}</p> : null}

      {hasSeats ? (
        <section className="mt-5 grid gap-3">
          {seats.map((seat) => {
            const isAtRisk = seat.status === 'At risk'
            return (
              <Card key={seat.owner} variant="glass" className="rounded-xl p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-[14px] font-semibold text-foreground">{seat.owner}</h2>
                  <Badge variant="outline" className="rounded-full !border-border !bg-muted/[0.06] px-2.5 py-1 text-[11px] font-semibold text-primary">{seat.status}</Badge>
                </div>
                <p className="mt-2 text-[13px] text-foreground">Active clients: {seat.activeClients}</p>
                <p className="mt-1 text-[13px] text-foreground">Weekly relationship actions: {seat.weeklyActions}</p>
                <p className="mt-1 text-[12px] text-muted-foreground">Last update: {seat.lastUpdatedAt ?? 'no updates logged yet'}</p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingSeat === seat.owner || !isAtRisk}
                    onClick={() => updateSeatStatus(seat, 'active')}
                    className="rounded-full !border-border !bg-transparent px-3 py-1.5 text-[12px] font-semibold !text-foreground hover:!border-primary/70 hover:!bg-muted/40"
                  >
                    {savingSeat === seat.owner ? 'Saving...' : 'Mark active'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={savingSeat === seat.owner || isAtRisk}
                    onClick={() => updateSeatStatus(seat, 'at_risk')}
                    className="rounded-full !border-border !bg-transparent px-3 py-1.5 text-[12px] font-semibold !text-foreground hover:!border-primary/70 hover:!bg-muted/40"
                  >
                    {savingSeat === seat.owner ? 'Saving...' : 'Mark at risk'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </section>
      ) : null}
    </>
  )
}
