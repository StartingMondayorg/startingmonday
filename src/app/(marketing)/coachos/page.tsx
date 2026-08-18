import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday CoachOS | Relationship-First Career Transition Coaching',
  description: 'A coach-first operating layer for relationship-driven career transition programs. Help clients execute between sessions with less admin load and stronger outcomes.',
  alternates: { canonical: 'https://startingmonday.app/coachos' },
  openGraph: {
    title: 'Starting Monday CoachOS',
    description: 'For relationship-first coaches who want clients prepared, accountable, and moving between sessions.',
    url: 'https://startingmonday.app/coachos',
  },
}

const URGENCY_REASONS = [
  {
    title: 'Clients drift between sessions',
    detail: 'Most professionals in transition lose momentum in weeks 2 and 3. Without a daily action rhythm, the progress your sessions create erodes before the next call.',
  },
  {
    title: 'You are coaching status, not strategy',
    detail: 'Up to 30 minutes per session can go to rebuilding context. CoachOS delivers a what-changed snapshot before every call so that time goes to decisions instead.',
  },
  {
    title: 'The hidden market moves before roles are posted',
    detail: 'Leadership changes, funding events, and quiet openings happen weeks before a role is listed. Your clients need continuous signal awareness, not a weekly check-in.',
  },
  {
    title: 'Already building with AI? CoachOS likely fills a different gap.',
    detail: 'Whatever your tool handles, CoachOS focuses on execution: target-company monitoring, daily accountability, pipeline tracking, and session prep. Most coaches find the two complement each other.',
  },
]

const DEMO_LINKS = [
  {
    label: 'Michael Torres - live dashboard',
    description: 'A prefilled client dashboard: pipeline, contacts, and daily actions.',
    href: '/demo/michael-dashboard',
    cta: 'Open dashboard',
  },
  {
    label: 'Michael Torres - strategy brief',
    description: 'The coaching strategy brief before a VP of IT interview at Salesforce.',
    href: '/demo/michael-strategy-brief',
    cta: 'Read strategy brief',
  },
  {
    label: 'AI interview prep brief',
    description: 'A live AI-generated prep brief streamed in real time.',
    href: '/demo/executive-brief',
    cta: 'See prep brief live',
  },
  {
    label: 'Full interactive demo',
    description: 'Walk through the platform end-to-end at your own pace.',
    href: '/demo',
    cta: 'Start full demo',
  },
]

const CORE_CAPABILITIES = [
  {
    title: 'Daily execution clarity',
    detail: 'Every client gets a simple daily action rhythm: what changed, what matters now, and what to do next.',
  },
  {
    title: 'Session prep snapshot',
    detail: 'Before each call you see exactly what moved since the last session. Less context rebuild, more strategy.',
  },
  {
    title: 'Signal-aware targeting',
    detail: 'Company and role signals alert clients to timing opportunities before roles are publicly posted.',
  },
  {
    title: 'White-label ready',
    detail: 'Clients experience your brand: your logo, your colors, your support email. CoachOS stays invisible.',
  },
]

const OBJECTIONS = [
  {
    objection: 'My coaching is relationship-based. Will software dilute that?',
    response: 'CoachOS handles the execution layer so your session time stays on judgment, trust, and decisions. The tool serves the relationship - it does not replace it.',
  },
  {
    objection: 'I already have an AI tool I built. How does this fit?',
    response: 'It depends on what your tool does - and we can compare the overlap. CoachOS focuses on live signal monitoring, daily client accountability, and between-session tracking. If there is overlap we can work around it; if there is not, the tools likely complement each other.',
  },
  {
    objection: 'Many of my clients are not leaders. Will this still work?',
    response: 'Yes. CoachOS runs both a leader transition track and a professional transition track so you can serve mixed cohorts from one system.',
  },
  {
    objection: 'My team is not technical. Is this manageable?',
    response: 'There is no coding involved. Your team configures tracks, invites clients, and runs weekly cadence through a settings dashboard - the same way you would manage any SaaS tool.',
  },
]

const PRICING = [
  {
    tier: 'Solo',
    price: '$299/mo',
    seats: 'Up to 10 clients',
    bestFor: 'Independent coaches running a small active cohort',
    includes: ['CoachOS branding basics', 'Client dashboard', 'Session prep snapshot', 'Weekly digest'],
  },
  {
    tier: 'Boutique',
    price: '$1,500/mo',
    seats: 'Up to 75 clients',
    bestFor: 'Teams like GHN running multiple active programs',
    includes: ['Full white-label branding', 'Both transition tracks', 'Cohort dashboard', 'Sponsor report export', 'Priority support'],
  },
]

