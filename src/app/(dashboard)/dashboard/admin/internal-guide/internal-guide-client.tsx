'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

type GuideSection = {
  id: string
  title: string
  body: string
  items?: Array<{
    title: string
    ref?: string
    summary: string
    lastModifiedAt?: string
    qualityWeight?: number
  }>
}

type ParsedGuideItem = {
  title: string
  ref?: string
  href?: string
  external?: boolean
  summary: string
  functionKey: string
  lastModifiedAt?: string
  qualityWeight?: number
}

type ChatSource = {
  id: string
  title: string
  ref: string
  score: number
  type: string
  snippet?: string
}

type ChatResponse = {
  answer: string
  sources: ChatSource[]
  intent?: string
  confidence?: number
  conservative?: boolean
}

const REPO_BLOB_BASE = 'https://github.com/richrothschild/startingmonday/blob/main/'

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(' ')
}

function reviewerLabelFromInternalRef(title: string, ref?: string): string {
  const normalizedTitle = title.toLowerCase()
  const normalizedRef = (ref ?? '').replace(/\\/g, '/').toLowerCase()

  if (normalizedTitle.includes('architecture') || normalizedRef.includes('architecture') || normalizedRef.includes('internal-system-summary')) {
    return 'System design and boundaries'
  }
  if (normalizedRef.startsWith('/login') || normalizedRef.startsWith('/signup') || normalizedRef.includes('/auth/') || normalizedRef.includes('staff') || normalizedRef.includes('security')) {
    return 'Access, identity, and permissions'
  }
  if (normalizedRef.startsWith('/dashboard/admin') || normalizedRef.includes('/admin/')) {
    return 'Admin operations and control surfaces'
  }
  if (normalizedRef.startsWith('/dashboard/') || normalizedRef.startsWith('/')) {
    return 'User workflow surfaces'
  }
  if (normalizedRef.startsWith('src/app/api/(ops)/admin/')) {
    return 'Admin automation and control endpoints'
  }
  if (normalizedRef.startsWith('src/app/api/(auth)/auth/') || normalizedRef.includes('/auth/')) {
    return 'Authentication and session endpoints'
  }
  if (normalizedRef.startsWith('src/app/api/')) {
    return 'Product and integration endpoints'
  }
  if (normalizedRef.startsWith('scripts/') && /(monitor|check|audit|guard|smoke|eval|report)/.test(normalizedRef)) {
    return 'Monitoring, QA, and release gates'
  }
  if (normalizedRef.startsWith('scripts/')) {
    return 'Operational automation and maintenance'
  }
  if (normalizedRef.startsWith('src/lib/')) {
    return 'Shared business logic and integrations'
  }
  if (normalizedRef.startsWith('supabase/migrations/')) {
    return 'Schema, policies, and data changes'
  }
  if (normalizedRef.startsWith('docs/')) {
    return 'Reference docs, runbooks, and decisions'
  }
  if (normalizedRef.startsWith('.github/workflows/')) {
    return 'CI, deployment, and scheduled operations'
  }

  return 'Core platform behavior'
}

