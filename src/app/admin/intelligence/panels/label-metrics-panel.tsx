// Epic E2 T2.6: Label metrics dashboard panels
// Shows: label coverage (% companies with >= 1 labeled outcome),
// label latency (median days from signal to label),
// role openings by source/family/sector breakdown.

'use client'

import { useEffect, useState } from 'react'
import { Alert, AlertDescription, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui'
interface LabelStats {
  totalCompanies: number
  companiesWithLabels: number
  coveragePercent: number
  medianDaysToOpening: number | null
  openingsBySource: Array<{ source: string; count: number }>
  openingsByFamily: Array<{ family: string; count: number }>
  openingsBySector: Array<{ sector: string; count: number }>
  lastUpdated: string
}

interface SourceBreakdown {
  source_key: string
  total_openings: number
  median_days_to_opening: number | null
  hit_rate: number
}

export function LabelMetricsPanel() {
  const [stats, setStats] = useState<LabelStats | null>(null)
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdown[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/admin/intelligence/label-metrics')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        const data = await response.json()
        setStats(data.stats)
        setSourceBreakdown(data.sourceBreakdown || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        console.error('label-metrics: fetch failed', err)
      } finally {
        setLoading(false)
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 60000) // Refresh every 60s
    return () => clearInterval(interval)
  }, [refreshKey])

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse h-48 bg-muted rounded" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p className="font-medium">Error loading label metrics</p>
          <p className="text-sm mt-1">{error}</p>
        </AlertDescription>
      </Alert>
    )
  }

  if (!stats) {
    return <div className="text-muted-foreground">No label data available yet</div>
  }

  const coverageStatus = stats.coveragePercent >= 60 ? 'pass' : stats.coveragePercent >= 40 ? 'warn' : 'fail'
  const coverageVariant = {
    pass: 'success' as const,
    warn: 'warning' as const,
    fail: 'destructive' as const,
  }[coverageStatus]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Label Coverage & Latency</h2>
        <Button size="sm" variant="secondary" onClick={handleRefresh}>
          Refresh
        </Button>
      </div>

      {/* Coverage Card */}
      <Alert variant={coverageVariant} className="p-6">
        <AlertDescription className="flex items-end justify-between text-current">
          <div>
            <p className="text-sm font-medium opacity-75">Label Coverage</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-4xl font-bold text-current">{stats.coveragePercent.toFixed(1)}%</span>
              <span className="text-lg opacity-75">({stats.companiesWithLabels} / {stats.totalCompanies})</span>
            </div>
            <p className="text-xs mt-2 opacity-75">Companies with {'\u2265'} 1 labeled outcome</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-semibold text-current">
              {coverageStatus === 'pass' ? '✓ On Track' : coverageStatus === 'warn' ? '⚠ Monitor' : '✗ Backlog'}
            </p>
            <p className="text-xs mt-1 opacity-75">Target: {'\u2265'} 60%</p>
          </div>
        </AlertDescription>
      </Alert>

      {/* Latency Card */}
      <Alert variant="info" className="p-6">
        <AlertDescription className="text-current">
          <p className="text-sm font-medium">Median Label Latency</p>
          <div className="mt-2 flex items-baseline gap-2">
            {stats.medianDaysToOpening !== null ? (
              <>
                <span className="text-4xl font-bold text-current">{stats.medianDaysToOpening.toFixed(0)}</span>
                <span className="text-lg">days before opening</span>
              </>
            ) : (
              <span className="text-lg italic">No labeled outcomes yet</span>
            )}
          </div>
          <p className="text-xs mt-2">Signal-to-label detection latency (precursor quality)</p>
        </AlertDescription>
      </Alert>

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* By Source */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">By Source</h3>
          <div className="space-y-2">
            {stats.openingsBySource.length > 0 ? (
              stats.openingsBySource.map((row) => (
                <div key={row.source} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{row.source}</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">{row.count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No data</p>
            )}
          </div>
        </Card>

        {/* By Role Family */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">By Role Family</h3>
          <div className="space-y-2">
            {stats.openingsByFamily.length > 0 ? (
              stats.openingsByFamily.map((row) => (
                <div key={row.family} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{row.family}</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">{row.count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No data</p>
            )}
          </div>
        </Card>

        {/* By Sector */}
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">By Sector (Top 5)</h3>
          <div className="space-y-2">
            {stats.openingsBySector.slice(0, 5).length > 0 ? (
              stats.openingsBySector.slice(0, 5).map((row) => (
                <div key={row.sector} className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground truncate">{row.sector}</span>
                  <span className="font-mono bg-muted px-2 py-1 rounded text-foreground">{row.count}</span>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm italic">No data</p>
            )}
          </div>
        </Card>
      </div>

      {/* Source Details Table */}
      {sourceBreakdown.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold text-foreground mb-3">Source Details (Last 24h)</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Openings</TableHead>
                <TableHead className="text-right">Hit Rate</TableHead>
                <TableHead className="text-right">Median Days</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sourceBreakdown.map((row) => (
                <TableRow key={row.source_key}>
                  <TableCell>{row.source_key}</TableCell>
                  <TableCell className="text-right font-mono">{row.total_openings}</TableCell>
                  <TableCell className="text-right font-mono">
                    {(row.hit_rate * 100).toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.median_days_to_opening !== null ? row.median_days_to_opening.toFixed(0) : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Footer */}
      <div className="text-xs text-muted-foreground pt-2">
        Last updated: {new Date(stats.lastUpdated).toLocaleString()}
      </div>
    </div>
  )
}
