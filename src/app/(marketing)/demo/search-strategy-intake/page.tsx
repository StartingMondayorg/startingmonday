import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Search frame',
    summary: 'What the search is aiming at, what to exclude, and how urgent it is.',
    fields: [
      'Target roles',
      'Stretch roles',
      'Roles to avoid',
      'Transition type',
      'Search stage',
      'Urgency / timing',
    ],
  },
  {
    title: 'Target market',
    summary: 'Which companies, geographies, and operating constraints fit the search.',
    fields: [
      'Target industries',
      'Target companies',
      'Company size / stage',
      'Geography',
      'Remote / travel constraints',
      'Compensation guardrails',
    ],
  },
  {
    title: 'Positioning',
    summary: 'How the candidate should be described in one crisp market narrative.',
    fields: [
      'Current / most recent title',
      'Positioning summary',
      'Differentiators',
      'Proof points',
      'Recent activity summary',
      'Relationships to activate',
    ],
  },
  {
    title: 'Decision rules',
    summary: 'What makes a role a fit, and what should stop the search early.',
    fields: [
      'Culture criteria',
      'Red flags',
      'Non-negotiables',
      'Decision criteria',
      'Board visibility',
      'Stakeholder complexity',
    ],
  },
]

const PREVIEW_CARD = [
  { label: 'Scope', value: '4 sections' },
  { label: 'Read time', value: 'Under 2 minutes' },
  { label: 'Outcome', value: 'Sharper brief' },
]

export const metadata = {
  title: 'Search Strategy Intake Preview - Starting Monday',
  description: 'Preview of the staged intake form used to capture search strategy, target market, positioning, and decision rules.',
}

export default function SearchStrategyIntakePreviewPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[42rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.24),_transparent_33%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.11),_transparent_28%),linear-gradient(180deg,_rgba(7,11,21,0.98)_0%,_rgba(10,15,28,0.96)_58%,_rgba(8,12,22,0.99)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/demo" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <span className="text-[11px] tracking-[0.14em] uppercase text-slate-400">Intake preview</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">
              <span className="rounded-full border border-orange-400/30 bg-orange-500/10 px-3 py-1">Coach-shareable intake</span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">One-sitting completion</span>
            </div>

            <h1 className="mt-5 max-w-3xl font-serif text-[2.5rem] leading-[1.02] tracking-tight text-white sm:text-[3.4rem]">
              A staged search intake for fast, coach-readable strategy.
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-slate-300">
              Four grouped sections replace a long flat form so a coach or candidate can understand the whole search at a glance.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {PREVIEW_CARD.map(card => (
                <div key={card.label} className="rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-slate-400">{card.label}</p>
                  <p className="mt-1 text-[14px] font-semibold text-white">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-orange-400/20 bg-orange-500/8 px-4 py-4 text-[13px] leading-relaxed text-slate-200 sm:px-5">
              <p className="font-semibold text-orange-100">Read this page left to right.</p>
              <p className="mt-1 text-slate-300">Each section groups one search decision area; the right rail is the quick-read guide.</p>
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/55 px-4 py-3 text-[13px] leading-relaxed text-slate-300">
              <p className="font-semibold text-white">Private by default.</p>
              <p className="mt-1">This preview is coach-shareable, but the intake data stays inside your workspace until you choose to save it.</p>
            </div>

            <div className="mt-8 grid gap-4">
              {SECTIONS.map((section, index) => (
                <section key={section.title} className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">
                      Step 0{index + 1}
                    </p>
                    <h2 className="mt-1 text-[20px] font-bold text-white">{section.title}</h2>
                      <p className="mt-2 text-[13px] leading-relaxed text-slate-400">{section.summary}</p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {section.fields.map(field => (
                      <div key={field} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-medium text-slate-100">{field}</span>
                        </div>
                        <div className="mt-2 rounded-lg border border-dashed border-white/10 bg-slate-950/45 px-3 py-2 text-[13px] text-slate-500">
                          {field === 'Roles to avoid'
                            ? 'Exclude support, lateral, or non-target paths.'
                            : field === 'Positioning summary'
                              ? 'Operator for infrastructure modernization and executive transformation.'
                              : field === 'Decision criteria'
                                ? 'Mandate quality, sponsor depth, and decision clarity.'
                                : 'Short answer.'}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 rounded-[2rem] border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Coach view</p>
            <h2 className="mt-3 font-serif text-[2rem] leading-tight text-white">
              Fast answers, not more explanation.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-slate-300">
              The first read should tell you the target, the constraints, and the decision rules without forcing a full parse of the page.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Target roles and industries',
                'Transition type and search stage',
                'Positioning summary and decision criteria',
                'Optional context only when it sharpens the brief',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15 text-[11px] font-bold text-orange-200">
                    ✓
                  </span>
                  <span className="text-[13px] text-slate-200">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-orange-400/20 bg-orange-500/8 p-4">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-orange-200">Downstream use</p>
              <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-slate-200">
                <p>Search Strategy Brief uses the intake as primary context.</p>
                <p>Interview prep briefs honor your decision rules and red flags.</p>
                <p>Outreach drafts match your transition type and timing.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-orange-500 px-4 py-2 text-[13px] font-semibold text-slate-950 transition-colors hover:bg-orange-400"
              >
                Start free
              </Link>
              <Link
                href="/dashboard/strategy/intake"
                className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                Already a member? Open your intake
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  )
}