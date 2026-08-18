import { SuggestionCards } from '@/components/SuggestionCards'
import Link from 'next/link'
import { DashboardIntelSetupSections } from './intel-setup-sections'
import { DashboardPipelinePulse } from './pipeline-pulse'
import { DashboardWeeklyPerformanceSection } from './weekly-performance-section'
import type { WeekActivity } from '@/components/ActivityChart'
import type { VelocityRow } from '@/components/PipelineVelocity'

type DashboardAdvancedModulesSectionProps = {
  weeklyGoal: number | null
  outreachThisWeek: number
  onSaveWeeklyGoal: (formData: FormData) => void | Promise<void>
  momentumData: { momentum_score: number | null; momentum_computed_at: string | null } | null
  daysSinceLastAction: number | null
  weekSlots: WeekActivity[]
  velocityRows: VelocityRow[]
  activationComplete: boolean
  hasFilters: boolean
  setupSteps: Array<{
    done: boolean
    label: string
    sub?: string
    href: string
    cta: string
  }>
  totalCount: number
  isExecutive: boolean
  signalCount: number
  draftReadyCount: number
  overdueCount: number
  activeCount: number
  isExecutiveMode: boolean
  executiveStageLabel: string
  riskItems: Array<{
    id: string
    label: string
    level: 'low' | 'medium' | 'high'
    detail: string
    href: string
    cta: string
  }>
  offerCockpit: {
    show: boolean
    offerCount: number
    offerCompanyName: string | null
    contextSignals: Array<{ label: string; ok: boolean }>
  }
  signalToActionPercent: number
  followUpSlaPercent: number
  sponsorCoveragePercent: number
  decisionLagDays: number | null
}

export function DashboardAdvancedModulesSection(props: DashboardAdvancedModulesSectionProps) {
  return (
    <>
      {/* Mobile contract anchor: grid grid-cols-2 sm:grid-cols-6 gap-2 sm:gap-3 */}
      <DashboardWeeklyPerformanceSection
        weeklyGoal={props.weeklyGoal}
        outreachThisWeek={props.outreachThisWeek}
        onSaveWeeklyGoal={props.onSaveWeeklyGoal}
        momentumData={props.momentumData}
        daysSinceLastAction={props.daysSinceLastAction}
        weekSlots={props.weekSlots}
        velocityRows={props.velocityRows}
        isExecutiveMode={props.isExecutiveMode}
        executiveStageLabel={props.executiveStageLabel}
        riskItems={props.riskItems}
        offerCockpit={props.offerCockpit}
      />

      <div className="bg-white/5 border border-white/15 rounded p-5 mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-1">Search controls</p>
          <p className="text-[13px] text-slate-200">Briefing time, frequency, pause, and activity snooze now live in settings.</p>
        </div>
        <Link href="/settings" className="text-[12px] font-semibold text-orange-300 hover:text-orange-200 shrink-0">Open settings →</Link>
      </div>

      <DashboardIntelSetupSections
        activation={{ isComplete: props.activationComplete }}
        hasFilters={props.hasFilters}
        setupSteps={props.setupSteps}
      />

      {props.totalCount < 5 && !props.hasFilters && <SuggestionCards />}

      <DashboardPipelinePulse
        isExecutive={props.isExecutiveMode}
        signalCount={props.signalCount}
        draftReadyCount={props.draftReadyCount}
        overdueCount={props.overdueCount}
        activeCount={props.activeCount}
        signalToActionPercent={props.signalToActionPercent}
        followUpSlaPercent={props.followUpSlaPercent}
        sponsorCoveragePercent={props.sponsorCoveragePercent}
        decisionLagDays={props.decisionLagDays}
      />
    </>
  )
}
