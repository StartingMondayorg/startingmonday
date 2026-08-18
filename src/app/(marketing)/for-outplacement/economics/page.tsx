import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Outplacement Economics | Starting Monday',
  description: 'Seat structure, rollout model, and pilot economics for outplacement firms using Starting Monday with executive cohorts.',
  alternates: { canonical: 'https://startingmonday.app/for-outplacement/economics' },
}

const PARTNER_PLANS = [
  {
    name: 'Pilot Cohort',
    price: 'Custom pilot seats',
    fit: 'Best for firms validating workflow and outcomes with one live executive cohort before broader rollout.',
  },
  {
    name: 'Program Core',
    price: 'Seat-based monthly model',
    fit: 'Best for firms that run recurring transition cohorts and want predictable unit economics.',
  },
]

const WHAT_IS_INCLUDED = [
  'Participant seat provisioning and activation support',
  'Cohort-level engagement visibility for counselor leaders',
  'Signal monitoring and prep brief workflows for active search execution',
  'Partner review cadence and day-30 scorecard',
]

const SCORECARD_METRICS = [
  {
    metric: 'Activation rate',
    detail: 'Percent of assigned participants who complete setup and create initial target company list.',
  },
  {
    metric: 'Signal-driven actions',
    detail: 'Count of outreach or follow-up actions triggered by real signal movement.',
  },
  {
    metric: 'Prep readiness',
    detail: 'Rate of interview conversations with prep brief reviewed beforehand.',
  },
  {
    metric: 'Momentum markers',
    detail: 'Early indicators such as first qualified outreach, first interview, or meaningful stage movement.',
  },
]

const COMMERCIAL_NOTES = [
  'Pilot pricing is structured to lower risk and make the first decision evidence-based, not theoretical.',
  'Volume discounts are available for larger cohorts and longer program terms.',
  'Seat allocations can be tuned across Active and Monitor usage patterns.',
]

const COHORT_SCENARIOS = [
  {
    cohort: '25 seats',
    profile: 'Single office pilot cohort',
    decisionUse: 'Validate activation quality and counselor workflow fit before expansion.',
  },
  {
    cohort: '50 seats',
    profile: 'Multi-team program cohort',
    decisionUse: 'Validate repeatability across counselor teams and participant segments.',
  },
  {
    cohort: '100 seats',
    profile: 'Regional rollout',
    decisionUse: 'Measure governance consistency and operating cadence at scale.',
  },
]

const EMPLOYER_KPI_MAP = [
  {
    buyerMetric: 'Program engagement confidence',
    mappedSignal: 'Activation rate, weekly participant action consistency, stalled-participant trend.',
  },
  {
    buyerMetric: 'Transition momentum quality',
    mappedSignal: 'Time to first qualified outreach, signal-driven action count, interview-prep readiness.',
  },
  {
    buyerMetric: 'Counselor efficiency',
    mappedSignal: 'Reduced context rebuild and faster session preparation from shared workflow visibility.',
  },
]

const SAMPLE_WEEKLY_REPORT = [
  'Activation summary by cohort and counselor team',
  'Top stalled participants with recommended interventions',
  'Signal-driven actions completed this week',
  'Risks, escalations, and next-week plan',
]

const COMMERCIAL_EXAMPLES = [
  {
    seats: '25 seats',
    term: '3-month pilot',
    mix: '15 Active, 10 Monitor',
    monthlyList: '$3,485/mo list before volume discounts',
    estimate: '$10,455 total list over 3 months before negotiated partner terms',
  },
  {
    seats: '50 seats',
    term: '6-month program',
    mix: '30 Active, 20 Monitor',
    monthlyList: '$6,950/mo list before volume discounts',
    estimate: '$41,700 total list over 6 months before negotiated partner terms',
  },
  {
    seats: '100 seats',
    term: '12-month rollout',
    mix: '55 Active, 45 Monitor',
    monthlyList: '$13,240/mo list before volume discounts',
    estimate: '$158,880 total list over 12 months before negotiated partner terms',
  },
]

const BUSINESS_IMPACT = [
  {
    metric: 'Placement-cycle confidence',
    conservative: 'Use day-30 momentum lift as an early indicator, not a guaranteed placement claim.',
  },
  {
    metric: 'Counselor capacity quality',
    conservative: 'Target fewer context-rebuild minutes per session and more strategy-time minutes per session.',
  },
  {
    metric: 'Employer-facing program credibility',
    conservative: 'Use documented scorecards and governance notes to show disciplined transition support.',
  },
]

