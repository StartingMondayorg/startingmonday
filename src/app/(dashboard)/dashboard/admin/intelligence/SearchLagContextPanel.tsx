import { Badge, Card } from '@/components/ui'
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
    <Card className="p-5 sm:p-6 mb-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="text-[15px] font-bold text-foreground">Search-lag context (internal)</h2>
        <Badge variant={ready ? 'success' : 'warning'}>
          {ready ? 'Ready' : 'Building support'}
        </Badge>
      </div>
      <p className="text-[12px] text-muted-foreground mb-3">
        Descriptive benchmarks only. Role context requires n ≥ 20; company context requires n ≥ 3; industry context requires n ≥ 10. Unsupported cohorts are withheld.
        {lastUpdatedAt ? ` Last refreshed ${new Date(lastUpdatedAt).toISOString().slice(0, 10)}.` : ''}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="px-3 py-2.5">
          <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Company Cohorts</div>
          <div className="text-[18px] font-bold text-foreground">{companyCohortCount}</div>
        </Card>
        <Card className="px-3 py-2.5">
          <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Role Cohorts</div>
          <div className="text-[18px] font-bold text-foreground">{roleStats.length}</div>
        </Card>
        <Card className="px-3 py-2.5 col-span-2">
          <div className="text-[10px] tracking-[0.08em] text-muted-foreground font-bold">Highest-Support Role Context</div>
          <div className="text-[13px] font-semibold text-foreground mt-1">
            {topRole
              ? `${topRole.title_normalized}: median ${topRole.median_search_lag_days} days, middle 50% ${topRole.p25_search_lag_days}–${topRole.p75_search_lag_days} (n=${topRole.sample_size})`
              : 'No supported role cohort yet'}
          </div>
        </Card>
      </div>
    </Card>
  )
}