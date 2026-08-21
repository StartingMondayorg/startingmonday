import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Search Firm Trust and Legal Summary | Starting Monday',
  description:
    'Public-facing trust, confidentiality, and legal-readiness summary for retained search firms evaluating a Starting Monday pilot.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms/trust',
  },
}

const trustPoints = [
  'Candidate visibility stays role-scoped, auditable, and revocable across the pilot team.',
  'Pilot reviews run with explicit sharing boundaries agreed by search leadership and counsel before kickoff.',
  'Starting Monday is a decision-support layer for partner and consultant judgment, not an autonomous hiring system.',
]

const legalChecklist = [
  'Confirm confidentiality boundaries, role access assumptions, and approved reviewer roles.',
  'Confirm pilot contract path, data-processing terms, and internal approver sequence.',
  'Confirm retention, deletion, incident response, and escalation ownership.',
]

export default function SearchFirmsTrustPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background px-4 py-10 text-foreground sm:px-6 sm:py-14">
      <div className="mx-auto max-w-5xl">
        <Link href="/search-firms" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          {'<- Back to search firms'}
        </Link>

        <header className="mt-6 rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Trust and legal</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.08] text-foreground sm:text-[44px]">Search-firm trust and legal summary</h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-foreground">
            This summary helps retained-search leadership, legal, and delivery owners decide whether a pilot can run without confidentiality drift or legal ambiguity.
          </p>
        </header>

        <section className="mt-6 rounded-[2rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <h2 className="font-serif text-[24px] leading-[1.15] text-foreground">Trust position in three lines</h2>
          <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-foreground">
            {trustPoints.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="font-bold text-primary">+</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>

          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">First legal pass</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">What legal reviewers should confirm first</h2>
          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Legal checklist</h3>
          <ul className="mt-5 space-y-3 text-[14px] text-foreground">
            {legalChecklist.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="font-bold text-primary">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-xl">
          <h2 className="font-serif text-[24px] leading-[1.15] text-foreground">Confidentiality and AI boundary</h2>
          <p className="mt-3 text-[14px] leading-relaxed text-foreground">
            Candidate-controlled sharing is the default. Partner-side visibility is role-limited, auditable, and revocable. Starting Monday supports partner and consultant review workflows and does not make autonomous hiring decisions.
          </p>
        </section>

        <section className="mt-6 rounded-[2rem] border border-warning/25 bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Next step</p>
          <h2 className="mt-3 font-serif text-[28px] leading-[1.15] text-foreground sm:text-[34px]">Move to procurement only when this aligns with the firm&apos;s legal posture.</h2>
          <h3 className="mt-4 text-[13px] font-semibold uppercase tracking-[0.14em] text-primary">Decision boundary</h3>
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-foreground">
            Keep the decision bounded: if trust controls, access governance, and pilot legal structure are acceptable for the retained-search team, continue to procurement. If not, pause here without adding workflow noise.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/search-firms/procurement" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Review procurement path
            </Link>
            <Link href="/partners?channel=search-firms#apply" className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40">
              Apply to partner program
            </Link>
          </div>
        </section>
      </div>
    
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
  )
}
