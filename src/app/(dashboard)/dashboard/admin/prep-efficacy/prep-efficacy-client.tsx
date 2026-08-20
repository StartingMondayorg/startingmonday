'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type MonthlyRow = {
  month_start: string
  total_outcomes: number
  advanced_count: number
  offer_count: number
  rejected_count: number
  advance_rate_pct: number
  offer_rate_pct: number
}

export function PrepEfficacyClient() {
  const [rows, setRows] = useState<MonthlyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/reports/prep-efficacy/monthly?months=6', { cache: 'no-store' })
        const payload = await res.json().catch(() => ({})) as { rows?: MonthlyRow[]; error?: string }
        if (!res.ok) {
          if (!active) return
          setError(payload.error ?? `Request failed (${res.status})`)
          return
        }
        if (!active) return
        setRows(Array.isArray(payload.rows) ? payload.rows : [])
      } catch {
        if (!active) return
        setError('Failed to load prep efficacy report.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => { active = false }
  }, [])

  const summary = useMemo(() => {
    if (rows.length === 0) return null
    const total = rows.reduce((sum, row) => sum + row.total_outcomes, 0)
    const offers = rows.reduce((sum, row) => sum + row.offer_count, 0)
    const advanced = rows.reduce((sum, row) => sum + row.advanced_count, 0)
    const offerRate = total > 0 ? Math.round((offers / total) * 1000) / 10 : 0
    const advanceRate = total > 0 ? Math.round((advanced / total) * 1000) / 10 : 0
    return { total, offers, advanced, offerRate, advanceRate }
  }, [rows])

  if (loading) {
    return (
      <Card variant="default" className="p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Outcomes (6m)" value={summary.total} />
          <Stat label="Advanced" value={summary.advanced} />
          <Stat label="Offers" value={summary.offers} />
          <Stat label="Offer rate" value={`${summary.offerRate}%`} />
        </div>
      )}

      <Card variant="default" className="overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100">
          <p className="text-[12px] font-bold tracking-[0.12em] uppercase text-slate-500">Monthly rollup</p>
        </div>
        {rows.length === 0 ? (
          <p className="px-5 py-4 text-[13px] text-slate-500">No prep outcomes recorded yet.</p>
        ) : (
          <Table className="text-[13px]">
            <TableHeader className="bg-slate-50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-2 text-left font-semibold text-slate-500">Month</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-slate-500">Total</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-slate-500">Advanced</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-slate-500">Offers</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-slate-500">Rejected</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-slate-500">Advance rate</TableHead>
                <TableHead className="px-4 py-2 text-right font-semibold text-slate-500">Offer rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.month_start} className="border-b border-slate-100 last:border-0">
                  <TableCell className="px-4 py-2.5 text-slate-700">
                    {new Date(`${row.month_start}T12:00:00Z`).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                  </TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-slate-900 font-semibold">{row.total_outcomes}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-slate-700">{row.advanced_count}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-slate-700">{row.offer_count}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-slate-700">{row.rejected_count}</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-slate-700">{row.advance_rate_pct}%</TableCell>
                  <TableCell className="px-4 py-2.5 text-right text-slate-700">{row.offer_rate_pct}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card variant="default" className="p-4">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-400">{label}</p>
      <p className="mt-1 text-[22px] font-bold text-slate-900 leading-none">{value}</p>
    </Card>
  )
}
