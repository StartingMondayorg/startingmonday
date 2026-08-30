import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Executive Recruiter Demo | Starting Monday',
  description:
    'Starting Monday for executive recruiters. Improve shortlist confidence, accelerate qualified conversations, and reduce partner rework.',
  robots: {
    index: false,
    follow: false,
  },
}

type DemoStep = {
  title: string
  summary: string
  href: string
  cta: string
  whyItMatters: string
}

const demoSteps: DemoStep[] = [
  {
    title: 'Search-firm overview',
    summary: 'Start with the retained-search operating model and where Starting Monday supports kickoff quality and shortlist confidence.',
    href: '/search-firms',
    cta: 'Open search-firm overview',
    whyItMatters: 'Keeps the conversation tied to speed-to-shortlist and confidence-to-submit.',
  },
  {
    title: 'Signal-led role context',
    summary: 'Review how market and company signals shape mandate context before broad posting noise appears.',
    href: '/demo/executive-brief',
    cta: 'Open signal context demo',
    whyItMatters: 'Recruiters care about better timing and fewer dead-end outreach cycles.',
  },
  {
    title: 'Sample candidate brief',
    summary: 'See how narrative quality shifts from generic operator language to board-ready role-fit framing.',
    href: '/search-firms/sample-cfo-brief',
    cta: 'Open sample CFO brief',
    whyItMatters: 'Narrative quality determines whether first conversations become real process.',
  },
  {
    title: 'Pilot governance and scope',
    summary: 'Review trust, procurement posture, and a bounded trial charter for one active search.',
    href: '/search-firms/trial-charter',
    cta: 'Open trial charter',
    whyItMatters: 'Removes adoption friction and makes next step concrete inside the meeting.',
  },
  {
    title: 'Pilot application',
    summary: 'Submit for a 14-day pilot focused on one to two active mandates and a clear decision checkpoint.',
    href: '/partners?channel=search-firms#apply',
    cta: 'Start pilot application',
    whyItMatters: 'A bounded pilot converts interest into measurable adoption.',
  },
]

const proofPoints = [
  'Faster first qualified outreach in live searches where timing signals and prep cadence were maintained.',
  'Cleaner first-round narratives with less partner-level repair work mid-search.',
  'Higher confidence submitting candidates when role context and positioning were reviewed before intro.',
]

const operatingPrinciples = [
  'Keep the pilot bounded to one active mandate with a named internal sponsor.',
  'Review candidate framing quality before first-round outreach scales.',
  'Use day-14 outcomes to decide expansion, not feature preference.',
]

const meetingClose =
  'Let us run this on one active mandate for 14 days. If speed-to-qualified-conversation and shortlist confidence do not improve, you should not continue.'

export default function ExecutiveRecruiterDemoPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      <header className="border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] text-foreground hover:opacity-80">
            <span className="text-foreground">Starting </span>
            <span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/search-firms" className="text-[13px] text-muted-foreground hover:text-foreground">
              Search-firm overview
            </Link>
            <a
              href="https://app-na2.hubspot.com/meetings/246442927"
              className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Book follow-up
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-border bg-muted/[0.03] p-7 shadow-2xl sm:p-9">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Starting Monday for executive recruiters</p>
              <h1 className="max-w-3xl font-serif text-[36px] leading-[1.04] tracking-tight text-foreground sm:text-[52px]">
                Show outcomes, not software.
              </h1>
              <p className="mt-5 max-w-3xl text-[18px] leading-relaxed text-foreground">
                Starting Monday gives retained-search teams a practical operating layer for better shortlist confidence, faster qualified conversations, and less partner rework.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={demoSteps[0].href}
                  className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Explore recruiter workflow
                </Link>
                <Link
                  href="/search-firms/sample-cfo-brief"
                  className="rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold text-foreground hover:border-primary/70 hover:bg-muted/40"
                >
                  Open sample brief
                </Link>
              </div>
            </div>

            <aside className="rounded-3xl border border-primary/25 bg-primary/10 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Pilot outcome</p>
              <p className="mt-3 text-[16px] leading-relaxed text-foreground">
                A 14-day pilot tied to one live mandate, one named sponsor, and one decision checkpoint.
              </p>
              <p className="mt-2 rounded-xl border border-border bg-background/45 p-4 text-[13px] leading-relaxed text-foreground">
                {meetingClose}
              </p>
            </aside>
          </section>

          <section className="mt-10 rounded-3xl border border-border bg-card/55 p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-serif text-[30px] leading-tight text-foreground">Executive recruiter walkthrough</h2>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Five linked views</p>
            </div>
            <div className="space-y-4">
              {demoSteps.map((step, idx) => (
                <article key={step.title} className="rounded-2xl border border-border bg-muted/[0.02] p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                      Step {idx + 1}
                    </p>
                  </div>
                  <h3 className="text-[20px] font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-foreground">{step.summary}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">Why it matters: {step.whyItMatters}</p>
                  <Link
                    href={step.href}
                    className="mt-4 inline-flex items-center rounded-full border border-border px-4 py-1.5 text-[12px] font-semibold text-foreground hover:border-primary/70 hover:bg-muted/40"
                  >
                    {step.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-border bg-muted/[0.03] p-6">
              <h2 className="font-serif text-[30px] leading-tight text-foreground">Proof points to emphasize</h2>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-foreground">
                {proofPoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="text-primary">+</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-border bg-muted/[0.03] p-6">
              <h2 className="font-serif text-[30px] leading-tight text-foreground">Operating principles</h2>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-foreground">
                {operatingPrinciples.map((principle) => (
                  <li key={principle} className="flex gap-3">
                    <span className="text-primary">+</span>
                    <span>{principle}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
