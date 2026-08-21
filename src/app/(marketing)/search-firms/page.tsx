import type { Metadata } from 'next'
import Link from 'next/link'
import { TrackLink } from '@/app/components/TrackLink'
import { SiteFooter } from '@/app/components/SiteFooter'
import { EVENT_NAMES } from '@/lib/channel-metrics-events'
import { ProspectingScannerPanel } from './ProspectingScannerPanel'

export const metadata: Metadata = {
  title: 'Starting Monday for Search Firms',
  description:
    'Starting Monday gives retained search firms one clear brief before round one: mandate context, candidate narrative, interview focus, and risk flags.',
  alternates: {
    canonical: 'https://startingmonday.app/search-firms',
  },
  openGraph: {
    title: 'Starting Monday for Search Firms',
    description:
      'One clear brief before round one. Better shortlist confidence with less partner rework.',
    url: 'https://startingmonday.app/search-firms',
  },
}

const summaryPoints = [
  'Convert kickoff notes into a decision brief in hours, before scope drifts.',
  'Calibrate candidate narrative to sponsor priorities before first client interview.',
  'Pre-structure panel focus so feedback stays comparable and usable.',
  'Surface risk and readiness early enough to reset before credibility drops.',
]

const roleLanes = [
  {
    title: '1) Align the client before outreach starts',
    body: 'Capture sponsor outcomes, non-negotiables, and likely objections in one source of truth.',
  },
  {
    title: '2) Coach the candidate narrative to the mandate',
    body: 'Turn resume facts into a client-ready thesis with proof points and pressure-test prompts.',
  },
  {
    title: '3) Keep client feedback decision-grade',
    body: 'Anchor panel interviews to agreed criteria so shortlist decisions do not collapse into politics.',
  },
]

const differentiators = [
  {
    title: 'Most tools organize activity. Starting Monday organizes judgment.',
    body: 'Traditional recruiter software tracks tasks and stages. Starting Monday centers the decision brief your client and candidate both need before round one.',
  },
  {
    title: 'Most tools produce records. Starting Monday produces interview leverage.',
    body: 'Instead of more notes to reconcile later, your team gets one mandate-level narrative with thesis, proof, risk, and interview focus aligned upfront.',
  },
  {
    title: 'Most tools report after drift. Starting Monday helps prevent drift.',
    body: 'The workflow is built to expose misalignment early so partners can reset sponsor expectations before shortlist confidence breaks.',
  },
]

const whyItWorks = [
  'When clients change the spec mid-search, mandate history is explicit and recoverable.',
  'When interview feedback conflicts, candidate evaluation stays anchored to agreed outcomes.',
  'When offers stall late, motivation and risk signals are already documented and actionable.',
]

export default function SearchFirmsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] text-foreground transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/search-firms/executive-recruiter-demo"
              className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Recruiter outcomes
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
          <div className="mx-auto max-w-5xl">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
              For retained search firms
            </p>
            <h1 className="max-w-4xl font-serif text-[38px] leading-[1.04] tracking-tight text-foreground sm:text-[54px]">
              Your client reaches shortlist confidence before round one.
            </h1>
            <p className="mt-6 max-w-3xl text-[19px] leading-relaxed text-foreground/92 sm:text-[20px]">
              Starting Monday gives recruiters one working brief across the mandate: client context, candidate thesis, interview focus, and risk flags. Fewer late resets. Fewer executive-client surprises.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <TrackLink
                href="/partners?channel=search-firms#apply"
                event={EVENT_NAMES.channelEntryClicked}
                logToUserEvents
                properties={{ channel: 'search_firms', cta_label: 'start_retained_search_pilot', source_page: '/search-firms' }}
                className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start retained-search pilot
              </TrackLink>
              <Link
                href="/search-firms/executive-recruiter-demo"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                Open recruiter outcomes demo
              </Link>
              <Link
                href="/search-firms/sample-cfo-brief"
                className="rounded-full border border-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                View sample CFO brief
              </Link>
            </div>

            <p className="mt-6 text-[12px] tracking-[0.14em] text-muted-foreground">
              One mandate. One brief. One decision path.
            </p>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-muted/[0.03] p-6 shadow-xl backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Executive summary</p>
            <ul className="mt-4 space-y-3 text-[15px] leading-relaxed text-foreground">
              {summaryPoints.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-primary">+</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[2rem] border border-border bg-card/85 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div>
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Recruiter workflow</p>
              <h2 className="font-serif text-[30px] leading-[1.15] text-foreground sm:text-[36px]">How recruiters run a mandate from intake to shortlist.</h2>
              <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-foreground">
                This mirrors the real sequence search partners follow: align the client, coach the candidate, then manage interview signal quality before executive decisions are made.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {roleLanes.map((lane) => (
                <article key={lane.title} className="rounded-2xl border border-border bg-muted/[0.05] p-5">
                  <h3 className="text-[17px] font-semibold text-foreground">{lane.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">{lane.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-card/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Why Starting Monday is different</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-foreground sm:text-[32px]">
              A retained-search tool should sharpen judgment, not just store workflow.
            </h2>
            <div className="mt-6 space-y-4">
              {differentiators.map((item) => (
                <article key={item.title} className="rounded-2xl border border-border bg-muted/[0.04] p-5">
                  <h3 className="text-[17px] font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <ProspectingScannerPanel />

        <section className="px-4 pb-14 sm:px-6 sm:pb-16">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-muted/40 p-6 shadow-xl backdrop-blur-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Executive-client pain points</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-foreground sm:text-[32px]">What breaks most retained searches and how this prevents it.</h2>
            <ul className="mt-5 space-y-3 text-[14px] leading-relaxed text-foreground">
              {whyItWorks.map((point) => (
                <li key={point} className="flex gap-3">
                  <span className="font-bold text-primary">+</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/search-firms/trust"
                className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Review trust controls
              </Link>
              <TrackLink
                href="/search-firms/sample-cfo-brief"
                event={EVENT_NAMES.channelEntryClicked}
                logToUserEvents
                properties={{ channel: 'search_firms', cta_label: 'Review full brief structure', source_page: '/search-firms' }}
                className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
              >
                Review full brief structure
              </TrackLink>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 sm:px-6 sm:pb-20">
          <div className="mx-auto max-w-5xl rounded-[1.75rem] border border-border bg-card/85 p-6 shadow-xl backdrop-blur-sm sm:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Common objections</p>
            <h2 className="mt-3 font-serif text-[26px] leading-[1.2] text-foreground sm:text-[32px]">
              Short answers for the objections you hear most.
            </h2>
            <ul className="mt-4 space-y-2 text-[14px] leading-relaxed text-foreground">
              <li>We already have an ATS and a CRM. Why add another layer?</li>
              <li>Will this create extra work for partners and principals?</li>
              <li>How do we know this improves shortlist quality, not just reporting?</li>
            </ul>
            <div className="mt-6">
              <Link
                href="/search-firms/objections"
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Read full objections and how we overcome them
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  )
}
