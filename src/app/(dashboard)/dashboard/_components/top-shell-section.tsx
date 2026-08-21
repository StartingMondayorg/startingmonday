import Link from 'next/link'
import { DashboardPrimaryNavSections } from './primary-nav-sections'
import { DashboardStatusBanners } from './status-banners'
import { DashboardGreetingBlock } from './greeting-block'
import { Alert, AlertDescription, Badge, Button, Card } from '@/components/ui'
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
    low: 'bg-muted/60 text-success border-success/20 shadow-md',
    medium: 'bg-muted/60 text-warning border-warning/20 shadow-md',
    high: 'bg-muted/60 text-destructive border-destructive/25 shadow-md',
  } as const

  return (
    <>
      {props.isExecutiveMode && (
        <Card variant="glass" className="gap-0 mb-6 p-0 shadow-xl">
          <div className="px-5 py-3.5 border-b border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-primary">Executive mode</span>
              {props.isExecutivePreview && (
                <Badge className="h-auto px-2 py-0.5 text-[13px] font-semibold text-info bg-info/20 border-info/30">
                  Preview mode
                </Badge>
              )}
              <Badge className="h-auto px-2 py-0.5 text-[13px] font-semibold text-foreground bg-muted/60 border-border">
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
              <h2 className="text-[13px] font-semibold text-muted-foreground mb-2">Decision brief</h2>
              <div className="space-y-2.5">
                <p className="text-[13px] text-foreground"><span className="font-semibold text-foreground">What changed:</span> {props.executiveDecisionBrief.changed}</p>
                <p className="text-[13px] text-foreground"><span className="font-semibold text-foreground">Why now:</span> {props.executiveDecisionBrief.whyNow}</p>
                <p className="text-[13px] text-foreground"><span className="font-semibold text-foreground">Recommended move:</span> {props.executiveDecisionBrief.recommendedMove}</p>
                <p className="text-[13px] text-foreground"><span className="font-semibold text-foreground">Downside if delayed:</span> {props.executiveDecisionBrief.downsideIfDelayed}</p>
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
        className="gap-0 mb-4 sm:mb-6 border-border bg-card/85 px-5 py-4 sm:px-6 sm:py-5 shadow-lg"
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
