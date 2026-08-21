'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Alert, AlertDescription, Badge, Button, Card, Input, Skeleton } from '@/components/ui'
type DiscoveryCompany = {
  id?: string
  narrativeUrl?: string
  name: string
  sector: string
  why: string
  fit: number
  signalFreshnessScore?: number
  provenanceCoverage?: number
  keySignals?: string[]
  keyAttributes?: string[]
  suggestedPeople?: Array<{
    name: string
    title: string
    reason: string
    source: 'anthropic' | 'fallback'
    confidence: number
  }>
}

function scoreVariant(score?: number): 'secondary' | 'success' | 'warning' | 'destructive' {
  if (typeof score !== 'number') return 'secondary'
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  return 'destructive'
}

function fitVariant(fit: number): 'success' | 'warning' | 'secondary' {
  if (fit >= 8) return 'success'
  if (fit >= 6) return 'warning'
  return 'secondary'
}

export default function DiscoverPage() {
  const [companies, setCompanies] = useState<DiscoveryCompany[]>([])
  const [loading, setLoading] = useState(true)
  const [seedInput, setSeedInput] = useState('')
  const [seedMode, setSeedMode] = useState(false)
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState<Set<string>>(new Set())
  const [addedCount, setAddedCount] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const fetchSuggestions = useCallback(async (seeds: string[] = []) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seeds.length ? { seeds } : {}),
      })
      if (!res.ok) throw new Error('fetch failed')
      const data = await res.json()
      setCompanies(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not load suggestions. Check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  async function handleAdd(co: DiscoveryCompany) {
    if (added.has(co.name) || adding.has(co.name)) return
    setAdding(prev => new Set([...prev, co.name]))
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: co.name, sector: co.sector, fit_score: co.fit, source: 'discover_card' }),
      })
      if (res.ok || res.status === 409) {
        setAdded(prev => new Set([...prev, co.name]))
        setAddedCount(c => c + 1)
      }
    } finally {
      setAdding(prev => { const s = new Set(prev); s.delete(co.name); return s })
    }
  }

  function handleFindSimilar() {
    const seeds = seedInput.split(',').map(s => s.trim()).filter(Boolean).slice(0, 5)
    if (!seeds.length) return
    setSeedMode(true)
    fetchSuggestions(seeds)
  }

  function handleReset() {
    setSeedInput('')
    setSeedMode(false)
    fetchSuggestions()
  }

  return (
    <div className="min-h-screen bg-muted font-sans">

      <header className="dark bg-card">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-5">
            <Button
              variant="outline"
              className="border-border text-[12px] font-semibold text-muted-foreground whitespace-nowrap"
              render={<Link href="/dashboard/companies/new" />}
            >
              Add manually
            </Button>
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-primary mb-1">Company Discovery</div>
          <h1 className="text-[26px] font-bold text-foreground leading-tight">Discover Companies</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            {seedMode
              ? 'Showing companies similar to your seeds. Reset to go back to profile-based suggestions.'
              : 'AI-suggested targets based on your profile and search goals.'}
          </p>
        </div>

        {/* Seed input */}
        <Card className="p-4 mb-6">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[0.08em] mb-2">
            Find companies similar to
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              value={seedInput}
              onChange={e => setSeedInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFindSimilar()}
              placeholder="ServiceNow, Workday, Salesforce (comma-separated)"
              className="flex-1 text-[13px] text-foreground placeholder:text-muted-foreground"
            />
            <div className="flex gap-2 shrink-0">
              <Button
                onClick={handleFindSimilar}
                disabled={loading || !seedInput.trim()}
                className="text-[13px] font-semibold whitespace-nowrap"
              >
                Find similar
              </Button>
              {seedMode && (
                <Button
                  variant="secondary"
                  onClick={handleReset}
                  className="text-[13px] font-semibold whitespace-nowrap"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Added banner */}
        {addedCount > 0 && (
          <Alert variant="success" className="mb-6 px-5 py-3 flex items-center justify-between gap-4">
            <AlertDescription className="text-[13px]">
              {addedCount} {addedCount === 1 ? 'company' : 'companies'} added to your pipeline.
            </AlertDescription>
            <Link href="/dashboard" className="font-semibold underline shrink-0 text-[13px]">
              View pipeline &rarr;
            </Link>
          </Alert>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-5 w-10 ml-2 shrink-0" />
                </div>
                <Skeleton className="h-3 w-1/3 mb-3" />
                <Skeleton className="h-3 w-full mb-1.5" />
                <Skeleton className="h-3 w-4/5 mb-1.5" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <Skeleton className="h-8 w-full" />
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <Alert variant="destructive" className="inline-flex mb-4 px-4 py-2">
              <AlertDescription className="text-[14px]">{error}</AlertDescription>
            </Alert>
            <div>
              <Button variant="secondary" onClick={() => fetchSuggestions()} className="text-[13px] font-semibold">
                Try again
              </Button>
            </div>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-muted-foreground mb-2">No suggestions returned.</p>
            <p className="text-[13px] text-muted-foreground mb-4">Complete your profile to improve results.</p>
            <Button variant="secondary" className="text-[13px] font-semibold" render={<Link href="/dashboard/profile" />}>
              Go to profile &rarr;
            </Button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(co => {
                const isAdded = added.has(co.name)
                const isAdding = adding.has(co.name)
                return (
                  <Card key={co.name} className="p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[15px] font-bold text-foreground leading-tight">{co.name}</span>
                      <Badge variant={fitVariant(co.fit)} className="shrink-0">
                        {co.fit}/10
                      </Badge>
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-[0.08em] font-semibold mb-2">
                      {co.sector}
                    </div>
                    <p className="text-[13px] text-muted-foreground leading-relaxed flex-1 mb-4">{co.why}</p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <Badge variant={scoreVariant(co.signalFreshnessScore)}>
                        Signal freshness {co.signalFreshnessScore ?? '--'}
                      </Badge>
                      <Badge variant={scoreVariant(co.provenanceCoverage)}>
                        Provenance coverage {co.provenanceCoverage ?? '--'}
                      </Badge>
                    </div>
                    {co.narrativeUrl && (
                      <Link
                        href={co.narrativeUrl}
                        className="mb-3 inline-block text-[12px] font-semibold text-muted-foreground hover:text-foreground underline"
                      >
                        Why this company and who to contact &rarr;
                      </Link>
                    )}
                    <Button
                      variant={isAdded || isAdding ? 'secondary' : 'default'}
                      onClick={() => handleAdd(co)}
                      disabled={isAdded || isAdding}
                      className="w-full text-[12px] font-semibold"
                    >
                      {isAdded ? '✓ Added' : isAdding ? 'Adding...' : '+ Add to watchlist'}
                    </Button>
                  </Card>
                )
              })}
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="ghost"
                onClick={() => seedMode
                  ? fetchSuggestions(seedInput.split(',').map(s => s.trim()).filter(Boolean))
                  : fetchSuggestions()
                }
                disabled={loading}
                className="text-[13px] text-muted-foreground"
              >
                Regenerate suggestions &rarr;
              </Button>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
