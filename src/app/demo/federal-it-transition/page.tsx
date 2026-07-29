import type { Metadata } from 'next'
import Link from 'next/link'

const LIVE_ROLE_LEADS = [
  {
    company: 'Booz Allen Hamilton',
    title: 'Vice President, Federal IT Modernization',
    confidence: 91,
    window: '30-90 days',
    whyNow:
      'Federal delivery, security, and transformation mandates often create room for senior operators who can translate government discipline into private-sector execution.',
  },
  {
    company: 'Guidehouse',
    title: 'Director, Federal Technology Transformation',
    confidence: 88,
    window: '15-60 days',
    whyNow:
      'Consulting firms with federal depth tend to need leaders who can bridge modernization, client service, and executive communication without a long ramp.',
  },
  {
    company: 'Leidos',
    title: 'Senior Director, Enterprise IT Modernization',
    confidence: 84,
    window: '45-120 days',
    whyNow:
      'Mission-heavy delivery environments reward leaders who can stabilize complex programs while improving credibility with business and technical stakeholders.',
  },
]

const SELECTION_CRITERIA = [
  'They operate in federal or federal-adjacent markets where a public-sector leader can transfer credibility quickly.',
  'They need senior technology leadership that sits close to modernization, delivery, and stakeholder management.',
  'They are the right size and role family for a federal leader translating into the private sector without a long recalibration period.',
]

const EXCLUDED_EVALUATION = [
  {
    firm: 'Pure commercial SaaS firms',
    reason: 'They can be strong matches for some transitions, but they usually demand a sharper product-led operating background than this demo is targeting.',
  },
  {
    firm: 'Very early-stage startups',
    reason: 'The role scope is often too broad and too volatile for the transition pattern this page is trying to illustrate.',
  },
  {
    firm: 'Large firms without a clear federal lane',
    reason: 'They may have scale, but not enough public-sector relevance to make the transition story feel immediate or believable.',
  },
]

export const metadata: Metadata = {
  title: 'Starting Monday | Federal IT Transition Demo',
  description: 'A shareable demo for Cynthia Iglesias Guven focused on federal employees in transition and VP of IT-equivalent roles.',
  robots: { index: false, follow: false },
}

function LeadCard({
  index,
  company,
  title,
  confidence,
  window,
  whyNow,
}: (typeof LIVE_ROLE_LEADS)[number] & { index: number }) {
  return (
    <article className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-orange-200 mb-2">Live role lead {index}</p>
          <h3 className="text-[20px] font-semibold text-white leading-tight">{company}</h3>
        </div>
        <span className="rounded-full border border-orange-300/40 px-2.5 py-1 text-[11px] font-semibold text-orange-100">{confidence}% match</span>
      </div>
      <p className="text-[14px] font-medium text-slate-100 mb-2">{title}</p>
      <p className="text-[12px] text-slate-300 mb-3">Likely opening window: {window}</p>
      <div className="space-y-3 text-[13px] leading-relaxed text-slate-200">
        <p><span className="font-semibold text-white">Why now:</span> {whyNow}</p>
      </div>
    </article>
  )
}