const METHOD_DISCLOSURE = [
  'Activation numerator: participants with complete setup and target list. Denominator: assigned seats.',
  'Signal action numerator: active participants with at least one signal-driven action. Denominator: active participants.',
  'Prep readiness numerator: high-stakes conversations with prep brief reviewed beforehand. Denominator: high-stakes conversations.',
]

const OWNER_MATRIX = [
  {
    meeting: 'Weekly operating review',
    owner: 'Program lead',
    output: 'Adoption status, top risks, and intervention owners.',
  },
  {
    meeting: 'Biweekly counselor quality review',
    owner: 'Counselor lead',
    output: 'Session-yield trend and prep-quality drift analysis.',
  },
  {
    meeting: 'Monthly sponsor governance review',
    owner: 'Partner sponsor',
    output: 'Scale/tune/stop recommendation with documented evidence.',
  },
]

const WEEKLY_PACKET_TEMPLATE = [
  'Activation rate: percent of assigned participants fully active this week',
  'Signal action velocity: average signal-driven actions per active participant',
  'Prep readiness rate: percent of high-stakes meetings with prep brief review before meeting',
  'Stall index: count of participants with 7+ days without meaningful action',
]

const QUANTIFIED_COMPARISON = [
  {
    metric: 'Weekly participant action consistency',
    current: '40-55% consistently active',
    target: '70-85% consistently active by day 30',
  },
  {
    metric: 'Prep reviewed before high-stakes meetings',
    current: '35-50%',
    target: '70-90%',
  },
  {
    metric: 'Counselor context rebuild time per session',
    current: '20-30 minutes',
    target: '5-12 minutes',
  },
  {
    metric: 'Stalled-participant detection latency',
    current: '7-14 days',
    target: '2-5 days',
  },
]

const QUOTE_PACKAGING = [
  {
    packageName: 'Pilot packaging',
    details: '1 cohort, fixed 30-day decision gate, onboarding + weekly governance support included under signed Order Form and MSA scope.',
    quoteInputs: 'Seat mix, support tier, reporting scope, legal review timeline, and named sponsor owner.',
  },
  {
    packageName: 'Program packaging',
    details: 'Multi-cohort or recurring cohorts with defined review cadence, named deliverables, and contract-linked reporting outputs.',
    quoteInputs: 'Expected cohort volume, term length, operating model complexity, training needs, and committee review schedule.',
  },
]

const CONTRACT_SLA_MAP = [
  {
    clause: 'Support response commitments',
    clauseId: 'Schedule B-2 (proposed)',
    contractualLanguage: 'Response-time commitments documented in Order Form schedule by severity tier (P1, P2, P3).',
    defaultPosition: 'P1 same business day, P2 next business day, P3 two business days.',
  },
  {
    clause: 'Pilot decision window',
    clauseId: 'Schedule A-1 (proposed)',
    contractualLanguage: 'Pilot scope fixed to one cohort and one decision window with explicit pass/fail criteria.',
    defaultPosition: 'Day-30 decision gate with clean-no close path and optional corrective cycle terms.',
  },
  {
    clause: 'Reporting obligations',
    clauseId: 'Schedule C-1 (proposed)',
    contractualLanguage: 'Weekly and monthly reporting outputs listed as deliverables in commercial schedule.',
    defaultPosition: 'Activation, action velocity, prep readiness, stall index, and intervention queue included.',
  },
  {
    clause: 'Security and trust artifacts',
    clauseId: 'Schedule D-1 (proposed)',
    contractualLanguage: 'Trust artifact request process and diligence documents referenced in security exhibit.',
    defaultPosition: 'Public summary plus partner diligence packet under request workflow.',
  },
]

const REDLINE_READY_QUOTE_EXCERPT = [
  'Order Form Excerpt (Pilot Cohort):',
  'Scope: 1 cohort, 25 seats (15 Active, 10 Monitor), 30-day decision window.',
  'Term: 3 months, auto-renew disabled during pilot period.',
  'Acceptance criteria: activation >= 70%, prep readiness >= 70%, stall detection <= 5 days median.',
  'Support commitment: P1 same business day, P2 next business day, P3 within two business days (see Schedule B-2).',
  'Reporting deliverables: weekly operating packet + monthly sponsor readout (see Schedule C-1).',
  'Expansion condition: expansion terms activate only after documented day-30 pass decision signed by partner sponsor.',
  'Clean-no path: if criteria are not met, pilot closes at term end without expansion obligation.',
]

