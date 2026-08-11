import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { buildMauricioMailto } from '@/lib/mauricio-contact'
import { createClient } from '@/lib/supabase/server'
import { getStaffMember } from '@/lib/staff'

type TaskRow = {
  week: string
  title: string
  whyItMatters: string
  output: string
  metric: string
  owner: string
}

type PriorityRow = {
  title: string
  doneDefinition: string
}

type FounderNeedRow = {
  request: string
  owner: string
  due: string
}

export const metadata: Metadata = {
  title: 'Mauricio BD Workspace - Starting Monday',
  description: 'Private execution workspace for Mauricio: priorities, dependencies, operating links, and weekly review guardrails.',
  robots: { index: false, follow: false },
  alternates: { canonical: 'https://startingmonday.app/mauricio-kickoff-execution' },
}

const THIS_WEEK_PRIORITIES: PriorityRow[] = [
  {
    title: 'Lock ICP wedge and list criteria',
    doneDefinition: 'One approved segment, exclusion rules, and 150 target contacts tagged by tier.',
  },
  {
    title: 'Run first outbound wave',
    doneDefinition: 'First 120 touches completed with response labels and next-step coding.',
  },
  {
    title: 'Handoff warm leads in under 24h',
    doneDefinition: 'Every qualified positive reply handed to founder using the agreed handoff template.',
  },
  {
    title: 'Publish Friday scorecard',
    doneDefinition: 'Weekly update sent with conversion funnel, blockers, and next-week experiments.',
  },
]

const FOUNDER_NEEDS: FounderNeedRow[] = [
  {
    request: 'Approve ICP wedge and disqualification criteria',
    owner: 'Founder',
    due: 'Before first launch batch',
  },
  {
    request: 'Approve message angle set A/B/C and forbidden claims list',
    owner: 'Founder',
    due: 'Before first outreach day',
  },
  {
    request: 'Confirm founder response windows for warm handoffs',
    owner: 'Founder',
    due: 'Today',
  },
  {
    request: 'Confirm source of truth (Airtable or CRM) and required fields',
    owner: 'Founder + Mauricio',
    due: 'This week',
  },
  {
    request: 'Grant read-only provider workspace/file access for list QA and enrichment checks',
    owner: 'Founder/Admin',
    due: 'This week',
  },
  {
    request: 'Provide weekly customer email report split by channel (email, LinkedIn, referral, other)',
    owner: 'Founder/Admin',
    due: 'This week',
  },
]

const OPERATING_LINKS = [
  {
    label: 'Kickoff brief',
    href: '/mauricio-kickoff',
    helper: 'Working agreement, timeline, and checkpoint definitions.',
  },
  {
    label: 'Sales and marketing plan',
    href: '/sales-marketing-plan',
    helper: 'Current GTM narrative and channel plan.',
  },
  {
    label: 'Sales enablement control room',
    href: '/dashboard/admin/sales-enablement',
    helper: 'Internal definitions, ranking, and checkpoints.',
  },
  {
    label: 'Coach outreach operations',
    href: '/dashboard/admin/coach-outreach',
    helper: 'Outreach workflow and template operations.',
  },
  {
    label: 'Partner program page',
    href: '/partners',
    helper: 'Partner positioning and funnel context.',
  },
  {
    label: 'Coaches guide',
    href: '/coaches-guide',
    helper: 'Messaging context for coach segment.',
  },
]

