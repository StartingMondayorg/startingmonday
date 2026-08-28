'use client'

import Link from 'next/link'
import { usePostHog } from 'posthog-js/react'
import { useEffect, useRef, useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Textarea } from '@/components/ui'
export type DailyMomentumAction = {
  body: string
  cta: string
  effortMinutes: number
  href: string
  id: string
  title: string
  track: 'relationship' | 'readiness' | 'focus'
  whyNow?: string
  whyYou?: string
  links?: { label: string; href: string }[]
}

type DailyMomentumPlanProps = {
  actions: DailyMomentumAction[]
  dateKey: string
  status: 'low' | 'medium' | 'strong'
}

type DailyMomentumState = {
  completed: Record<string, boolean>
  notes: Record<string, string>
  reflection: string
}

const STATUS_COPY: Record<DailyMomentumPlanProps['status'], { chip: string; accent: string; body: string }> = {
  low: {
    chip: 'Steady start',
    accent: 'border-border/35 bg-muted/60 text-foreground',
    body: 'Keep today narrow. Finish two actions and leave the rest for tomorrow.',
  },
  medium: {
    chip: 'Momentum building',
    accent: 'border-warning/40 bg-warning/10 text-warning',
    body: 'You have enough signal to move. Protect the top three actions before opening more tabs.',
  },
  strong: {
    chip: 'Strong momentum',
    accent: 'border-success/40 bg-success/10 text-success',
    body: 'The pipeline is giving you something to work with. Convert it into clean follow-through today.',
  },
}

function buildInitialState(actions: DailyMomentumAction[]): DailyMomentumState {
  return {
    completed: Object.fromEntries(actions.map((action) => [action.id, false])),
    notes: Object.fromEntries(actions.map((action) => [action.id, ''])),
    reflection: '',
  }
}

