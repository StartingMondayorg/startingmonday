import type { Metadata } from 'next'
import Link from 'next/link'
import { buildMauricioMailto } from '@/lib/mauricio-contact'

type DayPlan = {
  day: string
  focus: string
  output: string
}

type MetricRow = {
  metric: string
  target: string
  why: string
}

export const metadata: Metadata = {
  title: 'Mauricio Kickoff - Starting Monday',
  description: 'Public kickoff page for Starting Monday business development trial with Mauricio.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://startingmonday.app/mauricio-kickoff' },
  openGraph: {
    title: 'Starting Monday x Mauricio Kickoff',
    description: '30-day business development kickoff plan with outreach and sales-enablement guardrails.',
    url: 'https://startingmonday.app/mauricio-kickoff',
  },
}

const DAY_PLAN: DayPlan[] = [
  {
    day: 'Day 1',
    focus: 'Discovery and kickoff',
    output: 'ICP brief v1 with target industries, titles, company size, and pain points.',
  },
  {
    day: 'Day 2',
    focus: 'List build',
    output: '150-200 verified decision-maker contacts and tiered prospect list for founder review.',
  },
  {
    day: 'Day 3',
    focus: 'Messaging architecture',
    output: 'Three email angles, LinkedIn opener by persona, and subject-line variants.',
  },
  {
    day: 'Day 4',
    focus: 'Sequence and channel setup',
    output: 'Five-step sequence, LinkedIn cadence, call talk track, and launch-ready setup.',
  },
  {
    day: 'Day 5',
    focus: 'QA and launch readiness',
    output: 'Final script, QA summary, and explicit launch-ready confirmation.',
  },
  {
    day: 'Day 6',
    focus: 'Controlled launch (Tier 1)',
    output: '40-60 emails, 15-20 calls, 20 LinkedIn touches, and activity log.',
  },
  {
    day: 'Day 7',
    focus: 'Reply handling and iteration',
    output: 'Updated reply log and first warm-lead handoff list.',
  },
  {
    day: 'Day 8',
    focus: 'Performance read',
    output: 'Snapshot of open/reply/connect rates and optimization memo.',
  },
  {
    day: 'Day 9',
    focus: 'Scale winning angles',
    output: '60-80 emails, 25-30 calls, 30 LinkedIn DMs with refined messaging.',
  },
  {
    day: 'Day 10',
    focus: 'Full recap and next plan',
    output: 'Ten-day report: wins, misses, meetings, pipeline status, and next strategy.',
  },
]

const DAY_14_METRICS: MetricRow[] = [
  {
    metric: 'Launch status',
    target: 'All channels live with QA complete and first qualified meetings booked.',
    why: 'Confirms setup quality and initial market resonance.',
  },
  {
    metric: 'Positive reply quality',
    target: 'Replies show real pain, authority, and near-term timing signals.',
    why: 'Prevents false positives and vanity activity.',
  },
  {
    metric: 'Operational cadence',
    target: 'Daily activity notes and a weekly founder update delivered on time.',
    why: 'Maintains iteration speed and accountability.',
  },
]

const DAY_30_METRICS: MetricRow[] = [
  {
    metric: 'Qualified meetings held',
    target: '10+ qualified meetings held.',
    why: 'Primary output target for this trial.',
  },
  {
    metric: 'Meeting show rate',
    target: '>= 80% show rate.',
    why: 'Indicates meeting quality and confirmation discipline.',
  },
  {
    metric: 'Qualified-to-next-step',
    target: 'Clear post-meeting next step on the majority of qualified calls.',
    why: 'Protects founder time and creates pipeline movement.',
  },
]

const PROOF_PACK = [
  'Starting Monday one-line value narrative by ICP segment.',
  'Two short customer/partner proof points and one case-style result snippet.',
  'Standard objection responses (timing, budget, competing priorities, status quo).',
  'Call handoff template with context, pain signal, and meeting objective.',
]

