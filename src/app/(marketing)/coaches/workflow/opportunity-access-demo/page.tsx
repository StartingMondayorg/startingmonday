import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Opportunity Access Demo | Starting Monday',
  description:
    'Example walkthrough for coaches: converting transition readiness into opportunity access through relationships and timing signals.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/workflow/opportunity-access-demo',
  },
}

const companyTargets = [
  'Apex Industrial Systems: PE operating pressure with finance transformation trigger.',
  'North Harbor Health Services: interim finance signal and guidance uncertainty.',
  'Copperline Logistics Group: integration-risk context after acquisition activity.',
]

const outreachPaths = [
  'Retained-search partner with mandate-aligned thesis memo.',
  'Board or audit committee connector for hidden decision criteria.',
  'Former sector CFO peer for message pressure testing before live interviews.',
]

export default function OpportunityAccessDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Workflow demo 3</p>
        <h1 className="max-w-4xl font-serif text-[36px] leading-[1.06] text-foreground sm:text-[52px]">
          Convert readiness into opportunity access.
        </h1>
        <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-foreground sm:text-[19px]">
          This demo shows how a coach uses market signals and relationships to improve access to real executive transition opportunities.
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Target companies this week</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
            {companyTargets.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Relationship activation paths</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
            {outreachPaths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Coach dashboard demo</p>
          <h2 className="mt-2 text-[22px] font-serif leading-tight text-foreground">See how the coach layer drives opportunity access.</h2>
          <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-foreground">
            This demo shows weekly momentum, relationship activation, and transition-signal timing in one operating view.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <article className="rounded-xl border border-border bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Coach view</p>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                Portfolio-level panel showing client readiness, blocked commitments, and target-company timing signals.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-background/55 p-4">
              <p className="text-[11px] uppercase tracking-[0.1em] text-muted-foreground">Executive view</p>
              <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                Candidate-side dashboard with transition brief quality, interview readiness, and objection pressure points.
              </p>
            </article>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/coaches/mock-dashboard" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Open coach dashboard demo
            </Link>
            <Link href="/demo/executive-brief" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
              See demo executive dashboard
            </Link>
          </div>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/coaches" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Back to coach workflow
          </Link>
          <Link href="/coaches/sample-transition-brief" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
            Open sample transition brief
          </Link>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