export function DailyMomentumPlan({ actions, dateKey, status }: DailyMomentumPlanProps) {
  const ph = usePostHog()
  const storageKey = `sm_daily_momentum_plan:${dateKey}`
  const [state, setState] = useState<DailyMomentumState>(() => buildInitialState(actions))
  const [openNoteId, setOpenNoteId] = useState<string | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const loadedEventSent = useRef(false)
  const submittedReflections = useRef<Set<string>>(new Set())

  useEffect(() => {
    const nextState = buildInitialState(actions)
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) {
        setState(nextState)
        setHydrated(true)
        return
      }

      const parsed = JSON.parse(raw) as Partial<DailyMomentumState>
      setState({
        completed: { ...nextState.completed, ...(parsed.completed ?? {}) },
        notes: { ...nextState.notes, ...(parsed.notes ?? {}) },
        reflection: typeof parsed.reflection === 'string' ? parsed.reflection : '',
      })
    } catch {
      setState(nextState)
    } finally {
      setHydrated(true)
    }
  }, [actions, storageKey])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [hydrated, state, storageKey])

  useEffect(() => {
    if (!hydrated || loadedEventSent.current) return
    loadedEventSent.current = true

    const properties = {
      action_count: actions.length,
      date_key: dateKey,
      momentum_status: status,
    }

    try {
      ph?.capture('emi_daily_loop_loaded', properties)
    } catch {
      // never block the dashboard
    }

    try {
      void fetch('/api/events/daily-momentum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'emi_daily_loop_loaded', properties }),
        keepalive: true,
      })
    } catch {
      // never block the dashboard
    }
  }, [actions.length, dateKey, hydrated, ph, status])

  const completedCount = actions.filter((action) => state.completed[action.id]).length
  const isDayComplete = completedCount >= 2
  const statusCopy = STATUS_COPY[status]
  const statusChip = completedCount === 0 ? 'Day not started' : statusCopy.chip

  function emitActionCompleted(action: DailyMomentumAction, nextCompletedCount: number) {
    const properties = {
      action_id: action.id,
      action_track: action.track,
      completed_count: nextCompletedCount,
      date_key: dateKey,
      effort_minutes: action.effortMinutes,
      momentum_status: status,
      note_present: Boolean(state.notes[action.id]?.trim()),
    }

    try {
      ph?.capture('emi_action_completed', properties)
    } catch {
      // never block the dashboard
    }

    try {
      void fetch('/api/events/daily-momentum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'emi_action_completed', properties }),
        keepalive: true,
      })
    } catch {
      // never block the dashboard
    }
  }

  function emitReflectionSubmitted(reflection: string) {
    const trimmed = reflection.trim()
    if (!trimmed) return
    const signature = `${dateKey}:${trimmed}`
    if (submittedReflections.current.has(signature)) return
    submittedReflections.current.add(signature)

    const properties = {
      completed_count: completedCount,
      date_key: dateKey,
      momentum_status: status,
      reflection_length: trimmed.length,
    }

    try {
      ph?.capture('emi_daily_reflection_submitted', properties)
    } catch {
      // never block the dashboard
    }

    try {
      void fetch('/api/events/daily-momentum', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName: 'emi_daily_reflection_submitted', properties }),
        keepalive: true,
      })
    } catch {
      // never block the dashboard
    }
  }

  return (
    <Card id="daily-momentum-plan" variant="glass" className="mb-8 overflow-hidden py-0 shadow-xl">
      <div className="px-6 py-4 sm:px-7 border-b border-border bg-card/85">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="text-[16px] font-bold text-foreground leading-tight">Today&apos;s three actions</h2>
            <span className="text-[12px] text-muted-foreground">{completedCount} of 3 complete · day complete at two</span>
          </div>
          <div className={`inline-flex items-center self-start rounded-full border px-3 py-1 text-[12px] font-semibold ${statusCopy.accent}`}>
            {statusChip}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-7 sm:py-7">
        <div className="grid grid-cols-1 gap-4">
          {actions.map((action, index) => {
            const done = Boolean(state.completed[action.id])
            return (
              <article
                key={action.id}
                className={`rounded-2xl border p-5 sm:p-6 transition-colors ${done ? 'border-success/40 bg-success/10' : 'border-border bg-muted/40'}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">{index + 1}</span>
                      <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[13px] font-medium text-foreground">
                        {action.track}
                      </span>
                      <span className="rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[13px] font-medium text-foreground">
                        {action.effortMinutes} min
                      </span>
                    </div>
                    <h3 className="text-[15px] font-semibold text-foreground mb-1.5">{action.title}</h3>
                    <p className="text-[13px] leading-relaxed text-foreground">{action.body}</p>
                    {(action.whyNow || action.whyYou) && (
                      <dl className="mt-3 space-y-1.5">
                        {action.whyNow && (
                          <div className="flex gap-2 text-[12px] leading-relaxed">
                            <dt className="shrink-0 font-bold uppercase tracking-[0.08em] text-primary/90">Why now</dt>
                            <dd className="text-muted-foreground">{action.whyNow}</dd>
                          </div>
                        )}
                        {action.whyYou && (
                          <div className="flex gap-2 text-[12px] leading-relaxed">
                            <dt className="shrink-0 font-bold uppercase tracking-[0.08em] text-primary/90">Why you</dt>
                            <dd className="text-muted-foreground">{action.whyYou}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                    {(action.links ?? []).length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {action.links!.map((link) => (
                          <Link
                            key={link.href + link.label}
                            href={link.href}
                            className="rounded border border-border px-2.5 py-1 text-[12px] font-semibold text-foreground transition-colors"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:w-[15rem] lg:items-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setState((current) => {
                        const nextDone = !current.completed[action.id]
                        const nextState = {
                          ...current,
                          completed: {
                            ...current.completed,
                            [action.id]: nextDone,
                          },
                        }

                        if (nextDone) {
                          const nextCompletedCount = actions.filter((candidate) => (
                            candidate.id === action.id ? true : Boolean(nextState.completed[candidate.id])
                          )).length
                          emitActionCompleted(action, nextCompletedCount)
                        }

                        return nextState
                      })}
                      className={`min-h-[44px] rounded-full px-4 text-[13px] font-semibold ${done ? '!border-success/40 !bg-success/10 !text-success' : '!border-border !bg-muted/40 !text-foreground hover:!border-border'}`}
                    >
                      {done ? 'Done' : 'Complete'}
                    </Button>
                    <Button
                      className="h-[44px] rounded-full px-4 text-[13px] font-semibold"
                      render={<Link href={action.href} />}
                    >
                      {action.cta}
                    </Button>
                  </div>
                </div>

                <div className="mt-3">
                  {openNoteId === action.id ? (
                    <Input
                      id={`daily-note-${action.id}`}
                      aria-label="Optional note"
                      value={state.notes[action.id] ?? ''}
                      onChange={(event) => setState((current) => ({
                        ...current,
                        notes: {
                          ...current.notes,
                          [action.id]: event.target.value,
                        },
                      }))}
                      placeholder="What will make this easier to finish?"
                      className="w-full rounded-xl !border-border !bg-muted/40 text-[13px] !text-foreground placeholder:!text-muted-foreground focus-visible:!border-primary/60"
                    />
                  ) : (
                    <Button
                      type="button"
                      variant="link"
                      onClick={() => setOpenNoteId(action.id)}
                      className="h-auto p-0 text-[12px] font-semibold !text-muted-foreground hover:!text-foreground"
                    >
                      Add note
                    </Button>
                  )}
                </div>
              </article>
            )
          })}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
          <div className="rounded-2xl border border-border bg-muted/40 px-4 py-4">
            <label className="block text-[13px] font-medium text-foreground mb-2" htmlFor="daily-reflection-prompt">
              Daily reflection
            </label>
            <Textarea
              id="daily-reflection-prompt"
              value={state.reflection}
              onChange={(event) => setState((current) => ({ ...current, reflection: event.target.value }))}
              onBlur={(event) => emitReflectionSubmitted(event.target.value)}
              placeholder="What moved? What got stuck? What needs a simpler recovery tomorrow?"
              className="min-h-[112px] w-full resize-y rounded-xl !border-border !bg-muted/40 text-[13px] !text-foreground placeholder:!text-muted-foreground focus-visible:!border-primary/60"
            />
          </div>

          <Alert variant={isDayComplete ? 'success' : 'warning'} className="rounded-2xl px-4 py-4">
            <AlertDescription className="text-current">
              <p className="text-[13px] font-semibold">
                {isDayComplete ? 'Day complete' : 'Recovery rule'}
              </p>
              <p className="mt-2 text-[13px] leading-relaxed">
                {isDayComplete
                  ? 'You cleared the daily gate. Leave the rest alone unless it is already in motion.'
                  : 'If today slips, keep tomorrow to one relationship action, one readiness action, and one optional focus action again.'}
              </p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </Card>
  )
}