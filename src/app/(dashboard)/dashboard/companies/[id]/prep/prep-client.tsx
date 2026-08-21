'use client'
import Link from 'next/link'
import { useState, useRef, useEffect, useMemo } from 'react'
import { usePostHog } from 'posthog-js/react'
import { getRelevantResources, getDefaultResources, type Resource } from '@/lib/resources'
import {
  PREP_PROVENANCE_VERSION,
  buildPrepClaimProvenance,
  type ClaimOriginClass,
} from '@/lib/prep/prep-provenance'
import { formatPrepConfidenceForUser, scorePrepBriefConfidence } from '@/lib/prep/prep-confidence'
import { PMF_EVENTS } from '@/lib/pmf-event-taxonomy'
import { type PrepRoleMode } from '@/lib/prep/prep-role-modes'
import { BriefRating } from '@/app/(dashboard)/dashboard/_components/BriefRating'
import { Skeleton } from '@/app/(dashboard)/dashboard/_components/Skeleton'
import type { InterviewStage } from '@/lib/ai/prompts'
import {
  DEFAULT_INTERVIEW_STAGE,
  inferInitialRoleMode,
  ROLE_MODE_OPTIONS,
  STAGE_OPTIONS,
} from './prep-config'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, Input, ScrollArea, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
function PulsingDots({ dotClassName = 'w-1.5 h-1.5', className = '' }: { dotClassName?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Skeleton className={`${dotClassName} rounded-full`} />
      <Skeleton className={`${dotClassName} rounded-full [animation-delay:150ms]`} />
      <Skeleton className={`${dotClassName} rounded-full [animation-delay:300ms]`} />
    </span>
  )
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((part, i) => i % 2 === 1 ? <strong key={i}>{part}</strong> : part)}
    </>
  )
}

function normalizePrepDisplayText(text: string) {
  return text
    .replace(/\u00e2\u20ac\u00a2\s*/g, '- ')
    .replace(/\u00e2\u20ac\u201d\s*/g, ' - ')
    .replace(/\u00e2\u20ac\u201c\s*/g, ' - ')
    .replace(/\u00e2\u20ac\u2122/g, "'")
    .replace(/\u00e2\u20ac\u0153|\u00e2\u20ac\u009c/g, '"')
    .replace(/\u00e2\u20ac\u009d|\u00e2\u20ac\u009d/g, '"')
    .replace(/\u00e2\u20ac\u00a6/g, '...')
}

