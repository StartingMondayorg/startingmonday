import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Operating Scorecard | Starting Monday',
  description: 'Printable operating scorecard combining weekly execution and day-30/day-60/day-90 governance checkpoints.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/operating-scorecard' },
}

const WEEKLY_METRICS = [
  'Activation rate',
  'Signal-driven action rate',
  'Prep-readiness rate',
  'Stall index',
  'Session strategy-time ratio',
]

const STAGE_CHECKPOINTS = [
  {
    stage: 'Day 30',
    decision: 'Pass, tune, or stop pilot',
    required: 'Baseline adherence, action consistency, prep-readiness threshold, and intervention efficacy.',
  },
  {
    stage: 'Day 60',
    decision: 'Pause, continue corrective cycle, or approve limited expansion',
    required: 'Improvement trend continuity and stable metric definitions across cohorts.',
  },
  {
    stage: 'Day 90',
    decision: 'Scale readiness decision',
    required: 'Governance reliability, reporting quality, and sustained operating performance.',
  },
]

export default function OutplacementOperatingScorecardPage() {
  return (
    <div className="min-h-screen bg-card font-sans print:bg-card">
      <nav className="bg-primary sticky top-0 z-10 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-primary-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <Link href="/for-outplacement" className="text-[13px] text-muted-foreground hover:text-primary-foreground transition-colors">
            Back to outplacement page
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 print:py-4">
        <header className="mb-8">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-primary mb-3">Printable operating scorecard</p>
          <h1 className="text-[28px] sm:text-[36px] font-bold text-foreground leading-[1.1] tracking-tight mb-3">
            Weekly operations + 30/60/90 decision checkpoints.
          </h1>
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            Use this page in weekly operations and print for governance meetings.
          </p>
        </header>

        <section className="mb-8 border border-border rounded-xl p-5 bg-card">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Weekly scorecard fields</p>
          {WEEKLY_METRICS.map((metric) => (
            <p key={metric} className="text-[14px] text-muted-foreground leading-relaxed">+ {metric}: __________</p>
          ))}
          <p className="text-[14px] text-muted-foreground leading-relaxed mt-4">+ Top intervention queue: __________</p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">+ Decision owner notes: __________</p>
        </section>

        <section className="mb-8 border border-border rounded-xl p-5 bg-muted">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">30/60/90 governance checkpoints</p>
          <div className="space-y-3">
            {STAGE_CHECKPOINTS.map((row) => (
              <div key={row.stage} className="border border-border rounded-lg p-4 bg-card">
                <p className="text-[13px] font-semibold text-foreground mb-1">{row.stage}</p>
                <p className="text-[13px] text-muted-foreground mb-1"><span className="font-semibold text-muted-foreground">Decision: </span>{row.decision}</p>
                <p className="text-[13px] text-muted-foreground"><span className="font-semibold text-muted-foreground">Required evidence: </span>{row.required}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 border border-border rounded-xl p-5 bg-card">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-3">Print and use</p>
          <p className="text-[14px] text-muted-foreground leading-relaxed">For print: use your browser print dialog and select standard portrait layout.</p>
        </section>

        <section className="border border-border rounded-xl p-5 bg-card print:hidden">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-primary mb-2">Next step</p>
          <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">CTA: get started now by applying this scorecard in your next weekly review.</p>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/for-outplacement/metric-dictionary" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
              Open canonical metric dictionary
            </Link>
            <Link href="/for-outplacement/economics" className="text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
              Return to economics
            </Link>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

