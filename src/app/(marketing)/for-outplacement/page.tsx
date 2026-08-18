import type { Metadata } from 'next'
import Link from 'next/link'
import { CompactTimelineModule } from '@/components/channel/CompactTimelineModule'
import { ProofStoriesModule } from '@/components/channel/ProofStoriesModule'

export const metadata: Metadata = {
  title: 'Outplacement Partner Preview | Starting Monday',
  description: 'For outplacement and transition firms that want stronger cohort momentum, better interview readiness, and clearer placement outcomes without adding counselor admin load.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement' },
  openGraph: {
    title: 'Outplacement Partner Preview | Starting Monday',
    description: 'Give displaced executives a practical operating layer between sessions: pipeline, signals, prep briefs, and daily execution cadence.',
    url: 'https://startingmonday.app/for-outplacement',
  },
}

const FEATURES = [
  {
    name: 'Active Search Infrastructure',
    forFirm: 'Your program graduates executives with a clear understanding of the search process. Starting Monday gives them the platform to actually run it. Pipeline command center, company intelligence scanner, daily briefing, interview prep briefs - it is the operational layer that turns your workshop into an active campaign.',
    outcome: 'Executives leave your program with a running search, not a revised resume and a list of job boards. Programs using the operating layer show stronger early-stage momentum-higher first-interview rates and more signal-driven actions in the first 30 days. Your client\'s HR team sees the difference.',
  },
  {
    name: 'Company Intelligence Scanner',
    forFirm: 'The scanner monitors every company an executive is tracking - news, executive departures, funding, 8-K filings, career page postings - every 48 hours. When signals cluster into a pattern that precedes a CIO or VP search, the platform names it and alerts the executive before the role is formalized.',
    outcome: 'Executives reach out to target companies before searches go to firms. That is the window that matters at the senior level. Your program delivers it.',
  },
  {
    name: 'Daily Briefing and Accountability',
    forFirm: 'Every morning, the platform sends each enrolled executive a digest of new signals, pending follow-up actions, and pipeline status. It installs the daily discipline that displaced executives often lose when the structure of employment disappears. This reduces the need for manual check-ins between sessions-based on early pilot observation.',
    outcome: 'Search activity stays consistent between check-ins. Executives who were drifting stay in motion. Your counselors spend time on strategy, not accountability.',
  },
]

const PROOF_METRICS = [
  {
    value: '1-3 wks',
    label: 'typical lead time on role-shaping signals before broad-market posting (documented timing model)',
  },
  {
    value: '60 sec',
    label: 'to generate a role-specific prep brief before any interview or first call',
  },
  {
    value: '3x/wk',
    label: 'automated career-page scans on every tracked target company',
  },
  {
    value: '24-48 hrs',
    label: 'from setup to first signal delivery for an enrolled executive',
  },
]

const SESSION_YIELD_METRICS = [
  {
    metric: 'Session strategy time',
    before: 'Sessions dominated by recap and status reconstruction',
    after: 'More session time on strategic decisions after the first two weeks (directional observation)',
  },
  {
    metric: 'Context rebuild time',
    before: 'Significant time rebuilding activity context each session',
    after: 'Entry at decision quality using the what-changed prep snapshot (directional observation)',
  },
]

const METHODOLOGY_NOTES = [
  'Activation rate numerator: participants with completed account setup and initial target list. Denominator: assigned cohort seats.',
  'Signal-response numerator: active participants with at least one logged signal-driven action in period. Denominator: active participants.',
  'Measurement windows: day 0 baseline, day 30 pilot decision, day 60 stabilization review.',
]

const PEER_VALIDATED_ARTIFACTS = [
  'Regional provider cohort A: day-30 scorecard export with method notes',
  'National provider cohort B: counselor operating cadence and intervention summary',
]

const COMPARISON_ROWS = [
  {
    dimension: 'Participant operating model',
    current: 'Workshops plus manual spreadsheets plus ad hoc follow-up',
    operatingLayer: 'Daily operating cadence with signals, prep briefs, and tracked actions',
  },
  {
    dimension: 'Counselor time allocation',
    current: 'High context rebuild load in each session',
    operatingLayer: 'More strategy time using shared workflow visibility',
  },
  {
    dimension: 'Program-level visibility',
    current: 'Delayed and manual status collection',
    operatingLayer: 'Cohort-level engagement, confidence, momentum, and narrative-drift visibility with a weekly review packet',
  },
]