const TASKS: TaskRow[] = [
  {
    week: 'Week 1',
    title: 'Finalize ICP and offer architecture for US executives and coaches',
    whyItMatters:
      'Fast-close sales fails when the offer is broad and the buyer is unclear. Tight ICP and offer language increases reply quality and shortens sales cycles.',
    output: 'Approved ICP matrix, pricing ladder, and disqualification rules.',
    metric: '100% of outbound records tagged to ICP tier before first touch.',
    owner: 'Mauricio + Founder',
  },
  {
    week: 'Week 1',
    title: 'Ship outbound messaging matrix for LinkedIn and email',
    whyItMatters:
      'Without segment-specific messaging, reply rates stay low and meetings are weak. Messaging architecture is the leverage point for early revenue.',
    output: 'Three message angles per segment with objection responses.',
    metric: '>= 8% positive reply rate by end of week 2.',
    owner: 'Mauricio',
  },
  {
    week: 'Week 1',
    title: 'Build and QA first 150 target contacts',
    whyItMatters:
      'Pipeline quality determines close quality. Bad targeting burns founder time and slows learning loops.',
    output: 'Tiered contact list with role, company, trigger context, and channel notes.',
    metric: '>= 90% contact data completeness in CRM.',
    owner: 'Mauricio',
  },
  {
    week: 'Week 2',
    title: 'Launch first outbound wave with strict activity logging',
    whyItMatters:
      'You cannot optimize what you cannot observe. Structured logging turns outreach from activity into an improvement system.',
    output: 'Daily outreach batches across LinkedIn and email with response coding.',
    metric: '>= 120 touches completed with channel-level conversion tracking.',
    owner: 'Mauricio',
  },
  {
    week: 'Week 2',
    title: 'Run founder handoff protocol for warm leads within 24 hours',
    whyItMatters:
      'Warm leads decay quickly. Speed-to-response directly affects booked meetings and trust.',
    output: 'Handoff template with context, pain signal, and next-step recommendation.',
    metric: '>= 90% warm lead handoffs answered within 24 hours.',
    owner: 'Founder',
  },
  {
    week: 'Week 2',
    title: 'Create proof-asset pack for calls and follow-up',
    whyItMatters:
      'Fast-close buyers need evidence quickly. Proof assets increase meeting-to-opportunity conversion.',
    output: 'Three proof snippets, FAQ responses, and one objection sheet.',
    metric: '>= 35% meeting-to-opportunity conversion by week 4.',
    owner: 'Founder + Mauricio',
  },
  {
    week: 'Week 3',
    title: 'Refine scripts using real reply and call data',
    whyItMatters:
      'Static scripts stall quickly. Data-driven refinement increases signal quality and close probability.',
    output: 'Versioned scripts with keep/kill notes and rationale.',
    metric: '>= 20% lift in positive replies vs week 2 baseline.',
    owner: 'Mauricio',
  },
  {
    week: 'Week 3',
    title: 'Open first coach pilot track with BD page and intake form',
    whyItMatters:
      'Coach pilots validate B2B economics and create compounding referrals.',
    output: 'Live pilot intake path and partner follow-up workflow.',
    metric: 'At least one coach pilot in active proposal by end of week 3.',
    owner: 'Founder + Mauricio',
  },
  {
    week: 'Week 3',
    title: 'Support product improvements tied to closing conversations',
    whyItMatters:
      'Revenue conversations reveal friction. Fast fixes in onboarding and brief quality improve conversion and retention.',
    output: 'Prioritized list of product fixes linked to lost/won reasons.',
    metric: 'Top three sales blockers have active engineering tickets.',
    owner: 'Founder',
  },
  {
    week: 'Week 4',
    title: 'Run channel economics review and focus decision',
    whyItMatters:
      'Scale requires concentration, not channel sprawl. Choosing the highest-return channel protects budget and time.',
    output: 'Channel scorecard with CAC proxy, close rate, and cycle time.',
    metric: 'One primary channel selected for next 60 days.',
    owner: 'Founder + Mauricio',
  },
  {
    week: 'Week 4',
    title: 'Publish repeatable outbound and handoff SOPs',
    whyItMatters:
      'Repeatability is required before adding volume or team members.',
    output: 'SOP set for list build, outreach, handoff, and weekly review.',
    metric: 'SOPs approved and used in weekly operations review.',
    owner: 'Mauricio + Founder',
  },
  {
    week: 'Week 4',
    title: 'Decide continue, expand, or stop using day-30 gates',
    whyItMatters:
      'A trial without objective gates creates bias and wasted spend.',
    output: 'Signed day-30 decision memo with next 60-day plan.',
    metric: 'Decision made within two business days of day-30 review.',
    owner: 'Founder',
  },
]

const WEEKLY_REVIEW = [
  'Pipeline added this week (qualified opportunities)',
  'Meetings booked, held, and show-rate trend',
  'Meeting-to-opportunity and opportunity-to-close trend',
  'Top objection themes and script changes made',
  'Highest-leverage experiments for next week',
]