const RACI_ROWS = [
  {
    deliverable: 'Metric dictionary maintenance',
    responsible: 'Program analytics owner',
    accountable: 'Partner sponsor',
    consulted: 'Counselor lead, Starting Monday partner success',
    informed: 'Client HR stakeholders',
  },
  {
    deliverable: 'Weekly review packet publication',
    responsible: 'Program lead',
    accountable: 'Partner sponsor',
    consulted: 'Counselor lead',
    informed: 'Executive steering group',
  },
  {
    deliverable: 'Intervention rule updates',
    responsible: 'Counselor lead',
    accountable: 'Program lead',
    consulted: 'Partner success, analytics owner',
    informed: 'Sponsor and client HR partners',
  },
]

export default function OutplacementEconomicsPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-950 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/for-outplacement" className="text-[13px] text-slate-200 hover:text-white transition-colors">
            Back to outplacement page
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <header className="mb-12">
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
            Outplacement economics
          </p>
          <h1 className="text-[30px] sm:text-[40px] font-bold text-slate-900 leading-[1.1] tracking-tight mb-4">
            Pilot structure and commercial model, one click deeper.
          </h1>
          <p className="text-[15px] text-slate-600 leading-relaxed max-w-2xl">
            For partner teams that need pricing, scorecards, and rollout mechanics for internal approval.
          </p>
        </header>

        <section id="pilot-first" className="border border-emerald-200 bg-emerald-50/40 rounded-2xl p-6 sm:p-7 mb-10">
          <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-emerald-700 mb-3">
            Pilot first
          </p>
          <div className="space-y-3 text-[14px] text-slate-700 leading-relaxed">
            <p>Most partners begin with one cohort and a 30-day pass/fail review before expanding seats.</p>
            <p>This keeps procurement risk low while giving counselor teams enough workflow exposure to judge fit.</p>
            <p className="font-semibold text-slate-800">Pilot is for decision, not lock-in.</p>
          </div>
        </section>

        <details className="group border border-slate-200 rounded-2xl bg-white overflow-hidden mb-10">
          <summary className="list-none cursor-pointer px-6 py-5 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
            <div>
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-1">Deep dive</p>
              <p className="text-[16px] font-semibold text-slate-900">Expand partner models, scorecards, and commercial examples</p>
            </div>
            <span className="text-slate-200 text-[18px] leading-none group-open:rotate-45 transition-transform">+</span>
          </summary>
          <div className="px-6 py-6 border-t border-slate-100 space-y-10">
        <section id="partner-models" className="mb-10">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-5">
            Partner models
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PARTNER_PLANS.map((plan) => (
              <div key={plan.name} className="border border-slate-200 rounded-2xl p-5 bg-white">
                <p className="text-[16px] font-semibold text-slate-900 mb-1">{plan.name}</p>
                <p className="text-[20px] font-bold text-orange-600 mb-3">{plan.price}</p>
                <p className="text-[14px] text-slate-600 leading-relaxed">{plan.fit}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            What is included
          </h2>
          <ul className="space-y-3">
            {WHAT_IS_INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[14px] text-slate-700 leading-relaxed">
                <span className="text-orange-500 shrink-0 mt-0.5">+</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section id="decision-scorecard" className="mb-10 border border-slate-200 rounded-2xl p-6 bg-slate-50">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            30-day decision scorecard
          </h2>
          <div className="space-y-3">
            {SCORECARD_METRICS.map((row) => (
              <div key={row.metric} className="border border-slate-200 rounded-lg p-4 bg-white">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.metric}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{row.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-3">
            Commercial notes
          </h2>
          <div className="space-y-3 text-[14px] text-slate-600 leading-relaxed">
            {COMMERCIAL_NOTES.map((note) => (
              <p key={note}>{note}</p>
            ))}
          </div>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Cohort sizing scenarios for procurement
          </h2>
          <div className="space-y-3">
            {COHORT_SCENARIOS.map((row) => (
              <div key={row.cohort} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                <p className="text-[13px] font-semibold text-slate-900 mb-1">{row.cohort} - {row.profile}</p>
                <p className="text-[13px] text-slate-600 leading-relaxed">{row.decisionUse}</p>
              </div>
            ))}
          </div>
          <p className="text-[12px] text-slate-500 mt-4 leading-relaxed">
            Final pricing depends on seat mix, term, and support model. These scenarios are for planning conversations and internal approvals.
          </p>
        </section>

        <section className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Quantified current-model vs operating-layer outcomes
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Metric</th>
                  <th className="px-4 py-3 font-semibold">Typical current range</th>
                  <th className="px-4 py-3 font-semibold">Pilot target range</th>
                </tr>
              </thead>
              <tbody>
                {QUANTIFIED_COMPARISON.map((row) => (
                  <tr key={row.metric} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3 text-slate-900 font-medium">{row.metric}</td>
                    <td className="px-4 py-3 text-slate-600">{row.current}</td>
                    <td className="px-4 py-3 text-slate-700">{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">
            Ranges are directional planning bands; calibrate with your baseline and governance model before launch.
          </p>
        </section>

        <section id="commercial-examples" className="mb-10 border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-slate-200 mb-4">
            Commercial examples by term and seat mix (illustrative)
          </h2>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="min-w-full text-left text-[13px]">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Cohort</th>
                  <th className="px-4 py-3 font-semibold">Term</th>
                  <th className="px-4 py-3 font-semibold">Seat mix</th>
                  <th className="px-4 py-3 font-semibold">Monthly list estimate</th>
                  <th className="px-4 py-3 font-semibold">Term estimate</th>
                </tr>
              </thead>
              <tbody>
                {COMMERCIAL_EXAMPLES.map((row) => (
                  <tr key={`${row.seats}-${row.term}`} className="border-t border-slate-200 bg-white">
                    <td className="px-4 py-3 text-slate-900 font-medium">{row.seats}</td>
                    <td className="px-4 py-3 text-slate-600">{row.term}</td>
                    <td className="px-4 py-3 text-slate-600">{row.mix}</td>
                    <td className="px-4 py-3 text-slate-700">{row.monthlyList}</td>
                    <td className="px-4 py-3 text-slate-700">{row.estimate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[12px] text-slate-500 mt-3 leading-relaxed">
            Illustrative calculations use published plan prices before partner discounts, term incentives, and negotiated service scope.
          </p>
        </section>
          </div>
        </details>

        <section id="next-step" className="border border-slate-200 rounded-2xl p-6 bg-white">
          <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-3">
            Next step
          </h2>
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/50 mb-5">
            <p className="text-[12px] font-semibold text-slate-900 mb-1">Short objection response</p>
            <p className="text-[12px] text-slate-700 leading-relaxed">Worried this creates commitment pressure? It does not. Pilot is scoped as a decision gate with a documented clean-no exit path.</p>
          </div>
          <p className="text-[14px] text-slate-600 leading-relaxed mb-5">
            If the model looks viable, request a live partner walkthrough and define a pilot cohort with named success metrics.
          </p>
          <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 mb-5">
            <p className="text-[12px] font-semibold text-slate-900 mb-2">Calibrated decision questions</p>
            <p className="text-[12px] text-slate-600 leading-relaxed">Would it be unreasonable to use one 30-day cohort as the only decision gate before scaling?</p>
            <p className="text-[12px] text-slate-600 leading-relaxed mt-1">What specific day-30 evidence would make expansion feel obvious to your committee?</p>
          </div>
          <div className="flex flex-wrap gap-4 text-[13px]">
            <Link href="/partners#apply" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Apply to partner program
            </Link>
            <Link href="/for-outplacement/executive-summary" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              View committee one-pager
            </Link>
            <Link href="/for-outplacement/runbook" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open runbook and templates
            </Link>
            <Link href="/for-outplacement/metric-dictionary" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open canonical metric dictionary
            </Link>
            <Link href="/for-outplacement/operating-scorecard" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open printable operating scorecard
            </Link>
            <Link href="/for-outplacement/trust-pack" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open trust and governance pack
            </Link>
            <Link href="/proof/roi-calculator" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Open ROI calculator by channel and role
            </Link>
            <Link href="/for-outplacement/faq" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Read outplacement FAQ
            </Link>
            <Link href="/for-outplacement" className="text-slate-700 hover:text-slate-900 underline underline-offset-2 transition-colors">
              Return to outplacement preview
            </Link>
          </div>
          <p className="text-[12px] text-slate-500 leading-relaxed mt-4">
            Clean no path: if pilot criteria are not met at day 30, close without expansion commitment and retain the decision artifacts.
          </p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