function formatDate(value?: string): string {
  if (!value) return 'No timestamp available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No timestamp available'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function resolveInternalRef(ref?: string): { href?: string; external: boolean } {
  if (!ref) return { href: undefined, external: false }
  if (ref.startsWith('/')) return { href: ref, external: false }
  return { href: `${REPO_BLOB_BASE}${ref.replace(/^\/+/, '')}`, external: true }
}

function inferFunctionKey(title: string, ref?: string): string {
  const cleanedTitle = title.replace(/^(feature|api|code|script|doc|migration)\s+/i, '').trim()

  if (cleanedTitle.includes(' / ')) {
    const segments = cleanedTitle.split(' / ').map((segment) => segment.trim()).filter(Boolean)
    if (segments.length >= 2) return `${segments[0]} / ${segments[1]}`
    if (segments.length === 1) return segments[0]!
  }

  if (ref) {
    const normalized = ref.replace(/\\/g, '/').replace(/^\/+/, '')
    const reviewerLabel = reviewerLabelFromInternalRef(title, normalized)
    if (reviewerLabel) return reviewerLabel
    if (normalized.startsWith('src/app/api/')) {
      const seg = normalized.slice('src/app/api/'.length).split('/').filter(Boolean)
      return seg.length > 0 ? `API ${titleCase(seg[0]!)}` : 'API Core'
    }
    if (normalized.startsWith('src/app/')) {
      const seg = normalized.slice('src/app/'.length).split('/').filter(Boolean)
      return seg.length > 0 ? `App ${titleCase(seg[0]!.replace(/[()]/g, ''))}` : 'App Core'
    }
    if (normalized.startsWith('src/lib/')) return 'Lib Core'
    if (normalized.startsWith('scripts/')) return 'Automation Scripts'
    if (normalized.startsWith('docs/')) return 'Documentation'
    if (normalized.startsWith('supabase/migrations/')) return 'Data Migrations'
  }

  return reviewerLabelFromInternalRef(title, ref)
}

function parseInternalItems(section: GuideSection): ParsedGuideItem[] {
  if (section.items && section.items.length > 0) {
    return section.items.map((item) => {
      const link = resolveInternalRef(item.ref)
      return {
        title: item.title,
        ref: item.ref,
        href: link.href,
        external: link.external,
        summary: item.summary,
        functionKey: inferFunctionKey(item.title, item.ref),
        lastModifiedAt: item.lastModifiedAt,
        qualityWeight: item.qualityWeight,
      }
    })
  }

  const lines = section.body.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.map((line) => {
    const normalized = line.replace(/^[-*]\s+/, '').trim()
    const parts = normalized.split('|').map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 3) {
      const [title, ref, ...rest] = parts
      const link = resolveInternalRef(ref)
      return {
        title,
        ref,
        href: link.href,
        external: link.external,
        summary: rest.join(' | '),
        functionKey: inferFunctionKey(title, ref),
      }
    }

    if (parts.length === 2) {
      const [title, summary] = parts
      return {
        title,
        summary,
        functionKey: inferFunctionKey(title),
      }
    }

    return {
      title: normalized,
      summary: '',
      functionKey: inferFunctionKey(normalized),
    }
  })
}

