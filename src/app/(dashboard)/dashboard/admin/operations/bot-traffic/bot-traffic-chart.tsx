'use client'
import {
  Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'

type Point = {
  bucket: string
  totalRequests: number
  botRequests: number
}

function hourLabel(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('en-US', { month: 'numeric', day: 'numeric', hour: 'numeric' })
}

export function BotTrafficChart({ data }: { data: Point[] }) {
  // Human traffic is the remainder, not a separate measure. Deriving it here
  // keeps the two series summing to the total the stat cards report.
  const points = data.map((point) => ({
    label: hourLabel(point.bucket),
    human: Math.max(0, point.totalRequests - point.botRequests),
    bot: point.botRequests,
  }))

  if (points.length === 0) {
    return (
      <div className="h-[240px] flex items-center justify-center text-[13px] text-muted-foreground">
        No requests recorded yet.
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={points} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#cbd5e1' }}
          axisLine={false}
          tickLine={false}
          minTickGap={40}
        />
        <YAxis tick={{ fontSize: 11, fill: '#cbd5e1' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(15,23,42,0.95)', color: '#e2e8f0' }}
          labelStyle={{ color: '#f8fafc' }}
          itemStyle={{ color: '#f8fafc' }}
          cursor={{ stroke: 'rgba(255,255,255,0.18)' }}
        />
        <Legend wrapperStyle={{ fontSize: 12, color: '#cbd5e1' }} />
        <Area
          type="monotone"
          dataKey="human"
          name="Human"
          stackId="traffic"
          stroke="#64748b"
          fill="#475569"
          fillOpacity={0.5}
        />
        <Area
          type="monotone"
          dataKey="bot"
          name="Suspected bot"
          stackId="traffic"
          stroke="#fb923c"
          fill="#fb923c"
          fillOpacity={0.55}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
