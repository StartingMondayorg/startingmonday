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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">

      <header className="sticky top-0 z-20 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/demo" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <span className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground">Intake preview</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="rounded-[2rem] border border-border bg-muted/[0.035] p-6 shadow-2xl shadow-muted/20 backdrop-blur-sm sm:p-8">
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">
              <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1">Coach-shareable intake</span>
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1">One-sitting completion</span>
            </div>

            <h1 className="mt-5 max-w-3xl font-serif text-[2.5rem] leading-[1.02] tracking-tight text-foreground sm:text-[3.4rem]">
              A staged search intake for fast, coach-readable strategy.
            </h1>
            <p className="mt-4 max-w-2xl text-[16px] leading-relaxed text-muted-foreground">
              Four grouped sections replace a long flat form so a coach or candidate can understand the whole search at a glance.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {PREVIEW_CARD.map(card => (
                <div key={card.label} className="rounded-2xl border border-border bg-background/55 px-4 py-3">
                  <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-[14px] font-semibold text-foreground">{card.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/8 px-4 py-4 text-[13px] leading-relaxed text-foreground sm:px-5">
              <p className="font-semibold text-primary">Read this page left to right.</p>
              <p className="mt-1 text-muted-foreground">Each section groups one search decision area; the right rail is the quick-read guide.</p>
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-background/55 px-4 py-3 text-[13px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Private by default.</p>
              <p className="mt-1">This preview is coach-shareable, but the intake data stays inside your workspace until you choose to save it.</p>
            </div>

            <div className="mt-8 grid gap-4">
              {SECTIONS.map((section, index) => (
                <section key={section.title} className="rounded-2xl border border-border bg-card/60 p-5">
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">
                      Step 0{index + 1}
                    </p>
                    <h2 className="mt-1 text-[20px] font-bold text-foreground">{section.title}</h2>
                      <p className="mt-2 text-[13px] leading-relaxed text-muted-foreground">{section.summary}</p>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {section.fields.map(field => (
                      <div key={field} className="rounded-xl border border-border bg-muted/[0.03] p-3.5">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[13px] font-medium text-foreground">{field}</span>
                        </div>
                        <div className="mt-2 rounded-lg border border-dashed border-border bg-background/45 px-3 py-2 text-[13px] text-muted-foreground">
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

          <aside className="lg:sticky lg:top-24 rounded-[2rem] border border-border bg-card/80 p-6 shadow-2xl shadow-muted/20 backdrop-blur-sm sm:p-7">
            <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Coach view</p>
            <h2 className="mt-3 font-serif text-[2rem] leading-tight text-foreground">
              Fast answers, not more explanation.
            </h2>
            <p className="mt-3 text-[14px] leading-relaxed text-muted-foreground">
              The first read should tell you the target, the constraints, and the decision rules without forcing a full parse of the page.
            </p>

            <div className="mt-6 space-y-3">
              {[
                'Target roles and industries',
                'Transition type and search stage',
                'Positioning summary and decision criteria',
                'Optional context only when it sharpens the brief',
              ].map(item => (
                <div key={item} className="flex items-center gap-3 rounded-2xl border border-border bg-muted/[0.04] px-4 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                    ✓
                  </span>
                  <span className="text-[13px] text-foreground">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/8 p-4">
              <p className="text-[11px] font-semibold tracking-[0.16em] uppercase text-primary">Downstream use</p>
              <div className="mt-3 space-y-2 text-[13px] leading-relaxed text-foreground">
                <p>Search Strategy Brief uses the intake as primary context.</p>
                <p>Interview prep briefs honor your decision rules and red flags.</p>
                <p>Outreach drafts match your transition type and timing.</p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Start free
              </Link>
              <Link
                href="/dashboard/strategy/intake"
                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-4 py-2 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted/60"
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