import Link from 'next/link'
import { ActivityChart, type WeekActivity } from '@/components/ActivityChart'
import { PipelineVelocity, type VelocityRow } from '@/components/PipelineVelocity'

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
            <div className="bg-white/5 border border-white/15 rounded p-5 mb-6 sm:mb-8 flex items-center gap-5">
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
                <button type="submit" className="text-[11px] text-slate-400 hover:text-slate-200 border border-white/20 rounded px-2.5 py-1 cursor-pointer bg-transparent transition-colors">
                  Goal: {goal} &uarr;
                </button>
              </form>
            </div>
          )
        }

        return (
          <div className="bg-white/5 border border-white/15 rounded p-5 mb-6 sm:mb-8">
            <p className="text-[13px] font-semibold text-white mb-1">Set a weekly outreach target.</p>
            <p className="text-[12px] text-slate-400 mb-3 leading-relaxed">A weekly target increases follow-through.</p>
            <form action={onSaveWeeklyGoal} className="flex items-center gap-3">
              <select
                name="weekly_goal"
                aria-label="Weekly outreach goal"
                defaultValue="2"
                className="border border-white/20 rounded px-3 py-2 text-[13px] text-slate-100 bg-slate-900 focus:outline-none focus:border-orange-300/50"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>
                    {n} per week
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-400 text-slate-950 text-[13px] font-semibold px-4 py-2 rounded transition-colors cursor-pointer border-0"
              >
                Set goal
              </button>
            </form>
          </div>
        )
      })()}

      {momentumData?.momentum_score != null && (
        <div className="bg-white/5 border border-white/15 rounded p-5 mb-6 sm:mb-8 flex items-center gap-5">
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
        </div>
      )}

      {isExecutiveMode && riskItems.length > 0 && (
        <section id="risk-engine" className="mb-6 sm:mb-8 bg-slate-900/70 border border-white/10 rounded overflow-hidden">
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
        </section>
      )}

      {offerCockpit.show && (
        <section id="offer-cockpit" className="mb-6 sm:mb-8 bg-slate-900 border border-slate-700 rounded overflow-hidden">
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
                <Link href="/dashboard/offers" className="inline-flex min-h-[44px] items-center justify-center border border-white/15 bg-white/5 text-slate-100 text-[13px] font-semibold px-4 py-2 rounded hover:border-white/30 hover:bg-white/10">
                Offers
              </Link>
              <Link href="/dashboard/strategy" className="inline-flex min-h-[44px] items-center justify-center border border-slate-500 text-slate-200 text-[13px] font-semibold px-4 py-2 rounded hover:border-slate-300">
                Criteria
              </Link>
              <Link href="/dashboard/wrap-up" className="inline-flex min-h-[44px] items-center justify-center border border-emerald-500 text-emerald-200 text-[13px] font-semibold px-4 py-2 rounded hover:border-emerald-300">
                Mark accepted
              </Link>
              <Link href="/dashboard/wrap-up" className="inline-flex min-h-[44px] items-center justify-center border border-slate-500 text-slate-200 text-[13px] font-semibold px-4 py-2 rounded hover:border-slate-300">
                Launch 30/60/90 transition
              </Link>
            </div>
          </div>
        </section>
      )}

      {isExecutiveMode ? (
        <details className="mb-6 sm:mb-8 bg-slate-900/70 border border-white/10 rounded overflow-hidden">
          <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">Review performance</span>
            <span className="text-[11px] text-slate-400">Expand</span>
          </summary>
          <div className="px-5 pb-5">
            <section id="benchmarks" className="bg-white/5 border border-white/15 rounded px-5 py-4 mb-6">
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
            </section>

            <ActivityChart data={weekSlots} />
            <PipelineVelocity companies={velocityRows} />
          </div>
        </details>
      ) : (
        <>
          <section id="benchmarks" className="bg-slate-900/70 border border-white/10 rounded px-5 py-4 mb-6 sm:mb-8">
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
          </section>

          <ActivityChart data={weekSlots} />
          <PipelineVelocity companies={velocityRows} />
        </>
      )}
    </>
  )
}
