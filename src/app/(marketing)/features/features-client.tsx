'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { FeatureDocCard } from '@/lib/feature-docs'
import { Badge, Button, Card, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, ToggleGroup, ToggleGroupItem } from '@/components/ui'
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-[13px] sm:text-[14px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </Link>
          <div className="flex items-center gap-4 text-[13px]">
            <Link href="/learn-more" className="text-muted-foreground hover:text-foreground">Learn more</Link>

          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <Card variant="glass" className="p-5 shadow-xl sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">Document Hub</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">Feature and onboarding docs</h1>
          <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-muted-foreground">
            Every one-pager is rendered from the source markdown with full section coverage. Use filters, search, and chat to find the right document quickly.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card variant="glass" className="bg-background/45 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Documents</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{stats.totalDocs}</p>
            </Card>
            <Card variant="glass" className="bg-background/45 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Total lines</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{stats.totalLines}</p>
            </Card>
            <Card variant="glass" className="bg-background/45 p-3">
              <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Headings audited</p>
              <p className="mt-1 text-xl font-semibold text-foreground">{stats.totalHeadings}</p>
            </Card>
          </div>
        </Card>

        <Card variant="glass" className="mt-5 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <Input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, summary, or file path"
              className="w-full rounded-lg border-border bg-background/50 text-[14px] text-foreground placeholder:text-muted-foreground"
            />
            <Select value={category} onValueChange={(value) => setCategory(value as typeof category)}>
              <SelectTrigger aria-label="Filter by document category" className="w-full rounded-lg border-border bg-background/50 text-[14px] text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ToggleGroup
            value={[persona]}
            onValueChange={(values) => { if (values[0]) setPersona(values[0] as typeof persona) }}
            className="mt-3 -mx-1 flex-nowrap justify-start gap-2 overflow-x-auto px-1 pb-1"
            aria-label="Persona filters"
          >
            <ToggleGroupItem
              value="all"
              className="whitespace-nowrap rounded-full border border-border bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground aria-pressed:border-border bg-card aria-pressed:bg-card aria-pressed:text-primary-foreground"
            >
              All personas
            </ToggleGroupItem>
            {(Object.entries(PERSONA_LABELS) as Array<[FeatureDocCard['persona'], string]>).map(([value, label]) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="whitespace-nowrap rounded-full border border-border bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground aria-pressed:border-primary/30 aria-pressed:bg-primary aria-pressed:text-primary-foreground"
              >
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <p className="mt-2 text-[12px] text-muted-foreground">Showing {filtered.length} of {docs.length} documents.</p>
        </Card>

        <Card variant="glass" id="chat" className="mt-5 bg-background p-4 sm:p-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Find with chat</p>
          <p className="mt-2 text-[13px] text-muted-foreground">Ask in plain language and get ranked docs with short summaries.</p>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Input
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
              className="w-full rounded-lg border-border bg-card text-[14px] text-foreground placeholder:text-muted-foreground"
            />
            <Button
              type="button"
              onClick={() => { void askChat() }}
              disabled={chatLoading || !chatQuestion.trim()}
              className="text-[13px]"
            >
              {chatLoading ? 'Searching...' : 'Ask'}
            </Button>
          </div>
          {chatError ? <p className="mt-2 text-[12px] text-destructive">{chatError}</p> : null}
          {chatResult ? (
            <Card variant="glass" className="mt-4 bg-card p-4">
              <p className="text-[13px] whitespace-pre-wrap text-foreground">{chatResult.answer}</p>
              <p className="mt-2 text-[11px] text-muted-foreground">Confidence: {Math.round(chatResult.confidence * 100)}%</p>
              <div className="mt-3 space-y-2">
                {chatResult.sources.map((source) => (
                  <Card key={source.slug} variant="glass" className="bg-background p-3">
                    <Link href={source.url} className="text-[13px] font-semibold text-primary hover:underline">
                      {source.title}
                    </Link>
                    <p className="mt-1 text-[12px] text-muted-foreground">{source.summary}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{source.snippet}</p>
                  </Card>
                ))}
              </div>
            </Card>
          ) : null}
        </Card>

        <section className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((doc) => (
            <Card key={doc.slug} variant="glass" className="bg-background/45 p-4 shadow-lg">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-muted px-2 py-1 text-[11px] font-semibold text-foreground">{CATEGORY_LABELS[doc.category]}</Badge>
                <Badge className="bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">{PERSONA_LABELS[doc.persona]}</Badge>
              </div>
              <h2 className="mt-2 text-lg font-bold text-foreground">
                <Link href={`/features/${doc.slug}`} className="hover:text-primary hover:underline">{doc.title}</Link>
              </h2>
              <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{doc.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
                <span>{doc.lineCount} lines</span>
                <span>{doc.headingCount} headings</span>
                <span>Updated {formatDate(doc.updatedAt)}</span>
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground">Last line: {doc.lastLine}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[13px]">
                <Link href={`/features/${doc.slug}`} className="font-semibold text-primary hover:underline">Open document</Link>
                {doc.landingHref ? <Link href={doc.landingHref} className="text-muted-foreground hover:text-foreground hover:underline">Related page</Link> : null}
              </div>
            </Card>
          ))}
        </section>
      </main>
    </div>
  )
}
