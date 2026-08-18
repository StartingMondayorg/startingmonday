import Link from 'next/link'
import { DashboardTopShellSection } from '@/app/(dashboard)/dashboard/dashboard-top-shell-section'
import { DailyMomentumPlan, type DailyMomentumAction } from '@/components/DailyMomentumPlan'
import { markPlaced } from '@/app/(dashboard)/dashboard/placed/actions'

const michaelActions: DailyMomentumAction[] = [
  {
    id: 'relationship',
    title: 'Advance one Salesforce sponsor conversation',
    body: 'Send a specific follow-up to the SVP Product contact tied to current platform AI priorities.',
    cta: 'Open contacts',
    href: '/dashboard/contacts',
    effortMinutes: 20,
    track: 'relationship',
  },
  {
    id: 'readiness',
    title: 'Sharpen VP of IT interview proof points',
    body: 'Refine one systems-integration story with measurable outcomes and decision ownership.',
    cta: 'Open briefing',
    href: '/dashboard/briefing',
    effortMinutes: 15,
    track: 'readiness',
  },
  {
    id: 'focus',
    title: 'Protect weekly follow-through quality',
    body: 'Close one overdue action before adding net-new outreach this week.',
    cta: 'Open calendar',
    href: '/dashboard/calendar',
    effortMinutes: 15,
    track: 'focus',
  },
]

const PIPELINE = [
  { company: 'Salesforce', stage: 'Interview prep', nextAction: 'Run VP of IT interview brief and sponsor call prep', owner: 'Michael Torres' },
  { company: 'ServiceNow', stage: 'Warm outreach', nextAction: 'Send revised outreach note to CIO network path', owner: 'Michael Torres' },
  { company: 'Workday', stage: 'Signal watch', nextAction: 'Track leadership movement and follow up Friday', owner: 'Michael Torres' },
]

const KEY_CONTACTS = [
  { name: 'Jordan Lee', role: 'SVP Product, Salesforce', status: 'Warm', lastTouch: '2 days ago' },
  { name: 'Priya Patel', role: 'Partner, retained search', status: 'Active', lastTouch: 'Yesterday' },
  { name: 'Alex Chen', role: 'Former CIO peer', status: 'Advisory', lastTouch: 'Today' },
]

const RELATIONSHIP_QUEUE = [
  { action: 'Send sponsor follow-up to Jordan Lee', due: 'Tue', status: 'Ready', note: 'Tie message to current platform AI delivery pressure.' },
  { action: 'Request intro sync with Priya Patel', due: 'Wed', status: 'Ready', note: 'Confirm shortlist formation timing and interview angle.' },
  { action: 'Ask Alex Chen for operating-story calibration', due: 'Thu', status: 'At risk', note: 'Need one quantified outcomes example before call.' },
]

export default function MichaelDashboardPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] transition-opacity hover:opacity-80">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/alumni-networks-review" className="text-[14px] font-semibold text-slate-300 hover:text-white transition-colors">
              Back to alumni demo
            </Link>
            <Link href="/demo/michael-strategy-brief" className="text-[14px] font-semibold text-slate-300 hover:text-white transition-colors">
              Strategy brief
            </Link>
          </div>
        </div>
      </header>

      <main className="dashboard-landing-theme max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <p className="text-[14px] font-semibold tracking-[0.08em] text-orange-200">Prefilled operating dashboard demo</p>
          <h1 className="mt-2 font-serif text-[28px] leading-tight text-white sm:text-[34px]">Michael Torres · VP of IT transition dashboard</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-200">New dashboard style with Michael Torres data prefilled for fast walkthrough: priorities, signals, pipeline, and next actions.</p>
        </div>

        <DashboardTopShellSection
          firstName="Michael"
          briefingTimezone="America/Los_Angeles"
          signalCount={4}
          overdueCount={2}
          canUseOutreachHub
          isRothschildAdmin
          profileSaved={false}
          isTrialing={false}
          trialDaysLeft={0}
          totalCount={18}
          offerCount={0}
          offerName={null}
          offerCompanyName={null}
          onMarkPlaced={markPlaced}
          activationComplete={true}
          activationCompletedCount={4}
          isExecutiveMode={true}
          isExecutivePreview={true}
          executiveStageLabel="Interview cycle"
          executivePrimaryRisk={{
            label: 'Signal response lag',
            level: 'medium',
            href: '/dashboard/briefing',
            cta: 'Review',
          }}
          executiveDecisionBrief={{
            changed: 'Two target companies moved into active leadership search mode.',
            whyNow: 'Outreach timing is strongest before recruiter process hardens.',
            recommendedMove: 'Advance one sponsor relationship this week.',
            downsideIfDelayed: 'Michael enters after shortlist assumptions lock.',
            href: '/dashboard/briefing',
            cta: 'Open decision brief',
          }}
        />

        <DailyMomentumPlan actions={michaelActions} dateKey={new Date().toISOString().slice(0, 10)} status="medium" />

        <section className="mt-5 grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[14px] font-semibold tracking-[0.08em] text-orange-200">Michael pipeline snapshot</p>
            <div className="mt-3 space-y-2.5">
              {PIPELINE.map((item) => (
                <div key={item.company} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                  <p className="text-[14px] font-semibold text-white">{item.company} · {item.stage}</p>
                  <p className="mt-1 text-[14px] text-slate-300">Owner: {item.owner}</p>
                  <p className="mt-1 text-[14px] text-slate-200">Next action: {item.nextAction}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-[14px] font-semibold tracking-[0.08em] text-orange-200">Key relationships</p>
            <div className="mt-3 space-y-2.5">
              {KEY_CONTACTS.map((contact) => (
                <div key={contact.name} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                  <p className="text-[14px] font-semibold text-white">{contact.name}</p>
                  <p className="mt-1 text-[14px] text-slate-300">{contact.role}</p>
                  <p className="mt-1 text-[14px] text-slate-200">Status: {contact.status} · Last touch: {contact.lastTouch}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-[14px] font-semibold tracking-[0.08em] text-orange-200">Weekly relationship action queue</p>
          <div className="mt-3 grid gap-2.5 md:grid-cols-3">
            {RELATIONSHIP_QUEUE.map((item) => (
              <article key={item.action} className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-white">{item.due}</p>
                  <span className="rounded-full border border-white/15 bg-white/[0.06] px-2 py-0.5 text-[12px] font-semibold text-orange-200">{item.status}</span>
                </div>
                <p className="mt-1 text-[14px] font-semibold text-slate-100">{item.action}</p>
                <p className="mt-1 text-[14px] text-slate-300">{item.note}</p>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[14px] leading-relaxed text-slate-400">Trust layer: each queue item is tied to role-timing signals and decision-path relevance, with uncertainty surfaced before outreach.</p>
        </section>
      
        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

