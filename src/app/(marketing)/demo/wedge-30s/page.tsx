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
    <div className="relative min-h-screen overflow-x-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.22),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.1),_transparent_30%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(10,15,28,0.96)_60%,_rgba(10,15,28,1)_100%)]" />

      <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/78 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/handshake-review" className="text-[13px] text-slate-200 transition-colors hover:text-white">
              Handshake demo
            </Link>
            <Link href="/alumni-networks-review" className="text-[13px] text-slate-200 transition-colors hover:text-white">
              Alumni demo
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-5xl rounded-[1.5rem] border border-white/10 bg-[linear-gradient(150deg,rgba(26,22,20,0.72),rgba(10,14,24,0.92))] p-6 shadow-[0_18px_56px_rgba(15,23,42,0.24)] sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-200">30-second wedge demo</p>
          <h1 className="mt-3 max-w-3xl font-serif text-[34px] leading-[1.05] tracking-tight text-white sm:text-[46px]">
            Be on the shortlist before the role is posted.
          </h1>
          <p className="mt-4 max-w-3xl text-[16px] leading-relaxed text-slate-200 sm:text-[18px]">
            This is the full product wedge in one screen: likely-to-open role timing, decision-path mapping, and your next relationship action.
          </p>

          <section className="mt-6 space-y-3">
            {SHORTLIST.map((item) => (
              <article key={item.role} className="rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-[14px] font-semibold text-white">{item.role}</h2>
                  <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-orange-200">{item.confidence}</span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-200"><span className="font-semibold text-white">Why now:</span> {item.whyNow}</p>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-200"><span className="font-semibold text-white">Decision path:</span> {item.decisionPath.join(', ')}</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-400"><span className="font-semibold text-slate-300">Source provenance:</span> {item.source}</p>
                {item.confidence === 'Medium confidence' && (
                  <p className="mt-2 text-[12px] text-amber-200">Uncertainty note: verify one additional signal before broad outreach.</p>
                )}
              </article>
            ))}
          </section>

          <section className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-orange-200">Weekly relationship action queue</p>
            <ul className="mt-3 space-y-2">
              {RELATIONSHIP_ACTIONS.map((action) => (
                <li key={action} className="flex gap-2.5 text-[13px] leading-relaxed text-slate-200">
                  <span className="font-bold text-orange-300">+</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/shortlist-sprint"
              className="rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-orange-400"
            >
              Start 7-day shortlist sprint
            </Link>
            <Link
              href="/demo/michael-dashboard"
              className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-slate-100 transition-colors hover:border-orange-300/70 hover:bg-white/5"
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

