import Link from 'next/link'
import { DashboardTopShellSection } from '@/app/(dashboard)/dashboard/dashboard-top-shell-section'
import { DashboardProfileIntelligenceSection } from '@/app/(dashboard)/dashboard/dashboard-profile-intelligence-section'
import { DashboardWeeklyPerformanceSection } from '@/app/(dashboard)/dashboard/dashboard-weekly-performance-section'
import { DashboardPipelinePulse } from '@/app/(dashboard)/dashboard/dashboard-pipeline-pulse'
import { DashboardProgressFeedSection } from '@/app/(dashboard)/dashboard/dashboard-progress-feed-section'
import { DashboardPipelineSection } from '@/app/(dashboard)/dashboard/dashboard-pipeline-section'
import { DailyMomentumPlan, type DailyMomentumAction } from '@/components/DailyMomentumPlan'
import type { VelocityRow } from '@/components/PipelineVelocity'
import type { WeekActivity } from '@/components/ActivityChart'

const STAGE: Record<string, { label: string; cls: string }> = {
  watching: { label: 'Watching', cls: 'bg-slate-100 text-slate-500' },
  researching: { label: 'Researching', cls: 'bg-blue-50 text-blue-700' },
  applied: { label: 'In Process', cls: 'bg-indigo-50 text-indigo-700' },
  interviewing: { label: 'Interviewing', cls: 'bg-amber-50 text-amber-700' },
  offer: { label: 'Offer', cls: 'bg-green-50 text-green-700' },
}

const weekSlots: WeekActivity[] = [
  { week: 'Apr 1', companies: 1, contacts: 0, briefs: 0, followUps: 0 },
  { week: 'Apr 8', companies: 2, contacts: 1, briefs: 1, followUps: 0 },
  { week: 'Apr 15', companies: 1, contacts: 2, briefs: 1, followUps: 1 },
  { week: 'Apr 22', companies: 0, contacts: 2, briefs: 2, followUps: 1 },
  { week: 'Apr 29', companies: 1, contacts: 1, briefs: 1, followUps: 2 },
  { week: 'May 6', companies: 0, contacts: 2, briefs: 2, followUps: 2 },
  { week: 'May 13', companies: 1, contacts: 1, briefs: 2, followUps: 2 },
  { week: 'May 20', companies: 0, contacts: 2, briefs: 1, followUps: 2 },
  { week: 'May 27', companies: 0, contacts: 2, briefs: 1, followUps: 3 },
  { week: 'Jun 3', companies: 0, contacts: 1, briefs: 1, followUps: 2 },
]

const velocityRows: VelocityRow[] = [
  { id: '1', name: 'Datadog', stage: 'interviewing', updated_at: '2026-06-06T12:00:00.000Z' },
  { id: '2', name: 'Snyk', stage: 'offer', updated_at: '2026-06-05T12:00:00.000Z' },
  { id: '3', name: 'Cloudflare', stage: 'applied', updated_at: '2026-06-02T12:00:00.000Z' },
  { id: '4', name: 'HashiCorp', stage: 'researching', updated_at: '2026-05-28T12:00:00.000Z' },
]

const dailyMomentumActions: DailyMomentumAction[] = [
  {
    id: 'relationship-action',
    track: 'relationship',
    title: 'Work Dana Kim at Datadog',
    body: 'A fresh infrastructure hiring signal gives you a concrete reason to restart the conversation now.',
    effortMinutes: 15,
    href: '/dashboard/contacts/1/outreach',
    cta: 'Open outreach',
  },
  {
    id: 'readiness-action',
    track: 'readiness',
    title: 'Tighten prep for Snyk board-facing round',
    body: 'Late-stage prep quality is the fastest way to protect leverage and decision quality.',
    effortMinutes: 25,
    href: '/dashboard/strategy',
    cta: 'Open prep brief',
  },
  {
    id: 'focus-action',
    track: 'focus',
    title: 'Review signal priority before expanding the list',
    body: 'You have enough targets. Convert timing edge into action before adding more companies.',
    effortMinutes: 10,
    href: '/dashboard/signals',
    cta: 'Open signals',
  },
]

