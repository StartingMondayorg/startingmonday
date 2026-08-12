'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { FeatureDocCard } from '@/lib/feature-docs'

type FeatureChatSource = {
  slug: string
  title: string
  summary: string
  url: string
  score: number
  snippet: string
  category: 'features' | 'onboarding' | 'analysis'
  persona: 'executives' | 'coaches' | 'outplacement' | 'search-firms' | 'white-label' | 'cross-persona'
}

type FeatureChatResponse = {
  answer: string
  confidence: number
  sources: FeatureChatSource[]
}

const PERSONA_LABELS: Record<FeatureDocCard['persona'], string> = {
  executives: 'Executives',
  coaches: 'Executive Coaches',
  outplacement: 'Outplacement',
  'search-firms': 'Search Firms',
  'white-label': 'White Label',
  'cross-persona': 'Cross-Persona',
}

const CATEGORY_LABELS: Record<FeatureDocCard['category'], string> = {
  features: 'Feature Guides',
  onboarding: 'Quick Starts',
  analysis: 'Analysis',
}

function formatDate(value?: string): string {
  if (!value) return 'No timestamp'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No timestamp'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

export function FeaturesClient({ docs }: { docs: FeatureDocCard[] }) {
  const [query, setQuery] = useState('')
  const [persona, setPersona] = useState<'all' | FeatureDocCard['persona']>('all')
  const [category, setCategory] = useState<'all' | FeatureDocCard['category']>('all')
  const [chatQuestion, setChatQuestion] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [chatResult, setChatResult] = useState<FeatureChatResponse | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return docs.filter((doc) => {
      if (persona !== 'all' && doc.persona !== persona) return false
      if (category !== 'all' && doc.category !== category) return false
      if (!q) return true

      const haystack = `${doc.title} ${doc.summary} ${doc.filePath} ${doc.lastLine}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [category, docs, persona, query])

  const stats = useMemo(() => {
    const totalLines = docs.reduce((sum, doc) => sum + doc.lineCount, 0)
    const totalHeadings = docs.reduce((sum, doc) => sum + doc.headingCount, 0)
    return { totalDocs: docs.length, totalLines, totalHeadings }
  }, [docs])

  async function askChat() {
    const trimmed = chatQuestion.trim()
    if (!trimmed || chatLoading) return

    setChatLoading(true)
    setChatError(null)
    try {
      const response = await fetch('/api/features/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Feature chat is unavailable right now.')
      }
      const payload = (await response.json()) as FeatureChatResponse
      setChatResult(payload)
    } catch (error) {
      setChatResult(null)
      setChatError(error instanceof Error ? error.message : 'Unable to answer right now.')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(251,146,60,0.12),_transparent_30%),linear-gradient(180deg,_#020617_0%,_#0f172a_48%,_#111827_100%)] text-slate-100">
      <header className="border-b border-white/10 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-slate-300">
            <span className="text-white">Starting </span><span className="text-orange-500">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/learn-more" className="text-slate-300 hover:text-white">Learn more</Link>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_60px_rgba(2,6,23,0.42)] backdrop-blur-md sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-orange-500">Document Hub</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">Feature and onboarding docs</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-slate-300">
            Every one-pager is rendered from the source markdown with full section coverage. Use filters, search, and chat to find the right document quickly.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Documents</p>
              <p className="mt-1 text-xl font-semibold text-white">{stats.totalDocs}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Total lines</p>
              <p className="mt-1 text-xl font-semibold text-white">{stats.totalLines}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/45 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-slate-400">Headings audited</p>
              <p className="mt-1 text-xl font-semibold text-white">{stats.totalHeadings}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, summary, or file path"
              className="w-full rounded-lg border border-white/20 bg-slate-950/50 px-3 py-2 text-[14px] text-slate-100 placeholder:text-slate-400"
            />
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as typeof category)}
              aria-label="Filter by document category"
              className="rounded-lg border border-white/20 bg-slate-950/50 px-3 py-2 text-[14px] text-slate-100"
            >
              <option value="all">All categories</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Persona filters">
            {persona === 'all' ? (
              <button
                type="button"
                aria-pressed="true"
                onClick={() => setPersona('all')}
                className="whitespace-nowrap rounded-full border border-slate-900 bg-slate-900 px-3 py-1.5 text-[12px] font-semibold text-white"
              >
                All personas
              </button>
            ) : (
              <button
                type="button"
                aria-pressed="false"
                onClick={() => setPersona('all')}
                className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-slate-400"
              >
                All personas
              </button>
            )}
            {(Object.entries(PERSONA_LABELS) as Array<[FeatureDocCard['persona'], string]>).map(([value, label]) => (
              persona === value ? (
                <button
                  key={value}
                  type="button"
                  aria-pressed="true"
                  onClick={() => setPersona(value)}
                  className="whitespace-nowrap rounded-full border border-orange-500 bg-orange-500 px-3 py-1.5 text-[12px] font-semibold text-slate-950"
                >
                  {label}
                </button>
              ) : (
                <button
                  key={value}
                  type="button"
                  aria-pressed="false"
                  onClick={() => setPersona(value)}
                  className="whitespace-nowrap rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:border-slate-400"
                >
                  {label}
                </button>
              )
            ))}
          </div>

          <p className="mt-2 text-[12px] text-slate-400">Showing {filtered.length} of {docs.length} documents.</p>
        </section>

        <section id="chat" className="mt-5 rounded-2xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">Find with chat</p>
          <p className="mt-2 text-[13px] text-slate-300">Ask in plain language and get ranked docs with short summaries.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={chatQuestion}
              onChange={(event) => setChatQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  void askChat()
                }
              }}
              placeholder="Example: show me white-label setup and pricing"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-[14px] text-slate-100 placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={() => { void askChat() }}
              disabled={chatLoading || !chatQuestion.trim()}
              className="rounded-lg bg-orange-500 px-4 py-2 text-[13px] font-semibold text-slate-950 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {chatLoading ? 'Searching...' : 'Ask'}
            </button>
          </div>
          {chatError ? <p className="mt-2 text-[12px] text-rose-300">{chatError}</p> : null}
          {chatResult ? (
            <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900 p-4">
              <p className="text-[13px] whitespace-pre-wrap text-slate-200">{chatResult.answer}</p>
              <p className="mt-2 text-[11px] text-slate-400">Confidence: {Math.round(chatResult.confidence * 100)}%</p>
              <div className="mt-3 space-y-2">
                {chatResult.sources.map((source) => (
                  <article key={source.slug} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
                    <Link href={source.url} className="text-[13px] font-semibold text-orange-300 hover:text-orange-200 hover:underline">
                      {source.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-slate-300">{source.summary}</p>
                    <p className="mt-1 text-[11px] text-slate-500">{source.snippet}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((doc) => (
            <article key={doc.slug} className="rounded-2xl border border-white/10 bg-slate-950/45 p-4 shadow-[0_12px_38px_rgba(2,6,23,0.35)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] font-semibold text-slate-200">{CATEGORY_LABELS[doc.category]}</span>
                <span className="rounded-full bg-orange-500/15 px-2 py-1 text-[11px] font-semibold text-orange-300">{PERSONA_LABELS[doc.persona]}</span>
              </div>
              <h2 className="mt-2 text-lg font-bold text-white">
                <Link href={`/features/${doc.slug}`} className="hover:text-orange-200 hover:underline">{doc.title}</Link>
              </h2>
              <p className="mt-1 text-[14px] leading-relaxed text-slate-300">{doc.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-400">
                <span>{doc.lineCount} lines</span>
                <span>{doc.headingCount} headings</span>
                <span>Updated {formatDate(doc.updatedAt)}</span>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">Last line: {doc.lastLine}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
                <Link href={`/features/${doc.slug}`} className="font-semibold text-orange-300 hover:text-orange-200 hover:underline">Open document</Link>
                {doc.landingHref ? <Link href={doc.landingHref} className="text-slate-300 hover:text-white hover:underline">Related page</Link> : null}
              </div>
            </article>
          ))}
        </section>
      </main>
    </div>
  )
}