const GOVERNANCE_MEETINGS = [
  {
    cadence: 'Weekly operating review',
    owner: 'Program lead',
    requiredOutput: 'Risk list, intervention assignments, and next-week plan.',
  },
  {
    cadence: 'Biweekly counselor sync',
    outcome: 'Search activity stays consistent between check-ins. Executives who were drifting stay in motion, and the weekly review packet makes confidence and narrative drift visible before they become session problems. Your counselors spend time on strategy, not accountability.',
    requiredOutput: 'Session-yield trends, adoption blockers, and coaching adjustments.',
  },
]

const COUNSELOR_QUOTES = [
  {
    quote: 'By week two, I was spending less time asking what happened and more time coaching what to do next.',
    attribution: 'Counselor, regional transition cohort A (anonymized)',
  },
  {
    quote: 'The what-changed view before sessions removed most of the context catch-up.',
    attribution: 'Counselor lead, enterprise-sponsored cohort C (anonymized)',
  },
]

const PILOT_SCORECARD = [
  {
    metric: 'Week 1 cohort activation',
    success: 'At least 80% of assigned executives activate and set target list baseline.',
  },
  {
    metric: 'Week 2 signal response',
    success: 'Each active executive takes at least one signal-driven outreach action.',
  },
  {
    metric: 'Week 3 prep quality',
    success: 'At least one prep brief reviewed before a real interview conversation.',
  },
]

const ANON_SOCIAL_PROOF = [
  {
    title: 'National outplacement provider, technology cohort',
    detail: 'Pilot cohort showed stronger week-2 outreach consistency after introducing daily decision prompts and counselor-side activity visibility.',
  },
  {
    title: 'Regional transition specialist, mixed leadership cohort',
    detail: 'Counselor prep time dropped as participants arrived with current pipeline status and signal context already organized.',
  },
]

const PILOT_IMPLEMENTATION_STEPS = [
  {
    week: 'Week 0',
    action: 'Kickoff and baseline setup',
    owner: 'Partner lead + Starting Monday',
    outcome: 'Cohort defined, scorecard baseline approved, seat mix confirmed.',
  },
  {
    week: 'Week 1',
    action: 'Activation sprint',
    owner: 'Counselor leads + participant cohort',
    outcome: 'Target list setup complete and first signal review performed.',
  },
  {
    week: 'Week 2',
    action: 'Signal-to-action execution',
    owner: 'Participants with counselor oversight',
    outcome: 'Each active participant logs at least one signal-driven outreach action.',
  },
  {
    week: 'Week 3',
    action: 'Prep quality checkpoint',
    owner: 'Counselors + participants',
    outcome: 'At least one high-stakes conversation prepared through a prep brief.',
  },
]

const WEEKLY_CADENCE = [
  'Monday: cohort pipeline review and stalled participant triage',
  'Tuesday through Thursday: daily signal review and one high-quality action per participant',
  'Pre-session: counselor reads what changed since prior conversation',
  'Friday: risk and momentum review with next-week intervention list',
]

const ROLE_MATRIX = [
  {
    role: 'Starting Monday platform',
    owns: 'Signal detection, prep brief generation, activity visibility, scorecard reporting.',
  },
  {
    role: 'Counselors',
    owns: 'Judgment, narrative coaching, prioritization, and confidence support.',
  },
  {
    role: 'Program lead',
    owns: 'Cohort governance, adoption accountability, and escalation decisions.',
  },
]

const OBJECTIONS = [
  {
    objection: 'We already provide this in coaching and workshops.',
    response:
      'That is exactly why this works. Starting Monday is not a replacement for your counselors. It is the between-session operating layer that reduces admin drag and keeps executives in motion.',
  },
  {
    objection: 'Our executives are overwhelmed and will not adopt another tool.',
    response:
      'Adoption improves when framed as one morning decision list, not another platform. Start with a 30-day cohort pilot and measure activation and action rates before deciding on rollout.',
  },
]

const OUTPLACEMENT_PROOF_STORIES = [
  {
    title: 'Cohort activation lift',
    role: 'Program operator',
    outcome: 'Week-2 action consistency improved when participants followed daily signal-driven prompts.',
  },
  {
    title: 'Counselor prep efficiency',
    role: 'Counselor lead',
    outcome: 'Session time shifted toward strategy as context rebuild requirements decreased.',
  },
  {
    title: 'Sponsor confidence signal',
    role: 'Program sponsor audience',
    outcome: 'Weekly scorecard visibility made intervention decisions faster and more objective.',
  },
]

