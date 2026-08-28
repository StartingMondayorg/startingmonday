"use client"

import { useMemo, useState } from 'react'
import { Badge, Button, Card } from '@/components/ui'
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
      <Card variant="glass" className="mx-auto max-w-5xl bg-card/85 p-6 shadow-2xl sm:p-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Coach dashboard</p>
        <h2 className="font-serif text-[30px] leading-[1.15] text-foreground sm:text-[36px]">
          What transition coaches need to lead with calm authority.
        </h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-foreground">
          Keep every client on one decision path: transition thesis quality, momentum risk, and market timing signals.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card variant="glass" className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Transition readiness</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">86%</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              Narrative, proof stories, and risk responses are interview-ready.
            </p>
          </Card>
          <Card variant="glass" className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Momentum health</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">4 of 5</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              Weekly commitments are holding, with one blocked action requiring intervention.
            </p>
          </Card>
          <Card variant="glass" className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Opportunity timing</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">4 live signals</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              Companies with near-term executive-transition pressure detected.
            </p>
          </Card>
        </div>

        <Card variant="glass" className="mt-8 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            Find companies likely to open executive transition opportunities
          </p>
          <h3 className="mt-2 text-[20px] font-semibold text-foreground">
            Build a target-company list for a sample CFO transition.
          </h3>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-foreground">
            Use intelligence signals to shape client outreach timing, then activate relationship paths that improve mandate access.
          </p>

          <Button
            type="button"
            onClick={runScanner}
            disabled={isLoading}
            className="mt-5"
          >
            {isLoading ? 'Scanning transition signals...' : 'Build sample CFO transition target list'}
          </Button>

          {hasRun ? (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Scanner output</p>
                <div className="mt-3 grid gap-3">
                  {topSignals.map((signal) => (
                    <Card key={signal.company} variant="glass" className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-[16px] font-semibold text-foreground">{signal.company}</h4>
                        <Badge className="rounded-full border-primary/40 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          Confidence {signal.confidence}%
                        </Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-foreground">{signal.trigger}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">Likely opening window: {signal.window}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Coach move: {signal.coachingMove}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Three relationship moves to win access</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {RELATIONSHIP_MOVES.map((item) => (
                    <Card key={item.path} variant="glass" className="p-4">
                      <h4 className="text-[14px] font-semibold text-foreground">{item.path}</h4>
                      <p className="mt-2 text-[12px] leading-relaxed text-foreground">{item.why}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </Card>
    </section>
  )
}
