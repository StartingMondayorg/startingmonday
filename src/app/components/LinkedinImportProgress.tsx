'use client'

import { useEffect, useState } from 'react'

export type LinkedinImportProgressState =
  | { status: 'idle' }
  | { status: 'running'; stage: number }
  | { status: 'complete' }

type Tone = 'dark' | 'light'

// None of the import calls report byte-level progress, so the bar eases toward a
// ceiling for the stage that is running and only reaches 100% when the work returns.
const FINAL_CEILING = 94

const TONES: Record<Tone, {
  panel: string
  title: string
  muted: string
  stage: string
  track: string
  spinner: string
  divider: string
  waitingDot: string
}> = {
  dark: {
    panel: 'border-border bg-muted/40',
    title: 'text-foreground',
    muted: 'text-muted-foreground',
    stage: 'text-foreground',
    track: 'bg-muted/60',
    spinner: 'border-border border-t-primary/30',
    divider: 'border-border',
    waitingDot: 'bg-muted',
  },
  light: {
    panel: 'border-border bg-muted',
    title: 'text-foreground',
    muted: 'text-muted-foreground',
    stage: 'text-foreground',
    track: 'bg-muted',
    spinner: 'border-border border-t-primary/30',
    divider: 'border-border',
    waitingDot: 'bg-muted',
  },
}

export function ceilingFor(stage: number, stageCount: number) {
  return ((Math.min(stage, stageCount - 1) + 1) / stageCount) * FINAL_CEILING
}

export function LinkedinImportProgress({
  state,
  stages,
  fileName,
  tone = 'dark',
  title,
  hint,
}: {
  state: LinkedinImportProgressState
  stages: string[]
  fileName?: string
  tone?: Tone
  title?: { active?: string; done?: string }
  hint?: { active?: string; done?: string }
}) {
  // Callers mount this only while a run is in flight, so mount time is run start.
  const [mountedAt] = useState(() => Date.now())
  const [view, setView] = useState(() => ({ percent: 8, now: Date.now() }))

  const status = state.status
  const stage = state.status === 'running' ? state.stage : 0
  const stageCount = Math.max(1, stages.length)
  // Ease from the previous stage's ceiling toward this stage's, so the bar keeps
  // moving without ever implying work that has not finished.
  const base = stage > 0 ? ceilingFor(stage - 1, stageCount) : 0
  const ceiling = ceilingFor(stage, stageCount)

  useEffect(() => {
    if (status !== 'running') return
    const stageStartedAt = Date.now()
    const timer = window.setInterval(() => {
      const stageMs = Date.now() - stageStartedAt
      const eased = base + (ceiling - base) * (1 - Math.exp(-stageMs / 2600))
      setView(prev => ({ percent: Math.max(prev.percent, eased), now: Date.now() }))
    }, 120)
    return () => window.clearInterval(timer)
  }, [status, base, ceiling])

  if (status === 'idle') return null

  const t = TONES[tone]
  const done = status === 'complete'
  const percent = done ? 100 : view.percent
  const elapsed = Math.max(0, Math.round((view.now - mountedAt) / 1000))
  const heading = done
    ? title?.done ?? 'Profile imported'
    : title?.active ?? 'Importing your profile'
  const footer = done
    ? hint?.done ?? 'Your background is saved.'
    : hint?.active ?? 'This usually takes about 10 seconds. Keep this window open.'

  return (
    <div className={`border rounded-lg p-5 flex flex-col gap-4 ${t.panel}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {done ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <circle cx="10" cy="10" r="10" fill="var(--success)" fillOpacity="0.2" />
              <path d="M6 10l3 3 5-5" stroke="var(--success)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className={`w-[18px] h-[18px] border-2 rounded-full animate-spin shrink-0 ${t.spinner}`} />
          )}
          <p className={`text-[14px] font-semibold truncate ${t.title}`}>{heading}</p>
        </div>
        <span className={`text-[12px] shrink-0 tabular-nums ${t.muted}`}>
          {done ? 'Complete' : `${elapsed}s`}
        </span>
      </div>

      {fileName && <p className={`text-[12px] truncate -mt-2 ${t.muted}`}>{fileName}</p>}

      <div
        className={`h-1.5 w-full rounded-full overflow-hidden ${t.track}`}
        role="progressbar"
        aria-label="LinkedIn import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div
          className={[
            'h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none',
            done ? 'bg-success' : 'bg-gradient-to-r from-primary to-warning',
          ].join(' ')}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      {stages.length > 1 && (
        <div className="flex flex-col gap-2">
          {stages.map((label, index) => {
            const stageState = done || index < stage ? 'done' : index === stage ? 'active' : 'waiting'
            return (
              <div key={label} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={[
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      stageState === 'done'
                        ? 'bg-success'
                        : stageState === 'active'
                          ? 'bg-primary animate-pulse'
                          : t.waitingDot,
                    ].join(' ')}
                  />
                  <span className={`text-[13px] truncate ${stageState === 'waiting' ? t.muted : t.stage}`}>
                    {label}
                  </span>
                </div>
                <span className={`text-[12px] shrink-0 ${t.muted}`}>
                  {stageState === 'done' ? 'Done' : stageState === 'active' ? 'Working' : 'Next'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <p className={`text-[12px] border-t pt-3 ${t.muted} ${t.divider}`} aria-live="polite">
        {footer}
      </p>
    </div>
  )
}
