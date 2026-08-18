import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Starting Monday | Demo Sandbox - Alto-Shaam Candidate Match',
  description:
    'Private demo sandbox showing anonymized candidate profile mapping to Alto-Shaam role-fit signals.',
  robots: { index: false, follow: false },
}

const CANDIDATE_SNAPSHOT = {
  targetRoles: [
    'Senior Strategic Account Manager',
    'Key Account Manager',
    'Business Development Manager (Foodservice Equipment)',
    'Regional Account Manager',
  ],
  differentiators: [
    'ACF Certified Executive Chef with 17+ years in culinary and hospitality operations',
    'Commercial equipment consultative sales with operator-level credibility',
    'First-year territory growth of $3.0M and active ownership of a multi-million-dollar pipeline',
    'Hands-on project coverage from kitchen workflow design through installation',
  ],
  constraints: [
    'Remote-first or hybrid roles preferred',
    'Sustainable travel rhythm (occasional overnight only)',
    'Clear base + commission structure with strategic account growth path',
  ],
}

type SignalRow = {
  signal: string
  whyItMatters: string
  candidateAngle: string
  nextAction: string
}

const ALTO_SHAAM_SIGNALS: SignalRow[] = [
  {
    signal: 'Product line momentum in combi, smoke, and holding solutions for institutional kitchens',
    whyItMatters:
      'Indicates consultative conversations with multi-stakeholder buyers rather than pure transactional sales.',
    candidateAngle:
      'Candidate has direct operator-to-buyer translation experience across workflow, labor pressure, and ROI framing.',
    nextAction:
      'Lead outreach with a two-minute "kitchen throughput and labor-efficiency" narrative tied to institutional use cases.',
  },
  {
    signal: 'Dealer and rep ecosystem remains central to regional growth execution',
    whyItMatters:
      'Regional account impact depends on channel discipline, not only direct enterprise selling.',
    candidateAngle:
      'Candidate has lived both account ownership and field coordination realities in foodservice equipment environments.',
    nextAction:
      'Prepare a 30-60-90 plan showing dealer enablement cadence, rep feedback loop, and target account conversion goals.',
  },
  {
    signal: 'Buyer pressure around speed, consistency, and labor constraints in hospitality and institutional foodservice',
    whyItMatters:
      'Stronger sellers win by teaching operators how to solve production constraints, not by listing specs.',
    candidateAngle:
      'Executive-chef foundation gives credibility in operational pain language that generic sellers often miss.',
    nextAction:
      'Open conversations with a "before/after kitchen flow" discussion backed by prior project outcomes.',
  },
]

const ROLE_FIT = [
  {
    role: 'Senior Strategic Account Manager',
    score: 'High fit',
    rationale: 'Best match for consultative selling depth plus strategic account growth trajectory.',
  },
  {
    role: 'Key Account Manager',
    score: 'High fit',
    rationale: 'Aligns with relationship-heavy, value-based sales approach and pipeline ownership history.',
  },
  {
    role: 'Regional Sales Manager',
    score: 'Medium-high fit',
    rationale: 'Strong if scope emphasizes account strategy and market development over immediate large-team management.',
  },
]

export default function AltoShaamSandboxPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-14">
        <header className="mb-10">
          <p className="text-[11px] tracking-[0.08em] text-orange-300">Private demo sandbox</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Alto-Shaam Candidate Match and Signal Walkthrough
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-300">
            This page is a meeting-ready sandbox built from an anonymized candidate profile to demonstrate how
            Starting Monday maps resume evidence to role-fit and signal-driven outreach strategy.
          </p>
          <p className="mt-2 text-xs text-slate-400">
            Source basis: anonymized profile and target-company list prepared for demo validation.
          </p>
          <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
        </header>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-orange-300">Candidate snapshot</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-3">
            <div>
              <h3 className="text-xs font-semibold tracking-[0.08em] text-slate-400">Target roles</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {CANDIDATE_SNAPSHOT.targetRoles.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.08em] text-slate-400">Differentiators</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {CANDIDATE_SNAPSHOT.differentiators.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold tracking-[0.08em] text-slate-400">Search constraints</h3>
              <ul className="mt-2 space-y-2 text-sm text-slate-200">
                {CANDIDATE_SNAPSHOT.constraints.map((item) => (
                  <li key={item}>- {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-orange-300">Role-fit scoreboard</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Fit</th>
                  <th className="px-3 py-2 font-semibold">Why</th>
                </tr>
              </thead>
              <tbody>
                {ROLE_FIT.map((row) => (
                  <tr key={row.role} className="border-b border-white/5 align-top text-slate-200">
                    <td className="px-3 py-2">{row.role}</td>
                    <td className="px-3 py-2">{row.score}</td>
                    <td className="px-3 py-2 text-slate-300">{row.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-8 rounded-xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-orange-300">
            Alto-Shaam signal board (what was not shown live)
          </h2>
          <div className="mt-4 space-y-4">
            {ALTO_SHAAM_SIGNALS.map((row) => (
              <article key={row.signal} className="rounded-lg border border-white/10 bg-slate-900/70 p-4">
                <h3 className="text-sm font-semibold text-white">{row.signal}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">Why it matters: </span>
                  {row.whyItMatters}
                </p>
                <p className="mt-1.5 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">Candidate angle: </span>
                  {row.candidateAngle}
                </p>
                <p className="mt-1.5 text-sm text-slate-300">
                  <span className="font-semibold text-slate-200">Next action: </span>
                  {row.nextAction}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-orange-400/30 bg-orange-500/10 p-5 sm:p-6">
          <h2 className="text-sm font-semibold tracking-[0.08em] text-orange-300">Demo script cue card</h2>
          <ol className="mt-3 space-y-2 text-sm text-slate-200">
            <li>1. Start with role-fit scoreboard to establish strategic-match thesis in under 90 seconds.</li>
            <li>2. Walk signal board and tie each signal to one concrete outreach move.</li>
            <li>3. Close with candidate differentiation: operator credibility + consultative commercial execution.</li>
          </ol>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/demo"
              className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-slate-950 hover:bg-orange-400"
            >
              Return to main demo
            </Link>
            <Link
              href="/signup?from=demo"
              className="inline-flex items-center rounded-full border border-white/20 px-4 py-2 text-xs font-semibold tracking-[0.04em] text-white hover:border-white/40"
            >
              Start trial
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