export default function ForOutplacementPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[24rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.18),_transparent_36%),linear-gradient(180deg,_rgba(9,14,26,0.96)_0%,_rgba(10,15,28,0.96)_100%)]" />

      {/* Nav */}
      <nav className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-5">
            <Link href="/demo" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              See a demo
            </Link>
            <Link href="/for-outplacement/faq" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              FAQ
            </Link>
            <Link href="/for-outplacement/trust-pack" className="text-[13px] text-slate-200 hover:text-white transition-colors">
              Trust pack
            </Link>
            <Link
              href="/partners"
              className="text-[13px] font-semibold text-slate-900 bg-orange-500 px-4 py-1.5 rounded hover:bg-orange-600 transition-colors"
            >
              Become a partner
            </Link>
          </div>
        </div>
      </nav>

      <main className="bg-transparent text-slate-100">

{/* Header */}
        <header className="px-4 sm:px-6 pt-14 pb-12">
          <div className="max-w-2xl mx-auto">
            <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
              Partner Guide
            </p>
            <h1 className="text-[30px] sm:text-[38px] font-bold text-white leading-[1.15] tracking-tight mb-4">
              Starting Monday for <span className="whitespace-nowrap">Outplacement Firms</span>
            </h1>
            <p className="text-[16px] text-slate-200 leading-relaxed">
              Give displaced executives an active search platform, not just workshop content.
            </p>
            <p className="text-[13px] text-orange-200 leading-relaxed mt-4 max-w-xl">
              The goal is simple: stronger placement momentum with less counselor admin overhead.
            </p>
            <p className="text-[13px] text-slate-200 leading-relaxed mt-3 max-w-xl">
              Pilot is for evidence and decision, not long-term lock-in.
            </p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Why now</p>
              <p className="text-[13px] leading-relaxed text-slate-200">Outplacement outcomes are judged quickly. Programs that create consistent week-1 and week-2 motion outperform programs that rely on workshop-only momentum.</p>
            </div>
            <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">This week</p>
              <ol className="space-y-1 text-[13px] leading-relaxed text-slate-200">
                <li>1. Set baseline activation and signal-response targets for one cohort.</li>
                <li>2. Run counselor prep with what-changed summaries before sessions.</li>
                <li>3. Review cohort risks in a weekly operating meeting with clear ownership.</li>
              </ol>
            </div>
            <div className="border border-white/10 rounded-2xl p-4 bg-slate-950/60 mt-6 backdrop-blur-sm">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-orange-200 mb-2">You might be thinking</p>
              <div className="space-y-1.5 text-[13px] text-slate-200 leading-relaxed">
                <p><span className="text-white font-semibold">This sounds like one more platform to manage.</span> The goal is the opposite: reduce counselor overhead and keep strategy time high.</p>
              </div>
            </div>
            <div className="mt-5">
              <Link
                href="/features/outplacement"
                className="inline-flex items-center rounded border border-slate-600 bg-slate-900 px-4 py-2 text-[13px] font-semibold text-slate-100 hover:border-slate-400"
              >
                View full outplacement feature one-pager
              </Link>
            </div>
          </div>
        </header>

        <ProofStoriesModule
          title="Role-specific outcomes for outplacement operations"
          stories={OUTPLACEMENT_PROOF_STORIES}
          sourceNote="Directional pilot outcomes; pair with your own day-30 scorecard for expansion decisions."
        />

        <CompactTimelineModule
          channel="outplacement"
          sourcePage="/for-outplacement"
          eyebrow="Mini timeline"
          title="See the outplacement operating flow in 3 phases"
          summary="A compact map of activation, intervention, and sponsor-readout milestones that keeps program buyers oriented quickly."
          steps={[
            { phase: 'Discover', focus: 'Define cohort scope and day-30 baseline risk', visual: 'Book/cohort baseline tiles' },
            { phase: 'Activate', focus: 'Drive weekly signal-to-action velocity', visual: 'Velocity and prep coverage cards' },
            { phase: 'Operate', focus: 'Intervene on stalls and prep sponsor decision packs', visual: 'Exception queue + gate summary' },
          ]}
        />

        {/* Body */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-2xl mx-auto space-y-14">

            {/* What it is */}
            <details className="group border border-white/10 rounded-2xl bg-slate-950/55 overflow-hidden backdrop-blur-sm">
              <summary className="list-none cursor-pointer px-6 py-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors">
                <div>
                  <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-orange-200 mb-1">Deep dive</p>
                  <p className="text-[16px] font-semibold text-white">Expand full partner rationale, evidence, objections, and program model</p>
                </div>
                <span className="text-slate-200 text-[18px] leading-none group-open:rotate-45 transition-transform">+</span>
              </summary>
              <div className="px-6 pb-6 border-t border-white/10 space-y-8">
            <section className="space-y-4 text-[15px] text-slate-200 leading-relaxed">
              <h2 className="text-[22px] font-bold text-white">What Starting Monday is</h2>
              <p>
                Starting Monday is an AI-powered search platform built for leadership-level transitions
                in active career transition. Pipeline tracking, company intelligence scanning, AI
                interview prep briefs, daily briefing, and a strategy brief built from their background
                and target list.
              </p>
              <p>
                For outplacement firms, it is the operational layer that turns your program into an
                active campaign. Your counselors provide the strategy and support. Starting Monday
                provides the infrastructure the executive needs to actually run the search.
              </p>
              <p>
                In practical terms: one shared view for pipeline, signal movement, and prep readiness
                so counselors spend less time rebuilding context and more time on strategic coaching.
              </p>
            </section>

            <section className="border border-white/10 rounded-2xl p-6 bg-white/6 backdrop-blur-sm">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-orange-200 mb-3">Why partners buy</p>
              <h2 className="text-[22px] font-bold text-white mb-3">Outplacement partners buy outcomes first.</h2>
              <ul className="space-y-2 text-[15px] text-slate-200 leading-relaxed pl-1">
                <li>+ More executives taking weekly search actions instead of drifting</li>
                <li>+ Better interview readiness before high-stakes conversations</li>
                <li>+ Clear cohort-level visibility without manual check-in overhead</li>
                <li>+ Stronger client confidence in program progress during transition</li>
              </ul>
            </section>

            {/* The gap */}
            <section className="space-y-4 text-[15px] text-slate-200 leading-relaxed">
              <h2 className="text-[22px] font-bold text-white">The gap it fills</h2>
              <p>
                Most outplacement programs are built around workshops, resume reviews, and interview
                coaching. Those are necessary. But they do not give the executive the daily operational
                infrastructure to run a modern senior search.
              </p>
              <p>
                Your executive leaves the program with a revised resume, a revised LinkedIn profile,
                and a list of best practices. Then they go home and manage their search in a
                spreadsheet - manually tracking 40 companies, missing signals before roles are posted,
                preparing for interviews the night before with a ten-minute web search.
              </p>
              <p>
                The gap between your program and a successful placement is infrastructure. Starting
                Monday fills it.
              </p>
            </section>

            {/* How firms use it */}
            <section className="space-y-6">
              <h2 className="text-[22px] font-bold text-white">How outplacement firms use it</h2>
              <div className="space-y-8">
                {FEATURES.slice(0, 3).map(f => (
                  <div key={f.name} className="border-l-2 border-orange-300 pl-5">
                    <p className="text-[13px] font-bold tracking-[0.1em] uppercase text-orange-200 mb-2">{f.name}</p>
                    <p className="text-[15px] text-slate-200 leading-relaxed mb-2">{f.forFirm}</p>
                    <p className="text-[13px] text-slate-200 leading-relaxed">
                      <span className="font-semibold text-slate-200">Outcome: </span>{f.outcome}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h2 className="text-[22px] font-bold text-white">Pilot proof snapshot</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROOF_METRICS.slice(0, 3).map((m) => (
                  <div key={m.label} className="border border-white/10 rounded-2xl p-4 bg-white/6 backdrop-blur-sm">
                    <p className="text-[26px] font-bold text-orange-200 leading-none mb-2">{m.value}</p>
                    <p className="text-[13px] text-slate-200 leading-relaxed">{m.label}</p>
                  </div>
                ))}
              </div>
              <p className="text-[12px] text-slate-200 leading-relaxed">
                Source: product mechanics and our documented signal timing model (method notes at /references). Validate against your own cohort baseline during a pilot.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-[22px] font-bold text-white">30-day partner decision set</h2>
              <div className="space-y-3">
                {PILOT_SCORECARD.slice(0, 2).map((row) => (
                  <div key={row.metric} className="border border-white/10 rounded-2xl p-4 bg-white/6 backdrop-blur-sm">
                    <p className="text-[13px] font-semibold text-white mb-1">{row.metric}</p>
                    <p className="text-[13px] text-slate-200 leading-relaxed">{row.success}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="border border-emerald-200/20 bg-emerald-950/20 rounded-2xl p-6 backdrop-blur-sm">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-emerald-300 mb-3">Trust and governance</p>
              <p className="text-[14px] text-slate-200 leading-relaxed mb-3">
                You get trust-pack documentation, permission boundaries, and procurement-ready pilot governance.
              </p>
              <div className="flex flex-wrap gap-4 text-[13px]">
                <Link href="/for-outplacement/trust-pack" className="text-slate-200 hover:text-white underline underline-offset-2">
                  Open trust pack
                </Link>
                <Link href="/for-outplacement/economics" className="text-slate-200 hover:text-white underline underline-offset-2">
                  View economics
                </Link>
              </div>
            </section>
              </div>
            </details>

            {/* Apply CTA */}
            <section className="bg-white/6 border border-white/10 rounded-2xl p-7 backdrop-blur-sm">
              <p className="text-[11px] font-bold tracking-[0.18em] uppercase text-orange-200 mb-3">
                Ready to partner?
              </p>
              <h2 className="text-[20px] font-bold text-white mb-3 leading-snug">
                Apply to the partner program
              </h2>
              <p className="text-[14px] text-slate-200 leading-relaxed mb-6">
                Submit the application. We follow up within 2 business days with pilot structure, seat options, and rollout details.
              </p>
              <div className="border border-white/10 rounded-2xl p-4 bg-white/6 mb-6">
                <p className="text-[12px] font-semibold text-white mb-2">What happens next</p>
                <ul className="space-y-1 text-[12px] text-slate-200 leading-relaxed">
                  <li>1. Within 2 business days: fit and cohort-scope call</li>
                  <li>2. Within 7 business days: pilot plan, scorecard baseline, and trust review track</li>
                  <li>3. Day 10 onward: activation sprint begins with counselor enablement</li>
                </ul>
              </div>
              <div className="border border-white/10 rounded-2xl p-4 bg-white/6 mb-6">
                <p className="text-[12px] font-semibold text-white mb-2">Calibrated decision questions</p>
                <p className="text-[12px] text-slate-200 leading-relaxed">How would you feel if your next cohort had a shared scorecard your counselors and client HR both trusted?</p>
                <p className="text-[12px] text-slate-200 leading-relaxed mt-1">What would need to be true in 30 days for you to consider expansion rational?</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://app-na2.hubspot.com/meetings/246442927"
                  className="inline-block rounded-full bg-orange-500 px-7 py-3 text-[14px] font-bold text-slate-950 transition-colors hover:bg-orange-400"
                >
                  Book a meeting
                </a>
                <Link
                  href="/partners#apply"
                  className="inline-block rounded-full border border-white/20 bg-transparent px-7 py-3 text-[14px] font-bold text-slate-100 transition-colors hover:border-white/40 hover:bg-white/5"
                >
                  Apply now &rarr;
                </Link>
              </div>
              <p className="text-[12px] text-slate-200 mt-4 leading-relaxed">
                Run one 30-day pilot before deciding on broader rollout.
              </p>
              <p className="text-[12px] text-slate-200 mt-2 leading-relaxed">
                If the pilot does not meet agreed success criteria, you close it cleanly with no expansion commitment.
              </p>
              <p className="text-[12px] text-slate-200 mt-2 leading-relaxed">
                If the answer after 30 days is no, you keep your governance artifacts and close without pressure.
              </p>
              <p className="text-[13px] text-slate-200 mt-4">
                Want to see the platform first?{' '}
                <Link href="/demo" className="text-slate-200 underline hover:text-white transition-colors">
                  Walk through a live demo
                </Link>
                .
              </p>
            </section>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-8 mt-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <p className="text-[11px] text-slate-200">
            Questions? contact@startingmonday.app
          </p>
        </div>
      
          <p className="text-[11px] text-slate-500 mt-2">Privacy-first by design.</p>
</footer>

    </div>
  )
}