export function InternalGuideClient({ sections, initialQuestion = '', staffRole, guideGeneratedAt = '' }: { sections: GuideSection[]; initialQuestion?: string; staffRole: string; guideGeneratedAt?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [question, setQuestion] = useState(initialQuestion)
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [activeFunctionKey, setActiveFunctionKey] = useState<string | null>(null)

  useEffect(() => {
    setActiveSectionId(searchParams.get('section'))
    setActiveFunctionKey(searchParams.get('function'))
  }, [searchParams])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return sections
    return sections.filter((section) => section.title.toLowerCase().includes(q) || section.body.toLowerCase().includes(q))
  }, [query, sections])

  const sectionDetails = useMemo(() => filtered.map((section) => {
    const items = parseInternalItems(section)
    const functionMap = new Map<string, ParsedGuideItem[]>()
    for (const item of items) {
      const list = functionMap.get(item.functionKey) ?? []
      list.push(item)
      functionMap.set(item.functionKey, list)
    }

    const functions = Array.from(functionMap.entries()).map(([functionKey, functionItems]) => ({
      functionKey,
      items: functionItems,
      summary: functionItems[0]?.summary || functionItems[0]?.title || 'No summary available.',
      lastModifiedAt: functionItems.map((item) => item.lastModifiedAt).filter((value): value is string => Boolean(value)).sort().at(-1),
      reviewScore: functionItems.reduce((sum, item) => sum + (item.qualityWeight ?? 1), 0),
    })).sort((a, b) => a.functionKey.localeCompare(b.functionKey))

    return { section, items, functions }
  }), [filtered])

  const activeSection = useMemo(() => {
    if (!activeSectionId) return sectionDetails[0] ?? null
    return sectionDetails.find((entry) => entry.section.id === activeSectionId) ?? sectionDetails[0] ?? null
  }, [activeSectionId, sectionDetails])

  const activeFunction = useMemo(() => {
    if (!activeSection) return null
    if (!activeFunctionKey) return activeSection.functions[0] ?? null
    return activeSection.functions.find((entry) => entry.functionKey === activeFunctionKey) ?? activeSection.functions[0] ?? null
  }, [activeFunctionKey, activeSection])

  const sectionRollup = useMemo(() => sectionDetails.map((entry) => ({
    id: entry.section.id,
    title: entry.section.title,
    sectionSummary: entry.section.body.split('\n').find((line) => line.trim())?.replace(/^[-*]\s*/, '').slice(0, 180) ?? 'No summary available.',
    itemCount: entry.items.length,
    functionCount: entry.functions.length,
  })), [sectionDetails])

  const allFunctions = useMemo(() => sectionDetails.flatMap((entry) => entry.functions.map((fn) => ({
    sectionId: entry.section.id,
    functionKey: fn.functionKey,
    summary: fn.summary,
    itemCount: fn.items.length,
    lastModifiedAt: fn.lastModifiedAt,
    reviewScore: fn.reviewScore,
  }))), [sectionDetails])

  const mostReviewed = useMemo(() => [...allFunctions].sort((a, b) => (b.reviewScore - a.reviewScore) || (b.itemCount - a.itemCount)).slice(0, 4), [allFunctions])
  const recentlyChanged = useMemo(() => [...allFunctions].filter((entry) => entry.lastModifiedAt).sort((a, b) => new Date(b.lastModifiedAt!).getTime() - new Date(a.lastModifiedAt!).getTime()).slice(0, 4), [allFunctions])

  function updateSelection(sectionId: string | null, functionKey: string | null) {
    setActiveSectionId(sectionId)
    setActiveFunctionKey(functionKey)
    const params = new URLSearchParams(searchParams.toString())
    if (sectionId) params.set('section', sectionId)
    else params.delete('section')
    if (functionKey) params.set('function', functionKey)
    else params.delete('function')
    router.replace(params.size > 0 ? `${pathname}?${params.toString()}` : pathname, { scroll: false })
  }

  async function askInternalChat() {
    const trimmed = question.trim()
    if (!trimmed || chatLoading) return
    setChatLoading(true)
    setChatError(null)
    try {
      const response = await fetch('/api/admin/internal-guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Internal guide chat is unavailable right now.')
      }
      const payload = (await response.json()) as ChatResponse
      setChatResult(payload)
    } catch (error) {
      setChatResult(null)
      setChatError(error instanceof Error ? error.message : 'Unable to get an answer right now.')
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans">
      <header className="bg-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-slate-400"><span className="text-white">Starting </span><span className="text-orange-500">Monday</span></span>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400 uppercase tracking-[0.12em]">{staffRole}</span>
            <Link href="/dashboard/admin" className="text-[13px] text-slate-300 hover:text-white transition-colors">Admin</Link>
            <Link href="/guide" className="text-[13px] text-slate-300 hover:text-white transition-colors">User Guide</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-slate-900">Starting Monday Internal Engineering Guide</h1>
          <p className="text-[13px] text-slate-500 mt-1">Admin/owner handbook organized as: section overview, then function-level drill-down inside each section.</p>
        </div>

        <section className="sticky top-4 z-20 bg-slate-950 text-slate-100 border border-slate-800 rounded-xl p-4 mb-6 shadow-lg">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">You are here</p>
              <p className="text-[14px] font-semibold text-white mt-1">Internal Guide{activeSection ? ` / ${activeSection.section.title}` : ''}{activeFunction ? ` / ${activeFunction.functionKey}` : ''}</p>
              <p className="text-[12px] text-slate-400 mt-1">{activeFunction?.summary ?? activeSection?.section.body.split('\n').find((line) => line.trim())?.replace(/^[-*]\s*/, '') ?? 'Choose a section to see its functions and source items.'}</p>
              <p className="text-[11px] text-slate-500 mt-2">Guide synced {formatDate(guideGeneratedAt)}</p>
            </div>
            {activeSection ? (
              <div className="lg:max-w-[45%]">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500 mb-2">Mini map</p>
                <div className="space-y-2">
                  {activeSection.functions.map((entry) => (
                    <button key={entry.functionKey} type="button" onClick={() => updateSelection(activeSection.section.id, entry.functionKey)} className={`w-full rounded-lg border px-3 py-2 text-left text-[12px] ${activeFunction?.functionKey === entry.functionKey ? 'border-orange-400 bg-orange-500/10 text-white' : 'border-slate-800 bg-slate-900 text-slate-200 hover:border-slate-700'}`}>
                      <p className="font-semibold">{entry.functionKey}</p>
                      <p className="mt-1 text-[11px] text-slate-300">Covers {entry.summary}.</p>
                      <p className="mt-1 text-[11px] text-slate-400">Why: this is the next drill-down when the section alone is too broad.</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded p-4 mb-6">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Audit shortcuts</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[12px] font-semibold text-slate-900 mb-2">Most reviewed</p>
              <div className="space-y-2">
                {mostReviewed.map((entry) => (
                  <button key={`${entry.sectionId}-${entry.functionKey}`} type="button" onClick={() => updateSelection(entry.sectionId, entry.functionKey)} className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-left hover:border-slate-400">
                    <p className="text-[12px] font-semibold text-slate-900">{entry.functionKey}</p>
                    <p className="text-[11px] text-slate-600 mt-1">Covers {entry.summary}.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Why: this is one of the highest-signal places to inspect first.</p>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-slate-900 mb-2">Recently changed</p>
              <div className="space-y-2">
                {recentlyChanged.map((entry) => (
                  <button key={`${entry.sectionId}-${entry.functionKey}-recent`} type="button" onClick={() => updateSelection(entry.sectionId, entry.functionKey)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-left hover:border-slate-400">
                    <p className="text-[12px] font-semibold text-slate-900">{entry.functionKey}</p>
                    <p className="text-[11px] text-slate-600 mt-1">Covers {entry.summary}.</p>
                    <p className="text-[11px] text-slate-500 mt-1">Why: updated {formatDate(entry.lastModifiedAt)}, so it is the freshest area to inspect.</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <p className="text-[12px] font-semibold text-slate-900 mb-2">Quick links</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <a href="/dashboard/admin/diagrams" className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-left hover:border-orange-400 hover:bg-orange-50 transition-colors">
                <p className="text-[12px] font-semibold text-slate-900">Architecture Diagrams</p>
                <p className="text-[11px] text-slate-600 mt-1">10 Mermaid diagrams covering auth, onboarding, billing, signals, integrations, and SRE.</p>
                <p className="text-[11px] text-orange-500 mt-1">View diagrams →</p>
              </a>
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded p-4 mb-6">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Level 1: Sections</p>
          <p className="text-[13px] text-slate-600 mb-3">Pick a section, then review the next level by function.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sectionRollup.map((entry) => (
              <button key={entry.id} type="button" onClick={() => updateSelection(entry.id, sectionDetails.find((detail) => detail.section.id === entry.id)?.functions[0]?.functionKey ?? null)} className={`text-left rounded border px-3 py-2 ${activeSection?.section.id === entry.id ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                <p className="text-[12px] font-semibold text-slate-900">{entry.title}</p>
                <p className="text-[12px] text-slate-500 mt-1">Covers {entry.sectionSummary}.</p>
                <p className="text-[11px] text-slate-500 mt-1">Why: use this when you want the broad overview before drilling into functions.</p>
                <p className="text-[11px] text-slate-500 mt-1">{entry.functionCount} functions · {entry.itemCount} items</p>
              </button>
            ))}
          </div>
        </section>

        {activeSection ? (
          <section className="bg-white border border-slate-200 rounded p-4 mb-6">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-3">Level 2: Functions in {activeSection.section.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeSection.functions.map((entry) => (
                <button key={entry.functionKey} type="button" onClick={() => updateSelection(activeSection.section.id, entry.functionKey)} className={`text-left rounded border px-3 py-2 ${activeFunction?.functionKey === entry.functionKey ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                  <p className="text-[12px] font-semibold text-slate-900">{entry.functionKey}</p>
                  <p className="text-[12px] text-slate-500 mt-1">Covers {entry.summary}.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Why: this groups the related items you would usually review together.</p>
                  <p className="text-[11px] text-slate-500 mt-1">{entry.items.length} items{entry.lastModifiedAt ? ` · updated ${formatDate(entry.lastModifiedAt)}` : ''}</p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        <div className="bg-slate-900 border border-slate-800 rounded p-4 sm:p-5 mb-6">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Internal Engineering Chat</p>
          <p className="text-[13px] text-slate-300 mb-3">Ask about internals: feature behavior, route handlers, scripts, migrations, or architecture links.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void askInternalChat() } }} placeholder="Example: Which route handles onboarding events and what tables does it touch?" className="w-full text-[14px] border border-slate-700 rounded px-3 py-2 bg-slate-950 text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-slate-500" />
            <button type="button" onClick={() => { void askInternalChat() }} disabled={chatLoading || !question.trim()} className="sm:w-auto px-4 py-2 text-[13px] font-semibold rounded bg-orange-500 text-black hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed">
              {chatLoading ? 'Searching...' : 'Ask'}
            </button>
          </div>

          {chatError ? <p className="text-[12px] text-rose-300 mt-3">{chatError}</p> : null}

          {chatResult ? (
            <div className="mt-4 p-4 rounded border border-slate-700 bg-slate-950">
              <p className="text-[13px] text-slate-200 whitespace-pre-wrap">{chatResult.answer}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">intent: {chatResult.intent ?? 'general'}</span>
                <span className="px-2 py-1 rounded bg-slate-800 text-slate-300">confidence: {Math.round((chatResult.confidence ?? 0) * 100)}%</span>
                {chatResult.conservative ? <span className="px-2 py-1 rounded bg-amber-900/30 text-amber-300">source-first mode</span> : null}
              </div>
              {chatResult.sources.length > 0 ? (
                <div className="mt-3 space-y-2">
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-slate-500">Internal Sources</p>
                  {chatResult.sources.map((source) => {
                    const link = resolveInternalRef(source.ref)
                    return (
                      <div key={source.id} className="text-[13px]">
                        {link.href ? <a href={link.href} target={link.external ? '_blank' : undefined} rel={link.external ? 'noopener noreferrer' : undefined} className="text-orange-300 hover:text-orange-200 hover:underline">{source.title}</a> : <p className="text-orange-300">{source.title}</p>}
                        <p className="text-[12px] text-slate-400">ref: {source.ref}</p>
                        {source.snippet ? <p className="text-[12px] text-slate-400">{source.snippet}</p> : null}
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="bg-white border border-slate-200 rounded p-4 mb-5">
          <label htmlFor="internal-guide-search" className="block text-[11px] font-bold tracking-[0.12em] uppercase text-slate-400 mb-2">Search internal guide sections</label>
          <input id="internal-guide-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search architecture, route names, modules, scripts, migrations, docs..." className="w-full text-[14px] border border-slate-300 rounded px-3 py-2 bg-white text-slate-900 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300" />
          <p className="text-[12px] text-slate-400 mt-2">Showing {filtered.length} of {sections.length} sections.</p>
        </div>

        {activeSection ? (
          <section className="bg-white border border-slate-200 rounded p-5">
            <h2 className="text-[18px] font-bold text-slate-900 mb-2">{activeSection.section.title}</h2>
            <p className="text-[13px] text-slate-600 mb-4">{activeFunction ? `Showing ${activeFunction.items.length} items for ${activeFunction.functionKey}.` : 'Select a function to inspect implementation details.'}</p>
            {activeFunction ? (
              <div className="space-y-3">
                {activeFunction.items.map((item, index) => (
                  <article key={`${item.title}-${index}`} className="rounded border border-slate-200 bg-slate-50 p-3">
                    {item.href ? <a href={item.href} target={item.external ? '_blank' : undefined} rel={item.external ? 'noopener noreferrer' : undefined} className="text-[13px] font-semibold text-slate-900 hover:text-slate-700 hover:underline">{item.title}</a> : <p className="text-[13px] font-semibold text-slate-900">{item.title}</p>}
                    {item.ref ? <p className="text-[12px] text-slate-500 mt-1">Covers {item.summary || 'the linked source item'}.</p> : null}
                    {item.ref ? <p className="text-[11px] text-slate-500 mt-1">Why: open this for the exact file or route referenced by the current function.</p> : null}
                    {item.ref ? <p className="text-[12px] text-slate-500 mt-1">{item.ref}</p> : null}
                    {item.summary ? <p className="text-[12px] text-slate-600 mt-1">{item.summary}</p> : null}
                    {item.lastModifiedAt ? <p className="text-[11px] text-slate-500 mt-2">Updated {formatDate(item.lastModifiedAt)}</p> : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        ) : (
          <div className="bg-white border border-slate-200 rounded p-5">
            <p className="text-[14px] font-semibold text-slate-900">No internal guide sections found for this search.</p>
            <p className="text-[13px] text-slate-600 mt-1">Try a broader keyword like architecture, api, script, migration, or dashboard.</p>
          </div>
        )}
      </main>
    </div>
  )
}

