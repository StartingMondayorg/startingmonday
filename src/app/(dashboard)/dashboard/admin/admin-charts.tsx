'use client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

type FunnelRow = { step: string; count: number; label: string }
type EventRow  = { event_name: string; count: number }

function shortLabel(step: string) {
  const MAP: Record<string, string> = {
    a1_resume: 'Resume', a2_company: 'Company', a3_prep: 'Brief',
    a4_contact: 'Contact', a5_briefing: 'Briefing', a6_follow_up: 'Follow-up',
  }
  return MAP[step] ?? step
}

export function FunnelChart({ data }: { data: FunnelRow[] }) {
  const max = Math.max(...data.map(d => d.count), 1)
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(15,23,42,0.95)', color: '#e2e8f0' }}
          labelStyle={{ color: '#f8fafc' }}
          itemStyle={{ color: '#f8fafc' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {data.map((row, i) => (
            <Cell key={i} fill={row.count / max > 0.5 ? '#fb923c' : '#64748b'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function EventVolumeChart({ data }: { data: EventRow[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
        <XAxis type="number" tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
        <YAxis type="category" dataKey="event_name" width={160} tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(15,23,42,0.95)', color: '#e2e8f0' }}
          labelStyle={{ color: '#f8fafc' }}
          itemStyle={{ color: '#f8fafc' }}
          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
        />
        <Bar dataKey="count" fill="var(--primary)" radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
