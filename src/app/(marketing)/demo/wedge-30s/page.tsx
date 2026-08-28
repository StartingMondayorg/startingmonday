import Link from 'next/link'

const SHORTLIST = [
  {
    role: 'Salesforce · VP of IT',
    confidence: 'High confidence',
    whyNow: 'Leadership-change and mandate-expansion signals indicate role formation before posting pressure spikes.',
    decisionPath: ['Jordan Lee (SVP Product)', 'Priya Patel (Retained Search)', 'Alex Chen (Former CIO peer)'],
    source: 'Signals: leadership movement, mandate shift, hiring language drift',
  },
  {
    role: 'ServiceNow · VP Technology Operations',
    confidence: 'Medium confidence',
    whyNow: 'Platform-integration pressure and role-scope expansion suggest a likely shortlist window soon.',
    decisionPath: ['Rina Das (Platform PMO lead)', 'Mark Evans (Search partner)', 'Elaine Hu (Ops sponsor)'],
    source: 'Signals: reorg language, partner movement, delivery-risk commentary',
  },
]

const RELATIONSHIP_ACTIONS = [
  'Send one sponsor follow-up tied to this week\'s business signal.',
  'Book one decision-path conversation before Friday.',
  'Log one next-step owner so momentum does not stall.',
]

export default function Wedge30SecondDemoPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">

      <nav className="sticky top-0 z-20 border-b border-border bg-background/78 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
          </div>
        </div>
      </nav>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-border bg-card/85 p-6 shadow-xl sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">30-second wedge demo</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-foreground sm:text-[46px]">
            Be on the shortlist before the role is posted.
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-foreground sm:text-[18px]">
            This is the full product wedge in one screen: likely-to-open role timing, decision-path mapping, and your next relationship action.
          </p>

          <section className="mt-6 space-y-3">
            {SHORTLIST.map((item) => (
              <article key={item.role} className="rounded-xl border border-border bg-muted/[0.04] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-foreground">{item.role}</h2>
                  <span className="rounded-full border border-border bg-muted/[0.06] px-2.5 py-1 text-[11px] font-semibold text-primary">{item.confidence}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground"><span className="font-semibold text-foreground">Why now:</span> {item.whyNow}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-foreground"><span className="font-semibold text-foreground">Decision path:</span> {item.decisionPath.join(', ')}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground"><span className="font-semibold text-muted-foreground">Source provenance:</span> {item.source}</p>
                {item.confidence === 'Medium confidence' && (
                  <p className="mt-2 text-[12px] text-warning">Uncertainty note: verify one additional signal before broad outreach.</p>
                )}
              </article>
            ))}
          </section>

          <section className="mt-4 rounded-xl border border-border bg-muted/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">Weekly relationship action queue</p>
            <ul className="mt-3 space-y-2">
              {RELATIONSHIP_ACTIONS.map((action) => (
                <li key={action} className="flex gap-2.5 text-[13px] leading-relaxed text-foreground">
                  <span className="font-bold text-primary">+</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/shortlist-sprint"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Start 7-day shortlist sprint
            </Link>
            <Link
              href="/demo/michael-dashboard"
              className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/70 hover:bg-muted/40"
            >
              Open full operating dashboard
            </Link>
          </div>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

