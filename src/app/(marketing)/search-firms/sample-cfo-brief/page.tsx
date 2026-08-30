import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'CFO Brief Example | Starting Monday',
  description:
    'Editorial CFO brief example for recruiters: clear mandate context, candidate narrative, interview focus, risk flags, and first-30-day plan.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms/sample-cfo-brief',
  },
  openGraph: {
    title: 'CFO Brief Example | Starting Monday',
    description:
      'See why Starting Monday matters to recruiter outcomes in the first minute.',
    url: 'https://startingmonday.app/search-firms/sample-cfo-brief',
  },
}

const summaryPoints = [
  'Mandate context is clear in under two minutes.',
  'Candidate narrative is tied to measurable outcomes, not generic profile language.',
  'Interview focus is pre-structured so first-round conversations are sharper.',
  'Risk flags are explicit before shortlist confidence is at stake.',
]

const marketContext = [
  'Comparable CFO transitions in mid-market SaaS over the last four quarters.',
  'Common role triggers: sponsor change, acquisition, and pre-IPO readiness pressure.',
  'Observed timeline: shortlist target in 45 days, signed offer target in 75 days.',
]

const candidateThesis = [
  'Mandate-fit operator for integration pressure and international expansion complexity.',
  'Board-ready communicator with a clear decision narrative under uncertainty.',
  'Evidence weighted toward repeatable operating outcomes over isolated wins.',
]

const interviewFocus = [
  '90-day integration sequence with milestones at week 4, 8, and 12.',
  'Board and sponsor communication during high-risk decision windows.',
  'Forecast-quality improvement under changing business assumptions.',
]

const riskFlags = [
  'Narrative over-indexes on cost control and underweights growth orchestration.',
  'Public-company exposure is present, but sponsor-complexity examples are thin.',
  'Integration claims are broad without artifact-level operating evidence.',
]

const thirtyDayPlan = [
  'Day 1-7: align sponsor objectives, lock operating cadence, and baseline forecast integrity.',
  'Day 8-15: map integration dependencies and establish control-point accountability.',
  'Day 16-23: align finance, GTM, and product assumptions into one decision narrative.',
  'Day 24-30: deliver board-ready operating review with corrective actions and owners.',
]

const nextActions = [
  'Open one live mandate and generate this format against your actual sponsor context.',
  'Calibrate first-round interview questions to the brief before candidate outreach scales.',
  'Use day-14 outcomes to decide pilot expansion, not feature preference.',
]

export default function SampleCfoBriefPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 sm:py-14">

      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          {'<- Back to search firms'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Full brief example</p>
          <h1 className="mt-3 max-w-4xl font-serif text-[34px] leading-[1.08] text-foreground sm:text-[44px]">
            Starting Monday matters because it gives your team an interview-ready CFO brief in minutes, before round one.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground">
            One concise artifact: mandate context, candidate thesis, interview focus, risk flags, and a first-30-day operating view.
          </p>
          <p className="mt-5 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">Clear first read. Better shortlist decisions.</p>
        </header>

        <section className="mt-6 rounded-2xl border border-border bg-muted/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-foreground">Summary</h2>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
            {summaryPoints.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="font-bold text-primary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">CFO brief</h2>

          <article className="mt-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-primary">Market context</h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
              {marketContext.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="font-bold text-primary">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="mt-6">
            <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-primary">Candidate thesis</h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
              {candidateThesis.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="font-bold text-primary">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="mt-6">
            <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-primary">Interview focus</h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
              {interviewFocus.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="font-bold text-primary">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-muted/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-foreground">Risk flags</h2>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
            {riskFlags.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="font-bold text-primary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-muted/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-foreground">First 30-day operating plan</h2>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground">
            {thirtyDayPlan.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-primary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">What to do next</h2>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground">
            {nextActions.map((action) => (
              <li key={action} className="flex gap-3">
                <span className="font-bold text-primary">+</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/partners?channel=search-firms#apply" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Start search-firm pilot
            </Link>
            <Link href="/search-firms" className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
              Return to search-firm overview
            </Link>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