export default function FederalItTransitionDemoPage() {
  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[52rem] bg-[radial-gradient(ellipse_at_top_left,_rgba(193,127,59,0.18),_transparent_58%),radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.08),_transparent_38%)]" />

      <nav className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-slate-300 hover:text-white transition-colors">Main demo</Link>
            <Link href="/demo/cio" className="text-[13px] text-slate-300 hover:text-white transition-colors">CIO demo</Link>
            <Link href="/signup?from=demo" className="rounded-full bg-orange-500 px-4 py-1.5 text-[13px] font-semibold text-slate-950 hover:bg-orange-600 transition-colors">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-orange-300 mb-4">Live demo</p>
            <h1 className="font-serif text-[2.6rem] sm:text-[3.8rem] leading-[1.02] tracking-tight text-white mb-5 max-w-3xl">
              Federal transition, not generic job search.
            </h1>
            <p className="max-w-2xl text-[16px] leading-relaxed text-slate-300">
              Built for federal leaders in transition and the coaches who support them. This demo treats the market the way it actually moves: the role title changes by sector, but the work is still about translating operating credibility into a private-sector mandate.
            </p>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-slate-400">
              Federal equivalents to a VP of IT are usually CIO, Deputy CIO, Associate CIO, or Director of IT. The scanner focuses on those translation points and shows where the next conversation is likely to start.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#scanner-leads" className="rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-slate-950 hover:bg-slate-100 transition-colors">
                See the three live leads
              </a>
              <a href="#between-sessions" className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-white hover:border-white/30 transition-colors">
                What this helps between sessions
              </a>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-sm">
            <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-orange-200 mb-4">Scanner read</p>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Leads found</p>
                <p className="mt-2 text-3xl font-bold text-white">3</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4">
                <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Confidence</p>
                <p className="mt-2 text-3xl font-bold text-white">88%</p>
              </div>
            </div>
            <div className="space-y-3 text-[13px] leading-relaxed text-slate-200">
              <p><span className="font-semibold text-white">Market focus:</span> federal employees in transition into contractor, consulting, or public-sector-adjacent private roles.</p>
              <p><span className="font-semibold text-white">Role focus:</span> CIO, Deputy CIO, Director of IT, and VP-of-IT-equivalent leadership seats.</p>
              <p><span className="font-semibold text-white">Demo promise:</span> if the page does not help between sessions, it should be changed.</p>
            </div>
          </aside>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-emerald-300/20 bg-emerald-300/10 p-5 sm:p-6">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-200 mb-2">What this page is for</p>
          <p className="text-[14px] leading-relaxed text-slate-100">
            One better than 15 minutes: a demo page built for a federal-transition executive. If it would not help them between sessions, it should not ship.
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-300">
            That is the bar this demo is built to meet.
          </p>
        </section>

        <section id="scanner-leads" className="mt-10">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-orange-300 mb-2">Starting Monday scanner</p>
              <h2 className="text-[24px] sm:text-[28px] font-bold text-white leading-tight">Three live role leads for the federal IT transition lane</h2>
            </div>
            <p className="hidden sm:block text-[12px] text-slate-400 max-w-xs text-right">
              These are scanner hypotheses, not generic job postings. Each lead is the kind of role family Cynthia can use to coach a federal leader into the private sector.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {LIVE_ROLE_LEADS.map((lead, index) => (
              <LeadCard key={lead.company} index={index + 1} {...lead} />
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-orange-200 mb-3">Why these firms</p>
          <h2 className="text-[22px] sm:text-[26px] font-bold text-white leading-tight mb-3">
            The shortlist is built around transferability, not just company name.
          </h2>
          <p className="text-[14px] leading-relaxed text-slate-300 max-w-3xl mb-5">
            We selected these three because they sit in the overlap between federal credibility and private-sector execution. They are close enough to the mission, delivery, and modernization work that a federal leader can make the move without having to reinvent the story from scratch.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-300 mb-3">What was evaluated</p>
              <ul className="space-y-3 text-[14px] leading-relaxed text-slate-200">
                {SELECTION_CRITERIA.map((item) => (
                  <li key={item} className="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-300 mb-3">What we evaluated but did not include</p>
              <div className="space-y-3">
                {EXCLUDED_EVALUATION.map((item) => (
                  <article key={item.firm} className="rounded-2xl border border-white/8 bg-slate-950/35 px-4 py-3">
                    <p className="text-[13px] font-semibold text-white mb-1">{item.firm}</p>
                    <p className="text-[13px] leading-relaxed text-slate-300">{item.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-6 shadow-[0_18px_50px_rgba(15,23,42,0.24)] backdrop-blur-sm">
          <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-orange-200 mb-3">Use it in the room</p>
          <p className="text-[15px] leading-relaxed text-slate-100">
            Cynthia, use this as the working artifact in the room: it gives you the market, the three role families, and the language to turn federal experience into a private-sector conversation.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/demo/cio" className="rounded-full bg-orange-500 px-5 py-2.5 text-[13px] font-semibold text-slate-950 hover:bg-orange-600 transition-colors">
              Open the CIO demo
            </Link>
            <Link href="/coaches/federal-it-transition-demo" className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-white hover:border-white/30 transition-colors">
              Open public share version
            </Link>
            <Link href="/signup?from=demo" className="rounded-full border border-white/15 px-5 py-2.5 text-[13px] font-semibold text-white hover:border-white/30 transition-colors">
              Start a trial
            </Link>
          </div>
        </section>
      </main>
    </div>
  )
}