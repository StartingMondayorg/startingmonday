'use client'

import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, Button, Card, Collapsible, CollapsibleContent, Input } from '@/components/ui'
type SnoozeState = {
  startDate: string
  endDate: string
}

const STORAGE_KEY = 'dashboard.activity_snooze.v1'

function toLocalIsoDate(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

function addDays(base: Date, days: number): Date {
  const next = new Date(base)
  next.setDate(next.getDate() + days)
  return next
}

function formatRangeDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function readSnoozeState(): SnoozeState | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<SnoozeState>
    if (!parsed.startDate || !parsed.endDate) return null
    if (!/^\d{4}-\d{2}-\d{2}$/.test(parsed.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(parsed.endDate)) return null
    return { startDate: parsed.startDate, endDate: parsed.endDate }
  } catch {
    return null
  }
}

function writeSnoozeState(state: SnoozeState | null) {
  if (state) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } else {
    window.localStorage.removeItem(STORAGE_KEY)
  }
}

export function DashboardActivitySnooze() {
  const [loaded, setLoaded] = useState(false)
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<SnoozeState | null>(null)
  const [startDate, setStartDate] = useState(() => toLocalIsoDate(new Date()))
  const [endDate, setEndDate] = useState(() => toLocalIsoDate(addDays(new Date(), 1)))

  const today = useMemo(() => toLocalIsoDate(new Date()), [])

  useEffect(() => {
    const existing = readSnoozeState()
    if (existing && existing.endDate >= today) {
      setState(existing)
      setStartDate(existing.startDate)
      setEndDate(existing.endDate)
    } else {
      writeSnoozeState(null)
    }
    setLoaded(true)
  }, [today])

  const isActive = !!state && state.startDate <= today && state.endDate >= today
  const customRangeValid = startDate <= endDate

  const applyPreset = (days: number) => {
    const start = toLocalIsoDate(new Date())
    const end = toLocalIsoDate(addDays(new Date(), days))
    const next = { startDate: start, endDate: end }
    setState(next)
    writeSnoozeState(next)
    setOpen(false)
  }

  const applyCustomRange = () => {
    if (!customRangeValid) return
    const next = { startDate, endDate }
    setState(next)
    writeSnoozeState(next)
    setOpen(false)
  }

  const clearSnooze = () => {
    setState(null)
    writeSnoozeState(null)
    setOpen(false)
  }

  if (!loaded) {
    return null
  }

  return (
    <Card
      variant="glass"
      className="mb-4 px-4 py-3 shadow-lg sm:px-5 sm:py-4"
    >
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary">Activity controls</p>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-foreground">
            {isActive && state
              ? `Activity nudges are snoozed through ${formatRangeDate(state.endDate)}.`
              : 'Pause reminders when your search is temporarily not the top priority.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isActive && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen((prev) => !prev)}
              className="min-h-[44px] border-border bg-transparent text-[12px] font-semibold text-muted-foreground hover:text-foreground"
            >
              Snooze activity
            </Button>
          )}
          {isActive && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen((prev) => !prev)}
                className="min-h-[44px] border-border bg-transparent text-[12px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Edit snooze
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={clearSnooze}
                className="min-h-[44px] border-primary/50 bg-primary/10 text-[12px] font-semibold text-primary hover:text-foreground"
              >
                Resume activity
              </Button>
            </>
          )}
        </div>
      </div>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleContent className="mt-3 rounded-xl border border-border bg-muted/40 p-3 sm:p-4">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Quick options</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => applyPreset(1)}
              className="min-h-[44px] border-border bg-transparent text-[12px] font-semibold text-foreground"
            >
              Snooze 1 day
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => applyPreset(7)}
              className="min-h-[44px] border-border bg-transparent text-[12px] font-semibold text-foreground"
            >
              Snooze 1 week
            </Button>
          </div>

          <p className="mt-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground">Custom date range</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-[12px] text-foreground">
              Start
              <Input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 min-h-[44px] w-full border-border bg-background/40 text-[12px] text-foreground"
              />
            </label>
            <label className="text-[12px] text-foreground">
              End
              <Input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 min-h-[44px] w-full border-border bg-background/40 text-[12px] text-foreground"
              />
            </label>
            <Button
              type="button"
              variant="outline"
              disabled={!customRangeValid}
              onClick={applyCustomRange}
              className="min-h-[44px] justify-center border-primary/40 bg-primary/10 text-[12px] font-semibold text-primary hover:text-foreground disabled:opacity-50"
            >
              Apply range
            </Button>
          </div>
          {!customRangeValid && (
            <Alert variant="warning" className="mt-2 border-none bg-transparent px-0 py-0 text-[12px] text-warning">
              <AlertDescription className="text-[12px] text-warning">
                End date must be the same as or after start date.
              </AlertDescription>
            </Alert>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
