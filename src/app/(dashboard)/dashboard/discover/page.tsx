'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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

function scoreBadge(score?: number) {
  if (typeof score !== 'number') return 'bg-slate-100 text-slate-500'
  if (score >= 80) return 'bg-emerald-100 text-emerald-800'
  if (score >= 60) return 'bg-amber-100 text-amber-800'
  return 'bg-rose-100 text-rose-800'
}

function fitBadge(fit: number) {
  if (fit >= 8) return 'bg-green-100 text-green-800'
  if (fit >= 6) return 'bg-amber-50 text-amber-700'
  return 'bg-slate-100 text-slate-500'
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
    <div className="min-h-screen bg-slate-100 font-sans">

      <header className="bg-slate-900">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </span>
          <div className="flex items-center gap-5">
            <Link
              href="/dashboard/companies/new"
              className="text-[12px] font-semibold text-slate-400 border border-slate-700 rounded px-3 py-1 hover:border-slate-500 transition-colors whitespace-nowrap"
            >
              Add manually
            </Link>
            <Link href="/dashboard" className="text-[13px] text-slate-300 hover:text-white transition-colors whitespace-nowrap">
              &larr; Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
<div className="mb-6">
          <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-orange-500 mb-1">Company Discovery</div>
          <h1 className="text-[26px] font-bold text-slate-900 leading-tight">Discover Companies</h1>
          <p className="text-[13px] text-slate-500 mt-1">
            {seedMode
              ? 'Showing companies similar to your seeds. Reset to go back to profile-based suggestions.'
              : 'AI-suggested targets based on your profile and search goals.'}
          </p>
        </div>

        {/* Seed input */}
        <div className="bg-white border border-slate-200 rounded p-4 mb-6">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em] mb-2">
            Find companies similar to
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={seedInput}
              onChange={e => setSeedInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleFindSimilar()}
              placeholder="ServiceNow, Workday, Salesforce (comma-separated)"
              className="flex-1 border border-slate-200 rounded px-3 py-2 text-[13px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
            />
            <div className="flex gap-2 shrink-0">
              <button
                onClick={handleFindSimilar}
                disabled={loading || !seedInput.trim()}
                className="bg-slate-900 hover:bg-slate-700 disabled:opacity-40 text-white text-[13px] font-semibold px-4 py-2 rounded transition-colors cursor-pointer border-0 whitespace-nowrap"
              >
                Find similar
              </button>
              {seedMode && (
                <button
                  onClick={handleReset}
                  className="text-[13px] font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded transition-colors cursor-pointer border-0 whitespace-nowrap"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Added banner */}
        {addedCount > 0 && (
          <div className="mb-6 px-5 py-3 rounded bg-green-50 border border-green-200 text-[13px] text-green-800 flex items-center justify-between gap-4">
            <span>
              {addedCount} {addedCount === 1 ? 'company' : 'companies'} added to your pipeline.
            </span>
            <Link href="/dashboard" className="font-semibold underline shrink-0">
              View pipeline &rarr;
            </Link>
          </div>
        )}

        {/* Cards */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded p-4 animate-pulse">
                <div className="flex items-start justify-between mb-2">
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                  <div className="h-5 bg-slate-100 rounded w-10 ml-2 shrink-0" />
                </div>
                <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-slate-100 rounded w-full mb-1.5" />
                <div className="h-3 bg-slate-100 rounded w-4/5 mb-1.5" />
                <div className="h-3 bg-slate-100 rounded w-2/3 mb-4" />
                <div className="h-8 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-slate-500 mb-4">{error}</p>
            <button
              onClick={() => fetchSuggestions()}
              className="text-[13px] font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded transition-colors cursor-pointer border-0"
            >
              Try again
            </button>
          </div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[14px] text-slate-500 mb-2">No suggestions returned.</p>
            <p className="text-[13px] text-slate-400 mb-4">Complete your profile to improve results.</p>
            <Link href="/dashboard/profile" className="text-[13px] font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded transition-colors">
              Go to profile &rarr;
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map(co => {
                const isAdded = added.has(co.name)
                const isAdding = adding.has(co.name)
                return (
                  <div key={co.name} className="bg-white border border-slate-200 rounded p-4 flex flex-col">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="text-[15px] font-bold text-slate-900 leading-tight">{co.name}</span>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${fitBadge(co.fit)}`}>
                        {co.fit}/10
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 uppercase tracking-[0.08em] font-semibold mb-2">
                      {co.sector}
                    </div>
                    <p className="text-[13px] text-slate-600 leading-relaxed flex-1 mb-4">{co.why}</p>
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreBadge(co.signalFreshnessScore)}`}>
                        Signal freshness {co.signalFreshnessScore ?? '--'}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${scoreBadge(co.provenanceCoverage)}`}>
                        Provenance coverage {co.provenanceCoverage ?? '--'}
                      </span>
                    </div>
                    {co.narrativeUrl && (
                      <Link
                        href={co.narrativeUrl}
                        className="mb-3 inline-block text-[12px] font-semibold text-slate-700 hover:text-slate-900 underline"
                      >
                        Why this company and who to contact &rarr;
                      </Link>
                    )}
                    <button
                      onClick={() => handleAdd(co)}
                      disabled={isAdded || isAdding}
                      className={`w-full text-[12px] font-semibold py-2 rounded transition-colors cursor-pointer border-0 ${
                        isAdded
                          ? 'bg-green-50 text-green-700 cursor-default'
                          : isAdding
                            ? 'bg-slate-100 text-slate-400 cursor-default'
                            : 'bg-slate-900 hover:bg-slate-700 text-white'
                      }`}
                    >
                      {isAdded ? '✓ Added' : isAdding ? 'Adding...' : '+ Add to watchlist'}
                    </button>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => seedMode
                  ? fetchSuggestions(seedInput.split(',').map(s => s.trim()).filter(Boolean))
                  : fetchSuggestions()
                }
                disabled={loading}
                className="text-[13px] text-slate-400 hover:text-slate-600 bg-transparent border-0 cursor-pointer disabled:opacity-40"
              >
                Regenerate suggestions &rarr;
              </button>
            </div>
          </>
        )}

      </main>
    </div>
  )
}