export default async function MauricioKickoffExecutionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const staff = await getStaffMember(user.email ?? '')
  if (!staff) notFound()

  const emailMauricioHref = buildMauricioMailto('Mauricio Execution Follow-up')
  const requestFounderHref = buildMauricioMailto(
    'Founder input needed for Mauricio BD sprint',
    [
      'Please confirm the following so outreach can run without delay:',
      '',
      '1) ICP wedge and exclusion criteria',
      '2) Approved message set and forbidden claims',
      '3) Warm-handoff response windows',
      '4) Source of truth and required tracking fields',
    ].join('\n')
  )

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <nav className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="text-[13px] font-bold tracking-[0.18em] uppercase">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <Link href="/mauricio-kickoff" className="text-[13px] text-slate-300 hover:text-white">
            Back to kickoff page
          </Link>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <header className="mb-8">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-2">BD workspace</p>
          <h1 className="text-[28px] font-bold text-slate-900 leading-tight mb-2">Mauricio execution workspace</h1>
          <p className="text-[14px] text-slate-600 max-w-4xl">
            This page is the run surface for weekly execution, daily unblock requests, and reporting guardrails.
            If it is not on this page, it is not in this sprint.
          </p>
          <p className="mt-2 text-[13px] text-slate-600">
            Confidential operating plan. Core outcome target: move from outreach to qualified meeting with a weekly conversion lift.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={emailMauricioHref}
              className="inline-flex items-center rounded border border-orange-300 bg-orange-500/10 px-3 py-2 text-[13px] font-semibold text-orange-700 hover:bg-orange-500/20"
            >
              Email Mauricio when needed
            </a>
            <a
              href={requestFounderHref}
              className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Send founder-input request
            </a>
            <Link
              href="/feedback"
              className="inline-flex items-center rounded border border-emerald-300 bg-emerald-50 px-3 py-2 text-[13px] font-semibold text-emerald-800 hover:bg-emerald-100"
            >
              Log execution feedback
            </Link>
            <Link
              href="/mauricio-kickoff-execution/customer-email-by-channel"
              className="inline-flex items-center rounded border border-slate-300 bg-white px-3 py-2 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
            >
              Start weekly channel review
            </Link>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">This week priorities</h2>
            <ul className="space-y-2">
              {THIS_WEEK_PRIORITIES.map((item) => (
                <li key={item.title} className="border border-slate-100 rounded-lg px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>
                  <p className="text-[13px] text-slate-600 mt-1">Done when: {item.doneDefinition}</p>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-amber-200 rounded-xl p-5">
            <h2 className="text-[13px] font-bold tracking-[0.14em] uppercase text-amber-700 mb-3">Inputs needed from founder</h2>
            <ul className="space-y-2">
              {FOUNDER_NEEDS.map((item) => (
                <li key={item.request} className="border border-amber-100 rounded-lg bg-amber-50/40 px-3 py-2.5">
                  <p className="text-[13px] font-semibold text-slate-900">{item.request}</p>
                  <p className="text-[13px] text-slate-600 mt-1">Owner: {item.owner} | Due: {item.due}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 mb-8">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-3">Operating links</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {OPERATING_LINKS.map((link) => (
              <div key={link.href} className="border border-slate-100 rounded-lg px-3 py-2.5">
                <Link href={link.href} className="text-[13px] font-semibold text-slate-900 hover:text-orange-600">
                  {link.label}
                </Link>
                <p className="text-[13px] text-slate-600 mt-1">{link.helper}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white border border-orange-200 rounded-xl p-5 mb-8">
          <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-orange-700 mb-2">Requested data viewers</p>
          <p className="text-[13px] text-slate-600 mb-4">
            Open the two pages below to review legacy provider read-access files and weekly customer email outcomes by channel.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Link
              href="/mauricio-kickoff-execution/provider-read-access"
              className="inline-flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-800 hover:bg-slate-100"
            >
              Provider read-access viewer
              <span aria-hidden>→</span>
            </Link>
            <Link
              href="/mauricio-kickoff-execution/customer-email-by-channel"
              className="inline-flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-[13px] font-semibold text-slate-800 hover:bg-slate-100"
            >
              Customer email by channel viewer
              <span aria-hidden>→</span>
            </Link>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-[13px] font-semibold text-slate-900">30-day task sequence</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-white border-b border-slate-200">
                <tr>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Week</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Task</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Why it matters</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Required output</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Success metric</th>
                  <th className="px-4 py-2.5 text-[13px] font-bold tracking-[0.09em] uppercase text-slate-500">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {TASKS.map((task) => (
                  <tr key={`${task.week}-${task.title}`}>
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-900">{task.week}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-slate-800">{task.title}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-700">{task.whyItMatters}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600">{task.output}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600">{task.metric}</td>
                    <td className="px-4 py-3 text-[13px] text-slate-600">{task.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">Weekly review format</p>
            <ul className="space-y-2">
              {WEEKLY_REVIEW.map((item) => (
                <li key={item} className="text-[13px] text-slate-700 leading-relaxed flex gap-2.5">
                  <span className="text-orange-500 font-bold">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-[13px] font-bold tracking-[0.14em] uppercase text-slate-500 mb-2">Day-30 decision gates</p>
            <ul className="space-y-2 text-[13px] text-slate-700 leading-relaxed">
              <li className="flex gap-2.5"><span className="text-orange-500 font-bold">+</span><span>10+ qualified meetings held.</span></li>
              <li className="flex gap-2.5"><span className="text-orange-500 font-bold">+</span><span>2 B2B customer trials.</span></li>
              <li className="flex gap-2.5"><span className="text-orange-500 font-bold">+</span><span>At least 1 coach pilot in signed or near-signed stage.</span></li>
              <li className="flex gap-2.5"><span className="text-orange-500 font-bold">+</span><span>Repeatable outbound and handoff SOPs accepted.</span></li>
            </ul>
          </div>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}
