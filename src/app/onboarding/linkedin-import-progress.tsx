'use client'

import { useEffect, useRef, useState } from 'react'

export type LinkedinImportPhase = 'idle' | 'uploading' | 'analyzing' | 'complete'

// The two network calls give us no byte-level progress, so the bar eases toward a
// ceiling per phase and only reaches 100% when the import actually returns.
const PHASE_CEILING: Record<Exclude<LinkedinImportPhase, 'idle'>, number> = {
  uploading: 55,
  analyzing: 94,
  complete: 100,
}

const STAGES: Array<{ phase: Exclude<LinkedinImportPhase, 'idle' | 'complete'>; label: string }> = [
  { phase: 'uploading', label: 'Uploading and reading your PDF' },
  { phase: 'analyzing', label: 'Extracting your background' },
]

function stageState(stage: Exclude<LinkedinImportPhase, 'idle' | 'complete'>, phase: LinkedinImportPhase) {
  if (phase === 'complete') return 'done'
  if (phase === stage) return 'active'
  if (stage === 'uploading' && phase === 'analyzing') return 'done'
  return 'waiting'
}

export function LinkedinImportProgress({
  phase,
  fileName,
}: {
  phase: LinkedinImportPhase
  fileName: string
}) {
  const [percent, setPercent] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startedAt = useRef(0)

  useEffect(() => {
    if (phase === 'idle') {
      setPercent(0)
      setElapsed(0)
      return
    }
    if (phase === 'complete') {
      setPercent(100)
      return
    }
    if (!startedAt.current) {
      startedAt.current = Date.now()
      setPercent(8)
    }
    const timer = window.setInterval(() => {
      const ceiling = PHASE_CEILING[phase]
      setPercent(prev => (prev >= ceiling ? prev : prev + Math.max(0.35, (ceiling - prev) * 0.07)))
      setElapsed(Math.round((Date.now() - startedAt.current) / 1000))
    }, 120)
    return () => window.clearInterval(timer)
  }, [phase])

  useEffect(() => {
    if (phase === 'idle') startedAt.current = 0
  }, [phase])

  if (phase === 'idle') return null

  const done = phase === 'complete'

  return (
    <div className="border border-white/10 rounded-lg bg-white/5 p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          {done ? (
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="shrink-0">
              <circle cx="10" cy="10" r="10" fill="#10b981" fillOpacity="0.2" />
              <path d="M6 10l3 3 5-5" stroke="#34d399" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <span className="w-[18px] h-[18px] border-2 border-white/20 border-t-orange-400 rounded-full animate-spin shrink-0" />
          )}
          <p className="text-[14px] font-semibold text-slate-100 truncate">
            {done ? 'Profile imported' : 'Importing your profile'}
          </p>
        </div>
        <span className="text-[12px] text-slate-400 shrink-0 tabular-nums">
          {done ? 'Complete' : `${elapsed}s`}
        </span>
      </div>

      {fileName && (
        <p className="text-[12px] text-slate-400 truncate -mt-2">{fileName}</p>
      )}

      <div
        className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden"
        role="progressbar"
        aria-label="LinkedIn import progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(percent)}
      >
        <div
          className={[
            'h-full rounded-full transition-[width] duration-200 ease-out motion-reduce:transition-none',
            done ? 'bg-emerald-400' : 'bg-gradient-to-r from-orange-500 to-amber-300',
          ].join(' ')}
          style={{ width: `${Math.min(100, percent)}%` }}
        />
      </div>

      <div className="flex flex-col gap-2">
        {STAGES.map(stage => {
          const state = stageState(stage.phase, phase)
          return (
            <div key={stage.phase} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span
                  className={[
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    state === 'done'
                      ? 'bg-emerald-400'
                      : state === 'active'
                        ? 'bg-orange-400 animate-pulse'
                        : 'bg-slate-500',
                  ].join(' ')}
                />
                <span className={`text-[13px] truncate ${state === 'waiting' ? 'text-slate-400' : 'text-slate-200'}`}>
                  {stage.label}
                </span>
              </div>
              <span className="text-[12px] text-slate-400 shrink-0">
                {state === 'done' ? 'Done' : state === 'active' ? 'Working' : 'Next'}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-[12px] text-slate-400 border-t border-white/10 pt-3" aria-live="polite">
        {done
          ? 'Your background is saved. Setting up the rest of your profile...'
          : 'This usually takes about 10 seconds. Keep this window open.'}
      </p>
    </div>
  )
}
