import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Case Studies - Starting Monday',
  description: 'Executive transition case studies with before/after structure, quantified outcomes, and role-specific context.',
  alternates: {
    canonical: 'https://startingmonday.app/case-studies',
  },
}

const CASE_STUDIES = [
  {
    title: 'VP Engineering to CTO move',
    segment: 'VP to C-suite',
    before: 'Reactive outreach and inconsistent interview prep across target companies.',
    after: 'Structured weekly cadence with role-specific prep and clearer sponsor mapping.',
    outcome: 'Reached late-stage interviews in 5 weeks with a signed offer in quarter.',
  },
  {
    title: 'CIO quiet-search campaign',
    segment: 'Seated executive',
    before: 'Limited visibility into timing windows and no repeatable follow-up rhythm.',
    after: 'Signal-led company tracking and outreach sequencing tied to fresh movement.',
    outcome: 'Activated three high-fit conversations before public role postings appeared.',
  },
  {
    title: 'CISO board-facing transition',
    segment: 'Security leadership',
    before: 'Strong technical narrative but weak board and risk-language preparation.',
    after: 'Role-context prep briefs and objection rehearsal for board-level dialogue.',
    outcome: 'Improved interview progression rate and landed final-round shortlist position.',
  },
  {
    title: 'Chief Data Officer search reset',
    segment: 'Data leadership',
    before: 'Broad target list with low conversion and unclear message hierarchy.',
    after: 'Tighter ICP targeting with audience-specific narrative for each conversation type.',
    outcome: 'Conversion from first outreach to live calls improved materially within one month.',
  },
  {
    title: 'SVP Technology urgency campaign',
    segment: 'Post-restructure',
    before: 'High urgency but no system for prioritization or between-session execution.',
    after: 'Daily execution loop with pipeline hygiene and due-date follow-up controls.',
    outcome: 'Recovered momentum in two weeks and maintained weekly interview velocity.',
  },
  {
    title: 'Outplacement cohort pilot',
    segment: 'Partner-led cohort',
    before: 'Manual reporting and low visibility into participant execution quality.',
    after: 'Shared scorecards, standardized prep flow, and partner reporting rhythm.',
    outcome: 'Faster readiness signals and clearer partner-level progress reporting each month.',
  },
]

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-white hover:text-slate-200 transition-colors">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/evidence-hub" className="text-[13px] text-slate-200 hover:text-white transition-colors">Evidence Hub</Link>
            <Link href="/references" className="text-[13px] text-slate-200 hover:text-white transition-colors">References</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-18">
        <header className="mb-10 max-w-3xl">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-3">Case studies</p>
          <h1 className="text-[34px] sm:text-[44px] font-bold text-slate-900 leading-tight mb-4">Publishable outcome stories by role path.</h1>
          <p className="text-[15px] text-slate-600 leading-relaxed">
            Structured before/after narrative with outcome statements, focused on technology executive transitions.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {CASE_STUDIES.map((item) => (
            <article key={item.title} className="border border-slate-200 rounded-lg p-5">
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-slate-500 mb-2">{item.segment}</p>
              <h2 className="text-[17px] font-semibold text-slate-900 mb-3">{item.title}</h2>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-2"><span className="font-semibold text-slate-900">Before:</span> {item.before}</p>
              <p className="text-[13px] text-slate-700 leading-relaxed mb-2"><span className="font-semibold text-slate-900">After:</span> {item.after}</p>
              <p className="text-[13px] text-slate-700 leading-relaxed"><span className="font-semibold text-slate-900">Outcome:</span> {item.outcome}</p>
            </article>
          ))}
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}