const QUALIFIED_MEETING_STANDARD = [
  'Authority: decision-maker or strong influencer present.',
  'Need: explicit pain related to executive transition/search outcomes.',
  'Budget: realistic capacity for paid solution or funded pilot path.',
  'Timing: active window of 90 days or less.',
  'Fit: aligns to current ICP wedge and use case.',
]

const ACCESS_CHECKLIST = [
  'Email sending stack and domain/inbox access for outbound execution.',
  'Provider workspace and/or Sales Navigator access.',
  'CRM/source-of-truth destination for all touches and outcomes.',
  'Slack or equivalent channel for daily updates and blockers.',
  'Founder calendar constraints and preferred meeting windows.',
]

const FINALIZE_TODAY = [
  'Lock first ICP wedge (single segment) for the first 2 weeks.',
  'Approve qualified meeting definition and disqualification rules.',
  'Approve day-14 and day-30 pass/fail thresholds.',
  'Approve channel mix for week 1 (email, LinkedIn, calls).',
  'Approve founder handoff SLA for warm replies and booked calls.',
]

const CURRENT_ASSUMPTIONS = [
  'Primary ICP wedge (first 2 weeks): executive coaches.',
  'Page remains public but noindex during trial setup.',
  'Founder response SLA for warm replies: within 24 hours.',
  'Recommended source of truth: Airtable pipeline (provider list remains invite-source only).',
]

const COMMERCIAL_TERMS = [
  'Fixed pilot fee: $2,500 for 4 weeks covering all listed kickoff deliverables.',
  'Optional monthly retainer after pilot: $1,800/month for continued outreach execution, weekly reporting, and message iteration.',
  'Initial commitment window: 4-week trial sprint with day-14 and day-30 gates.',
  'Scope ownership: Mauricio owns outbound execution; founder owns live sales calls post-handoff.',
  'Decision gate: continue only if quality and conversion trend positive by week 4.',
]

const CRM_RECOMMENDATION = [
  'Lead source and enrichment: provider data.',
  'Single source of truth: Airtable base for all touches, meeting outcomes, and qualification notes.',
  'Weekly export backup: CSV snapshot of Airtable table to avoid data drift.',
  'Minimum fields: account, contact, channel, touch date, status, qualification score, next step, owner.',
]

const CURRENT_STATE_LINKS = [
  {
    label: 'LinkedIn company page',
    href: 'https://www.linkedin.com/company/starting-monday',
    helper: 'Public page and brand context.',
    external: true,
  },
  {
    label: 'Sales + marketing operating overview',
    href: '/sales-marketing-plan',
    helper: 'Current LinkedIn cadence, speaker outreach, and execution board.',
    external: false,
  },
  {
    label: 'Sales enablement control room',
    href: '/dashboard/admin/sales-enablement',
    helper: 'Shared workspace with definitions, ranking, and checkpoints (team access required).',
    external: false,
  },
  {
    label: 'Email outreach process',
    href: '/dashboard/admin/coach-outreach',
    helper: '6-step outreach process and message operations (team access required).',
    external: false,
  },
]

const RAMP_UP_GAPS = [
  'Data ownership and governance: one owner for CRM hygiene, duplicate control, and weekly QA signoff.',
  'Compliance guardrails: approved claims library, forbidden claims, and escalation path for risky asks.',
  'Handoff SLA detail: explicit 24-hour founder response coverage windows and backup approver if unavailable.',
  'Meeting rubric enforcement: required pre-call brief fields and no-meeting-handoff if rubric is incomplete.',
  'Weekly retrospective template: what to scale, what to kill, and one hypothesis for next week.',
]

