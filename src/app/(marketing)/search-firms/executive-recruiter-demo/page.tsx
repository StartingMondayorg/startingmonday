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
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(194,119,49,0.24),_transparent_36%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.08),_transparent_32%)]" />

      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="text-[10px] font-bold tracking-[0.16em] text-white hover:opacity-80">
            <span className="text-white">Starting </span>
            <span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/search-firms" className="text-[13px] text-slate-300 hover:text-white">
              Search-firm overview
            </Link>
            <a
              href="https://app-na2.hubspot.com/meetings/246442927"
              className="rounded-full bg-orange-500 px-4 py-1.5 text-[13px] font-semibold text-slate-950 hover:bg-orange-400"
            >
              Book follow-up
            </a>
          </div>
        </div>
      </header>

      <main className="px-4 pb-20 pt-12 sm:px-6 sm:pt-16">
        <div className="mx-auto max-w-6xl">
          <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 shadow-[0_22px_80px_rgba(15,23,42,0.35)] sm:p-9">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">Starting Monday for executive recruiters</p>
              <h1 className="max-w-3xl font-serif text-[36px] leading-[1.04] tracking-tight text-white sm:text-[52px]">
                Show outcomes, not software.
              </h1>
              <p className="mt-5 max-w-3xl text-[18px] leading-relaxed text-slate-200">
                Starting Monday gives retained-search teams a practical operating layer for better shortlist confidence, faster qualified conversations, and less partner rework.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={demoSteps[0].href}
                  className="rounded-full bg-orange-500 px-5 py-2.5 text-[13px] font-semibold text-slate-950 hover:bg-orange-400"
                >
                  Explore recruiter workflow
                </Link>
                <Link
                  href="/search-firms/sample-cfo-brief"
                  className="rounded-full border border-white/20 px-5 py-2.5 text-[13px] font-semibold text-slate-100 hover:border-orange-300/70 hover:bg-white/5"
                >
                  Open sample brief
                </Link>
              </div>
            </div>

            <aside className="rounded-3xl border border-orange-200/25 bg-orange-200/10 p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-100">Pilot outcome</p>
              <p className="mt-3 text-[16px] leading-relaxed text-slate-100">
                A 14-day pilot tied to one live mandate, one named sponsor, and one decision checkpoint.
              </p>
              <p className="mt-2 rounded-xl border border-white/10 bg-slate-950/45 p-4 text-[13px] leading-relaxed text-slate-100">
                {meetingClose}
              </p>
            </aside>
          </section>

          <section className="mt-10 rounded-3xl border border-white/10 bg-slate-900/55 p-6 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="font-serif text-[30px] leading-tight text-white">Executive recruiter walkthrough</h2>
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-400">Five linked views</p>
            </div>
            <div className="space-y-4">
              {demoSteps.map((step, idx) => (
                <article key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-orange-200">
                      Step {idx + 1}
                    </p>
                  </div>
                  <h3 className="text-[20px] font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-slate-200">{step.summary}</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-slate-400">Why it matters: {step.whyItMatters}</p>
                  <Link
                    href={step.href}
                    className="mt-4 inline-flex items-center rounded-full border border-white/20 px-4 py-1.5 text-[12px] font-semibold text-slate-100 hover:border-orange-300/70 hover:bg-white/5"
                  >
                    {step.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className="mt-10 grid gap-6 lg:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-serif text-[30px] leading-tight text-white">Proof points to emphasize</h2>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-slate-200">
                {proofPoints.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span className="text-orange-300">+</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <h2 className="font-serif text-[30px] leading-tight text-white">Operating principles</h2>
              <ul className="mt-4 space-y-3 text-[14px] leading-relaxed text-slate-200">
                {operatingPrinciples.map((principle) => (
                  <li key={principle} className="flex gap-3">
                    <span className="text-orange-300">+</span>
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
