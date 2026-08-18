import Link from 'next/link'
import { DashboardTopShellSection } from '@/app/(dashboard)/dashboard/_components/top-shell-section'
import { DailyMomentumPlan, type DailyMomentumAction } from '@/components/DailyMomentumPlan'
import { markPlaced } from '@/app/(dashboard)/dashboard/placed/actions'

const previewActions: DailyMomentumAction[] = [
  {
    id: 'relationship',
    title: 'Advance one sponsor conversation',
    body: 'Send a specific follow-up note tied to one current company signal.',
    cta: 'Open contacts',
    href: '/dashboard/contacts',
    effortMinutes: 20,
    track: 'relationship',
  },
  {
    id: 'readiness',
    title: 'Sharpen one interview proof point',
    body: 'Update one story with measurable outcomes and clear decision ownership.',
    cta: 'Open briefing',
    href: '/dashboard/briefing',
    effortMinutes: 15,
    track: 'readiness',
  },
  {
    id: 'focus',
    title: 'Protect follow-through quality',
    body: 'Resolve one overdue next step before adding new outreach work.',
    cta: 'Open calendar',
    href: '/dashboard/calendar',
    effortMinutes: 15,
    track: 'focus',
  },
]

export default function DashboardThemePreviewPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6">
          <span className="text-[13px] font-bold tracking-[0.16em] uppercase text-white/90 shrink-0">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-[13px] font-semibold text-slate-300 hover:text-white transition-colors">Dashboard</Link>
            <Link href="/dashboard/briefing" className="text-[13px] font-semibold text-slate-300 hover:text-white transition-colors">Briefing</Link>
          </div>
        </div>
      </header>

      <main className="dashboard-landing-theme max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
        <p className="sr-only">Privacy-first by design.</p>
        <h1 className="sr-only">Starting Monday</h1>
        <DashboardTopShellSection
          firstName="Richard"
          briefingTimezone="America/New_York"
          signalCount={4}
          overdueCount={3}
          canUseOutreachHub
          isRothschildAdmin
          profileSaved={false}
          isTrialing={false}
          trialDaysLeft={0}
          totalCount={28}
          offerCount={1}
          offerName="CTO"
          offerCompanyName="Northwind"
          onMarkPlaced={markPlaced}
          activationComplete={true}
          activationCompletedCount={4}
          isExecutiveMode={false}
          isExecutivePreview={false}
          executiveStageLabel="Positioning"
          executivePrimaryRisk={{
            label: 'Signal response lag',
            level: 'medium',
            href: '/dashboard/briefing',
            cta: 'Review',
          }}
          executiveDecisionBrief={{
            changed: 'Two target companies moved into active search mode.',
            whyNow: 'Outreach timing is strongest before recruiter process hardens.',
            recommendedMove: 'Advance one sponsor relationship this week.',
            downsideIfDelayed: 'You enter after shortlist assumptions lock.',
            href: '/dashboard/briefing',
            cta: 'Open decision brief',
          }}
        />

        <DailyMomentumPlan actions={previewActions} dateKey={new Date().toISOString().slice(0, 10)} status="medium" />

      </main>
    </div>
  )
}