function MetricTable({ title, rows }: { title: string; rows: MetricRow[] }) {
  return (
    <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <h3 className="text-[13px] font-semibold text-slate-900">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.metric} className="px-4 py-3 grid grid-cols-1 md:grid-cols-[180px_1fr_1fr] gap-2 md:gap-4">
            <p className="text-[13px] font-semibold text-slate-900">{row.metric}</p>
            <p className="text-[13px] text-slate-700">{row.target}</p>
            <p className="text-[13px] text-slate-500">{row.why}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MauricioKickoffPage() {
  const askMauricioHref = buildMauricioMailto('Mauricio Kickoff Questions')
  const requestMauricioHref = buildMauricioMailto('Mauricio Needs Request')

  return (
    <div className="min-h-screen bg-white font-sans">
      <nav className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.18em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/partners" className="text-[13px] text-slate-400 hover:text-white transition-colors">
            Partner hub
          </Link>
        </div>
      </nav>

      <main>
        <header className="bg-slate-900 px-4 sm:px-6 pt-14 pb-14">
          <div className="max-w-4xl mx-auto">
            <p className="text-[13px] font-bold tracking-[0.16em] uppercase text-orange-500 mb-4">
              Public kickoff page
            </p>
            <h1 className="text-[30px] sm:text-[40px] font-bold text-white leading-[1.08] tracking-tight mb-4">
              Starting Monday x Mauricio
              <br />
              Business Development Kickoff
            </h1>
            <p className="text-[15px] text-slate-300 leading-relaxed max-w-3xl mb-6">
              This page is the shared operating brief for the first 30 days: what we are solving, how we execute,
              how we qualify, and how we measure success.
            </p>
            <div className="flex flex-wrap gap-2">
              {['Business development first', 'Sales-enablement assist', 'Day 14 checkpoint', 'Day 30 decision'].map((chip) => (
                <span key={chip} className="text-[13px] font-semibold text-slate-300 border border-slate-700 rounded-full px-3 py-1.5 bg-slate-950/40">
                  {chip}
                </span>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/mauricio-kickoff-execution"
                className="inline-flex items-center rounded border border-orange-300 bg-orange-500/10 px-3 py-2 text-[13px] font-semibold text-orange-200 hover:bg-orange-500/20"
              >
                Open Mauricio execution tasks and why they matter
              </Link>
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
          <section className="border border-slate-200 rounded-2xl bg-white p-6">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">Start here</p>
            <h2 className="text-[20px] font-bold text-slate-900 mb-4">Guides, current-state assets, needs intake, and feedback</h2>

            <div className="flex flex-wrap gap-3 mb-5">
              <a
                href="https://startingmonday.app/coaches-guide"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center border border-slate-300 bg-slate-900 text-white text-[13px] font-semibold rounded px-3 py-2 hover:bg-slate-800 transition-colors"
              >
                Open external guide
              </a>
              <a
                href={askMauricioHref}
                className="inline-flex items-center border border-slate-300 bg-white text-slate-700 text-[13px] font-semibold rounded px-3 py-2 hover:bg-slate-50 transition-colors"
              >
                Email Mauricio with questions
              </a>
              <a
                href={requestMauricioHref}
                className="inline-flex items-center border border-emerald-300 bg-emerald-50 text-emerald-800 text-[13px] font-semibold rounded px-3 py-2 hover:bg-emerald-100 transition-colors"
              >
                Email Mauricio with a request
              </a>
              <Link
                href="/feedback"
                className="inline-flex items-center border border-orange-300 bg-orange-50 text-orange-800 text-[13px] font-semibold rounded px-3 py-2 hover:bg-orange-100 transition-colors"
              >
                Provide feedback
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CURRENT_STATE_LINKS.map((item) => (
                <div key={item.label} className="border border-slate-200 rounded-lg p-4">
                  {item.external ? (
                    <a href={item.href} target="_blank" rel="noreferrer" className="text-[13px] font-semibold text-slate-900 hover:text-orange-600 transition-colors">
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className="text-[13px] font-semibold text-slate-900 hover:text-orange-600 transition-colors">
                      {item.label}
                    </Link>
                  )}
                  <p className="text-[13px] text-slate-500 mt-1.5">{item.helper}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-indigo-200 rounded-xl bg-indigo-50/50 p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-indigo-700 mb-2">Current assumptions (can be edited)</p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {CURRENT_ASSUMPTIONS.map((item) => (
                <li key={item} className="text-[13px] text-slate-700 leading-relaxed bg-white border border-indigo-100 rounded-lg px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="border border-slate-200 rounded-xl bg-white p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-2">Primary objective</p>
              <p className="text-[15px] font-semibold text-slate-900 mb-2">Generate more qualified meetings without wasting founder time.</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Build a repeatable outbound motion that produces qualified conversations now and compounds into pipeline over the next 90 days.
              </p>
            </div>
            <div className="border border-amber-200 rounded-xl bg-amber-50/50 p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-amber-700 mb-2">Qualified meeting definition</p>
              <p className="text-[13px] text-slate-700 leading-relaxed">
                Decision-maker or strong influencer, clear pain, timing within 90 days, and explicit next step scheduled.
              </p>
            </div>
          </section>

          <section className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
            <div className="px-5 py-4 border-b border-slate-100 bg-slate-50">
              <h2 className="text-[15px] font-semibold text-slate-900">First 10-day execution plan</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px] min-w-[760px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-white text-left">
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Day</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Focus</th>
                    <th className="px-4 py-2.5 font-semibold text-slate-500">Required output</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {DAY_PLAN.map((row) => (
                    <tr key={row.day}>
                      <td className="px-4 py-2.5 font-semibold text-slate-900">{row.day}</td>
                      <td className="px-4 py-2.5 text-slate-700">{row.focus}</td>
                      <td className="px-4 py-2.5 text-slate-600">{row.output}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <MetricTable title="Day 14 checkpoint" rows={DAY_14_METRICS} />
            <MetricTable title="Day 30 decision gate" rows={DAY_30_METRICS} />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="border border-slate-200 rounded-xl bg-white p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Sales-enablement proof pack</p>
              <ul className="space-y-2">
                {PROOF_PACK.map((item) => (
                  <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                    <span className="text-orange-500 font-bold">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Qualification standard (4/5 minimum)</p>
              <ul className="space-y-2">
                {QUALIFIED_MEETING_STANDARD.map((item) => (
                  <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                    <span className="text-emerald-600 font-bold">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Access and tooling checklist</p>
              <ul className="space-y-2">
                {ACCESS_CHECKLIST.map((item) => (
                  <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                    <span className="text-slate-500 font-bold">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="border border-slate-200 rounded-xl bg-white p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Commercial terms (trial)</p>
              <ul className="space-y-2">
                {COMMERCIAL_TERMS.map((item) => (
                  <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                    <span className="text-orange-500 font-bold">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-slate-200 rounded-xl bg-white p-5">
              <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-3">Recommended CRM operating model</p>
              <ul className="space-y-2">
                {CRM_RECOMMENDATION.map((item) => (
                  <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                    <span className="text-emerald-600 font-bold">+</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="border border-orange-300 rounded-2xl bg-orange-50/50 p-6">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-700 mb-2">Finalize in today kickoff call</p>
            <h2 className="text-[19px] font-bold text-slate-900 mb-4">Five decisions we lock before launch</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FINALIZE_TODAY.map((item) => (
                <div key={item} className="border border-orange-200 bg-white rounded-lg px-4 py-3 text-[13px] text-slate-700 leading-relaxed">
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="border border-slate-200 rounded-xl bg-slate-50 p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">Reporting rhythm</p>
            <p className="text-[13px] text-slate-700 leading-relaxed mb-2">
              Weekly report every Friday by 5pm: activity summary, performance metrics, pipeline updates, what is working,
              what is being cut, and next-week plan.
            </p>
            <p className="text-[13px] text-slate-500">
              Daily update format: five bullets max (volume, replies, blockers, next actions, founder asks).
            </p>
          </section>

          <section className="border border-slate-200 rounded-xl bg-white p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">What is still missing for faster ramp-up</p>
            <ul className="space-y-2">
              {RAMP_UP_GAPS.map((item) => (
                <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                  <span className="text-slate-500 font-bold">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
