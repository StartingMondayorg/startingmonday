import Link from 'next/link'
import { Badge, Card } from '@/components/ui'
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
    <Card variant="glass" id="pipeline-pulse" className="gap-0 rounded overflow-hidden mb-8 border-primary/35 bg-primary/10 shadow-lg py-0">
      <div className="px-6 py-[18px] border-b border-primary/25 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary">Pipeline Pulse</h2>
          <Badge variant="warning">Executive</Badge>
        </div>
        <Link href="/dashboard/signals" className="text-[12px] text-muted-foreground hover:text-primary">
          Signals
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border border-b border-border">
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${signalCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>{signalCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">New Signals</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">last 7 days</div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${draftReadyCount > 0 ? 'text-primary' : 'text-muted-foreground'}`}>{draftReadyCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">Drafts Ready</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">last 14 days</div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>{overdueCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">Today</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">overdue</div>
        </div>
        <div className="px-6 py-5 text-center">
          <div className={`text-[28px] font-bold leading-none ${activeCount > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>{activeCount}</div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">In Process</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">active companies</div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${signalToActionPercent >= 60 ? 'text-success' : signalToActionPercent >= 35 ? 'text-warning' : 'text-destructive'}`}>
            {signalToActionPercent}%
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">Signal to action</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">draft conversion</div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${followUpSlaPercent >= 85 ? 'text-success' : followUpSlaPercent >= 65 ? 'text-warning' : 'text-destructive'}`}>
            {followUpSlaPercent}%
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">72h SLA</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">follow-up discipline</div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${sponsorCoveragePercent >= 70 ? 'text-success' : sponsorCoveragePercent >= 45 ? 'text-warning' : 'text-destructive'}`}>
            {sponsorCoveragePercent}%
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">Sponsor coverage</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">companies with contacts</div>
        </div>
        <div className="px-6 py-4 text-center">
          <div className={`text-[24px] font-bold leading-none ${decisionLagDays !== null && decisionLagDays >= 7 ? 'text-destructive' : 'text-foreground'}`}>
            {decisionLagDays ?? 0}d
          </div>
          <div className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-1.5">Decision lag</div>
          <div className="text-[11px] text-muted-foreground mt-0.5">active offer context</div>
        </div>
      </div>
    </Card>
  )
}