function normalizeClaimText(line: string) {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

type TraceFilter = ClaimOriginClass | 'all'

type ClaimOriginCounts = Record<ClaimOriginClass, number>

function originClassLabel(originClass: ClaimOriginClass) {
  if (originClass === 'user_provided') return 'User Provided'
  if (originClass === 'system_detected') return 'System Detected'
  return 'Inferred'
}

function originClassClassName(originClass: ClaimOriginClass) {
  if (originClass === 'user_provided') return 'bg-success/10 text-success border-success/30'
  if (originClass === 'system_detected') return 'bg-info/10 text-info border-info/30'
  return 'bg-warning/10 text-warning border-warning/30'
}

function buildClaimOriginLookup(text: string): Record<string, ClaimOriginClass> {
  const lookup: Record<string, ClaimOriginClass> = {}
  const claims = buildPrepClaimProvenance(text)
  for (const claim of claims) {
    lookup[claim.claimText] = claim.originClass
  }
  return lookup
}

function buildClaimOriginCounts(text: string): ClaimOriginCounts {
  const counts: ClaimOriginCounts = {
    user_provided: 0,
    system_detected: 0,
    inferred: 0,
  }
  const claims = buildPrepClaimProvenance(text)
  for (const claim of claims) {
    counts[claim.originClass] += 1
  }
  return counts
}

function TraceLabel({
  originClass,
  onClick,
}: {
  originClass: ClaimOriginClass
  onClick?: () => void
}) {
  const label = originClassLabel(originClass)
  const badge = (
    <Badge
      className={`${originClassClassName(originClass)} ${onClick ? 'cursor-pointer hover:brightness-95 transition' : ''}`}
      title={onClick ? `Trace source: ${label}. Click to filter.` : `Trace source: ${label}`}
      aria-label={`Trace source ${label}`}
    >
      {label}
    </Badge>
  )
  if (onClick) {
    return (
      <Button
        type="button"
        variant="ghost"
        onClick={onClick}
        className="h-auto rounded-4xl p-0 bg-transparent"
      >
        {badge}
      </Button>
    )
  }
  return badge
}

function SourceLegend({
  traceFilter,
  counts,
  onChangeFilter,
}: {
  traceFilter: TraceFilter
  counts: ClaimOriginCounts
  onChangeFilter: (next: TraceFilter) => void
}) {
  const totalClaims = counts.user_provided + counts.system_detected + counts.inferred
  const buttons: Array<{ key: TraceFilter; label: string; count: number }> = [
    { key: 'all', label: 'All Claims', count: totalClaims },
    { key: 'user_provided', label: 'User Provided', count: counts.user_provided },
    { key: 'system_detected', label: 'System Detected', count: counts.system_detected },
    { key: 'inferred', label: 'Inferred', count: counts.inferred },
  ]
  return (
    <div className="mb-5 rounded border border-border bg-muted/40 p-3">
      <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Source Legend</p>
      <ToggleGroup
        value={[traceFilter]}
        onValueChange={(values) => { const next = values[0] as TraceFilter | undefined; if (next) onChangeFilter(next) }}
        className="flex-wrap gap-2 mb-2"
      >
        {buttons.map((button) => (
          <ToggleGroupItem
            key={button.key}
            value={button.key}
            className={`h-auto gap-1 rounded border px-2 py-1 text-[10px] font-semibold tracking-[0.04em] uppercase transition-colors ${
              traceFilter === button.key
                ? 'bg-primary text-primary-foreground border-primary/30'
                : 'bg-muted/40 text-primary-foreground border-border hover:border-border'
            }`}
          >
            <span>{button.label}</span>
            <span className={`rounded px-1.5 py-[1px] ${traceFilter === button.key ? 'bg-muted text-foreground' : 'bg-muted/60 text-muted-foreground'}`}>
              {button.count}
            </span>
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <div className="flex flex-wrap gap-2">
        <TraceLabel originClass="user_provided" />
        <TraceLabel originClass="system_detected" />
        <TraceLabel originClass="inferred" />
      </div>
    </div>
  )
}

function renderBrief(
  text: string,
  traceFilter: TraceFilter,
  onTraceLabelClick: (originClass: ClaimOriginClass) => void,
) {
  const normalizedText = normalizePrepDisplayText(text)
  const claimOriginLookup = buildClaimOriginLookup(normalizedText)
  return normalizedText.split('\n').map((line, i) => {
    if (line.startsWith('# ')) return null
    if (line.trim() === '---' || line.trim() === '***') return null
    if (line.startsWith('## ')) {
      return (
        <h2 key={i} className="text-[11px] font-bold tracking-[0.1em] uppercase text-muted-foreground mt-10 mb-4 first:mt-0 pb-2 border-b border-border">
          {line.slice(3)}
        </h2>
      )
    }
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const claimText = normalizeClaimText(line)
      const originClass = claimOriginLookup[claimText] ?? 'inferred'
      if (traceFilter !== 'all' && originClass !== traceFilter) return null
      return (
        <div key={i} className="mb-3">
          <div className="mb-1.5">
            <TraceLabel originClass={originClass} onClick={() => onTraceLabelClick(originClass)} />
          </div>
          <div className="flex gap-2.5 text-[14px] text-muted-foreground leading-relaxed">
          <span className="text-muted-foreground shrink-0 select-none mt-0.5">-</span>
          <BoldText text={line.slice(2)} />
          </div>
        </div>
      )
    }
    if (line.trim() === '') return <div key={i} className="h-1.5" />
    const claimText = normalizeClaimText(line)
    const originClass = claimOriginLookup[claimText] ?? 'inferred'
    if (traceFilter !== 'all' && originClass !== traceFilter) return null
    return (
      <div key={i} className="mb-3">
        <div className="mb-1.5">
          <TraceLabel originClass={originClass} onClick={() => onTraceLabelClick(originClass)} />
        </div>
        <p className="text-[14px] text-muted-foreground leading-relaxed mb-0">
          <BoldText text={line} />
        </p>
      </div>
    )
  })
}

function extractSection(text: string, section: string): string {
  const pattern = new RegExp(`##\\s+${section.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\n([\\s\\S]*?)(?:\\n##\\s+|$)`, 'i')
  const match = text.match(pattern)
  return match?.[1]?.trim() ?? ''
}

function buildTonightView(text: string): string {
  const bottomLine = extractSection(text, 'Bottom Line')
  const pushback = extractSection(text, 'Anticipated Pushback')
  const likelyQuestions = extractSection(text, 'Likely Questions')
  const close = extractSection(text, 'How to Close')

  const blocks: string[] = ['## Tonight Brief']

  if (bottomLine) {
    blocks.push('## Bottom Line')
    blocks.push(bottomLine)
  }

  if (pushback) {
    blocks.push('## Top Pushbacks')
    const lines = pushback.split('\n').filter((line) => line.trim()).slice(0, 8)
    blocks.push(lines.join('\n'))
  }

  if (likelyQuestions) {
    blocks.push('## Likely Questions')
    const lines = likelyQuestions.split('\n').filter((line) => line.trim()).slice(0, 10)
    blocks.push(lines.join('\n'))
  }

  if (close) {
    blocks.push('## How to Close')
    blocks.push(close)
  }

  return blocks.join('\n\n')
}

function ResourcePanel({ brief }: { brief: string }) {
  const resources: Resource[] = brief.length > 0
    ? getRelevantResources(brief, 3)
    : getDefaultResources(2)

  if (resources.length === 0) return null

  return (
    <Card variant="glass" className="p-6 mb-4">
      <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-4">
        Further Reading
      </p>
      <div className="flex flex-col gap-3">
        {resources.map(r => (
          <a
            key={r.url + r.title}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 no-underline"
          >
            <div className="min-w-0">
              <div className="text-[13px] font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                {r.title}
                <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">{r.source} ↗</span>
              </div>
              <div className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{r.description}</div>
            </div>
          </a>
        ))}
      </div>
    </Card>
  )
}

async function streamResponse(res: Response, onChunk: (text: string) => void) {
  if (!res.body) throw new Error('No body')
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    onChunk(decoder.decode(value, { stream: true }))
  }
}

// The server appends an __ERROR__ marker when the model stream fails.
// It can arrive mid-stream (after partial content), not only at position 0.
function splitStreamError(fullText: string): { text: string; error: string | null } {
  const idx = fullText.indexOf('__ERROR__')
  if (idx < 0) return { text: fullText, error: null }
  return { text: fullText.slice(0, idx).trimEnd(), error: fullText.slice(idx + 9).trim() || 'Generation failed' }
}

async function saveBrief(
  type: string,
  text: string,
  companyId?: string,
  sectionName?: string,
  attributionContextIds?: string[],
): Promise<string | null> {
  try {
    const isPrepType = type === 'prep' || type === 'prep_section'
    const claimProvenance = isPrepType ? buildPrepClaimProvenance(text) : undefined
    const useAttributionV2 = isPrepType && (attributionContextIds?.length ?? 0) > 0
    const res = await fetch('/api/briefs/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        text,
        company_id: companyId,
        section_name: sectionName,
        provenance_version: isPrepType ? (useAttributionV2 ? 2 : PREP_PROVENANCE_VERSION) : undefined,
        claim_provenance: claimProvenance,
        attributionContextIds: useAttributionV2 ? attributionContextIds : undefined,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    return data.id ?? null
  } catch {
    return null
  }
}

function useOnDemand(url: string, companyId: string, sectionName: string) {
  const [content, setContent] = useState('')
  const [briefId, setBriefId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [groundingMode, setGroundingMode] = useState<'grounded' | 'pattern' | null>(null)
  const [evidenceCount, setEvidenceCount] = useState<number | null>(null)

  async function generate() {
    setLoading(true)
    setContent('')
    setBriefId(null)
    setError('')
    setGroundingMode(null)
    setEvidenceCount(null)
    try {
      const res = await fetch(url)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? `Request failed (${res.status})`)
        return
      }
      const mode = res.headers.get('x-prep-grounding-mode')
      setGroundingMode(mode === 'grounded' || mode === 'pattern' ? mode : null)
      const countRaw = res.headers.get('x-prep-evidence-count')
      const parsedCount = Number(countRaw)
      setEvidenceCount(Number.isFinite(parsedCount) ? parsedCount : null)
      let fullText = ''
      await streamResponse(res, chunk => { fullText += chunk; setContent(fullText) })
      const { text: cleanText, error: streamError } = splitStreamError(fullText)
      if (streamError) {
        setError(streamError)
        setContent(cleanText) // keep any partial content instead of discarding it
      } else {
        const id = await saveBrief('prep_section', cleanText, companyId, sectionName)
        setBriefId(id)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return { content, briefId, loading, error, groundingMode, evidenceCount, generate }
}

function OnDemandPanel({
  title,
  description,
  content,
  briefId,
  loading,
  error,
  onGenerate,
  groundingMode,
  evidenceCount,
  addEvidenceHref,
  traceFilter,
  onTraceLabelClick,
  onLegendFilter,
}: {
  title: string
  description: string
  content: string
  briefId: string | null
  loading: boolean
  error: string
  onGenerate: () => void
  groundingMode?: 'grounded' | 'pattern' | null
  evidenceCount?: number | null
  addEvidenceHref?: string
  traceFilter: TraceFilter
  onTraceLabelClick: (originClass: ClaimOriginClass) => void
  onLegendFilter: (next: TraceFilter) => void
}) {
  const claimOriginCounts = useMemo(() => buildClaimOriginCounts(content), [content])
  return (
    <Card variant="glass" className="gap-0 p-0 mb-4">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div>
          <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">{title}</p>
          {!content && !loading && (
            <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={onGenerate}
          disabled={loading}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          {loading ? 'Generating…' : content ? 'Regenerate' : 'Generate'}
        </Button>
      </div>
      {loading && !content && (
        <div className="px-6 py-5">
          <PulsingDots />
        </div>
      )}
      {error && !content && (
        <div className="px-6 py-4 text-[13px] text-destructive">{error}</div>
      )}
      {(content || (loading && content)) && (
        <div className="px-6 py-5">
          {groundingMode === 'pattern' && (
            <Alert variant="warning" className="mb-4 px-4 py-3">
              <AlertTitle className="text-[10px] tracking-[0.12em] uppercase">Pattern Analysis, Not Verified Intel</AlertTitle>
              <AlertDescription className="mt-1 text-[12px] leading-relaxed">
                This section used limited evidence{typeof evidenceCount === 'number' ? ` (${evidenceCount} source${evidenceCount === 1 ? '' : 's'})` : ''}.
                Add notes, documents, contacts, or fresh signals and regenerate for company-verified specificity.
              </AlertDescription>
              <div className="mt-2">
                <Button
                  variant="outline"
                  className="text-[11px] text-warning border-warning/40 hover:bg-warning/20"
                  render={<Link href={addEvidenceHref ?? '#'} />}
                >
                  Add evidence
                </Button>
              </div>
            </Alert>
          )}
          <SourceLegend
            traceFilter={traceFilter}
            counts={claimOriginCounts}
            onChangeFilter={onLegendFilter}
          />
          {renderBrief(content, traceFilter, onTraceLabelClick)}
          {loading && (
            <span className="inline-block w-0.5 h-4 bg-muted animate-pulse ml-0.5 align-middle" />
          )}
          {!loading && (
            <p className="mt-5 pt-3 border-t border-border text-[11px] text-muted-foreground">
              AI-generated - use as input, not advice. Verify facts before any conversation.
            </p>
          )}
        </div>
      )}
      {briefId && !loading && content && (
        <div className="px-6 pb-4 flex justify-end">
          <BriefRating briefId={briefId} />
        </div>
      )}
    </Card>
  )
}

const NO_NOTES_MESSAGES: Record<string, string> = {
  coo:       'COO briefs require operational context. Add notes on the specific challenge this company is navigating - what phase, what broke, what the CEO cannot do alone.',
  ciso:      'CISO briefs improve significantly with sector and regulatory context. Add notes on recent events in their space, board security posture, or why the role opened.',
  cpo:       'CPO briefs improve with product context. Add notes on the current product situation - engagement vs acquisition problem, what created this opening.',
  cdo_data:  'CDO briefs need data mandate context. Add notes on the company data maturity and whether this is a governance or analytics mandate.',
  cdo_digital: 'Chief Digital Officer briefs improve with transformation context. Add notes on the digital agenda and internal dynamics.',
  cto:       'CTO briefs improve with engineering context. Add notes on tech debt posture, team maturity, and what triggered this search.',
  cio:       'CIO briefs improve with transformation context. Add notes on the agenda, the current CIO situation, and board technology appetite.',
}

export function PrepClient({
  companyId,
  companyName,
  companyStage,
  stageLabel,
  hasContacts,
  hasNotes,
  hasInterviewNotes,
  roleType,
  hasCareerHistory,
  hasResume = false,
  hasPositioning,
  hasTargetTitles,
  profileScore,
  firstCompany = false,
  initialStage,
}: {
  companyId: string
  companyName: string
  companyStage: string
  stageLabel: string
  hasContacts: boolean
  hasNotes: boolean
  hasInterviewNotes: boolean
  roleType: string | null
  hasCareerHistory: boolean
  hasResume?: boolean
  hasPositioning: boolean
  hasTargetTitles: boolean
  profileScore: number
  firstCompany?: boolean
  initialStage?: InterviewStage
}) {
  const [brief, setBrief] = useState('')
  const [briefId, setBriefId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refineInput, setRefineInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [postingUrl, setPostingUrl] = useState('')
  const [interviewStage, setInterviewStage] = useState<InterviewStage>(
    initialStage ?? DEFAULT_INTERVIEW_STAGE[companyStage] ?? 'executive_interview'
  )
  const [roleMode, setRoleMode] = useState<PrepRoleMode>(inferInitialRoleMode(roleType))
  const [outreachDraft, setOutreachDraft] = useState('')
  const [outreachLoading, setOutreachLoading] = useState(false)
  const [outreachError, setOutreachError] = useState('')
  const [outreachCopied, setOutreachCopied] = useState(false)
  const [outreachLogged, setOutreachLogged] = useState(false)
  const [outreachLogLoading, setOutreachLogLoading] = useState(false)
  const [lowConfidenceAcknowledged, setLowConfidenceAcknowledged] = useState(false)
  const [reviewedBriefId, setReviewedBriefId] = useState<string | null>(null)
  const [markingReviewed, setMarkingReviewed] = useState(false)
  const [outcomeLogging, setOutcomeLogging] = useState<null | 'advanced' | 'rejected' | 'offer'>(null)
  const [outcomeLogged, setOutcomeLogged] = useState<null | 'advanced' | 'rejected' | 'offer'>(null)
  const [traceFilter, setTraceFilter] = useState<TraceFilter>('all')
  const [briefViewMode, setBriefViewMode] = useState<'tonight' | 'full'>('tonight')
    const [prepAttributionContextIds, setPrepAttributionContextIds] = useState<string[]>([])
  const ph = usePostHog()
  // Chat state
  type ChatMessage = { role: 'user' | 'assistant'; content: string }
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [exportGateError, setExportGateError] = useState<null | {
    type: 'sensitive' | 'low_confidence' | 'generic'
    message: string
    remediation: string[]
  }>(null)
  const refineRef = useRef<HTMLTextAreaElement>(null)
  const chatInputRef = useRef<HTMLTextAreaElement>(null)
  const autoStarted = useRef(false)
  const lowConfidenceSeenForBrief = useRef<string | null>(null)

  function captureTraceInteraction(interactionType: 'legend_filter' | 'label_click', nextFilter: TraceFilter) {
    try {
      ph?.capture('prep_trace_interaction', {
        company_id: companyId,
        interaction_type: interactionType,
        trace_filter: nextFilter,
        has_brief: !!brief,
      })
    } catch {
      // analytics must not block interactions
    }
  }

  async function emitPmfEvent(
    eventName: string,
    properties: Record<string, string | number | boolean | null>,
  ) {
    try {
      await fetch('/api/events/pmf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventName, properties }),
      })
    } catch {
      // telemetry must not block product interactions
    }
  }

  function handleTraceLabelClick(originClass: ClaimOriginClass) {
    setTraceFilter(originClass)
    captureTraceInteraction('label_click', originClass)
  }

  function handleLegendFilter(next: TraceFilter) {
    setTraceFilter(next)
    captureTraceInteraction('legend_filter', next)
  }

  useEffect(() => {
    if (firstCompany && !autoStarted.current) {
      autoStarted.current = true
      handleGenerate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const background   = useOnDemand(`/api/prep/${companyId}/background`,  companyId, 'background')
  const leadership   = useOnDemand(`/api/prep/${companyId}/leadership`,  companyId, 'leadership')
  const priorities   = useOnDemand(`/api/prep/${companyId}/priorities`,  companyId, 'priorities')
  const challenges   = useOnDemand(`/api/prep/${companyId}/challenges`,  companyId, 'challenges')
  const competitive  = useOnDemand(`/api/prep/${companyId}/competitive`, companyId, 'competitive')
  const wins         = useOnDemand(`/api/prep/${companyId}/wins`,        companyId, 'wins')
  const techStack    = useOnDemand(`/api/prep/${companyId}/tech-stack`,  companyId, 'tech_stack')
  const whyHere      = useOnDemand(`/api/prep/${companyId}/why-here`,    companyId, 'why_here')
  const questions    = useOnDemand(`/api/prep/${companyId}/questions`,   companyId, 'questions')

  async function handleGenerate() {
    setLoading(true)
    setBrief('')
    setBriefId(null)
    setBriefViewMode('tonight')
    setReviewedBriefId(null)
    setOutcomeLogged(null)
    setPrepAttributionContextIds([])
    setTraceFilter('all')
    setLowConfidenceAcknowledged(false)
    setError('')
    try {
      const url = new URL(`/api/prep/${companyId}`, window.location.origin)
      if (postingUrl.trim()) url.searchParams.set('posting_url', postingUrl.trim())
      url.searchParams.set('interview_stage', interviewStage)
      url.searchParams.set('role_mode', roleMode)
      const res = await fetch(url.toString())

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? `Request failed (${res.status})`)
        return
      }

      const attributionHeader = res.headers.get('x-prep-attribution-context-ids')
      let nextAttributionContextIds: string[] = []
      if (attributionHeader) {
        try {
          const parsed = JSON.parse(attributionHeader) as string[]
          nextAttributionContextIds = Array.isArray(parsed)
            ? parsed.filter((id) => typeof id === 'string' && id.trim())
            : []
        } catch {
          nextAttributionContextIds = []
        }
      }
      setPrepAttributionContextIds(nextAttributionContextIds)

      let fullText = ''
      await streamResponse(res, chunk => { fullText += chunk; setBrief(fullText) })
      const { text: cleanText, error: streamError } = splitStreamError(fullText)
      if (streamError) {
        setError(streamError)
        setBrief(cleanText) // keep partial brief visible; user can regenerate
      } else {
        const id = await saveBrief('prep', cleanText, companyId, undefined, nextAttributionContextIds)
        setBriefId(id)
        const confidence = scorePrepBriefConfidence(cleanText)
        await emitPmfEvent(PMF_EVENTS.prep.prep_brief_generated, {
          company_id: companyId,
          type: 'prep',
          mode: roleMode,
          confidence_band: confidence.band,
          action_context: 'prep_generate',
          interview_stage: interviewStage,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function handleRefine() {
    const request = refineInput.trim()
    if (!request || refining || loading) return
    setRefining(true)
    setBrief('')
    setBriefId(null)
    setBriefViewMode('tonight')
    setReviewedBriefId(null)
    setOutcomeLogged(null)
    setTraceFilter('all')
    setLowConfidenceAcknowledged(false)
    setError('')
    try {
      const res = await fetch(`/api/prep/${companyId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief, request }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? `Request failed (${res.status})`)
        return
      }
      let fullText = ''
      await streamResponse(res, chunk => { fullText += chunk; setBrief(fullText) })
      const { text: cleanText, error: streamError } = splitStreamError(fullText)
      if (streamError) {
        setError(streamError)
        setBrief(cleanText)
      } else {
        setRefineInput('')
        const id = await saveBrief('prep', cleanText, companyId, undefined, prepAttributionContextIds)
        setBriefId(id)
        const confidence = scorePrepBriefConfidence(cleanText)
        await emitPmfEvent(PMF_EVENTS.prep.prep_brief_refined, {
          company_id: companyId,
          mode: roleMode,
          confidence_band: confidence.band,
          action_context: 'prep_refine',
          interview_stage: interviewStage,
        })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setRefining(false)
    }
  }

  async function handleLogOutreach() {
    setOutreachLogLoading(true)
    try {
      await fetch(`/api/prep/${companyId}/outreach/log`, { method: 'POST' })
      setOutreachLogged(true)
    } catch {
      // non-critical - silently fail
    } finally {
      setOutreachLogLoading(false)
    }
  }

  async function handleGenerateOutreach() {
    setOutreachLoading(true)
    setOutreachDraft('')
    setOutreachError('')
    setOutreachCopied(false)
    setOutreachLogged(false)
    try {
      const res = await fetch(`/api/prep/${companyId}/outreach`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setOutreachError(body?.error ?? `Request failed (${res.status})`)
        return
      }
      let fullText = ''
      await streamResponse(res, chunk => { fullText += chunk; setOutreachDraft(fullText) })
      if (fullText.startsWith('__ERROR__')) {
        setOutreachError(fullText.slice(9))
        setOutreachDraft('')
      }
    } catch (e) {
      setOutreachError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setOutreachLoading(false)
    }
  }

  function handleCopyOutreach() {
    navigator.clipboard.writeText(outreachDraft).then(() => {
      setOutreachCopied(true)
      setTimeout(() => setOutreachCopied(false), 2000)
    }).catch(() => {})
  }

  async function handleChat() {
    const message = chatInput.trim()
    if (!message || chatLoading || loading) return
    const userMsg: ChatMessage = { role: 'user', content: message }
    setChatMessages(prev => [...prev, userMsg])
    setChatInput('')
    setChatLoading(true)
    try {
      const res = await fetch(`/api/prep/${companyId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          brief: brief.slice(0, 6000),
          companyName,
          history: chatMessages.slice(-8).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      let fullText = ''
      setChatMessages(prev => [...prev, { role: 'assistant', content: '' }])
      if (res.ok) {
        await streamResponse(res, chunk => {
          fullText += chunk
          setChatMessages(prev => {
            const updated = [...prev]
            updated[updated.length - 1] = { role: 'assistant', content: fullText }
            return updated
          })
        })
      } else {
        setChatMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: 'Unable to answer right now.' }
          return updated
        })
      }
    } catch {
      setChatMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Unable to answer right now.' }
        return updated
      })
    } finally {
      setChatLoading(false)
    }
  }

  async function handleDownload() {
    if (downloading || !brief) return
    setDownloading(true)
    setExportGateError(null)
    try {
      const title = `${companyName} - Prep Brief`
      const res = await fetch('/api/briefs/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: brief,
          title,
          brief_id: briefId,
          low_confidence_acknowledged: lowConfidenceAcknowledged,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({})) as {
          error?: string
          remediation?: string[]
          sample_claims?: string[]
          sensitive_hook_counts?: Record<string, number>
        }

        if (res.status === 412) {
          const hasSensitive = typeof payload.error === 'string' && payload.error.toLowerCase().includes('sensitive')
          if (hasSensitive) {
            const hookSummary = Object.entries(payload.sensitive_hook_counts ?? {})
              .map(([hook, count]) => `${hook.replace(/_/g, ' ')}: ${count}`)
            const sampleClaims = (payload.sample_claims ?? []).map((claim) => `Rewrite or source: ${claim}`)
            setExportGateError({
              type: 'sensitive',
              message: payload.error ?? 'Export blocked on sensitive claims.',
              remediation: [
                ...hookSummary,
                ...sampleClaims,
                'Remove unsourced compensation, legal, or security assertions.',
                'Regenerate this brief after adding evidence in company notes, documents, or signals.',
              ],
            })
            return
          }

          setExportGateError({
            type: 'low_confidence',
            message: payload.error ?? 'Export blocked until low-confidence acknowledgment is complete.',
            remediation: payload.remediation ?? [
              'Acknowledge low confidence in this screen before exporting.',
              'Add more evidence and regenerate to improve confidence.',
            ],
          })
          return
        }

        setExportGateError({
          type: 'generic',
          message: payload.error ?? `Download failed (${res.status}).`,
          remediation: ['Retry export in a moment.'],
        })
        return
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${companyName.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-prep-brief.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      await emitPmfEvent(PMF_EVENTS.prep.prep_export_word, {
        company_id: companyId,
        mode: roleMode,
        confidence_band: briefConfidence?.band ?? 'unknown',
        action_context: 'prep_export_word',
        interview_stage: interviewStage,
      })
    } catch {
      // silently fail - user can retry
    } finally {
      setDownloading(false)
    }
  }

  async function handlePdfExport() {
    if (exportBlockedByConfidence) return
    await emitPmfEvent(PMF_EVENTS.prep.prep_export_pdf, {
      company_id: companyId,
      mode: roleMode,
      confidence_band: briefConfidence?.band ?? 'unknown',
      action_context: 'prep_export_pdf',
      interview_stage: interviewStage,
    })
    window.print()
  }

  async function handleLogOutcome(outcome: 'advanced' | 'rejected' | 'offer') {
    if (!briefId || outcomeLogging) return
    setOutcomeLogging(outcome)
    try {
      const res = await fetch(`/api/briefs/${briefId}/outcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outcome }),
      })
      if (!res.ok) return
      setOutcomeLogged(outcome)
    } finally {
      setOutcomeLogging(null)
    }
  }

  async function handleMarkReviewed() {
    if (!brief || markingReviewed) return
    if (briefId && reviewedBriefId === briefId) return

    setMarkingReviewed(true)
    try {
      await emitPmfEvent(PMF_EVENTS.prep.prep_brief_reviewed, {
        company_id: companyId,
        mode: roleMode,
        confidence_band: briefConfidence?.band ?? 'unknown',
        action_context: 'prep_brief_reviewed',
        interview_stage: interviewStage,
      })
      setReviewedBriefId(briefId ?? '__reviewed__')
    } finally {
      setMarkingReviewed(false)
    }
  }

  const busy = loading || refining
  const briefConfidence = useMemo(() => {
    if (!brief) return null
    return scorePrepBriefConfidence(brief)
  }, [brief])
  const briefConfidenceCopy = useMemo(() => {
    if (!briefConfidence) return null
    return formatPrepConfidenceForUser(briefConfidence)
  }, [briefConfidence])
  const displayedBrief = useMemo(() => {
    if (!brief) return ''
    return briefViewMode === 'tonight' ? buildTonightView(brief) : brief
  }, [brief, briefViewMode])
  const isLowConfidence = briefConfidence?.band === 'low'
  const exportBlockedByConfidence = isLowConfidence && !lowConfidenceAcknowledged

  useEffect(() => {
    if (!brief || !isLowConfidence) return
    if (lowConfidenceSeenForBrief.current === brief) return
    lowConfidenceSeenForBrief.current = brief

    void emitPmfEvent(PMF_EVENTS.prep.prep_low_confidence_seen, {
      company_id: companyId,
      mode: roleMode,
      confidence_band: briefConfidence?.band ?? 'low',
      action_context: 'prep_low_confidence_banner',
      interview_stage: interviewStage,
    })
  }, [brief, isLowConfidence, companyId, roleMode, interviewStage, briefConfidence?.band])

  return (
    <div className="relative min-h-screen bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/72 backdrop-blur-xl no-print">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <Link
            href={`/dashboard/companies/${companyId}`}
            className="text-[13px] text-muted-foreground transition-colors"
          >
            ← {companyName}
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        <div className="mb-6 sm:mb-8 no-print">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 sm:gap-6 mb-5">
            <div>
              <h1 className="text-[26px] font-bold text-foreground leading-tight">Interview Prep</h1>
              <p className="text-[13px] text-muted-foreground mt-1.5">{companyName} · {stageLabel}</p>
            </div>
            <div className="flex flex-col items-stretch sm:items-end gap-2 shrink-0">
              <Input
                type="url"
                value={postingUrl}
                onChange={e => setPostingUrl(e.target.value)}
                placeholder="Paste job posting URL (optional)"
                disabled={busy}
                className="text-[12px] text-muted-foreground placeholder:text-muted-foreground w-full sm:w-72 focus-visible:border-border"
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  onClick={handleGenerate}
                  disabled={busy}
                  className="flex-1 text-[13px] px-5"
                >
                  {loading ? 'Generating…' : brief ? 'Regenerate' : 'Generate prep brief'}
                </Button>
                {brief && !busy && (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void handleMarkReviewed()
                      }}
                      disabled={markingReviewed || reviewedBriefId === (briefId ?? '__reviewed__')}
                      className="shrink-0 text-[13px] text-muted-foreground hover:text-foreground"
                      title="Mark this prep brief as reviewed"
                    >
                      {reviewedBriefId === (briefId ?? '__reviewed__') ? 'Reviewed' : markingReviewed ? 'Saving…' : 'Mark reviewed'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownload}
                      disabled={downloading || exportBlockedByConfidence}
                      className="shrink-0 text-[13px] text-muted-foreground hover:text-foreground"
                      title="Download as Word document"
                    >
                      {downloading ? '…' : 'Word'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        void handlePdfExport()
                      }}
                      disabled={exportBlockedByConfidence}
                      className="shrink-0 text-[13px] text-muted-foreground hover:text-foreground"
                      title="Save as PDF"
                    >
                      PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Interview stage</p>
            <ToggleGroup
              value={[interviewStage]}
              onValueChange={(values) => { const next = values[0] as InterviewStage | undefined; if (next) setInterviewStage(next) }}
              disabled={busy}
              className="flex-wrap gap-1.5"
            >
              {STAGE_OPTIONS.map(opt => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className={`h-auto text-[12px] font-medium px-3 py-1.5 rounded border transition-colors ${
                    interviewStage === opt.value
                      ? 'bg-primary text-primary-foreground border-primary/30'
                      : 'bg-muted/40 text-primary-foreground border-border hover:text-primary-foreground'
                  }`}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          <div className="mt-4">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground mb-2">Role mode</p>
            <ToggleGroup
              value={[roleMode]}
              onValueChange={(values) => { const next = values[0] as PrepRoleMode | undefined; if (next) setRoleMode(next) }}
              disabled={busy}
              className="flex-wrap gap-1.5"
            >
              {ROLE_MODE_OPTIONS.map(opt => (
                <ToggleGroupItem
                  key={opt.value}
                  value={opt.value}
                  className={`h-auto text-[12px] font-medium px-3 py-1.5 rounded border transition-colors ${
                    roleMode === opt.value
                      ? 'bg-primary text-primary-foreground border-primary/30'
                      : 'bg-muted/40 text-primary-foreground border-border hover:text-primary-foreground'
                  }`}
                >
                  {opt.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {firstCompany && !brief && (
          <Alert variant="warning" className="mb-6 px-6 py-5">
            <AlertTitle className="text-[10px] tracking-[0.14em] uppercase">Your first intelligence brief</AlertTitle>
            <p className="text-[14px] font-semibold text-foreground mb-1">
              {loading ? `Building your brief on ${companyName}...` : `Ready to brief you on ${companyName}.`}
            </p>
            <AlertDescription className="text-[13px] leading-relaxed">
              {loading
                ? 'Scanning public signals, leadership context, strategic priorities, and likely objections. This takes about 20 seconds.'
                : 'We scanned public signals, leadership context, and strategic priorities. Your brief is ready.'}
            </AlertDescription>
          </Alert>
        )}

        {exportGateError && (
          <Alert variant={exportGateError.type === 'sensitive' ? 'destructive' : 'warning'} className="mb-4 px-5 py-4">
            <p className="text-[12px] font-semibold text-foreground">{exportGateError.message}</p>
            <ul className="mt-2 space-y-1.5 text-[12px] text-muted-foreground">
              {exportGateError.remediation.slice(0, 6).map((item) => (
                <li key={item}>- {item}</li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBriefViewMode('full')}
                className="text-[11px]"
              >
                Review full brief
              </Button>
              <Button
                variant="outline"
                className="text-[11px]"
                render={<Link href={`/dashboard/companies/${companyId}`} />}
              >
                Add evidence
              </Button>
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6 px-4 py-3">
            <AlertDescription className="text-[13px]">{error}</AlertDescription>
          </Alert>
        )}

        {!brief && !busy && (() => {
          type ReadyState = 'ready' | 'partial' | 'missing'
          const items: { key: string; label: string; state: ReadyState; message: string; href: string; cta: string }[] = [
            {
              key: 'career',
              label: 'Career history',
              state: hasCareerHistory ? 'ready' : hasResume ? 'partial' : 'missing',
              message: hasCareerHistory
                ? 'Verified career history on file.'
                : hasResume
                  ? 'Resume on file. The brief will use it. Add verified career history for stronger personalization.'
                  : 'Add your career history so the brief can personalize your background. Import from your resume or add manually.',
              href: '/dashboard/profile',
              cta: hasCareerHistory ? 'Review' : hasResume ? 'Verify history' : 'Add career history',
            },
            {
              key: 'positioning',
              label: 'Positioning summary',
              state: hasPositioning ? 'ready' : 'missing',
              message: hasPositioning
                ? 'Positioning statement on file.'
                : 'Your Win Thesis will be more differentiated with a positioning statement.',
              href: '/dashboard/profile',
              cta: 'Add positioning',
            },
            {
              key: 'targets',
              label: 'Target roles',
              state: hasTargetTitles ? 'ready' : 'missing',
              message: hasTargetTitles
                ? 'Target roles set.'
                : 'Set at least one target title so the brief calibrates to the role you want.',
              href: '/dashboard/profile',
              cta: 'Set targets',
            },
            {
              key: 'notes',
              label: 'Company notes',
              state: hasNotes ? 'ready' : 'missing',
              message: hasNotes
                ? 'Company notes on file.'
                : (roleType && NO_NOTES_MESSAGES[roleType]) ?? 'Company notes are the single biggest lever for brief quality.',
              href: `/dashboard/companies/${companyId}`,
              cta: 'Add notes',
            },
          ]
          const readyCount = items.filter(i => i.state !== 'missing').length
          if (readyCount === items.length && items.every(i => i.state === 'ready')) return null
          return (
            <Card variant="glass" className="mb-4 px-5 py-4">
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <p className="text-[12px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Brief readiness</p>
                <Badge variant="outline" className="text-muted-foreground">{readyCount} of {items.length} inputs ready</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {items.map(i => (
                  <div key={i.key} className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span aria-hidden className={`mt-0.5 text-[13px] leading-none ${i.state === 'ready' ? 'text-success' : i.state === 'partial' ? 'text-warning' : 'text-muted-foreground'}`}>
                        {i.state === 'ready' ? '\u2713' : i.state === 'partial' ? '\u25D0' : '\u25CB'}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[12px] font-semibold ${i.state === 'missing' ? 'text-warning' : 'text-foreground'}`}>{i.label}</p>
                        <p className="text-[12px] text-muted-foreground leading-snug">{i.message}</p>
                      </div>
                    </div>
                    {i.state !== 'ready' && (
                      <Button
                        variant="outline"
                        className="shrink-0 text-[11px] text-foreground whitespace-nowrap"
                        render={<Link href={i.href} />}
                      >
                        {i.cta}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">
                You can generate the brief now. Each input you add makes it more specific to you.
              </p>
            </Card>
          )
        })()}

        {!brief && !busy && !error && (
          <Card variant="glass" className="p-8 sm:p-10 text-center">
            <p className="text-[14px] text-muted-foreground">
              Generates an elite brief using your pipeline data, company notes, scan results, and known contacts.
            </p>
          </Card>
        )}

        {!brief && !busy && error && (
          <Card variant="glass" className="p-8 sm:p-10 text-center">
            <p className="text-[14px] text-muted-foreground">
              Click Generate to try again.
            </p>
          </Card>
        )}

        {busy && !brief && (
          <Card variant="glass" className="p-5 sm:p-8">
            <PulsingDots />
          </Card>
        )}

        {brief && profileScore < 50 && !busy && (
          <Alert variant="warning" className="mb-4 px-5 py-4 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <AlertTitle className="text-[13px]">
                This brief used limited profile data.
              </AlertTitle>
              <AlertDescription className="text-[12px] mt-1 leading-relaxed">
                Adding your resume unlocks significantly more specific talking points, win thesis, and pushback prep. The brief you just generated is a starting point.
              </AlertDescription>
            </div>
            <Button
              variant="outline"
              className="shrink-0 text-[12px] text-warning border-warning/40 hover:border-warning/30"
              render={<Link href="/dashboard/profile#section-resume" />}
            >
              Add resume →
            </Button>
          </Alert>
        )}

        {brief && briefConfidence && !busy && (
          <Alert variant={isLowConfidence ? 'warning' : 'default'} className="mb-4 px-5 py-4">
            <div className="mb-3">
              <ToggleGroup
                value={[briefViewMode]}
                onValueChange={(values) => { const next = values[0] as 'tonight' | 'full' | undefined; if (next) setBriefViewMode(next) }}
                className="gap-2"
              >
                <ToggleGroupItem
                  value="tonight"
                  className={`h-auto text-[11px] font-semibold rounded px-2.5 py-1 ${briefViewMode === 'tonight' ? 'bg-primary text-primary-foreground border-primary/30' : 'bg-muted/40 text-primary-foreground border-border hover:border-border'}`}
                >
                  Tonight view
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="full"
                  className={`h-auto text-[11px] font-semibold rounded px-2.5 py-1 ${briefViewMode === 'full' ? 'bg-primary text-primary-foreground border-primary/30' : 'bg-muted/40 text-primary-foreground border-border hover:border-border'}`}
                >
                  Full dossier
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Brief confidence</p>
                <p className="text-[14px] font-semibold text-foreground mt-1">
                  {briefConfidenceCopy?.confidenceLabel}
                </p>
              </div>
              <div className="text-[12px] text-muted-foreground">
                {briefConfidenceCopy?.detail}
              </div>
            </div>
            {isLowConfidence && (
              <div className="mt-3 pt-3 border-t border-warning/30">
                <p className="text-[12px] font-semibold text-warning mb-1.5">Low confidence remediation required before export</p>
                <ul className="text-[12px] text-warning space-y-1.5">
                  {briefConfidence.remediation.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLowConfidenceAcknowledged(true)
                    void emitPmfEvent(PMF_EVENTS.prep.prep_low_confidence_seen, {
                      company_id: companyId,
                      mode: roleMode,
                      confidence_band: briefConfidence?.band ?? 'low',
                      action_context: 'prep_low_confidence_acknowledged',
                      interview_stage: interviewStage,
                    })
                  }}
                  className="mt-3 text-[12px] text-warning border-warning/40 hover:bg-warning/20"
                >
                  Acknowledge and allow export
                </Button>
              </div>
            )}
          </Alert>
        )}

        {brief && (
          <Card variant="glass" className="p-5 sm:p-8 mb-4">
            <SourceLegend
              traceFilter={traceFilter}
              counts={buildClaimOriginCounts(displayedBrief)}
              onChangeFilter={handleLegendFilter}
            />
            {renderBrief(displayedBrief, traceFilter, handleTraceLabelClick)}
            {busy && (
              <span className="inline-block w-0.5 h-4 bg-muted animate-pulse ml-0.5 align-middle" />
            )}
            {!busy && (
              <p className="mt-6 pt-4 border-t border-border text-[11px] text-muted-foreground">
                AI-generated - use as input, not advice. Verify facts before any conversation.
              </p>
            )}
          </Card>
        )}

        {briefId && !busy && (
          <div className="mb-4 flex justify-end no-print">
            <BriefRating briefId={briefId} />
          </div>
        )}

        {briefId && !busy && (
          <Card variant="glass" className="mb-4 p-4 no-print">
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">Post-interview outcome</p>
            <p className="mt-1 text-[13px] text-muted-foreground">Log the result after this conversation to improve efficacy tracking.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => { void handleLogOutcome('advanced') }}
                disabled={!!outcomeLogging}
                className="text-[12px] border-success/30 text-success hover:bg-success/10"
              >
                {outcomeLogging === 'advanced' ? 'Saving…' : 'Advanced'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { void handleLogOutcome('offer') }}
                disabled={!!outcomeLogging}
                className="text-[12px] border-info/30 text-info hover:bg-info/10"
              >
                {outcomeLogging === 'offer' ? 'Saving…' : 'Offer'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => { void handleLogOutcome('rejected') }}
                disabled={!!outcomeLogging}
                className="text-[12px] border-warning/40 text-warning hover:bg-warning/10"
              >
                {outcomeLogging === 'rejected' ? 'Saving…' : 'Rejected'}
              </Button>
            </div>
            {outcomeLogged && (
              <p className="mt-2 text-[12px] text-muted-foreground">Outcome saved: {outcomeLogged}.</p>
            )}
          </Card>
        )}

        {brief && !busy && (() => {
          const nudges: { href: string; cta: string; message: string }[] = []
          if (!hasInterviewNotes && (companyStage === 'interviewing' || companyStage === 'offer')) nudges.push({
            message: 'Add post-interview notes to sharpen the next brief based on what was actually asked.',
            href: `/dashboard/companies/${companyId}`,
            cta: 'Add interview notes',
          })
          if (!hasCareerHistory) nudges.push({
            message: 'Verified career history would make the Win Thesis and Talking Points significantly more specific.',
            href: '/dashboard/profile',
            cta: 'Add career history',
          })
          if (!hasPositioning) nudges.push({
            message: 'A positioning summary sharpens the Win Thesis and Bottom Line.',
            href: '/dashboard/profile',
            cta: 'Add positioning',
          })
          if (!hasNotes) nudges.push({
            message: 'Company notes are the single biggest lever. Add intel before the next regenerate.',
            href: `/dashboard/companies/${companyId}`,
            cta: 'Add notes',
          })
          const top = nudges.slice(0, 2)
          if (top.length === 0) return null
          return (
            <Card variant="glass" className="mb-4 p-5 no-print">
              <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground mb-3">What would sharpen the next brief</p>
              <div className="flex flex-col gap-2.5">
                {top.map((n, i) => (
                  <div key={i} className="flex items-start justify-between gap-4">
                    <p className="text-[13px] text-muted-foreground">{n.message}</p>
                    <Button
                      variant="outline"
                      className="shrink-0 text-[11px] text-muted-foreground whitespace-nowrap"
                      render={<Link href={n.href} />}
                    >
                      {n.cta}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )
        })()}

        {brief && !loading && (
          <div className="no-print">
            <OnDemandPanel
              title="Your Background Match"
              description="How your specific experience connects to this company's challenges. Generate this before you walk in."
              content={background.content}
              briefId={background.briefId}
              loading={background.loading}
              error={background.error}
              onGenerate={background.generate}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Leadership Team"
              description="Who is in the room, what they care about, and how to win with each of them."
              content={leadership.content}
              briefId={leadership.briefId}
              loading={leadership.loading}
              error={leadership.error}
              onGenerate={leadership.generate}
              groundingMode={leadership.groundingMode}
              evidenceCount={leadership.evidenceCount}
              addEvidenceHref={`/dashboard/companies/${companyId}`}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Strategic Priorities"
              description="What this company is actually focused on right now - and how to align your narrative."
              content={priorities.content}
              briefId={priorities.briefId}
              loading={priorities.loading}
              error={priorities.error}
              onGenerate={priorities.generate}
              groundingMode={priorities.groundingMode}
              evidenceCount={priorities.evidenceCount}
              addEvidenceHref={`/dashboard/companies/${companyId}`}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Pain Points"
              description="The real challenges they are dealing with - and how to demonstrate you understand them."
              content={challenges.content}
              briefId={challenges.briefId}
              loading={challenges.loading}
              error={challenges.error}
              onGenerate={challenges.generate}
              groundingMode={challenges.groundingMode}
              evidenceCount={challenges.evidenceCount}
              addEvidenceHref={`/dashboard/companies/${companyId}`}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Competitive Landscape"
              description="Who they compete with, how they position, and how to use it in the room."
              content={competitive.content}
              briefId={competitive.briefId}
              loading={competitive.loading}
              error={competitive.error}
              onGenerate={competitive.generate}
              groundingMode={competitive.groundingMode}
              evidenceCount={competitive.evidenceCount}
              addEvidenceHref={`/dashboard/companies/${companyId}`}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Recent Wins"
              description="What to acknowledge and reference to show you did the homework."
              content={wins.content}
              briefId={wins.briefId}
              loading={wins.loading}
              error={wins.error}
              onGenerate={wins.generate}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Tech Stack"
              description="What systems they are likely running and what to know before you walk in."
              content={techStack.content}
              briefId={techStack.briefId}
              loading={techStack.loading}
              error={techStack.error}
              onGenerate={techStack.generate}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Why Here"
              description="A personalized statement for when they ask why you want this role."
              content={whyHere.content}
              briefId={whyHere.briefId}
              loading={whyHere.loading}
              error={whyHere.error}
              onGenerate={whyHere.generate}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
            <OnDemandPanel
              title="Likely Interview Questions"
              description="The questions they will ask you - with coaching on how to answer each."
              content={questions.content}
              briefId={questions.briefId}
              loading={questions.loading}
              error={questions.error}
              onGenerate={questions.generate}
              traceFilter={traceFilter}
              onTraceLabelClick={handleTraceLabelClick}
              onLegendFilter={handleLegendFilter}
            />
          </div>
        )}

        {brief && !loading && <div className="no-print"><ResourcePanel brief={brief} /></div>}

        {brief && !loading && (
          <Card variant="glass" className="p-6 mb-4 no-print">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">
              Ask about this brief
            </p>
            {chatMessages.length > 0 && (
              <ScrollArea className="mb-4 max-h-80">
                <div className="flex flex-col gap-3">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-lg px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/40 border border-border text-primary-foreground'
                      }`}>
                        {msg.content}
                        {msg.role === 'assistant' && msg.content === '' && chatLoading && (
                          <PulsingDots dotClassName="w-1 h-1" className="ml-1 gap-1" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
            <div className="flex gap-2 items-end">
              <Textarea
                ref={chatInputRef}
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat() }
                }}
                placeholder={chatMessages.length === 0
                  ? 'Ask anything - "What should I ask about their CFO transition?" or "Role-play their opening question"'
                  : 'Ask a follow-up...'}
                rows={2}
                disabled={chatLoading || loading}
                className="flex-1 text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none"
              />
              <Button
                type="button"
                onClick={handleChat}
                disabled={chatLoading || loading || !chatInput.trim()}
                className="shrink-0 text-[13px] px-4"
              >
                {chatLoading ? '…' : 'Ask'}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
          </Card>
        )}

        {brief && !loading && (
          <Card variant="glass" className="p-6 no-print">
            <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-3">
              Refine this brief
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                'Make the pushback counters more aggressive',
                'Add a first 30/60/90 day plan',
                "Assume they'll challenge my industry experience",
              ].map(chip => (
                <Button
                  key={chip}
                  type="button"
                  variant="outline"
                  onClick={() => { setRefineInput(chip); refineRef.current?.focus() }}
                  className="rounded-full text-[12px] text-muted-foreground hover:text-foreground"
                >
                  {chip}
                </Button>
              ))}
            </div>
            <div className="flex gap-3 items-end">
              <Textarea
                ref={refineRef}
                value={refineInput}
                onChange={e => setRefineInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleRefine() }
                }}
                placeholder="Or type your own refinement request..."
                rows={2}
                disabled={refining}
                className="flex-1 rounded-lg text-[13px] text-foreground placeholder:text-muted-foreground focus-visible:border-border resize-none"
              />
              <Button
                type="button"
                onClick={handleRefine}
                disabled={refining || !refineInput.trim()}
                className="shrink-0 rounded-lg text-[13px] px-5"
              >
                {refining ? 'Refining…' : 'Refine'}
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground">Enter to submit · Shift+Enter for new line</p>
          </Card>
        )}

        {brief && (
          <Card variant="glass" className="mt-6 px-6 py-5 no-print">
            <div className="flex items-center justify-between gap-4 mb-3">
              <p className="text-[13px] text-muted-foreground font-semibold">
                Draft outreach from this brief
              </p>
              {!outreachDraft && !outreachLoading && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateOutreach}
                  disabled={outreachLoading}
                  className="shrink-0 text-[12px] text-foreground"
                >
                  Generate →
                </Button>
              )}
            </div>

            {outreachLoading && !outreachDraft && (
              <p className="text-[13px] text-muted-foreground italic">Drafting outreach…</p>
            )}

            {outreachError && (
              <p className="text-[13px] text-destructive">{outreachError}</p>
            )}

            {outreachDraft && (
              <div>
                <p className="text-[14px] text-foreground leading-relaxed whitespace-pre-wrap mb-4">
                  {outreachDraft}
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCopyOutreach}
                    className="text-[12px] text-foreground"
                  >
                    {outreachCopied ? 'Copied!' : 'Copy'}
                  </Button>
                  {hasContacts && !outreachLogged && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleLogOutreach}
                      disabled={outreachLogLoading}
                      className="text-[12px] text-muted-foreground hover:text-foreground"
                    >
                      {outreachLogLoading ? 'Logging…' : 'Log as sent'}
                    </Button>
                  )}
                  {outreachLogged && (
                    <span className="text-[12px] font-semibold text-success">Logged</span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleGenerateOutreach}
                    disabled={outreachLoading}
                    className="text-[12px] text-muted-foreground hover:text-foreground"
                  >
                    Regenerate
                  </Button>
                  {!hasContacts && (
                    <Link
                      href={`/dashboard/companies/${companyId}`}
                      className="text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Add a contact to log this →
                    </Link>
                  )}
                </div>
              </div>
            )}

            {!outreachDraft && !outreachLoading && !outreachError && (
              <p className="text-[12px] text-muted-foreground">
                Generates a 3-sentence message grounded in this company&apos;s signals and your prep brief.
                {!hasContacts && ' Add a contact at ' + companyName + ' to log the outreach after.'}
              </p>
            )}
          </Card>
        )}

      </main>
    </div>
  )
}