export default function CoachOSPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(249,115,22,0.18),_transparent_36%),linear-gradient(180deg,_rgba(9,14,26,0.96)_0%,_rgba(10,15,28,0.96)_100%)]" />

      <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-slate-100 transition-colors hover:text-white">See a demo</Link>
            <Link href="/for-coaches" className="text-[13px] text-slate-100 transition-colors hover:text-white">For coaches</Link>
            <Link href="/partners" className="inline-flex min-h-[40px] items-center rounded bg-orange-500 px-4 text-[13px] font-semibold text-slate-900 transition-colors hover:bg-orange-600">
              Partner with us
            </Link>
          </div>
        </div>
      </nav>

      <header className="border-b border-white/10 px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-[11px] font-bold tracking-[0.16em] text-orange-500">Starting Monday CoachOS</p>
          <p className="mb-4 text-[18px] font-semibold italic text-orange-200 sm:text-[22px]">The operating system for your next career move.</p>
          <h1 className="mb-5 max-w-4xl text-[32px] font-bold leading-[1.06] tracking-tight text-white sm:text-[48px]">
            For relationship-first career transition coaches who want clients to execute between sessions.
          </h1>
          <p className="mb-8 max-w-3xl text-[16px] leading-relaxed text-slate-100">
            If your coaching strengths are trust, positioning, and network strategy, CoachOS gives your clients the daily operating rhythm that keeps progress moving between calls - without you having to build or manage any software.
          </p>

          <div className="mb-8">
            <Link href="/demo" className="inline-flex min-h-[44px] items-center rounded bg-orange-500 px-6 text-[14px] font-semibold text-slate-900 transition-colors hover:bg-orange-600">
              See the full demo
            </Link>
          </div>
        </div>
      </header>

      <main className="px-4 py-12 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-6xl space-y-12">

          <section className="rounded-[2rem] border border-orange-300/20 bg-orange-400/5 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.18)] backdrop-blur-sm sm:p-7">
            <details className="mb-5">
              <summary className="cursor-pointer text-[13px] font-semibold text-orange-200 select-none">What&rsquo;s included in CoachOS</summary>
              <ul className="mt-3 space-y-1 text-[13px] text-slate-300 list-disc pl-5">
                <li>Daily execution rhythm for every client</li>
                <li>Session prep snapshot before every call</li>
                <li>Company and role signal monitoring</li>
                <li>White-label branding for your practice</li>
                <li>Cohort dashboard and sponsor reporting</li>
              </ul>
            </details>
            <p className="mb-2 text-[12px] font-semibold tracking-[0.02em] text-orange-200">Why coaches act on this now</p>
            <h2 className="mb-5 text-[24px] font-bold leading-snug text-white">The problems that get worse while you wait</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {URGENCY_REASONS.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
                  <h3 className="mb-2 text-[15px] font-semibold text-orange-100">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-slate-100">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-7">
            <p className="mb-2 text-[12px] font-semibold tracking-[0.02em] text-orange-300">See it in action - no signup required</p>
            <h2 className="mb-2 text-[24px] font-bold leading-snug text-white">Live examples using a real client profile</h2>
            <p className="mb-6 text-[14px] leading-relaxed text-slate-100">
              Michael Torres is a VP-level technology leader in active transition. Click any link to walk through what your clients and you would see inside CoachOS.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {DEMO_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-orange-400/40 hover:bg-orange-400/5"
                >
                  <p className="mb-1 text-[12px] font-semibold tracking-[0.08em] text-orange-300">{link.label}</p>
                  <p className="mb-3 text-[13px] leading-relaxed text-slate-100">{link.description}</p>
                  <p className="text-[13px] font-semibold text-orange-400 group-hover:text-orange-300">{link.cta}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-7">
            <p className="mb-2 text-[12px] font-semibold tracking-[0.02em] text-orange-300">What CoachOS does</p>
            <h2 className="mb-1 text-[24px] font-bold leading-snug text-white">Execution infrastructure for coaching practices</h2>
            <p className="text-[13px] text-slate-200">Works for both leader and professional transition clients - no separate system required.</p>
            <p className="mb-5 mt-2 text-[13px] text-slate-100">
              CoachOS also gives your team a coach layer: a clear dashboard, weekly reporting, and cohort-level visibility so delivery stays consistent.{' '}
              <Link href="/demo/coach-dashboard" className="underline underline-offset-2 text-slate-100 transition-colors hover:text-white">
                See coach dashboard demo and coach features
              </Link>
              .
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {CORE_CAPABILITIES.map((item) => (
                <article key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <h3 className="mb-2 text-[15px] font-semibold text-white">{item.title}</h3>
                  <p className="text-[13px] leading-relaxed text-slate-100">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-7">
            <p className="mb-2 text-[12px] font-semibold tracking-[0.02em] text-orange-300">Common questions</p>
            <h2 className="mb-5 text-[24px] font-bold leading-snug text-white">Questions coaches ask before partnering</h2>
            <div className="space-y-3">
              {OBJECTIONS.map((item) => (
                <article key={item.objection} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="mb-2 text-[14px] font-semibold text-white">{item.objection}</p>
                  <p className="text-[13px] leading-relaxed text-slate-100">{item.response}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-slate-950/55 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-7">
            <p className="mb-2 text-[12px] font-semibold tracking-[0.02em] text-orange-300">Pricing</p>
            <h2 className="mb-2 text-[24px] font-bold leading-snug text-white">Pilot pricing for coaching practices</h2>
            <p className="mb-6 text-[14px] leading-relaxed text-slate-100">Begin with an 8-week pilot. Continue only if the workflow fits your clients and your team.</p>
            <div className="grid gap-4 md:grid-cols-2">
              {PRICING.map((tier) => (
                <article key={tier.tier} className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
                  <p className="mb-1 text-[12px] font-semibold tracking-[0.02em] text-slate-100">{tier.tier}</p>
                  <p className="mb-1 text-[30px] font-bold tracking-tight text-white">{tier.price}</p>
                  <p className="mb-1 text-[13px] text-slate-200">{tier.seats}</p>
                  <p className="mb-3 text-[13px] text-slate-100 leading-relaxed">{tier.bestFor}</p>
                  <p className="mb-2 text-[12px] tracking-[0.02em] text-slate-200">Includes</p>
                  <ul className="space-y-2">
                    {tier.includes.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-[12px] text-slate-100">
                        <span className="h-1 w-1 rounded-full bg-orange-300/80" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            <p className="mt-4 text-[12px] text-slate-200">Annual prepay discount: 12%. Larger programs priced on request.</p>
          </section>

          <section className="rounded-[2rem] border border-orange-300/20 bg-orange-400/5 p-6 shadow-[0_18px_70px_rgba(15,23,42,0.22)] backdrop-blur-sm sm:p-7">
            <h2 className="mb-2 text-[24px] font-bold leading-snug text-white">If this fits your practice, start with a quiet pilot</h2>
            <p className="mb-6 text-[14px] leading-relaxed text-slate-100">
              Configure your brand, invite a small cohort, and decide by day 30 using real activation and momentum data.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="mailto:support@startingmonday.app?subject=CoachOS%20Pilot"
                className="inline-flex min-h-[44px] items-center rounded-full bg-orange-500 px-6 text-[14px] font-semibold text-slate-900 shadow-[0_8px_24px_rgba(249,115,22,0.25)] transition-colors hover:bg-orange-600"
              >
                Request a private pilot
              </a>
              <Link href="/demo" className="inline-flex min-h-[44px] items-center rounded-full border border-white/25 px-6 text-[13px] font-semibold text-slate-100 transition-colors hover:border-white/45">
                Walk through the demo first
              </Link>
              <Link href="/for-coaches/trust-pack" className="text-[13px] text-slate-100 underline underline-offset-2 transition-colors hover:text-white">
                Review trust and data policy
              </Link>
            </div>
          </section>

        </div>
      </main>

      <footer className="border-t border-white/10 px-4 py-8 text-[12px] text-slate-100 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <p>Starting Monday CoachOS - execution infrastructure for relationship-first career transition coaching.</p>
          <div className="flex gap-5">
            <Link href="/demo" className="text-slate-100 underline underline-offset-2 transition-colors hover:text-white">Live demo</Link>
            <Link href="/partners" className="text-slate-100 underline underline-offset-2 transition-colors hover:text-white">Partner program</Link>
            <Link href="/" className="text-slate-100 underline underline-offset-2 transition-colors hover:text-white">Starting Monday</Link>
          </div>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>
    </div>
  )
}


