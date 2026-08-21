import Link from 'next/link'
import { ActivityChart, type WeekActivity } from '@/app/components/ActivityChart'
import { PipelineVelocity, type VelocityRow } from '@/app/components/PipelineVelocity'
import { Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui'
type MomentumData = {
  momentum_score: number | null
  momentum_computed_at: string | null
} | null

type DashboardWeeklyPerformanceSectionProps = {
  weeklyGoal: number | null
  outreachThisWeek: number
  onSaveWeeklyGoal: (formData: FormData) => void | Promise<void>
  momentumData: MomentumData
  daysSinceLastAction: number | null
  weekSlots: WeekActivity[]
  velocityRows: VelocityRow[]
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
}

export function DashboardWeeklyPerformanceSection({
  weeklyGoal,
  outreachThisWeek,
  onSaveWeeklyGoal,
  momentumData,
  daysSinceLastAction,
  weekSlots,
  velocityRows,
  isExecutiveMode,
  executiveStageLabel,
  riskItems,
  offerCockpit,
}: DashboardWeeklyPerformanceSectionProps) {
  const riskTone = {
    low: 'border-info/20 bg-info/20 text-info shadow-md',
    medium: 'border-warning/30 bg-warning/28 text-warning shadow-md',
    high: 'border-destructive/20 bg-destructive/28 text-destructive shadow-md',
  } as const

  return (
    <>
      {(() => {
        const goal = weeklyGoal
        const done = outreachThisWeek
        if (goal) {
          const remaining = Math.max(0, goal - done)
          return (
            <Card variant="glass" className="flex-row items-center gap-5 p-5 mb-6 sm:mb-8">
              <div className={`text-[40px] font-bold leading-none tabular-nums shrink-0 ${
                done >= goal ? 'text-success' : done > 0 ? 'text-warning' : 'text-muted-foreground'
              }`}>
                {done}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-foreground">
                  {done >= goal
                    ? 'Weekly goal hit. Strong week.'
                    : `${remaining} outreach draft${remaining === 1 ? '' : 's'} left to hit your goal.`}
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">Goal: {goal} per week - {done} done since Monday</div>
              </div>
              <form action={onSaveWeeklyGoal} className="shrink-0">
                <input type="hidden" name="weekly_goal" value={goal === 1 ? 1 : goal + 1} />
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto border-border bg-transparent px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Goal: {goal} &uarr;
                </Button>
              </form>
            </Card>
          )
        }

        return (
          <Card variant="glass" className="gap-0 p-5 mb-6 sm:mb-8">
            <p className="text-[13px] font-semibold text-foreground mb-1">Set a weekly outreach target.</p>
            <p className="text-[12px] text-muted-foreground mb-3 leading-relaxed">A weekly target increases follow-through.</p>
            <form action={onSaveWeeklyGoal} className="flex items-center gap-3">
              <Select name="weekly_goal" defaultValue="2">
                <SelectTrigger aria-label="Weekly outreach goal" className="border-border bg-card px-3 py-2 text-[13px] text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} per week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="submit" className="h-auto px-4 py-2 text-[13px] font-semibold">
                Set goal
              </Button>
            </form>
          </Card>
        )
      })()}

      {momentumData?.momentum_score != null && (
        <Card variant="glass" className="flex-row items-center gap-5 p-5 mb-6 sm:mb-8">
          <div
            className={`text-[40px] font-bold leading-none tabular-nums shrink-0 ${
              momentumData.momentum_score >= 70
                ? 'text-success'
                : momentumData.momentum_score >= 40
                  ? 'text-warning'
                  : 'text-destructive'
            }`}
          >
            {momentumData.momentum_score}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-foreground">
              {momentumData.momentum_score >= 70
                ? 'Strong cadence. Keep it moving.'
                : momentumData.momentum_score >= 40
                  ? `Momentum is dropping.${daysSinceLastAction != null ? ` ${daysSinceLastAction}d since your last action.` : ''}`
                  : 'Pace below target. One steady week rebuilds momentum quickly.'}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              Momentum score
              {momentumData.momentum_computed_at && (
                <>
                  {' '}
                  &middot; Updated {Math.floor((Date.now() - new Date(momentumData.momentum_computed_at).getTime()) / 86400000)}d ago
                </>
              )}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1.5">
              Prefer an external tracker? Try{' '}
              <a href="https://www.manager-tools.com/2016/09/job-search-tracking" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline hover:text-foreground">
                Manager Tools
              </a>{' '}
              or{' '}
              <a href="https://www.manager-tools.com/career-tools-basics" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline hover:text-foreground">
                Career Tools
              </a>
            </div>
          </div>
        </Card>
      )}

      {isExecutiveMode && riskItems.length > 0 && (
        <Card variant="glass" id="risk-engine" className="gap-0 mb-6 sm:mb-8 bg-card/70 p-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-muted-foreground">Risk signals</h2>
            <span className="text-[13px] text-muted-foreground">Operational state from behavior patterns</span>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {riskItems.map((risk) => (
              <div key={risk.id} className={`border rounded p-3 ${riskTone[risk.level]}`}>
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[12px] font-semibold tracking-[0.01em]">{risk.label}</p>
                    <span className="text-[11px] font-semibold uppercase tracking-[0.08em] opacity-90">{risk.level}</span>
                </div>
                <p className="text-[12px] mt-1.5 leading-relaxed text-current/90">{risk.detail}</p>
                <Link href={risk.href} className="inline-flex mt-2 text-[12px] font-semibold underline decoration-current/40 underline-offset-4 hover:decoration-current">
                  {risk.cta}
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {offerCockpit.show && (
        <Card variant="glass" id="offer-cockpit" className="gap-0 mb-6 sm:mb-8 border-border bg-card p-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-primary">Offer comparison</h2>
            <span className="text-[13px] text-muted-foreground">{offerCockpit.offerCount} offer{offerCockpit.offerCount === 1 ? '' : 's'} in play</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[13px] text-foreground">
              {offerCockpit.offerCompanyName
                ? `Anchor decision quality around the role at ${offerCockpit.offerCompanyName}.`
                : 'Anchor decision quality around challenge, context, and downside risk.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {offerCockpit.contextSignals.map((signal) => (
                <div key={signal.label} className={`rounded border px-3 py-2 ${signal.ok ? 'border-success/30 bg-success/50 text-success' : 'border-warning/30 bg-warning/40 text-warning'}`}>
                  <p className="text-[11px] font-semibold">{signal.label}</p>
                  <p className="text-[10px] mt-1">{signal.ok ? 'Ready' : 'Needs clarity'}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                render={<Link href="/dashboard/offers" />}
                className="h-auto min-h-[44px] border-border bg-muted/40 px-4 py-2 text-[13px] font-semibold text-foreground hover:bg-muted/60"
              >
                Offers
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/strategy" />}
                className="h-auto min-h-[44px] border-border px-4 py-2 text-[13px] font-semibold text-foreground"
              >
                Criteria
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/wrap-up" />}
                className="h-auto min-h-[44px] border-success/30 px-4 py-2 text-[13px] font-semibold text-success"
              >
                Mark accepted
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/wrap-up" />}
                className="h-auto min-h-[44px] border-border px-4 py-2 text-[13px] font-semibold text-foreground"
              >
                Launch 30/60/90 transition
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isExecutiveMode ? (
        <Collapsible>
          <Card variant="glass" className="gap-0 mb-6 sm:mb-8 bg-card/70 p-0">
            <CollapsibleTrigger className="w-full cursor-pointer px-5 py-4 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Review performance</span>
              <span className="text-[11px] text-muted-foreground">Expand</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5">
              <Card variant="glass" id="benchmarks" className="gap-0 px-5 py-4 mb-6">
                <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">What works at this level</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[20px] font-bold text-foreground leading-none">12-18</p>
                    <p className="text-[12px] text-muted-foreground mt-1">target companies in a 90-day search</p>
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-foreground leading-none">2-3</p>
                    <p className="text-[12px] text-muted-foreground mt-1">new conversations per week to maintain momentum</p>
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-foreground leading-none">72 hrs</p>
                    <p className="text-[12px] text-muted-foreground mt-1">typical response time after a warm intro</p>
                  </div>
                </div>
              </Card>

              <ActivityChart data={weekSlots} />
              <PipelineVelocity companies={velocityRows} />
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ) : (
        <>
          <Card variant="glass" id="benchmarks" className="gap-0 bg-card/70 px-5 py-4 mb-6 sm:mb-8">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">What works at this level</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[20px] font-bold text-foreground leading-none">12-18</p>
                <p className="text-[12px] text-muted-foreground mt-1">target companies in a 90-day search</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-foreground leading-none">2-3</p>
                <p className="text-[12px] text-muted-foreground mt-1">new conversations per week to maintain momentum</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-foreground leading-none">72 hrs</p>
                <p className="text-[12px] text-muted-foreground mt-1">typical response time after a warm intro</p>
              </div>
            </div>
          </Card>

          <ActivityChart data={weekSlots} />
          <PipelineVelocity companies={velocityRows} />
        </>
      )}
    </>
  )
}
