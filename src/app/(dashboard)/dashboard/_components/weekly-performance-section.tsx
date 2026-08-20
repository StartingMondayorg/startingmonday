import Link from 'next/link'
import { ActivityChart, type WeekActivity } from '@/app/components/ActivityChart'
import { PipelineVelocity, type VelocityRow } from '@/app/components/PipelineVelocity'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

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
    low: 'border-cyan-300/20 bg-cyan-950/20 text-cyan-100 shadow-[0_12px_30px_rgba(2,6,23,0.18)]',
    medium: 'border-amber-300/30 bg-amber-900/28 text-amber-100 shadow-[0_12px_30px_rgba(2,6,23,0.18)]',
    high: 'border-rose-300/20 bg-rose-950/28 text-rose-100 shadow-[0_12px_30px_rgba(2,6,23,0.2)]',
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
                done >= goal ? 'text-emerald-300' : done > 0 ? 'text-amber-300' : 'text-slate-500'
              }`}>
                {done}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-white">
                  {done >= goal
                    ? 'Weekly goal hit. Strong week.'
                    : `${remaining} outreach draft${remaining === 1 ? '' : 's'} left to hit your goal.`}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Goal: {goal} per week - {done} done since Monday</div>
              </div>
              <form action={onSaveWeeklyGoal} className="shrink-0">
                <input type="hidden" name="weekly_goal" value={goal === 1 ? 1 : goal + 1} />
                <Button
                  type="submit"
                  variant="outline"
                  className="h-auto border-white/20 bg-transparent px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200"
                >
                  Goal: {goal} &uarr;
                </Button>
              </form>
            </Card>
          )
        }

        return (
          <Card variant="glass" className="gap-0 p-5 mb-6 sm:mb-8">
            <p className="text-[13px] font-semibold text-white mb-1">Set a weekly outreach target.</p>
            <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">A weekly target increases follow-through.</p>
            <form action={onSaveWeeklyGoal} className="flex items-center gap-3">
              <Select name="weekly_goal" defaultValue="2">
                <SelectTrigger aria-label="Weekly outreach goal" className="border-white/20 bg-slate-900 px-3 py-2 text-[13px] text-slate-100">
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
                ? 'text-emerald-300'
                : momentumData.momentum_score >= 40
                  ? 'text-amber-300'
                  : 'text-rose-300'
            }`}
          >
            {momentumData.momentum_score}
          </div>
          <div>
            <div className="text-[13px] font-semibold text-white">
              {momentumData.momentum_score >= 70
                ? 'Strong cadence. Keep it moving.'
                : momentumData.momentum_score >= 40
                  ? `Momentum is dropping.${daysSinceLastAction != null ? ` ${daysSinceLastAction}d since your last action.` : ''}`
                  : 'Pace below target. One steady week rebuilds momentum quickly.'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Momentum score
              {momentumData.momentum_computed_at && (
                <>
                  {' '}
                  &middot; Updated {Math.floor((Date.now() - new Date(momentumData.momentum_computed_at).getTime()) / 86400000)}d ago
                </>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-1.5">
              Prefer an external tracker? Try{' '}
              <a href="https://www.manager-tools.com/2016/09/job-search-tracking" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline hover:text-slate-200">
                Manager Tools
              </a>{' '}
              or{' '}
              <a href="https://www.manager-tools.com/career-tools-basics" target="_blank" rel="noopener noreferrer" className="text-slate-400 underline hover:text-slate-200">
                Career Tools
              </a>
            </div>
          </div>
        </Card>
      )}

      {isExecutiveMode && riskItems.length > 0 && (
        <Card variant="glass" id="risk-engine" className="gap-0 mb-6 sm:mb-8 bg-slate-900/70 p-0">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-slate-400">Risk signals</h2>
            <span className="text-[13px] text-slate-400">Operational state from behavior patterns</span>
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
        <Card variant="glass" id="offer-cockpit" className="gap-0 mb-6 sm:mb-8 border-slate-700 bg-slate-900 p-0">
          <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between gap-3">
            <h2 className="text-[13px] font-semibold text-orange-400">Offer comparison</h2>
            <span className="text-[13px] text-slate-300">{offerCockpit.offerCount} offer{offerCockpit.offerCount === 1 ? '' : 's'} in play</span>
          </div>
          <div className="p-5 space-y-4">
            <p className="text-[13px] text-slate-200">
              {offerCockpit.offerCompanyName
                ? `Anchor decision quality around the role at ${offerCockpit.offerCompanyName}.`
                : 'Anchor decision quality around challenge, context, and downside risk.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {offerCockpit.contextSignals.map((signal) => (
                <div key={signal.label} className={`rounded border px-3 py-2 ${signal.ok ? 'border-emerald-700 bg-emerald-950/50 text-emerald-300' : 'border-amber-700 bg-amber-950/40 text-amber-300'}`}>
                  <p className="text-[11px] font-semibold">{signal.label}</p>
                  <p className="text-[10px] mt-1">{signal.ok ? 'Ready' : 'Needs clarity'}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                render={<Link href="/dashboard/offers" />}
                className="h-auto min-h-[44px] border-white/15 bg-white/5 px-4 py-2 text-[13px] font-semibold text-slate-100 hover:border-white/30 hover:bg-white/10"
              >
                Offers
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/strategy" />}
                className="h-auto min-h-[44px] border-slate-500 px-4 py-2 text-[13px] font-semibold text-slate-200 hover:border-slate-300"
              >
                Criteria
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/wrap-up" />}
                className="h-auto min-h-[44px] border-emerald-500 px-4 py-2 text-[13px] font-semibold text-emerald-200 hover:border-emerald-300"
              >
                Mark accepted
              </Button>
              <Button
                variant="outline"
                render={<Link href="/dashboard/wrap-up" />}
                className="h-auto min-h-[44px] border-slate-500 px-4 py-2 text-[13px] font-semibold text-slate-200 hover:border-slate-300"
              >
                Launch 30/60/90 transition
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isExecutiveMode ? (
        <Collapsible>
          <Card variant="glass" className="gap-0 mb-6 sm:mb-8 bg-slate-900/70 p-0">
            <CollapsibleTrigger className="w-full cursor-pointer px-5 py-4 flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">Review performance</span>
              <span className="text-[11px] text-slate-400">Expand</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="px-5 pb-5">
              <Card variant="glass" id="benchmarks" className="gap-0 px-5 py-4 mb-6">
                <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">What works at this level</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[20px] font-bold text-white leading-none">12-18</p>
                    <p className="text-[12px] text-slate-300 mt-1">target companies in a 90-day search</p>
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-white leading-none">2-3</p>
                    <p className="text-[12px] text-slate-300 mt-1">new conversations per week to maintain momentum</p>
                  </div>
                  <div>
                    <p className="text-[20px] font-bold text-white leading-none">72 hrs</p>
                    <p className="text-[12px] text-slate-300 mt-1">typical response time after a warm intro</p>
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
          <Card variant="glass" id="benchmarks" className="gap-0 bg-slate-900/70 px-5 py-4 mb-6 sm:mb-8">
            <h2 className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">What works at this level</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-[20px] font-bold text-white leading-none">12-18</p>
                <p className="text-[12px] text-slate-300 mt-1">target companies in a 90-day search</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-white leading-none">2-3</p>
                <p className="text-[12px] text-slate-300 mt-1">new conversations per week to maintain momentum</p>
              </div>
              <div>
                <p className="text-[20px] font-bold text-white leading-none">72 hrs</p>
                <p className="text-[12px] text-slate-300 mt-1">typical response time after a warm intro</p>
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
