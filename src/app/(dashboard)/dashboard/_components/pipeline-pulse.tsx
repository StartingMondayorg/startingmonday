import Link from 'next/link'

type DashboardPipelinePulseProps = {
  isExecutive: boolean
  signalCount: number
  draftReadyCount: number
  overdueCount: number
  activeCount: number
  signalToActionPercent: number
  followUpSlaPercent: number
  sponsorCoveragePercent: number
  decisionLagDays: number | null
}

export function DashboardPipelinePulse({
  isExecutive,
  signalCount,
  draftReadyCount,
  overdueCount,
  activeCount,
  signalToActionPercent,
  followUpSlaPercent,
  sponsorCoveragePercent,
  decisionLagDays,
}: DashboardPipelinePulseProps) {
  if (!isExecutive) return null

  return (
    <section id="pipeline-pulse" className="rounded overflow-hidden mb-8 border border-orange-300/35 bg-orange-500/10 shadow-[0_18px_40px_rgba(15,23,42,0.22)] backdrop-blur-sm">
      <div className="px-6 py-[18px] border-b border-orange-300/25 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500">Pipeline Pulse</h2>
          <span className="text-[10px] font-semibold text-orange-100 bg-orange-500/20 border border-orange-300/35 px-2 py-0.5 rounded-full">Executive</span>
        </div>
        <Link href="/dashboard/signals" className="text-[12px] text-slate-300 hover:text-orange-200">
          Signals
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10 border-b border-white/10">
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${signalCount > 0 ? 'text-orange-500' : 'text-slate-300'}`}>{signalCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">New Signals</div>
          <div className="text-[11px] text-slate-400 mt-0.5">last 7 days</div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${draftReadyCount > 0 ? 'text-orange-500' : 'text-slate-300'}`}>{draftReadyCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">Drafts Ready</div>
          <div className="text-[11px] text-slate-400 mt-0.5">last 14 days</div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${overdueCount > 0 ? 'text-red-600' : 'text-slate-300'}`}>{overdueCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">Today</div>
          <div className="text-[11px] text-slate-400 mt-0.5">overdue</div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${activeCount > 0 ? 'text-slate-100' : 'text-slate-300'}`}>{activeCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">In Process</div>
          <div className="text-[11px] text-slate-400 mt-0.5">active companies</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-white/10">
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${signalToActionPercent >= 60 ? 'text-emerald-600' : signalToActionPercent >= 35 ? 'text-amber-600' : 'text-red-600'}`}>
            {signalToActionPercent}%
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">Signal to action</div>
          <div className="text-[11px] text-slate-400 mt-0.5">draft conversion</div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${followUpSlaPercent >= 85 ? 'text-emerald-600' : followUpSlaPercent >= 65 ? 'text-amber-600' : 'text-red-600'}`}>
            {followUpSlaPercent}%
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">72h SLA</div>
          <div className="text-[11px] text-slate-400 mt-0.5">follow-up discipline</div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${sponsorCoveragePercent >= 70 ? 'text-emerald-600' : sponsorCoveragePercent >= 45 ? 'text-amber-600' : 'text-red-600'}`}>
            {sponsorCoveragePercent}%
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">Sponsor coverage</div>
          <div className="text-[11px] text-slate-400 mt-0.5">companies with contacts</div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${decisionLagDays !== null && decisionLagDays >= 7 ? 'text-red-600' : 'text-slate-100'}`}>
            {decisionLagDays ?? 0}d
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-slate-300 mt-1.5">Decision lag</div>
          <div className="text-[11px] text-slate-400 mt-0.5">active offer context</div>
        </div>
      </div>
    </section>
  )
}
