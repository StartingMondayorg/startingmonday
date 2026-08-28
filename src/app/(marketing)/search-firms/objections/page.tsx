import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Search-Firm Objections | Starting Monday',
  description:
    'Common executive-recruiter objections and clear responses: where Starting Monday fits, how it affects workflow, and how outcomes are measured.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms/objections',
  },
}

const objectionCards = [
  {
    objection: 'We already have an ATS and a CRM. Why add another tool?',
    response:
      'Starting Monday does not replace pipeline systems. It sits above them as a mandate-quality layer that aligns sponsor outcomes, candidate thesis, interview focus, and risk before round one.',
    proof:
      'Result: less partner re-briefing and fewer late-stage narrative resets across the same ATS/CRM stack.',
  },
  {
    objection: 'This sounds useful, but partners will not adopt extra workflow.',
    response:
      'The operating model is intentionally narrow: one brief per mandate, one sponsor owner, one decision path. It removes reconciliation work rather than adding another reporting ritual.',
    proof:
      'Result: higher consistency in panel feedback and faster shortlist confidence without longer partner meetings.',
  },
  {
    objection: 'How do we know this improves search quality instead of just documentation?',
    response:
      'Quality is evaluated by decision signal quality: fewer conflicting interview reads, earlier risk visibility, and fewer mid-search scope pivots from the client side.',
    proof:
      'Result: better conversion to final shortlist and fewer avoidable resets before offer stage.',
  },
  {
    objection: 'Our clients are different. Will a standardized brief flatten nuance?',
    response:
      'The structure is consistent, but the content is mandate-specific. It preserves nuance by making sponsor context explicit and forcing role-specific proof points.',
    proof:
      'Result: briefs stay tailored while partner teams maintain consistent decision quality standards.',
  },
  {
    objection: 'What about security and confidentiality for retained mandates?',
    response:
      'Access is role-scoped and revocable. Sharing is controlled by mandate ownership, with explicit visibility boundaries for partner, principal, and client-facing views.',
    proof:
      'Result: retained-search discretion is protected while collaboration remains operationally useful.',
  },
]

export default function SearchFirmsObjectionsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

      <main className="px-4 pb-16 pt-16 sm:px-6 sm:pt-20 sm:pb-20">
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Search-firm objections guide</p>
          <h1 className="max-w-4xl font-serif text-[38px] leading-[1.06] tracking-tight text-foreground sm:text-[54px]">
            The objections you hear most, and how to answer them with confidence.
          </h1>
          <p className="mt-6 max-w-3xl text-[18px] leading-relaxed text-foreground sm:text-[20px]">
            Built for retained-search partners who need concise, decision-grade responses when clients question process, tooling, and outcomes.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/search-firms"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
            >
              Back to search-firms page
            </Link>
            <Link
              href="/search-firms/sample-cfo-brief"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              View sample CFO brief
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-5xl gap-4">
          {objectionCards.map((card) => (
            <article key={card.objection} className="rounded-2xl border border-border bg-muted/[0.04] p-6 shadow-xl backdrop-blur-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Objection</p>
              <h2 className="mt-2 text-[22px] font-serif leading-[1.2] text-foreground">{card.objection}</h2>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">How we answer</p>
              <p className="mt-2 text-[15px] leading-relaxed text-foreground">{card.response}</p>

              <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">What changes in practice</p>
              <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">{card.proof}</p>
            </article>
          ))}
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
