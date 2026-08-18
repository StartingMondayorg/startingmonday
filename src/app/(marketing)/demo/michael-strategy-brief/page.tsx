import Link from 'next/link'

const POSITIONING = [
  'Michael Torres is a VP-level enterprise IT operator who wins in high-complexity integration environments.',
  'His strongest differentiator is translating technical modernization into CFO-legible business outcomes.',
  'For Salesforce, he should position as execution discipline for a pressured margin and platform credibility moment.',
]

const STRATEGY_MOVES = [
  {
    title: 'Lead with operating mandate',
    detail:
      'Frame the role as execution under margin pressure and internal platform proof, not technology transformation theater.',
  },
  {
    title: 'Anchor to two business outcomes',
    detail:
      'Tie first-quarter success to one reliability metric and one cost or productivity metric that leadership can track weekly.',
  },
  {
    title: 'Pre-handle the top objection',
    detail:
      'Address the concern that transformation slows delivery by showing week-one governance and decision rights.',
  },
  {
    title: 'Close as a peer',
    detail:
      'End by restating the operating problem and asking for process cadence as a candidate expected to execute immediately.',
  },
]

export default function MichaelStrategyBriefPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase" aria-label="Go to Starting Monday homepage">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/mark-review" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Back to Mark flow
            </Link>
            <Link href="/demo/michael-dashboard" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Michael dashboard
            </Link>
          </div>
        </div>
      </nav>

      <header className="bg-slate-950 px-4 sm:px-6 pt-14 pb-16">
        <div className="max-w-4xl mx-auto">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-400 mb-4">Strategy brief demo</p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.12] tracking-tight mb-5">
            Michael Torres strategy brief
          </h1>
          <p className="text-[16px] text-slate-200 leading-relaxed max-w-3xl">
            Candidate: Michael Torres. Target: VP of IT at Salesforce. This is the high-level strategy framing for the room before detailed interview prep.
          </p>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-14 sm:py-18">
        <div className="max-w-4xl mx-auto space-y-8">
          <section className="border border-slate-200 rounded-lg p-6 bg-white">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">Positioning thesis</p>
            <ul className="space-y-2.5">
              {POSITIONING.map((item) => (
                <li key={item} className="text-[14px] text-slate-800 leading-relaxed flex items-start gap-2.5">
                  <span className="text-orange-500 mt-0.5">-</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="border border-slate-200 rounded-lg p-6 bg-slate-50">
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-4">Strategy moves for the conversation</p>
            <div className="space-y-3">
              {STRATEGY_MOVES.map((move) => (
                <article key={move.title} className="rounded border border-slate-200 bg-white p-4">
                  <p className="text-[13px] font-semibold text-slate-900 mb-1.5">{move.title}</p>
                  <p className="text-[13px] text-slate-700 leading-relaxed">{move.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/demo/executive-brief"
              className="inline-flex items-center justify-center rounded bg-slate-950 text-white text-[13px] font-semibold px-5 py-2.5 hover:bg-slate-800 transition-colors"
            >
              Open live interview brief
            </Link>
            <Link
              href="/demo/michael-dashboard"
              className="inline-flex items-center justify-center rounded border border-slate-300 text-slate-900 text-[13px] font-semibold px-5 py-2.5 hover:border-slate-500 transition-colors"
            >
              Open Michael dashboard
            </Link>
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