const companies = [
  { id: '1', name: 'Snyk', sector: 'Security', stage: 'offer', fit_score: 92, notes: 'Final package expected Monday' },
  { id: '2', name: 'Datadog', sector: 'Infrastructure', stage: 'interviewing', fit_score: 89, notes: 'Board-facing round next week' },
  { id: '3', name: 'Cloudflare', sector: 'Infrastructure', stage: 'applied', fit_score: 84, notes: 'Warm intro via former CFO' },
  { id: '4', name: 'HashiCorp', sector: 'Developer tools', stage: 'researching', fit_score: 78, notes: 'Need sponsor coverage' },
]

const followUps = [
  { id: 'fu-1', due_date: '2026-06-07', action: 'Follow up with CFO intro note', companies: { name: 'Cloudflare' } },
  { id: 'fu-2', due_date: '2026-06-08', action: 'Send thank-you after board prep call', companies: { name: 'Snyk' } },
]

const signals = [
  {
    id: 'sig-1',
    signal_type: 'leadership_change',
    signal_summary: 'Infrastructure org expansion indicates mandate clarity for platform leadership.',
    signal_date: '2026-06-06',
    company_id: '1',
    companies: { id: '1', name: 'Snyk' },
  },
  {
    id: 'sig-2',
    signal_type: 'funding',
    signal_summary: 'Budget confidence is rising after guidance update, increasing urgency for transformation hires.',
    signal_date: '2026-06-05',
    company_id: '2',
    companies: { id: '2', name: 'Datadog' },
  },
]

const patternAlerts = [
  {
    id: 'pat-1',
    signal_type: 'pattern_alert',
    signal_summary: 'Signal density: Board-visible roles are clustering around infrastructure cost takeout narratives.',
    signal_date: '2026-06-04',
    company_id: '2',
    companies: { id: '2', name: 'Datadog' },
  },
]

const warmPaths = [
  {
    contactId: 'contact-1',
    contactName: 'Dana Kim',
    contactTitle: 'Former CFO',
    companyId: '2',
    companyName: 'Datadog',
    signal: signals[1],
  },
]

const contactCountMap = new Map<string, number>([
  ['1', 2],
  ['2', 1],
  ['3', 1],
])

async function noopAction(_formData: FormData) {
  'use server'
}

export default function ExecutiveDashboardDemoPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/72 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:gap-6 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-200 shrink-0">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <span className="text-[11px] text-slate-300">Executive dashboard preview</span>
        </div>
      </header>

      <main className="dashboard-landing-theme max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
          <p className="text-[14px] font-semibold tracking-[0.08em] text-orange-200">Prefilled operating dashboard demo</p>
          <h1 className="mt-2 font-serif text-[28px] leading-tight text-white sm:text-[34px]">Executive decision dashboard</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-slate-200">Roles forming, sponsor movement, and next-step clarity in one dense executive view.</p>
        </div>

        <p className="sr-only">Starting Monday</p>
        <DashboardTopShellSection
          firstName="Richard"
          briefingTimezone="America/New_York"
          signalCount={3}
          overdueCount={2}
          canUseOutreachHub={true}
          isRothschildAdmin={true}
          profileSaved={false}
          isTrialing={false}
          trialDaysLeft={0}
          totalCount={4}
          offerCount={1}
          offerName="VP Platform"
          offerCompanyName="Snyk"
          onMarkPlaced={noopAction}
          activationComplete={true}
          activationCompletedCount={6}
          isExecutiveMode={true}
          isExecutivePreview={true}
          executiveStageLabel="Offer and Decision"
          executivePrimaryRisk={{
            label: 'Decision drag',
            level: 'high',
            href: '/dashboard/offers',
            cta: 'Resolve tradeoffs',
          }}
          executiveDecisionBrief={{
            changed: 'An offer is in play and board-facing interviews are still active elsewhere.',
            whyNow: 'Late-stage ambiguity raises regret risk and weakens your negotiating leverage.',
            recommendedMove: 'Compare the Snyk offer against explicit no-go criteria before taking the next board conversation.',
            downsideIfDelayed: 'You risk making a reactive compensation-driven choice instead of a mandate-quality decision.',
            href: '/dashboard/offers',
            cta: 'Run offer comparison',
          }}
        />

        <DailyMomentumPlan actions={dailyMomentumActions} dateKey="2026-06-07" status="medium" />

        <DashboardProfileIntelligenceSection
          profileScore={86}
          profileHref="/dashboard/profile#section-positioning"
          nextProfileSection={{ label: 'Positioning' }}
          onSaveQuickProfile={noopAction}
          quickProfileDefaults={{
            fullName: 'Richard Rothschild',
            currentTitle: 'Chief Information Officer',
            positioningSummary: 'Operator for infrastructure modernization and executive transformation roles.',
          }}
          stats={[
            { value: 4, label: 'Companies', alert: false, amber: false, href: '#pipeline' },
            { value: 3, label: 'Signals', alert: false, amber: true, href: '/dashboard/signals' },
            { value: 2, label: 'Due Today', alert: true, amber: false, href: '/dashboard/calendar' },
            { value: 1, label: 'Offers', alert: false, amber: true, href: '/dashboard/offers' },
          ]}
          totalCount={4}
          contactCoverageCount={3}
          numIntelGaps={2}
          companiesWithoutContact={[{ name: 'HashiCorp' }]}
          prospectContactCount={2}
          companiesWithoutBrief={[{ name: 'HashiCorp' }]}
          opportunityRadar={
            <section className="mb-8 rounded border border-white/10 bg-white/[0.04] p-5">
              <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-orange-200 mb-2">Opportunity radar</h2>
              <p className="text-[13px] text-slate-200 leading-relaxed">
                Infrastructure cost pressure and board visibility remain the strongest market angles for this search. Keep the target list tight and sponsor-led.
              </p>
            </section>
          }
          isExecutiveMode={true}
        />

        <DashboardProgressFeedSection
          todayISO="2026-06-07"
          followUps={followUps}
          warmPaths={warmPaths}
          patternAlerts={patternAlerts}
          signals={signals}
          isExecutiveMode={true}
        />

        <DashboardWeeklyPerformanceSection
          weeklyGoal={3}
          outreachThisWeek={2}
          onSaveWeeklyGoal={noopAction}
          momentumData={{ momentum_score: 58, momentum_computed_at: '2026-06-07T09:00:00.000Z' }}
          daysSinceLastAction={3}
          weekSlots={weekSlots}
          velocityRows={velocityRows}
          isExecutiveMode={true}
          executiveStageLabel="Offer and Decision"
          riskItems={[
            {
              id: 'threat-state',
              label: 'Threat and uncertainty state',
              level: 'medium',
              detail: 'Market pressure is manageable, but decision quality will drop if you let due actions stack up.',
              href: '/dashboard/briefing',
              cta: 'Open daily briefing',
            },
            {
              id: 'perfection-loop',
              label: 'Perfection loop risk',
              level: 'low',
              detail: 'Inputs are strong enough. You do not need another rewrite before the next move.',
              href: '/dashboard/strategy',
              cta: 'Keep strategy tight',
            },
            {
              id: 'isolation-risk',
              label: 'Sponsor map depth',
              level: 'medium',
              detail: 'Coverage is acceptable, but one target still has no executive-level contact path.',
              href: '/dashboard/contacts',
              cta: 'Expand sponsor map',
            },
            {
              id: 'decision-drag',
              label: 'Decision drag risk',
              level: 'high',
              detail: 'Offer context is active. Capture no-go criteria now so timing pressure does not distort the decision.',
              href: '/dashboard/offers',
              cta: 'Open offer compare',
            },
          ]}
          offerCockpit={{
            show: true,
            offerCount: 1,
            offerCompanyName: 'Snyk',
            contextSignals: [
              { label: 'Role thesis clarity', ok: true },
              { label: 'Context constraints captured', ok: false },
              { label: 'Sponsor confirmation path', ok: true },
            ],
          }}
        />

        <DashboardPipelinePulse
          isExecutive={true}
          signalCount={3}
          draftReadyCount={2}
          overdueCount={2}
          activeCount={3}
          signalToActionPercent={67}
          followUpSlaPercent={70}
          sponsorCoveragePercent={75}
          decisionLagDays={3}
        />

        <DashboardPipelineSection
          q=""
          stage=""
          page={0}
          start={0}
          pageSize={50}
          totalCount={4}
          totalFiltered={4}
          totalPages={1}
          hasFilters={false}
          filtered={companies}
          contactCountMap={contactCountMap}
          stageMap={STAGE}
          stageOptions={Object.entries(STAGE).map(([key, { label }]) => ({ key, label }))}
          activationResumeDone={true}
          showWrapUpLink={true}
        />


        <p className="sr-only">Private by default. We do not share your data with recruiters, employers, or third parties.</p>
      </main>
    </div>
  )
}

