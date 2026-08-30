import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Search Firm Procurement Path | Starting Monday',
  description:
    'Public-facing procurement and pilot path summary for retained search firms evaluating a Starting Monday rollout.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms/procurement',
  },
}

const packages = [
  {
    title: 'Pilot',
    body: 'One mandate, 30 days, named sponsor ownership, and a day-30 procurement decision memo.',
  },
  {
    title: 'Lane rollout',
    body: 'Ninety-day deployment across one role lane with weekly operating review and buyer-side checkpointing.',
  },
  {
    title: 'Expansion',
    body: 'Multi-lane rollout with practice governance, commercial controls, and quarterly review.',
  },
]

const buyingSteps = [
  'Confirm package scope, commercial owner, and sponsor for the retained-search pilot.',
  'Align legal packet path, procurement reviewer, and contracting dependencies.',
  'Approve pilot charter, invoicing model, and baseline scorecard before kickoff.',
  'Run the day-30 go, revise, or stop review with procurement and search leadership.',
]

export default function SearchFirmsProcurementPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          {'<- Back to search firms'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Procurement path</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.08] text-foreground sm:text-[44px]">Retained-search procurement and approval path</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground">
            This page is for procurement, legal, and search leadership teams reviewing a bounded pilot. It outlines scope, approvals, and decision controls before kickoff.
          </p>
        </header>

        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[24px] leading-[1.15] text-foreground">Package path</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {packages.map((pkg) => (
              <article key={pkg.title} className="rounded-xl border border-border bg-muted/[0.03] p-4">
                <h3 className="text-[14px] font-semibold text-foreground">{pkg.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground">{pkg.body}</p>
              </article>
            ))}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Buying sequence</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">Four decisions before kickoff</h2>
          <ol className="mt-5 space-y-3 text-[14px] text-foreground">
            {buyingSteps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-xl">
          <h2 className="font-serif text-[24px] leading-[1.15] text-foreground">Management and procurement ownership</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-foreground">
            Search management owns sponsor assignment, operating cadence, and day-30 success criteria. Procurement owns package scope confirmation, billing path, contractual dependencies, and buyer-side implementation effort.
          </p>
        </section>

        <section className="mt-6 rounded-[2rem] border border-warning/25 bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Next step</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">Move to application only when procurement controls are clear.</h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-foreground">
            If legal and trust review must precede commercial review, route the team through the trust summary first. Otherwise proceed to partner application with pilot scope, ownership, and approval path already aligned.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/partners?channel=search-firms#apply" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Apply to partner program
            </Link>
            <Link href="/search-firms/trial-charter" className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
              Review pilot charter
            </Link>
            <Link href="/search-firms/trust" className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
              Review trust summary
            </Link>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
