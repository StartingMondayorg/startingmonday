import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Set Transition Thesis Demo | Starting Monday',
  description:
    'Example walkthrough for coaches: setting a transition thesis before outreach with outcome framing, proof stories, and objections.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/workflow/set-transition-thesis-demo',
  },
}

const example = {
  client: 'VP Finance moving to first sponsor-backed CFO mandate',
  before: 'Strong operational history, but story reads as responsibilities and lacks board-level value language.',
  after: 'Clear thesis: stabilize reporting confidence in 90 days while protecting growth decisions through disciplined cash and margin governance.',
}

const steps = [
  'Define the business pressure in one sentence: what is at risk if finance leadership misses?',
  'Write a 90-second thesis with two measurable outcomes and one governance outcome.',
  'Select three proof stories with pre/post metrics and timeline accountability.',
  'Pressure-test likely objections and rewrite answers in sponsor language.',
]

export default function SetTransitionThesisDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Workflow demo 1</p>
        <h1 className="max-w-4xl font-serif text-[36px] leading-[1.06] text-foreground sm:text-[52px]">
          Set the transition thesis before outreach.
        </h1>
        <p className="mt-6 max-w-3xl text-[17px] leading-relaxed text-foreground sm:text-[19px]">
          This demo shows how a coach turns a generic profile into a mandate-ready narrative before first recruiter calls.
        </p>

        <section className="mt-10 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Example client</p>
          <p className="mt-2 text-[15px] text-foreground">{example.client}</p>
          <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">Before: {example.before}</p>
          <p className="mt-2 text-[14px] leading-relaxed text-foreground">After: {example.after}</p>
        </section>

        <section className="mt-4 rounded-2xl border border-border bg-muted/[0.04] p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">How it works</p>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-foreground">
            {steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/coaches/sample-transition-brief" className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Open full transition brief
          </Link>
          <Link href="/coaches" className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
            Back to coach workflow
          </Link>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
