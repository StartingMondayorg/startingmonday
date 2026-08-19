'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

type WeeklyPlanResponse = {
  actions?: string[]
  completions?: boolean[]
  reflection_notes?: string
  momentum_score?: number | null
  history?: Array<{
    week_start: string
    actions: string[]
    completions: boolean[]
    completed_count: number
    reflection_notes: string
  }>
}

function currentMondayIso(): string {
  const now = new Date()
  const day = now.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  now.setDate(now.getDate() + mondayOffset)
  now.setHours(0, 0, 0, 0)
  return now.toISOString().slice(0, 10)
}

function formatWeekLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00`)
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function DashboardPlanPage() {
  const [weekStart, setWeekStart] = useState(currentMondayIso())
  const [actions, setActions] = useState<string[]>(['', '', ''])
  const [completions, setCompletions] = useState<boolean[]>([false, false, false])
  const [reflectionNotes, setReflectionNotes] = useState('')
  const [history, setHistory] = useState<WeeklyPlanResponse['history']>([])
  const [momentumScore, setMomentumScore] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const canSave = useMemo(() => actions.length === 3 && actions.every((action) => action.trim().length > 0), [actions])

  useEffect(() => {
    let ignore = false

    async function loadPlan() {
      setLoading(true)
      setError(null)
      setMessage(null)

      try {
        const qs = new URLSearchParams({ week_start: weekStart })
        const response = await fetch(`/api/plan/weekly?${qs.toString()}`)
        const payload = (await response.json()) as WeeklyPlanResponse
        if (!response.ok) {
          if (!ignore) {
            setError((payload as { error?: string })?.error ?? 'Could not load weekly plan.')
            setActions(['', '', ''])
            setCompletions([false, false, false])
            setReflectionNotes('')
            setHistory([])
            setMomentumScore(null)
          }
          return
        }

        const nextActions = Array.isArray(payload?.actions) ? payload.actions : []
        if (!ignore) {
          setActions([
            typeof nextActions[0] === 'string' ? nextActions[0] : '',
            typeof nextActions[1] === 'string' ? nextActions[1] : '',
            typeof nextActions[2] === 'string' ? nextActions[2] : '',
          ])

          const nextCompletions = Array.isArray(payload?.completions) ? payload.completions : []
          setCompletions([
            Boolean(nextCompletions[0]),
            Boolean(nextCompletions[1]),
            Boolean(nextCompletions[2]),
          ])

          setReflectionNotes(typeof payload?.reflection_notes === 'string' ? payload.reflection_notes : '')
          setHistory(Array.isArray(payload?.history) ? payload.history : [])
          setMomentumScore(typeof payload?.momentum_score === 'number' ? payload.momentum_score : null)
        }
      } catch {
        if (!ignore) {
          setError('Could not load weekly plan.')
          setActions(['', '', ''])
          setCompletions([false, false, false])
          setReflectionNotes('')
          setHistory([])
          setMomentumScore(null)
        }
      } finally {
        if (!ignore) {
          setLoading(false)
        }
      }
    }

    void loadPlan()

    return () => {
      ignore = true
    }
  }, [weekStart])

  async function savePlan() {
    if (!canSave) return

    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/plan/weekly', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, actions, completions, reflection_notes: reflectionNotes }),
      })
      const payload = (await response.json()) as WeeklyPlanResponse
      if (!response.ok) {
        setError((payload as { error?: string })?.error ?? 'Could not save weekly plan.')
        return
      }

      setMessage('Weekly plan saved.')
      const nextActions = Array.isArray(payload?.actions) ? payload.actions : actions
      setActions([
        typeof nextActions[0] === 'string' ? nextActions[0] : '',
        typeof nextActions[1] === 'string' ? nextActions[1] : '',
        typeof nextActions[2] === 'string' ? nextActions[2] : '',
      ])

      const nextCompletions = Array.isArray(payload?.completions) ? payload.completions : completions
      setCompletions([
        Boolean(nextCompletions[0]),
        Boolean(nextCompletions[1]),
        Boolean(nextCompletions[2]),
      ])
      setReflectionNotes(typeof payload?.reflection_notes === 'string' ? payload.reflection_notes : reflectionNotes)
    } catch {
      setError('Could not save weekly plan.')
    } finally {
      setSaving(false)
    }
  }

  async function regeneratePlan(forceOverwrite = false) {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/plan/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart, overwrite: forceOverwrite }),
      })

      const payload = (await response.json()) as WeeklyPlanResponse

      if (response.status === 409 && (payload as { requires_overwrite?: boolean })?.requires_overwrite && !forceOverwrite) {
        const confirmed = window.confirm('This week already has saved actions. Overwrite with regenerated suggestions?')
        if (confirmed) {
          await regeneratePlan(true)
        }
        return
      }

      if (!response.ok) {
        setError((payload as { error?: string })?.error ?? 'Could not regenerate weekly plan.')
        return
      }

      const nextActions = Array.isArray(payload?.actions) ? payload.actions : []
      setActions([
        typeof nextActions[0] === 'string' ? nextActions[0] : '',
        typeof nextActions[1] === 'string' ? nextActions[1] : '',
        typeof nextActions[2] === 'string' ? nextActions[2] : '',
      ])
      const nextCompletions = Array.isArray(payload?.completions) ? payload.completions : [false, false, false]
      setCompletions([
        Boolean(nextCompletions[0]),
        Boolean(nextCompletions[1]),
        Boolean(nextCompletions[2]),
      ])
      setReflectionNotes(typeof payload?.reflection_notes === 'string' ? payload.reflection_notes : '')

      setMessage('Weekly plan regenerated.')
    } catch {
      setError('Could not regenerate weekly plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_26%),linear-gradient(180deg,_#0b1220_0%,_#0a1020_46%,_#0b1324_100%)] font-sans text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-12 max-w-4xl items-center justify-between px-4 sm:h-14 sm:px-6">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <Link
            href="/dashboard"
            className="inline-flex min-h-[44px] items-center rounded-md border border-white/15 bg-white/5 px-3 text-[13px] font-semibold text-slate-200 transition-colors hover:border-white/30 hover:text-white"
          >
            Back to dashboard
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        <Card variant="glass" className="mb-6 px-5 py-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-300">Weekly plan</p>
          <h1 className="mt-1 text-[26px] font-bold leading-tight text-white">Editable three-action operating plan</h1>
          <p className="mt-2 text-[13px] text-slate-200">
            This is the source of truth for Start Here. Choose one relationships move, one opportunities move, and one prep move for the week.
          </p>
          <p className="mt-2 text-[13px] text-slate-300">
            Momentum score: {typeof momentumScore === 'number' ? momentumScore : 'not available yet'}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <Label className="flex flex-col items-start gap-0 text-[13px] text-slate-200">
              Week start (Monday)
              <Input
                type="date"
                value={weekStart}
                onChange={(event) => setWeekStart(event.target.value)}
                className="mt-1 min-h-[44px] w-full text-[13px]"
              />
            </Label>
            <p className="text-[13px] text-slate-300">Week of {formatWeekLabel(weekStart)}</p>
          </div>
        </Card>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {message && (
          <Alert variant="success" className="mb-4">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <Card variant="glass" className="p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
          <div className="space-y-4">
            {[0, 1, 2].map((index) => (
              <article key={index} className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
                <Label htmlFor={`weekly-plan-action-${index}`} className="text-[13px] font-bold tracking-[0.1em] uppercase text-slate-300">
                  Action {index + 1}
                </Label>
                <Textarea
                  id={`weekly-plan-action-${index}`}
                  value={actions[index] ?? ''}
                  onChange={(event) => {
                    const next = [...actions]
                    next[index] = event.target.value
                    setActions(next)
                  }}
                  disabled={loading}
                  className="mt-2 min-h-[96px] w-full text-[13px]"
                />
                <label className="mt-2 inline-flex min-h-[36px] items-center gap-2 text-[13px] text-slate-200">
                  <Checkbox
                    checked={Boolean(completions[index])}
                    onCheckedChange={(checked) => {
                      const next = [...completions]
                      next[index] = checked === true
                      setCompletions(next)
                    }}
                    disabled={loading}
                  />
                  Mark as completed this week
                </label>
              </article>
            ))}

            <div className="rounded-xl border border-white/10 bg-slate-950/30 p-3">
              <Label htmlFor="weekly-plan-reflection" className="text-[13px] font-bold tracking-[0.1em] uppercase text-slate-300">
                Reflection notes
              </Label>
              <Textarea
                id="weekly-plan-reflection"
                value={reflectionNotes}
                onChange={(event) => setReflectionNotes(event.target.value)}
                disabled={loading}
                className="mt-2 min-h-[96px] w-full text-[13px]"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={savePlan}
              disabled={!canSave || loading || saving}
            >
              {saving ? 'Saving...' : 'Save weekly plan'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => void regeneratePlan(false)}
              disabled={loading || saving}
            >
              {saving ? 'Working...' : 'Regenerate suggestions'}
            </Button>
            <p className="text-[13px] text-slate-300">Regenerate and history actions land in the next sprint tickets.</p>
          </div>
        </Card>

        <Card variant="glass" className="mt-6 p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
          <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-slate-300">4-week history</p>
          {history && history.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {history.map((item) => (
                <li key={item.week_start} className="rounded-xl border border-white/10 bg-slate-950/30 px-3 py-2">
                  <p className="text-[13px] font-semibold text-white">Week of {formatWeekLabel(item.week_start)}</p>
                  <p className="mt-1 text-[13px] text-slate-300">Completed {item.completed_count}/3 actions</p>
                  <ul className="mt-2 space-y-1">
                    {item.actions.map((action, index) => (
                      <li key={`${item.week_start}-${index}`} className="text-[13px] text-slate-200">
                        {item.completions[index] ? '[x]' : '-'} {action}
                      </li>
                    ))}
                  </ul>
                  {item.reflection_notes && (
                    <p className="mt-2 text-[13px] text-slate-300">Reflection: {item.reflection_notes}</p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-[13px] text-slate-300">No weekly history yet.</p>
          )}
        </Card>
      </main>
    </div>
  )
}

