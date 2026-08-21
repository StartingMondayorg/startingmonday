'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Alert, AlertDescription, Button, Card, Input, Label } from '@/components/ui'
type GuideSection = {
  id: string
  title: string
  body: string
  items?: Array<{
    title: string
    url?: string
    summary: string
    lastModifiedAt?: string
    qualityWeight?: number
  }>
}

type ParsedGuideItem = {
  title: string
  url?: string
  summary: string
  functionKey: string
  lastModifiedAt?: string
  qualityWeight?: number
}

type ChatSource = {
  id: string
  title: string
  url: string
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
  queryId?: string | null
}

function titleCase(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).map((word) => word.slice(0, 1).toUpperCase() + word.slice(1)).join(' ')
}

function reviewerLabelFromGuideUrl(title: string, url?: string): string {
  const normalizedTitle = title.toLowerCase()
  const normalizedUrl = (url ?? '').replace(/\\/g, '/').toLowerCase()

  if (normalizedUrl === '/guide' || normalizedTitle.includes('guide') || normalizedTitle.includes('help')) {
    return 'Guide, help, and self-serve support'
  }
  if (normalizedUrl.startsWith('/dashboard/start') || normalizedUrl.startsWith('/dashboard/profile') || normalizedUrl.includes('/companies/new')) {
    return 'Onboarding and setup workflows'
  }
  if (normalizedUrl.startsWith('/dashboard/')) {
    return 'Daily execution and dashboard workflows'
  }
  if (normalizedUrl.startsWith('/api/')) {
    return 'Automation and integration endpoints'
  }
  if (normalizedUrl.startsWith('/blog/')) {
    return 'Research, coaching, and market reading'
  }
  if (normalizedUrl.startsWith('/for-') || normalizedUrl.startsWith('/partners') || normalizedUrl.startsWith('/coaches-guide')) {
    return 'Partner and persona review pages'
  }
  if (normalizedUrl.startsWith('/executives') || normalizedUrl.startsWith('/coaches')) {
    return 'Persona journeys and audience hubs'
  }
  if (normalizedTitle.includes('security') || normalizedTitle.includes('terms') || normalizedTitle.includes('unsubscribe')) {
    return 'Trust, account, and policy surfaces'
  }

  return 'Core product pathways'
}

function formatDate(value?: string): string {
  if (!value) return 'No timestamp available'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'No timestamp available'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function inferFunctionKey(title: string, url?: string): string {
  const cleanedTitle = title.replace(/^(feature|how-to|api|article)\s+/i, '').trim()
  if (cleanedTitle.includes(' / ')) {
    const segments = cleanedTitle.split(' / ').map((segment) => segment.trim()).filter(Boolean)
    if (segments.length >= 2) return `${segments[0]} / ${segments[1]}`
    if (segments.length === 1) return segments[0]!
  }
  if (url) {
    const normalized = url.replace(/\\/g, '/').trim()
    const reviewerLabel = reviewerLabelFromGuideUrl(title, normalized)
    if (reviewerLabel) return reviewerLabel
    if (normalized.startsWith('/api/')) {
      const seg = normalized.slice('/api/'.length).split('/').filter(Boolean)
      return seg.length > 0 ? `API ${titleCase(seg[0]!)}` : 'API Core'
    }
    if (normalized.startsWith('/dashboard/')) {
      const seg = normalized.slice('/dashboard/'.length).split('/').filter(Boolean)
      return seg.length > 0 ? `Dashboard ${titleCase(seg[0]!)}` : 'Dashboard Core'
    }
    if (normalized.startsWith('/')) {
      const seg = normalized.slice(1).split('/').filter(Boolean)
      return seg.length > 0 ? titleCase(seg[0]!) : 'Guide Core'
    }
  }
  return reviewerLabelFromGuideUrl(title, url)
}

function parseGuideItems(section: GuideSection): ParsedGuideItem[] {
  if (section.items && section.items.length > 0) {
    return section.items.map((item) => ({
      title: item.title,
      url: item.url,
      summary: item.summary,
      functionKey: inferFunctionKey(item.title, item.url),
      lastModifiedAt: item.lastModifiedAt,
      qualityWeight: item.qualityWeight,
    }))
  }

  const lines = section.body.split('\n').map((line) => line.trim()).filter(Boolean)
  return lines.map((line) => {
    const markdownLink = line.match(/^[-*]\s*\[([^\]]+)\]\(([^)]+)\)\s*-?\s*(.*)$/)
    if (markdownLink) {
      const [, title, url, summary] = markdownLink
      return { title, url, summary: summary ?? '', functionKey: inferFunctionKey(title, url) }
    }
    const normalized = line.replace(/^[-*]\s+/, '').trim()
    const parts = normalized.split('|').map((part) => part.trim()).filter(Boolean)
    if (parts.length >= 2) {
      const [title, ...rest] = parts
      return { title, summary: rest.join(' | '), functionKey: inferFunctionKey(title) }
    }
    return { title: normalized, summary: '', functionKey: inferFunctionKey(normalized) }
  })
}

