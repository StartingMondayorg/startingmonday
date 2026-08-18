import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Search Firm Pilot Charter | Starting Monday',
  description:
    'Required pilot charter structure for retained search firms. Covers scope, named ownership, day-0 baselines, success thresholds, legal, and procurement approvals before kickoff.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms/trial-charter',
  },
}

const namedOwners = [
  { role: 'Executive sponsor', note: 'Names the day-30 decision owner and approves scope.' },
  { role: 'Practice lead', note: 'Owns mandate selection and kickoff quality commitment.' },
  { role: 'Delivery lead', note: 'Owns consultant workflow adoption and weekly scorecard.' },
  { role: 'Candidate-success owner', note: 'Owns readiness tracking and first-round signal.' },
  { role: 'Scorecard owner', note: 'Owns baseline capture, metric review, and day-30 memo.' },
  { role: 'Legal reviewer', note: 'Confirms confidentiality terms and DPA path before kickoff.' },
]

const baselineFields = [
  'Prep hours per mandate (current baseline)',
  'First-slate acceptance rate (current baseline)',
  'Mid-search reset frequency (current baseline)',
  'Candidate first-round advancement rate (current baseline)',
  'Handoff completion within SLA (current baseline)',
]

const thresholds = [
  {
    outcome: 'Go (expand)',
    condition: 'Predefined thresholds met and executive sponsor approves lane rollout.',
  },
  {
    outcome: 'Revise and extend',
    condition: 'Partial threshold progress with sponsor agreement to extend with adjusted scope.',
  },
  {
    outcome: 'Stop',
    condition: 'Thresholds not met and no sponsor commitment to extension conditions.',
  },
]

const reportingArtifacts = [
  { name: 'Weekly pilot scorecard', cadence: 'Every week throughout the pilot window' },
  { name: 'Midpoint status memo', cadence: 'Day 14–16: progress, risks, and open issues' },
  { name: 'Final decision memo', cadence: 'Day 30: go, revise, or stop with baseline delta' },
]

const approvalChecklist = [
  'Scope confirmed: one mandate, named sponsor, explicit exclusions',
  'Baselines captured: all five Day-0 fields completed and sourced',
  'Legal section complete: contract path, DPA status, reviewer named',
  'Procurement section complete: package, billing terms, order path',
  'Management owners confirmed: all six named roles assigned',
  'Risk register completed: legal, procurement, sponsor, data, adoption',
]

export default function SearchFirmsTrialCharterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 sm:py-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.96)_54%,_rgba(10,15,28,0.98)_100%)]" />
      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms/procurement" className="text-sm text-slate-400 transition-colors hover:text-white">
          {'<- Back to procurement path'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,rgba(28,20,17,0.66),rgba(12,14,24,0.92))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Pilot governance</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.08] text-white sm:text-[44px]">Pilot charter requirements before kickoff.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-slate-200">
            All search-firm pilots require a complete charter before any candidate activation. This page covers the six required sections and the day-30 decision structure.
          </p>
          <p className="mt-5 text-[12px] uppercase tracking-[0.14em] text-slate-400">One mandate. Named sponsor. Day-30 go, revise, or stop.</p>
        </header>

        {/* Named owners */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Section H</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-white">Six named owners required before kickoff</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">No pilot begins without all six roles assigned. Unnamed ownership is the most common reason for mid-search governance failures.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {namedOwners.map((item) => (
              <div key={item.role} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[14px] font-semibold text-white">{item.role}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Day-0 baselines */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Section D</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-white">Day-0 baseline metrics</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">All five baseline fields must be captured and sourced before day-30 scorecard decisions are valid. Retrospective narratives cannot substitute for captured baselines.</p>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-slate-200">
            {baselineFields.map((field) => (
              <li key={field} className="flex gap-3">
                <span className="font-bold text-orange-300">+</span>
                <span>{field}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Success thresholds */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Section E</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-white">Day-30 decision structure</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">Three possible outcomes. Decision must use pre-defined thresholds and baseline deltas, not retrospective narratives or relationship factors.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {thresholds.map((t) => (
              <article key={t.outcome} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[14px] font-semibold text-white">{t.outcome}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-400">{t.condition}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Reporting artifacts */}
        <section className="mt-6 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.22)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Section J</p>
          <h2 className="mt-2 font-serif text-[24px] leading-[1.15] text-white">Required pilot artifacts</h2>
          <div className="mt-4 space-y-3">
            {reportingArtifacts.map((artifact) => (
              <div key={artifact.name} className="flex items-start gap-3">
                <span className="font-bold text-orange-300">+</span>
                <div>
                  <p className="text-[14px] font-semibold text-white">{artifact.name}</p>
                  <p className="text-[12px] text-slate-400">{artifact.cadence}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Approval checklist */}
        <section className="mt-6 rounded-[2rem] border border-white/10 bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] p-6 shadow-[0_20px_70px_rgba(15,23,42,0.24)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Section K</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-white">Charter approval checklist</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-400">All six items must be checked before charter is considered approved and pilot kickoff is authorized.</p>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-slate-200">
            {approvalChecklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-orange-300">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-[2rem] border border-amber-200/25 bg-[linear-gradient(160deg,rgba(28,20,17,0.66),rgba(12,14,24,0.92))] p-6 shadow-[0_22px_80px_rgba(15,23,42,0.28)] backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">Next step</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-white sm:text-[34px]">Complete the charter, then apply.</h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-slate-200">
            If all six charter sections are complete and approved internally, submit your search-firm pilot application. An incomplete charter delays kickoff - legal and procurement reviews cannot begin without it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/partners?channel=search-firms#apply"
              className="rounded-full bg-orange-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-300"
            >
              Apply to partner program
            </Link>
            <Link
              href="/search-firms/trust"
              className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Review trust summary
            </Link>
            <Link
              href="/search-firms/procurement"
              className="rounded-full border border-white/18 px-5 py-3 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
            >
              Procurement path
            </Link>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
