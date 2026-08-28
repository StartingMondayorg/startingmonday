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
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms/procurement" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          {'<- Back to procurement path'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Pilot governance</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.08] text-foreground sm:text-[44px]">Pilot charter requirements before kickoff.</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground">
            All search-firm pilots require a complete charter before any candidate activation. This page covers the six required sections and the day-30 decision structure.
          </p>
          <p className="mt-5 text-[12px] uppercase tracking-[0.14em] text-muted-foreground">One mandate. Named sponsor. Day-30 go, revise, or stop.</p>
        </header>

        {/* Named owners */}
        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Section H</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-foreground">Six named owners required before kickoff</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">No pilot begins without all six roles assigned. Unnamed ownership is the most common reason for mid-search governance failures.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {namedOwners.map((item) => (
              <div key={item.role} className="rounded-xl border border-border bg-muted/[0.03] p-4">
                <p className="text-[14px] font-semibold text-foreground">{item.role}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Day-0 baselines */}
        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Section D</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-foreground">Day-0 baseline metrics</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">All five baseline fields must be captured and sourced before day-30 scorecard decisions are valid. Retrospective narratives cannot substitute for captured baselines.</p>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground">
            {baselineFields.map((field) => (
              <li key={field} className="flex gap-3">
                <span className="font-bold text-primary">+</span>
                <span>{field}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Success thresholds */}
        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Section E</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-foreground">Day-30 decision structure</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">Three possible outcomes. Decision must use pre-defined thresholds and baseline deltas, not retrospective narratives or relationship factors.</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {thresholds.map((t) => (
              <article key={t.outcome} className="rounded-xl border border-border bg-muted/[0.03] p-4">
                <p className="text-[14px] font-semibold text-foreground">{t.outcome}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{t.condition}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Reporting artifacts */}
        <section className="mt-6 rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Section J</p>
          <h2 className="mt-2 font-serif text-[24px] leading-[1.15] text-foreground">Required pilot artifacts</h2>
          <div className="mt-4 space-y-3">
            {reportingArtifacts.map((artifact) => (
              <div key={artifact.name} className="flex items-start gap-3">
                <span className="font-bold text-primary">+</span>
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{artifact.name}</p>
                  <p className="text-[12px] text-muted-foreground">{artifact.cadence}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Approval checklist */}
        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Section K</p>
          <h2 className="mt-2 font-serif text-[26px] leading-[1.15] text-foreground">Charter approval checklist</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">All six items must be checked before charter is considered approved and pilot kickoff is authorized.</p>
          <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground">
            {approvalChecklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-primary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-[2rem] border border-warning/25 bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Next step</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">Complete the charter, then apply.</h2>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-foreground">
            If all six charter sections are complete and approved internally, submit your search-firm pilot application. An incomplete charter delays kickoff - legal and procurement reviews cannot begin without it.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/partners?channel=search-firms#apply"
              className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Apply to partner program
            </Link>
            <Link
              href="/search-firms/trust"
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
            >
              Review trust summary
            </Link>
            <Link
              href="/search-firms/procurement"
              className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
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
