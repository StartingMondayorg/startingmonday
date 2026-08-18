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
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.96)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms" className="text-sm text-slate-400 transition-colors hover:text-white">
          {'<- Back to search firms'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(28,20,17,0.66),rgba(12,14,24,0.92))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Full brief example</p>
          <h1 className="mt-3 max-w-4xl font-serif text-[34px] leading-[1.08] text-white sm:text-[44px]">
            Starting Monday matters because it gives your team an interview-ready CFO brief in minutes, before round one.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-200">
            One concise artifact: mandate context, candidate thesis, interview focus, risk flags, and a first-30-day operating view.
          </p>
          <p className="mt-5 text-[12px] uppercase tracking-[0.14em] text-slate-400">Clear first read. Better shortlist decisions.</p>
        </header>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-white">Summary</h2>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
            {summaryPoints.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="font-bold text-orange-300">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[28px] leading-[1.15] text-white sm:text-[34px]">CFO brief</h2>

          <article className="mt-5">
            <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-orange-200">Market context</h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {marketContext.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="font-bold text-orange-300">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="mt-6">
            <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-orange-200">Candidate thesis</h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {candidateThesis.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="font-bold text-orange-300">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="mt-6">
            <h3 className="text-[14px] font-semibold uppercase tracking-[0.12em] text-orange-200">Interview focus</h3>
            <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
              {interviewFocus.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="font-bold text-orange-300">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-white">Risk flags</h2>
          <ul className="mt-3 space-y-2 text-[14px] leading-relaxed text-slate-200">
            {riskFlags.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="font-bold text-orange-300">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-[18px] font-semibold text-white">First 30-day operating plan</h2>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-slate-200">
            {thirtyDayPlan.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-orange-300">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[28px] leading-[1.15] text-white sm:text-[34px]">What to do next</h2>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-slate-200">
            {nextActions.map((action) => (
              <li key={action} className="flex gap-3">
                <span className="font-bold text-orange-300">+</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/partners?channel=search-firms#apply" className="rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-300">
              Start search-firm pilot
            </Link>
            <Link href="/search-firms" className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5">
              Return to search-firm overview
            </Link>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
