type RoleLagStat = {
  title_normalized: string
  median_search_lag_days: number
  p25_search_lag_days: number
  p75_search_lag_days: number
  sample_size: number
}

export function SearchLagContextPanel({
  roleStats,
  companyCohortCount,
  lastUpdatedAt,
}: {
  roleStats: RoleLagStat[]
  companyCohortCount: number
  lastUpdatedAt: string | null
}) {
  const ready = roleStats.length > 0
  const topRole = roleStats[0] ?? null

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 mb-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[15px] font-bold text-slate-900">Search-lag context (internal)</h2>
        <span className={`text-[11px] font-semibold px-2 py-1 rounded ${ready ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
          {ready ? 'Ready' : 'Building support'}
        </span>
      </div>
      <p className="text-[12px] text-slate-500 mb-3">
        Descriptive benchmarks only. Role context requires n ≥ 20; company context requires n ≥ 3; industry context requires n ≥ 10. Unsupported cohorts are withheld.
        {lastUpdatedAt ? ` Last refreshed ${new Date(lastUpdatedAt).toISOString().slice(0, 10)}.` : ''}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-slate-200 px-3 py-2.5 bg-slate-50">
          <div className="text-[10px] tracking-[0.08em] text-slate-400 font-bold">Company Cohorts</div>
          <div className="text-[18px] font-bold text-slate-900">{companyCohortCount}</div>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2.5 bg-slate-50">
          <div className="text-[10px] tracking-[0.08em] text-slate-400 font-bold">Role Cohorts</div>
          <div className="text-[18px] font-bold text-slate-900">{roleStats.length}</div>
        </div>
        <div className="rounded-lg border border-slate-200 px-3 py-2.5 bg-slate-50 col-span-2">
          <div className="text-[10px] tracking-[0.08em] text-slate-400 font-bold">Highest-Support Role Context</div>
          <div className="text-[13px] font-semibold text-slate-900 mt-1">
            {topRole
              ? `${topRole.title_normalized}: median ${topRole.median_search_lag_days} days, middle 50% ${topRole.p25_search_lag_days}–${topRole.p75_search_lag_days} (n=${topRole.sample_size})`
              : 'No supported role cohort yet'}
          </div>
        </div>
      </div>
    </div>
  )
}