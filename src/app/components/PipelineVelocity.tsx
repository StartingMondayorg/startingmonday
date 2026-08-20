import Link from 'next/link'

const STAGE_LABELS: Record<string, string> = {
  watching:     'Watching',
  researching:  'Researching',
  applied:      'In Process',
  interviewing: 'Interviewing',
  offer:        'Offer',
}

const STAGE_CLS: Record<string, string> = {
  watching:     'bg-white/10 text-slate-300',
  researching:  'bg-blue-500/15 text-blue-200',
  applied:      'bg-indigo-500/15 text-indigo-200',
  interviewing: 'bg-amber-500/15 text-amber-200',
  offer:        'bg-emerald-500/15 text-emerald-200',
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
    <div className="bg-white/5 border border-white/15 rounded mb-6 sm:mb-8 overflow-hidden">
      <div className="px-5 py-[14px] border-b border-white/10 flex items-baseline justify-between">
        <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400">
          Pipeline Velocity
        </p>
        <p className="text-[11px] text-slate-400">days since last activity</p>
      </div>
      <div className="divide-y divide-white/10">
        {rows.map(row => {
          const staleCls =
            row.daysSince >= 30 ? 'text-rose-300 font-semibold' :
            row.daysSince >= 14 ? 'text-amber-300 font-semibold' :
            'text-slate-400'
          return (
            <div key={row.id} className="px-5 py-3 flex items-center gap-3">
              <Link
                href={`/dashboard/companies/${row.id}`}
                className="flex-1 text-[13px] font-medium text-slate-100 hover:text-white truncate"
              >
                {row.name}
              </Link>
              <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${STAGE_CLS[row.stage] ?? 'bg-white/10 text-slate-300'}`}>
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
