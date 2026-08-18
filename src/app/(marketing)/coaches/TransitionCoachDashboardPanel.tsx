"use client"

import { useMemo, useState } from 'react'

type TransitionSignal = {
  company: string
  trigger: string
  confidence: number
  window: string
  coachingMove: string
}

const TRANSITION_SIGNALS: TransitionSignal[] = [
  {
    company: 'North Harbor Health Services',
    trigger: 'CFO succession rumors and delayed guidance narrative',
    confidence: 90,
    window: '15-60 days',
    coachingMove: 'Rehearse board-facing value narrative and risk response before recruiter outreach.',
  },
  {
    company: 'Apex Industrial Systems',
    trigger: 'PE operating plan and finance transformation reset',
    confidence: 87,
    window: '30-90 days',
    coachingMove: 'Position integration leadership wins with measurable EBIT and execution language.',
  },
  {
    company: 'Copperline Logistics Group',
    trigger: 'Acquisition integration pressure and reporting complexity',
    confidence: 84,
    window: '45-120 days',
    coachingMove: 'Prepare stakeholder map and integration story with first-180-day milestones.',
  },
  {
    company: 'Blue Summit Security',
    trigger: 'Late-stage growth financing and enterprise expansion shift',
    confidence: 81,
    window: '30-75 days',
    coachingMove: 'Tune growth-to-discipline narrative for investor and board audiences.',
  },
]

const RELATIONSHIP_MOVES = [
  {
    path: 'Trusted retained-search partner',
    why: 'Share a crisp transition thesis and proof stories aligned to current sponsor pressure.',
  },
  {
    path: 'Board or audit committee connector',
    why: 'Validate decision criteria and political risk before formal interview loops begin.',
  },
  {
    path: 'Former CFO peer in target sector',
    why: 'Pressure-test message credibility and uncover hidden objections early.',
  },
]

export function TransitionCoachDashboardPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const topSignals = useMemo(() => {
    return [...TRANSITION_SIGNALS].sort((a, b) => b.confidence - a.confidence).slice(0, 3)
  }, [])

  const runScanner = () => {
    setIsLoading(true)
    window.setTimeout(() => {
      setIsLoading(false)
      setHasRun(true)
    }, 700)
  }

  return (
    <section className="px-4 pb-14 sm:px-6 sm:pb-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-white/10 bg-[linear-gradient(155deg,rgba(21,28,46,0.92),rgba(10,14,24,0.96))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.3)] backdrop-blur-sm sm:p-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-orange-200">Coach dashboard</p>
        <h2 className="font-serif text-[30px] leading-[1.15] text-white sm:text-[36px]">
          What transition coaches need to lead with calm authority.
        </h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-slate-200">
          Keep every client on one decision path: transition thesis quality, momentum risk, and market timing signals.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Transition readiness</p>
            <p className="mt-2 text-2xl font-semibold text-white">86%</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-200">
              Narrative, proof stories, and risk responses are interview-ready.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Momentum health</p>
            <p className="mt-2 text-2xl font-semibold text-white">4 of 5</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-200">
              Weekly commitments are holding, with one blocked action requiring intervention.
            </p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Opportunity timing</p>
            <p className="mt-2 text-2xl font-semibold text-white">4 live signals</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-200">
              Companies with near-term executive-transition pressure detected.
            </p>
          </article>
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200">
            Find companies likely to open executive transition opportunities
          </p>
          <h3 className="mt-2 text-[20px] font-semibold text-white">
            Build a target-company list for a sample CFO transition.
          </h3>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-slate-200">
            Use intelligence signals to shape client outreach timing, then activate relationship paths that improve mandate access.
          </p>

          <button
            type="button"
            onClick={runScanner}
            disabled={isLoading}
            className="mt-5 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? 'Scanning transition signals...' : 'Build sample CFO transition target list'}
          </button>

          {hasRun ? (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Scanner output</p>
                <div className="mt-3 grid gap-3">
                  {topSignals.map((signal) => (
                    <article key={signal.company} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-[16px] font-semibold text-white">{signal.company}</h4>
                        <span className="rounded-full border border-orange-300/40 px-2.5 py-1 text-[11px] font-semibold text-orange-200">
                          Confidence {signal.confidence}%
                        </span>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-200">{signal.trigger}</p>
                      <p className="mt-1 text-[12px] text-slate-300">Likely opening window: {signal.window}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-slate-300">Coach move: {signal.coachingMove}</p>
                    </article>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">Three relationship moves to win access</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {RELATIONSHIP_MOVES.map((item) => (
                    <article key={item.path} className="rounded-xl border border-white/10 bg-slate-950/55 p-4">
                      <h4 className="text-[14px] font-semibold text-white">{item.path}</h4>
                      <p className="mt-2 text-[12px] leading-relaxed text-slate-200">{item.why}</p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
