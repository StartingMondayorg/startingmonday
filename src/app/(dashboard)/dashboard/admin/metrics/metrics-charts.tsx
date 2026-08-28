'use client'
import { useState } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts'
import { GROUP_COLORS, GROUP_LABELS, type ScoreGroup } from '@/lib/action-scores'
import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ToggleGroup, ToggleGroupItem } from '@/components/ui'
export type WeekRow = {
  week: string
  onboarding: number
  pipeline: number
  intelligence: number
  signals: number
  communication: number
  profile: number
}

export type EventDetail = {
  event_name: string
  label: string
  count30d: number
  count7d: number
  emotion: number
  cognitive_load: number
  retention: number
  composite: number
}

const GROUPS: ScoreGroup[] = [
  'onboarding', 'pipeline', 'intelligence', 'signals', 'communication', 'profile',
]

function ScoreBadge({ value, highGood }: { value: number; highGood: boolean }) {
  const good = highGood ? value >= 8 : value <= 3
  const mid  = highGood ? value >= 5 : value <= 6
  return (
    <Badge variant={good ? 'success' : mid ? 'warning' : 'destructive'}>
      {value}
    </Badge>
  )
}

export function MetricsCharts({
  weeklyData,
  groupDetails,
}: {
  weeklyData: WeekRow[]
  groupDetails: Record<string, EventDetail[]>
}) {
  const [selected, setSelected] = useState<ScoreGroup | null>(null)

  const details = selected ? (groupDetails[selected] ?? []) : []

  return (
    <div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={weeklyData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 4, border: '1px solid #e2e8f0' }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          {GROUPS.map(g => (
            <Line
              key={g}
              type="monotone"
              dataKey={g}
              name={GROUP_LABELS[g]}
              stroke={GROUP_COLORS[g]}
              strokeWidth={selected === null || selected === g ? 2 : 0.5}
              strokeOpacity={selected === null || selected === g ? 1 : 0.25}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      <ToggleGroup
        variant="outline"
        className="flex-wrap mt-4 mb-5"
        value={selected ? [selected] : ['all']}
        onValueChange={(values) => {
          const next = values[0]
          setSelected(!next || next === 'all' ? null : (next as ScoreGroup))
        }}
      >
        <ToggleGroupItem value="all" className="text-[11px] font-semibold">
          All groups
        </ToggleGroupItem>
        {GROUPS.map(g => (
          <ToggleGroupItem
            key={g}
            value={g}
            style={selected === g ? { borderColor: GROUP_COLORS[g], color: GROUP_COLORS[g] } : undefined}
            className="text-[11px] font-semibold"
          >
            {GROUP_LABELS[g]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      {selected && (
        <div className="border-t border-border pt-5">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase mb-3" style={{ color: GROUP_COLORS[selected] }}>
            {GROUP_LABELS[selected]} - event breakdown
          </p>
          {details.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No events recorded for this group yet.</p>
          ) : (
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold text-muted-foreground">Action</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">30d</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">7d</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Emotion</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Cog load</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Retention</TableHead>
                  <TableHead className="font-semibold text-muted-foreground text-right">Composite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...details].sort((a, b) => b.composite - a.composite).map(row => (
                  <TableRow key={row.event_name} className={row.count30d === 0 ? 'opacity-40' : ''}>
                    <TableCell className="text-muted-foreground font-medium">{row.label}</TableCell>
                    <TableCell className="text-right font-semibold text-foreground">{row.count30d}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{row.count7d}</TableCell>
                    <TableCell className="text-right"><ScoreBadge value={row.emotion} highGood /></TableCell>
                    <TableCell className="text-right"><ScoreBadge value={row.cognitive_load} highGood={false} /></TableCell>
                    <TableCell className="text-right"><ScoreBadge value={row.retention} highGood /></TableCell>
                    <TableCell className="text-right font-bold text-foreground">{row.composite}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
