import Link from 'next/link'

const STAGE_LABELS: Record<string, string> = {
  watching:     'Watching',
  researching:  'Researching',
  applied:      'In Process',
  interviewing: 'Interviewing',
  offer:        'Offer',
}

const STAGE_CLS: Record<string, string> = {
  watching:     'bg-muted/60 text-muted-foreground',
  researching:  'bg-info/10 text-info',
  applied:      'bg-info/10 text-info',
  interviewing: 'bg-warning/10 text-warning',
  offer:        'bg-success/10 text-success',
}

export type VelocityRow = { id: string; name: string; stage: string; updated_at: string | null }

export function PipelineVelocity({ companies }: { companies: VelocityRow[] }) {
  const rows = companies
    .map(c => ({
      ...c,
      daysSince: c.updated_at
        ? Math.floor((Date.now() - new Date(c.updated_at).getTime()) / 86400000)
        : 999,
    }))
    .sort((a, b) => b.daysSince - a.daysSince)
    .slice(0, 12)

  if (rows.length === 0) return null

  return (
    <div className="bg-muted/40 border border-border rounded mb-6 sm:mb-8 overflow-hidden">
      <div className="px-5 py-[14px] border-b border-border flex items-baseline justify-between">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
          Pipeline Velocity
        </p>
        <p className="text-[11px] text-muted-foreground">days since last activity</p>
      </div>
      <div className="divide-y divide-border">
        {rows.map(row => {
          const staleCls =
            row.daysSince >= 30 ? 'text-destructive font-semibold' :
            row.daysSince >= 14 ? 'text-warning font-semibold' :
            'text-muted-foreground'
          return (
            <div key={row.id} className="px-5 py-3 flex items-center gap-3">
              <Link
                href={`/dashboard/companies/${row.id}`}
                className="flex-1 text-[13px] font-medium text-muted-foreground hover:text-foreground truncate"
              >
                {row.name}
              </Link>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${STAGE_CLS[row.stage] ?? 'bg-muted/60 text-muted-foreground'}`}>
                {STAGE_LABELS[row.stage] ?? row.stage}
              </span>
              <span className={`text-[12px] shrink-0 tabular-nums w-10 text-right ${staleCls}`}>
                {row.daysSince === 999 ? '--' : row.daysSince === 0 ? 'today' : `${row.daysSince}d`}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