export function GuideClient({ sections, initialQuestion = '', guideGeneratedAt = '' }: { sections: GuideSection[]; initialQuestion?: string; guideGeneratedAt?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [question, setQuestion] = useState(initialQuestion)
  const [chatResult, setChatResult] = useState<ChatResponse | null>(null)
  const [chatError, setChatError] = useState<string | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [feedbackState, setFeedbackState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [feedbackNote, setFeedbackNote] = useState('')
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
    const items = parseGuideItems(section)
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

  const sectionRollup = useMemo(() => sectionDetails.map((entry) => ({
    id: entry.section.id,
    title: entry.section.title,
    sectionSummary: entry.section.body.split('\n').find((line) => line.trim())?.replace(/^[-*]\s*/, '').slice(0, 180) ?? 'No summary available.',
    functionCount: entry.functions.length,
    itemCount: entry.items.length,
  })), [sectionDetails])

  const activeSection = useMemo(() => {
    if (!activeSectionId) return sectionDetails[0] ?? null
    return sectionDetails.find((entry) => entry.section.id === activeSectionId) ?? sectionDetails[0] ?? null
  }, [activeSectionId, sectionDetails])

  const activeFunction = useMemo(() => {
    if (!activeSection) return null
    if (!activeFunctionKey) return activeSection.functions[0] ?? null
    return activeSection.functions.find((entry) => entry.functionKey === activeFunctionKey) ?? activeSection.functions[0] ?? null
  }, [activeFunctionKey, activeSection])

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

  async function askGuideChat() {
    const trimmed = question.trim()
    if (!trimmed || chatLoading) return
    setChatLoading(true)
    setChatError(null)
    try {
      const response = await fetch('/api/guide/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: trimmed }),
      })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error ?? 'Guide chat is unavailable right now.')
      }
      const payload = (await response.json()) as ChatResponse
      setChatResult(payload)
      setFeedbackState('idle')
      setFeedbackNote('')
    } catch (error) {
      setChatResult(null)
      setChatError(error instanceof Error ? error.message : 'Unable to get an answer right now.')
    } finally {
      setChatLoading(false)
    }
  }

  async function sendFeedback(rating: 'helpful' | 'not_helpful') {
    if (!chatResult?.queryId || feedbackState === 'sending') return
    setFeedbackState('sending')
    try {
      const response = await fetch('/api/guide/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: chatResult.queryId, rating, note: feedbackNote.trim() || undefined }),
      })
      if (!response.ok) throw new Error('feedback failed')
      setFeedbackState('sent')
    } catch {
      setFeedbackState('error')
    }
  }

  return (
    <div className="min-h-screen bg-muted font-sans">
      <header className="dark bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground"><span className="text-foreground">Starting </span><span className="text-primary">Monday</span></span>
          <div className="flex items-center gap-4">
            <Link href="/dashboard/help" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Help</Link>
            <Link href="/features" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Features Docs</Link>
            <Link href="/dashboard" className="text-[13px] text-muted-foreground hover:text-foreground transition-colors">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="mb-6">
          <h1 className="text-[28px] font-bold text-foreground">Starting Monday Career Guide</h1>
          <p className="text-[13px] text-muted-foreground mt-1">Find features fast with two levels: section summaries first, then function-level items when you select a section.</p>
        </div>

        <Card className="dark sticky top-4 z-20 !bg-background !text-foreground p-4 mb-6 shadow-lg">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">You are here</p>
              <p className="text-[14px] font-semibold text-foreground mt-1">Career Guide{activeSection ? ` / ${activeSection.section.title}` : ''}{activeFunction ? ` / ${activeFunction.functionKey}` : ''}</p>
              <p className="text-[12px] text-muted-foreground mt-1">{activeFunction?.summary ?? activeSection?.section.body.split('\n').find((line) => line.trim())?.replace(/^[-*]\s*/, '') ?? 'Choose a section to see the next level of guide content.'}</p>
              <p className="text-[11px] text-muted-foreground mt-2">Guide synced {formatDate(guideGeneratedAt)}</p>
            </div>
            {activeSection ? (
              <div className="lg:max-w-[45%]">
                <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Mini map</p>
                <div className="space-y-2">
                  {activeSection.functions.map((entry) => (
                    <Button
                      key={entry.functionKey}
                      type="button"
                      onClick={() => updateSelection(activeSection.section.id, entry.functionKey)}
                      className={`h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-lg px-3 py-2 text-left text-[12px] ${activeFunction?.functionKey === entry.functionKey ? '!border-primary/30 !bg-primary/10 !text-foreground' : '!border-border !bg-card !text-foreground hover:!border-border'}`}
                    >
                      <p className="font-semibold">{entry.functionKey}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Covers {entry.summary}.</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Why: this is the next drill-down when the section alone is too broad.</p>
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </Card>

        <Card className="p-4 mb-5">
          <Label htmlFor="guide-search" className="block text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Search all guide sections</Label>
          <Input id="guide-search" type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search features, onboarding steps, APIs, and articles..." className="w-full text-[14px]" />
          <p className="text-[12px] text-muted-foreground mt-2">Showing {filtered.length} of {sections.length} sections.</p>
        </Card>

        <Card className="dark !bg-card p-4 sm:p-5 mb-6">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Career Guide Chat</p>
          <p className="text-[13px] text-muted-foreground mb-3">Ask anything about features, setup, workflows, or articles. You will get an answer plus source links.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input id="guide-chat" type="text" value={question} onChange={(e) => setQuestion(e.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void askGuideChat() } }} placeholder="Example: How do I get started and set up my profile?" className="w-full text-[14px] !border-border !bg-background !text-foreground placeholder:!text-muted-foreground" />
            <Button type="button" onClick={() => { void askGuideChat() }} disabled={chatLoading || !question.trim()} className="sm:w-auto">
              {chatLoading ? 'Searching...' : 'Ask'}
            </Button>
          </div>
          {chatError ? (
            <Alert variant="destructive" className="mt-3">
              <AlertDescription>{chatError}</AlertDescription>
            </Alert>
          ) : null}
          {chatResult ? (
            <div className="mt-4 p-4 rounded border border-border bg-background">
              <p className="text-[13px] text-foreground whitespace-pre-wrap">{chatResult.answer}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="px-2 py-1 rounded bg-muted text-muted-foreground">intent: {chatResult.intent ?? 'general'}</span>
                <span className="px-2 py-1 rounded bg-muted text-muted-foreground">confidence: {Math.round((chatResult.confidence ?? 0) * 100)}%</span>
                {chatResult.conservative ? <span className="px-2 py-1 rounded bg-warning/10 text-warning">source-first mode</span> : null}
              </div>
              {chatResult.sources.length > 0 ? (
                <div className="mt-3 space-y-1">
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Sources</p>
                  {chatResult.sources.map((source) => (
                    <div key={source.id}>
                      <a href={source.url} className="block text-[13px] text-primary hover:underline">{source.title}</a>
                      {source.snippet ? <p className="text-[12px] text-muted-foreground">{source.snippet}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              {chatResult.queryId ? (
                <div className="mt-4 pt-3 border-t border-border">
                  <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Was this helpful?</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" size="sm" onClick={() => { void sendFeedback('helpful') }} disabled={feedbackState === 'sending' || feedbackState === 'sent'} className="!bg-success !text-success-foreground hover:!bg-success/90">Helpful</Button>
                    <Button type="button" size="sm" variant="secondary" onClick={() => { void sendFeedback('not_helpful') }} disabled={feedbackState === 'sending' || feedbackState === 'sent'} className="!bg-muted !text-foreground hover:!bg-muted/90">Not helpful</Button>
                    <Input type="text" value={feedbackNote} onChange={(event) => setFeedbackNote(event.target.value)} placeholder="Optional: what was missing?" className="min-w-[240px] flex-1 text-[12px] !border-border !bg-card !text-foreground placeholder:!text-muted-foreground" />
                  </div>
                  {feedbackState === 'sent' ? <p className="text-[11px] text-success mt-2">Thanks. Feedback captured.</p> : null}
                  {feedbackState === 'error' ? <p className="text-[11px] text-destructive mt-2">Could not save feedback right now.</p> : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </Card>

        <Card className="p-4 mb-6">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Audit shortcuts</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">Most reviewed</p>
              <div className="space-y-2">
                {mostReviewed.map((entry) => (
                  <Button
                    key={`${entry.sectionId}-${entry.functionKey}`}
                    type="button"
                    variant="outline"
                    onClick={() => updateSelection(entry.sectionId, entry.functionKey)}
                    className="h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-lg px-3 py-2 text-left !border-border !bg-muted"
                  >
                    <p className="text-[12px] font-semibold text-foreground">{entry.functionKey}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Covers {entry.summary}.</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Why: this is one of the highest-signal places to inspect first.</p>
                  </Button>
                ))}
                </div>
            </div>
            <div>
              <p className="text-[12px] font-semibold text-foreground mb-2">Recently changed</p>
              <div className="space-y-2">
                {recentlyChanged.map((entry) => (
                  <Button
                    key={`${entry.sectionId}-${entry.functionKey}-recent`}
                    type="button"
                    variant="outline"
                    onClick={() => updateSelection(entry.sectionId, entry.functionKey)}
                    className="h-auto w-full flex-col items-start gap-0 whitespace-normal rounded-lg px-3 py-2 text-left !border-border !bg-card"
                  >
                    <p className="text-[12px] font-semibold text-foreground">{entry.functionKey}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Covers {entry.summary}.</p>
                    <p className="text-[11px] text-muted-foreground mt-1">Why: updated {formatDate(entry.lastModifiedAt)}, so it is the freshest area to inspect.</p>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 mb-6">
          <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Level 1: Sections</p>
          {sectionRollup.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {sectionRollup.map((entry) => (
                <Button
                  key={entry.id}
                  type="button"
                  variant="outline"
                  onClick={() => updateSelection(entry.id, sectionDetails.find((detail) => detail.section.id === entry.id)?.functions[0]?.functionKey ?? null)}
                  className={`h-auto w-full flex-col items-start gap-0 whitespace-normal rounded px-3 py-2 text-left ${activeSection?.section.id === entry.id ? '!border-primary/30 !bg-primary/10' : '!border-border hover:!border-border !bg-card'}`}
                >
                  <p className="text-[12px] font-semibold text-foreground">{entry.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">Covers {entry.sectionSummary}.</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Why: use this when you want the broad overview before drilling into functions.</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{entry.functionCount} functions · {entry.itemCount} items</p>
                </Button>
              ))}
            </div>
          ) : <p className="text-[12px] text-muted-foreground">No sections match this search yet. Clear search to browse all guide sections.</p>}
        </Card>

        {activeSection ? (
          <Card className="p-4 mb-6">
            <p className="text-[11px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-3">Level 2: Functions in {activeSection.section.title}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeSection.functions.map((entry) => (
                <Button
                  key={entry.functionKey}
                  type="button"
                  variant="outline"
                  onClick={() => updateSelection(activeSection.section.id, entry.functionKey)}
                  className={`h-auto w-full flex-col items-start gap-0 whitespace-normal rounded px-3 py-2 text-left ${activeFunction?.functionKey === entry.functionKey ? '!border-primary/30 !bg-primary/10' : '!border-border hover:!border-border !bg-card'}`}
                >
                  <p className="text-[12px] font-semibold text-foreground">{entry.functionKey}</p>
                  <p className="text-[12px] text-muted-foreground mt-1">Covers {entry.summary}.</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Why: this groups the related items you would usually review together.</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{entry.items.length} items{entry.lastModifiedAt ? ` · updated ${formatDate(entry.lastModifiedAt)}` : ''}</p>
                </Button>
              ))}
            </div>
          </Card>
        ) : null}

        {activeSection && activeFunction ? (
          <Card className="p-5">
            <h2 className="text-[18px] font-bold text-foreground mb-2">{activeSection.section.title}</h2>
            <p className="text-[13px] text-muted-foreground mb-4">{activeFunction.functionKey} · {activeFunction.items.length} items</p>
            <div className="space-y-3">
              {activeFunction.items.map((item, index) => (
                <article key={`${item.title}-${index}`} className="rounded border border-border bg-muted p-3">
                  {item.url ? <a href={item.url} className="text-[13px] font-semibold text-foreground hover:text-muted-foreground hover:underline">{item.title}</a> : <p className="text-[13px] font-semibold text-foreground">{item.title}</p>}
                  {item.url ? <p className="text-[12px] text-muted-foreground mt-1">Covers {item.summary || 'the linked guide item'}.</p> : null}
                  {item.url ? <p className="text-[11px] text-muted-foreground mt-1">Why: open this for the exact page or step referenced by the current function.</p> : null}
                  {item.url ? <p className="text-[12px] text-muted-foreground mt-1">{item.url}</p> : null}
                  {item.summary ? <p className="text-[12px] text-muted-foreground mt-1">{item.summary}</p> : null}
                  {item.lastModifiedAt ? <p className="text-[11px] text-muted-foreground mt-2">Updated {formatDate(item.lastModifiedAt)}</p> : null}
                </article>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-5">
            <p className="text-[14px] font-semibold text-foreground">No guide sections found for this search.</p>
            <p className="text-[13px] text-muted-foreground mt-1">Try a broader keyword like onboarding, profile, companies, briefing, or outreach.</p>
          </Card>
        )}
      </main>
    </div>
  )
}

