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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.96)_54%,_rgba(10,15,28,0.98)_100%)]" />
      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms" className="text-sm text-slate-400 transition-colors hover:text-white">
          {'<- Back to search firms'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(28,20,17,0.66),rgba(12,14,24,0.92))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Procurement path</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.08] text-white sm:text-[44px]">Retained-search procurement and approval path</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-200">
            This page is for procurement, legal, and search leadership teams reviewing a bounded pilot. It outlines scope, approvals, and decision controls before kickoff.
          </p>
        </header>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[24px] leading-[1.15] text-white">Package path</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {packages.map((pkg) => (
              <article key={pkg.title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-[14px] font-semibold text-white">{pkg.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-200">{pkg.body}</p>
              </article>
            ))}
          </div>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Buying sequence</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-white sm:text-[34px]">Four decisions before kickoff</h2>
          <ol className="mt-5 space-y-3 text-[14px] text-slate-200">
            {buyingSteps.map((step, index) => (
              <li key={step}>
                {index + 1}. {step}
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.22)]">
          <h2 className="font-serif text-[24px] leading-[1.15] text-white">Management and procurement ownership</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-200">
            Search management owns sponsor assignment, operating cadence, and day-30 success criteria. Procurement owns package scope confirmation, billing path, contractual dependencies, and buyer-side implementation effort.
          </p>
        </section>

        <section className="mt-6 rounded-[2rem] border border-amber-200/25 bg-[linear-gradient(160deg,rgba(28,20,17,0.66),rgba(12,14,24,0.92))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Next step</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-white sm:text-[34px]">Move to application only when procurement controls are clear.</h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate-200">
            If legal and trust review must precede commercial review, route the team through the trust summary first. Otherwise proceed to partner application with pilot scope, ownership, and approval path already aligned.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/partners?channel=search-firms#apply" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-300">
              Apply to partner program
            </Link>
            <Link href="/search-firms/trial-charter" className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5">
              Review pilot charter
            </Link>
            <Link href="/search-firms/trust" className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5">
              Review trust summary
            </Link>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
