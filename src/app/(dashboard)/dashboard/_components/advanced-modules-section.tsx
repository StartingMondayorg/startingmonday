import { SuggestionCards } from '@/app/(dashboard)/dashboard/_components/SuggestionCards'
import Link from 'next/link'
import { DashboardIntelSetupSections } from './intel-setup-sections'
import { DashboardPipelinePulse } from './pipeline-pulse'
import { DashboardWeeklyPerformanceSection } from './weekly-performance-section'
import type { WeekActivity } from '@/app/components/ActivityChart'
import type { VelocityRow } from '@/app/components/PipelineVelocity'
import { Card } from '@/components/ui'
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

      <Card variant="glass" className="p-5 mb-6 sm:mb-8 flex-row flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-1">Search controls</p>
          <p className="text-[13px] text-muted-foreground">Briefing time, frequency, pause, and activity snooze now live in settings.</p>
        </div>
        <Link href="/settings" className="text-[12px] font-semibold text-primary shrink-0">Open settings →</Link>
      </Card>

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
