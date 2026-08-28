'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export type WeekActivity = {
  week: string
  companies: number
  contacts: number
  briefs: number
  followUps: number
}

// Series colours come from the shared --chart-* tokens so the chart re-themes
// with the rest of the app instead of pinning its own palette.
const SERIES = [
  { color: 'var(--chart-1)', label: 'Companies' },
  { color: 'var(--chart-2)', label: 'Contacts' },
  { color: 'var(--chart-3)', label: 'Briefs' },
  { color: 'var(--chart-4)', label: 'Follow-ups' },
] as const

export function ActivityChart({ data }: { data: WeekActivity[] }) {
  const hasActivity = data.some(d => d.companies + d.contacts + d.briefs + d.followUps > 0)
  if (!hasActivity) return null

  return (
    <div className="bg-muted/40 border border-border rounded p-5 mb-6 sm:mb-8">
      <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-muted-foreground mb-4">
        Weekly Search Activity
      </p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              fontSize: 11,
              border: '1px solid var(--border)',
              background: 'var(--popover)',
              color: 'var(--popover-foreground)',
              borderRadius: 4,
              padding: '6px 10px',
            }}
            cursor={{ fill: 'var(--muted)' }}
          />
          <Bar dataKey="companies" name="Companies" stackId="a" fill={SERIES[0].color} />
          <Bar dataKey="contacts"  name="Contacts"  stackId="a" fill={SERIES[1].color} />
          <Bar dataKey="briefs"    name="Briefs"     stackId="a" fill={SERIES[2].color} />
          <Bar dataKey="followUps" name="Follow-ups" stackId="a" fill={SERIES[3].color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-5 mt-3 flex-wrap">
        {SERIES.map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
