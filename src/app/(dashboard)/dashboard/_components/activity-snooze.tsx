'use client'

import { useEffect, useMemo, useState } from 'react'

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
    <section className="mb-4 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 shadow-[0_16px_40px_rgba(15,23,42,0.12)] backdrop-blur-md sm:px-5 sm:py-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-300">Activity controls</p>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-slate-200">
            {isActive && state
              ? `Activity nudges are snoozed through ${formatRangeDate(state.endDate)}.`
              : 'Pause reminders when your search is temporarily not the top priority.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isActive && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex min-h-[44px] items-center rounded-md border border-white/25 px-3 text-[12px] font-semibold text-slate-100 hover:border-white/40 hover:text-white"
            >
              Snooze activity
            </button>
          )}
          {isActive && (
            <>
              <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                className="inline-flex min-h-[44px] items-center rounded-md border border-white/25 px-3 text-[12px] font-semibold text-slate-100 hover:border-white/40 hover:text-white"
              >
                Edit snooze
              </button>
              <button
                type="button"
                onClick={clearSnooze}
                className="inline-flex min-h-[44px] items-center rounded-md border border-orange-300/50 bg-orange-500/20 px-3 text-[12px] font-semibold text-orange-100 hover:text-white"
              >
                Resume activity
              </button>
            </>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
          <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-300">Quick options</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyPreset(1)}
              className="inline-flex min-h-[44px] items-center rounded-md border border-white/20 px-3 text-[12px] font-semibold text-slate-100 hover:border-white/35"
            >
              Snooze 1 day
            </button>
            <button
              type="button"
              onClick={() => applyPreset(7)}
              className="inline-flex min-h-[44px] items-center rounded-md border border-white/20 px-3 text-[12px] font-semibold text-slate-100 hover:border-white/35"
            >
              Snooze 1 week
            </button>
          </div>

          <p className="mt-3 text-[11px] font-semibold tracking-[0.08em] uppercase text-slate-300">Custom date range</p>
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="text-[12px] text-slate-200">
              Start
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="mt-1 block min-h-[44px] w-full rounded-md border border-white/20 bg-slate-950/40 px-2 text-[12px] text-slate-100"
              />
            </label>
            <label className="text-[12px] text-slate-200">
              End
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="mt-1 block min-h-[44px] w-full rounded-md border border-white/20 bg-slate-950/40 px-2 text-[12px] text-slate-100"
              />
            </label>
            <button
              type="button"
              disabled={!customRangeValid}
              onClick={applyCustomRange}
              className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-orange-300/40 bg-orange-500/20 px-3 text-[12px] font-semibold text-orange-100 hover:text-white disabled:opacity-50"
            >
              Apply range
            </button>
          </div>
          {!customRangeValid && (
            <p className="mt-2 text-[12px] text-amber-200">End date must be the same as or after start date.</p>
          )}
        </div>
      )}
    </section>
  )
}
