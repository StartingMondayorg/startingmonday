"use client"

import { useMemo, useState } from 'react'
import { Badge, Button, Card } from '@/components/ui'
type CompanySignal = {
  company: string
  signal: string
  confidence: number
  openWindow: string
  reason: string
}

const SCANNER_SIGNALS: CompanySignal[] = [
  {
    company: 'Apex Industrial Systems',
    signal: 'PE sponsor announced margin-reset plan and ERP consolidation',
    confidence: 91,
    openWindow: '30-90 days',
    reason: 'Finance transformation pressure and board cadence suggest a CFO mandate will open soon.',
  },
  {
    company: 'North Harbor Health Services',
    signal: 'Interim finance lead extension plus delayed annual guidance',
    confidence: 88,
    openWindow: '15-60 days',
    reason: 'Interim coverage and guidance slippage usually precede a retained CFO search.',
  },
  {
    company: 'Copperline Logistics Group',
    signal: 'Acquisition integration filing with integration-risk disclosure',
    confidence: 84,
    openWindow: '45-120 days',
    reason: 'Post-M&A integration risk often triggers board demand for a scaled operator CFO.',
  },
  {
    company: 'Blue Summit Security',
    signal: 'Series D close and prep activity for enterprise expansion',
    confidence: 82,
    openWindow: '30-75 days',
    reason: 'Late-stage growth with enterprise push typically requires a heavier finance leader profile.',
  },
  {
    company: 'Helios Grid Technologies',
    signal: 'Revenue restatement watch and audit committee turnover',
    confidence: 79,
    openWindow: '15-45 days',
    reason: 'Audit committee shifts plus reporting pressure can force fast CFO succession planning.',
  },
]

const RELATIONSHIP_TARGETS = [
  {
    relationship: 'Board audit committee influencer',
    action:
      'Ask for the top two finance outcomes they need in the first 180 days, then mirror those outcomes in your candidate thesis.',
  },
  {
    relationship: 'Private equity operating partner or lead investor contact',
    action:
      'Confirm value-creation milestones tied to the CFO hire so your search framing aligns with sponsor economics.',
  },
  {
    relationship: 'Trusted internal finance lieutenant (VP Finance or Controller)',
    action:
      'Validate team capability gaps and cultural constraints before candidate outreach begins.',
  },
]

export function ProspectingScannerPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const topSignals = useMemo(() => {
    return [...SCANNER_SIGNALS].sort((a, b) => b.confidence - a.confidence).slice(0, 4)
  }, [])

  const runScanner = () => {
    setIsLoading(true)
    window.setTimeout(() => {
      setHasRun(true)
      setIsLoading(false)
    }, 700)
  }

  return (
    <section className="px-4 pb-14 sm:px-6 sm:pb-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Client dashboard</p>
        <h2 className="font-serif text-[30px] leading-[1.15] text-foreground sm:text-[36px]">
          What a recruiter needs to run the mandate with confidence.
        </h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-foreground">
          Keep your team anchored to three operational views: mandate health, sponsor alignment, and market opportunity signals.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Card variant="glass" className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Mandate health</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">84%</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              Interview criteria complete, stakeholder map confirmed, and risk log current.
            </p>
          </Card>
          <Card variant="glass" className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Sponsor alignment</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">3 of 4</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              Core decision-makers aligned; one stakeholder requires updated success criteria.
            </p>
          </Card>
          <Card variant="glass" className="p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Market intelligence</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">5 live signals</p>
            <p className="mt-2 text-[13px] leading-relaxed text-foreground">
              Companies with likely CFO openings identified from financing, governance, and operating-change events.
            </p>
          </Card>
        </div>

        <Card variant="glass" className="mt-8 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
            Find companies likely to open executive roles
          </p>
          <h3 className="mt-2 text-[20px] font-semibold text-foreground">
            Build a target-company list for a sample CFO search.
          </h3>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-foreground">
            Use the intelligence scanner to generate a focused prospect list, then start outreach through the highest-leverage relationship paths.
          </p>

          <Button
            type="button"
            onClick={runScanner}
            disabled={isLoading}
            className="mt-5 rounded-full"
          >
            {isLoading ? 'Scanning signals...' : 'Build sample CFO target list'}
          </Button>

          {hasRun ? (
            <div className="mt-6 space-y-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Scanner output</p>
                <div className="mt-3 grid gap-3">
                  {topSignals.map((signal) => (
                    <Card key={signal.company} variant="glass" className="rounded-xl !bg-background/55 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="text-[16px] font-semibold text-foreground">{signal.company}</h4>
                        <Badge variant="outline" className="rounded-full !border-primary/40 px-2.5 py-1 text-[11px] font-semibold text-primary">
                          Confidence {signal.confidence}%
                        </Badge>
                      </div>
                      <p className="mt-2 text-[13px] leading-relaxed text-foreground">{signal.signal}</p>
                      <p className="mt-1 text-[12px] text-muted-foreground">Likely opening window: {signal.openWindow}</p>
                      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">Why this matters: {signal.reason}</p>
                    </Card>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">First outreach relationships</p>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  {RELATIONSHIP_TARGETS.map((target) => (
                    <Card key={target.relationship} variant="glass" className="rounded-xl !bg-background/55 p-4">
                      <h4 className="text-[14px] font-semibold text-foreground">{target.relationship}</h4>
                      <p className="mt-2 text-[12px] leading-relaxed text-foreground">{target.action}</p>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  )
}
