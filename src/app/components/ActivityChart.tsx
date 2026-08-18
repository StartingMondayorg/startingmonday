'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export type WeekActivity = {
  week: string
  companies: number
  contacts: number
  briefs: number
  followUps: number
}

export function ActivityChart({ data }: { data: WeekActivity[] }) {
  const hasActivity = data.some(d => d.companies + d.contacts + d.briefs + d.followUps > 0)
  if (!hasActivity) return null

  return (
    <div className="bg-white/5 border border-white/15 rounded p-5 mb-6 sm:mb-8">
      <p className="text-[10px] font-bold tracking-[0.14em] uppercase text-slate-400 mb-4">
        Weekly Search Activity
      </p>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
          <XAxis
            dataKey="week"
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{ fontSize: 11, border: '1px solid #e2e8f0', borderRadius: 4, padding: '6px 10px' }}
            cursor={{ fill: '#f8fafc' }}
          />
          <Bar dataKey="companies" name="Companies" stackId="a" fill="#f97316" />
          <Bar dataKey="contacts"  name="Contacts"  stackId="a" fill="#64748b" />
          <Bar dataKey="briefs"    name="Briefs"     stackId="a" fill="#0f172a" />
          <Bar dataKey="followUps" name="Follow-ups" stackId="a" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-5 mt-3 flex-wrap">
        {([
          { color: '#f97316', label: 'Companies' },
          { color: '#64748b', label: 'Contacts' },
          { color: '#0f172a', label: 'Briefs' },
          { color: '#cbd5e1', label: 'Follow-ups' },
        ] as const).map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm inline-block shrink-0" style={{ backgroundColor: item.color }} />
            <span className="text-[11px] text-slate-400">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
