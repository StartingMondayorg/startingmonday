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

const TITLE_TRANSLATION = ['Federal CIO', 'Deputy CIO', 'Associate CIO', 'Director of IT', 'VP of IT in contractor space']

const SELECTION_CRITERIA = [
  'They operate in federal or federal-adjacent markets where a public-sector leader can transfer credibility quickly.',
  'They need senior technology leadership close to modernization, delivery, and stakeholder management.',
  'They are the right size and role family for a federal leader translating into the private sector without a long recalibration period.',
]

const EXCLUDED_EVALUATION = [
  {
    firm: 'Pure commercial SaaS firms',
    reason: 'Strong for some transitions, but usually requires a sharper product-led operating background than this demo is targeting.',
  },
  {
    firm: 'Very early-stage startups',
    reason: 'The scope is often too broad and too volatile for the transition pattern shown here.',
  },
  {
    firm: 'Large firms without a clear federal lane',
    reason: 'They may have scale, but not enough public-sector relevance to make the transition story feel immediate or believable.',
  },
]

export const metadata: Metadata = {
  title: 'Federal IT Transition Demo | Starting Monday',
  description: 'A public demo for coaches and federal leaders in transition, showing three live role leads and title translation guidance.',
  alternates: {
    canonical: 'https://startingmonday.app/coaches/federal-it-transition-demo',
  },
  robots: { index: true, follow: true },
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
    <article className="rounded-[1.75rem] border border-border bg-muted/[0.04] p-5 shadow-lg backdrop-blur-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Live role lead {index}</p>
          <h3 className="text-[20px] font-semibold leading-tight text-foreground">{company}</h3>
        </div>
        <span className="rounded-full border border-primary/40 px-2.5 py-1 text-[11px] font-semibold text-primary">{confidence}% match</span>
      </div>
      <p className="mb-2 text-[14px] font-medium text-foreground">{title}</p>
      <p className="mb-3 text-[12px] text-muted-foreground">Likely opening window: {window}</p>
      <p className="text-[13px] leading-relaxed text-foreground">
        <span className="font-semibold text-foreground">Why now:</span> {whyNow}
      </p>
    </article>
  )
}

export default function FederalItTransitionDemoPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      <nav className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/coaches" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">Coaches</Link>
            <Link href="/demo/cio" className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">CIO demo</Link>
            <Link href="/signup?from=demo" className="rounded-full bg-primary px-4 py-1.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Public coach demo</p>
            <h1 className="mb-5 max-w-3xl font-serif text-[2.6rem] leading-[1.02] tracking-tight text-foreground sm:text-[3.8rem]">
              Federal transition, not generic job search.
            </h1>
            <p className="max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
              This page shows how Starting Monday helps a federal leader translate experience into a private-sector conversation. It keeps the title shift clear, the market narrow, and the next move visible.
            </p>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-muted-foreground">
              Federal equivalents to a VP of IT are usually CIO, Deputy CIO, Associate CIO, or Director of IT. The page focuses on those translation points and the firm families most likely to make that move credible.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#scanner-leads" className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-muted">
                See the three live leads
              </a>
              <a href="#why-these-firms" className="rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors">
                Why these firms
              </a>
            </div>
          </div>

          <aside className="rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-lg backdrop-blur-sm">
            <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Scanner read</p>
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-background/55 p-4">
                <p className="text-[12px] font-medium text-muted-foreground">Leads found</p>
                <p className="mt-2 text-3xl font-bold text-foreground">3</p>
              </div>
              <div className="rounded-2xl border border-border bg-background/55 p-4">
                <p className="text-[12px] font-medium text-muted-foreground">Confidence</p>
                <p className="mt-2 text-3xl font-bold text-foreground">88%</p>
              </div>
            </div>
            <div className="space-y-3 text-[13px] leading-relaxed text-foreground">
              <p><span className="font-semibold text-foreground">Market focus:</span> federal employees in transition into contractor, consulting, or public-sector-adjacent private roles.</p>
              <p><span className="font-semibold text-foreground">Role focus:</span> CIO, Deputy CIO, Director of IT, and VP-of-IT-equivalent leadership seats.</p>
              <p><span className="font-semibold text-foreground">Use case:</span> send this page before or after a session to keep the conversation anchored in actual market movement.</p>
            </div>
          </aside>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-success/20 bg-success/10 p-5 sm:p-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-success">Why it matters</p>
          <p className="text-[14px] leading-relaxed text-foreground">
            A federal transition is easier to evaluate when the page shows the right titles, the right firms, and the reason each lead stays in play.
          </p>
        </section>

        <section id="scanner-leads" className="mt-10">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Starting Monday scanner</p>
              <h2 className="text-[24px] font-bold leading-tight text-foreground sm:text-[28px]">Three live role leads for the federal IT transition lane</h2>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {LIVE_ROLE_LEADS.map((lead, index) => (
              <LeadCard key={lead.company} index={index + 1} {...lead} />
            ))}
          </div>
        </section>

        <section id="why-these-firms" className="mt-10 rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-lg backdrop-blur-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Why these firms</p>
          <h2 className="mb-3 text-[22px] font-bold leading-tight text-foreground sm:text-[26px]">The shortlist is built around transferability, not just company name.</h2>
          <p className="mb-5 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
            These firms sit in the overlap between federal credibility and private-sector execution. They are close enough to mission, delivery, and modernization work that a federal leader can make the move without having to reinvent the story from scratch.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-3 text-[13px] font-semibold text-muted-foreground">What was evaluated</p>
              <ul className="space-y-3 text-[14px] leading-relaxed text-foreground">
                {SELECTION_CRITERIA.map((item) => (
                  <li key={item} className="rounded-2xl border border-border bg-background/35 px-4 py-3">{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="mb-3 text-[13px] font-semibold text-muted-foreground">What we evaluated but did not include</p>
              <div className="space-y-3">
                {EXCLUDED_EVALUATION.map((item) => (
                  <article key={item.firm} className="rounded-2xl border border-border bg-background/35 px-4 py-3">
                    <p className="mb-1 text-[13px] font-semibold text-foreground">{item.firm}</p>
                    <p className="text-[13px] leading-relaxed text-muted-foreground">{item.reason}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-lg backdrop-blur-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Title translation</p>
          <div className="flex flex-wrap gap-2">
            {TITLE_TRANSLATION.map((item) => (
              <span key={item} className="rounded-full border border-border bg-background/60 px-3 py-1.5 text-[12px] text-foreground">{item}</span>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
            In federal transitions, the label changes before the job function does. This page keeps the focus on the actual movement: who can translate government operating experience into a private-sector seat that trusts them on day one.
          </p>
        </section>

        <section className="mt-10 rounded-[1.75rem] border border-border bg-muted/[0.04] p-6 shadow-lg backdrop-blur-sm">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Send this link</p>
          <p className="text-[15px] leading-relaxed text-foreground">
            Use this public page as the shareable version of the demo. It is designed to read cleanly on its own and give the viewer enough context to understand the market fit immediately.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/demo/federal-it-transition" className="rounded-full bg-primary px-5 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Open private working version
            </Link>
            <Link href="/coaches" className="rounded-full border border-border px-5 py-2.5 text-[13px] font-semibold text-foreground transition-colors">
              Back to coaches
            </Link>
          </div>
          <p className="mt-5 text-[12px] leading-relaxed text-muted-foreground">
            Private by default. This shared page shows market movement only. It never exposes a candidate&apos;s account or activity.
          </p>
        </section>
      </main>
    </div>
  )
}