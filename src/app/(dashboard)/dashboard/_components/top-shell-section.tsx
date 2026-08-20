import Link from 'next/link'
import { DashboardPrimaryNavSections } from './primary-nav-sections'
import { DashboardStatusBanners } from './status-banners'
import { DashboardGreetingBlock } from './greeting-block'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

type ExecutiveRiskLevel = 'low' | 'medium' | 'high'

type ExecutiveDecisionBrief = {
  changed: string
  whyNow: string
  recommendedMove: string
  downsideIfDelayed: string
  href: string
  cta: string
}

type DashboardTopShellSectionProps = {
  firstName: string
  briefingTimezone: string | null
  signalCount: number
  overdueCount: number
  canUseOutreachHub: boolean
  isRothschildAdmin: boolean
  profileSaved: boolean
  isTrialing: boolean
  trialDaysLeft: number
  totalCount: number
  offerCount: number
  offerName: string | null
  offerCompanyName: string | null
  onMarkPlaced: (formData: FormData) => void | Promise<void>
  activationComplete: boolean
  activationCompletedCount: number
  setupSteps?: Array<{
    done: boolean
    label: string
    href: string
    cta: string
  }>
  isExecutiveMode: boolean
  isExecutivePreview: boolean
  executiveStageLabel: string
  executivePrimaryRisk: {
    label: string
    level: ExecutiveRiskLevel
    href: string
    cta: string
  }
  executiveDecisionBrief: ExecutiveDecisionBrief
}

export function DashboardTopShellSection(props: DashboardTopShellSectionProps) {
  const riskTone = {
    low: 'bg-white/6 text-emerald-200 border-emerald-300/20 shadow-[0_10px_26px_rgba(15,23,42,0.15)]',
    medium: 'bg-white/6 text-amber-200 border-amber-300/20 shadow-[0_10px_26px_rgba(15,23,42,0.15)]',
    high: 'bg-white/8 text-rose-100 border-rose-300/25 shadow-[0_12px_30px_rgba(15,23,42,0.2)]',
  } as const

  return (
    <>
      {props.isExecutiveMode && (
        <Card variant="glass" className="gap-0 mb-6 p-0 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
          <div className="px-5 py-3.5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-orange-300">Executive mode</span>
              {props.isExecutivePreview && (
                <Badge className="h-auto px-2 py-0.5 text-[13px] font-semibold text-indigo-200 bg-indigo-500/20 border-indigo-300/30">
                  Preview mode
                </Badge>
              )}
              <Badge className="h-auto px-2 py-0.5 text-[13px] font-semibold text-slate-200 bg-white/10 border-white/10">
                Stage: {props.executiveStageLabel}
              </Badge>
            </div>
            <div className={`inline-flex items-center gap-2 text-[13px] font-semibold border px-2.5 py-1 rounded-full ${riskTone[props.executivePrimaryRisk.level]}`}>
              <span>Primary risk: {props.executivePrimaryRisk.label}</span>
              <Link href={props.executivePrimaryRisk.href} className="underline">
                {props.executivePrimaryRisk.cta}
              </Link>
            </div>
          </div>

          <div className="px-5 py-4 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-300 mb-2">Decision brief</h2>
              <div className="space-y-2.5">
                <p className="text-[13px] text-slate-200"><span className="font-semibold text-white">What changed:</span> {props.executiveDecisionBrief.changed}</p>
                <p className="text-[13px] text-slate-200"><span className="font-semibold text-white">Why now:</span> {props.executiveDecisionBrief.whyNow}</p>
                <p className="text-[13px] text-slate-200"><span className="font-semibold text-white">Recommended move:</span> {props.executiveDecisionBrief.recommendedMove}</p>
                <p className="text-[13px] text-slate-200"><span className="font-semibold text-white">Downside if delayed:</span> {props.executiveDecisionBrief.downsideIfDelayed}</p>
              </div>
            </div>
            <Button
              render={<Link href={props.executiveDecisionBrief.href} />}
              className="h-auto min-h-[44px] whitespace-nowrap px-4 py-2 text-[13px] font-semibold"
            >
              {props.executiveDecisionBrief.cta}
            </Button>
          </div>
        </Card>
      )}

      <Card
        variant="glass"
        className="gap-0 mb-4 sm:mb-6 border-slate-900 bg-[radial-gradient(circle_at_top_left,_rgba(193,127,59,0.2),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(255,255,255,0.16),_transparent_34%),linear-gradient(180deg,_rgba(9,14,26,0.98)_0%,_rgba(11,17,30,0.95)_54%,_rgba(10,15,28,0.98)_100%)] px-5 py-4 sm:px-6 sm:py-5 shadow-[0_20px_48px_rgba(15,23,42,0.14)]"
      >
        <DashboardGreetingBlock firstName={props.firstName} briefingTimezone={props.briefingTimezone} />
      </Card>

      <DashboardPrimaryNavSections
        signalCount={props.signalCount}
        overdueCount={props.overdueCount}
        canUseOutreachHub={props.canUseOutreachHub}
        isRothschildAdmin={props.isRothschildAdmin}
        isExecutiveMode={props.isExecutiveMode}
      />

      {props.profileSaved && (
        <Alert variant="success" className="mb-6 flex items-center justify-between gap-4 px-5 py-3">
          <AlertDescription className="text-current">Profile updated. Your briefs and coaching will reflect this now.</AlertDescription>
          <Link href="/dashboard/profile" className="font-semibold underline shrink-0">
            Finish profile
          </Link>
        </Alert>
      )}

      <DashboardStatusBanners
        isTrialing={props.isTrialing}
        trialDaysLeft={props.trialDaysLeft}
        totalCount={props.totalCount}
        offerCount={props.offerCount}
        offerName={props.offerName}
        offerCompanyName={props.offerCompanyName}
        onMarkPlaced={props.onMarkPlaced}
        activationComplete={props.activationComplete}
        activationCompletedCount={props.activationCompletedCount}
        setupSteps={props.setupSteps ?? []}
        isExecutiveMode={props.isExecutiveMode}
      />
    </>
  )
}
