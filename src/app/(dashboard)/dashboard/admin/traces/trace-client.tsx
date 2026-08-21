'use client'
import { useEffect, useRef, useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { rateTrace } from './actions'
import { buildFailureSummaryPayload } from './copy-summary'
import { resolveNextActiveRowId } from './active-row'
import {
  buildUrl,
  composeEvalNotes,
  FEATURE_LABELS,
  FEATURES,
  FAILURE_CATEGORIES,
  parseEvalNotes,
  type BulkApplyUndoChange,
  type LastActionState,
  type Trace,
} from './trace-shared'
import { Alert, AlertDescription, Badge, Button, Card, Collapsible, CollapsibleContent, CollapsibleTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, ScrollArea, Textarea, Toggle, ToggleGroup, ToggleGroupItem } from '@/components/ui'
function TraceRow({
  trace,
  enableShortcuts,
  shortcutsBlocked,
  denseMode,
  rowRef,
  onActivate,
  onRated,
}: {
  trace: Trace
  enableShortcuts: boolean
  shortcutsBlocked?: boolean
  denseMode: boolean
  rowRef?: (element: HTMLDivElement | null) => void
  onActivate?: (traceId: string) => void
  onRated?: (traceId: string, prevPass: boolean | null, nextPass: boolean | null, categories: string[]) => void
}) {
  const parsedNotes = parseEvalNotes(trace.eval_notes)
  const [evalPass, setEvalPass]   = useState(trace.eval_pass)
  const [evalNotesBody, setEvalNotesBody] = useState(parsedNotes.body)
  const [categories, setCategories] = useState(parsedNotes.categories)
  const [expanded, setExpanded]   = useState(false)
  const [, startTransition]       = useTransition()

  function persist(nextPass: boolean | null, nextNotesBody: string, nextCategories: string[]) {
    const nextNotes = composeEvalNotes(nextNotesBody, nextCategories)
    startTransition(async () => { await rateTrace(trace.id, nextPass, nextNotes) })
  }

  function setRating(nextPass: boolean | null) {
    const prevPass = evalPass
    setEvalPass(nextPass)
    persist(nextPass, evalNotesBody, categories)
    onRated?.(trace.id, prevPass, nextPass, categories)
  }

  function setCategoriesAndPersist(nextCategories: string[]) {
    setCategories(nextCategories)
    persist(evalPass, evalNotesBody, nextCategories)
    if (evalPass === false) {
      onRated?.(trace.id, false, false, nextCategories)
    }
  }

  function toggleCategory(category: string) {
    const nextCategories = categories.includes(category)
      ? categories.filter((item) => item !== category)
      : [...categories, category]

    setCategoriesAndPersist(nextCategories)
  }

  function saveNotes() {
    persist(evalPass, evalNotesBody, categories)
  }

  useEffect(() => {
    if (!enableShortcuts || shortcutsBlocked) return

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName.toLowerCase()
        if (tagName === 'textarea' || tagName === 'input' || tagName === 'select' || target.isContentEditable) return
      }

      if (event.key.toLowerCase() === 'p') {
        event.preventDefault()
        setRating(true)
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setRating(false)
      } else if (event.key.toLowerCase() === 'u') {
        event.preventDefault()
        setRating(null)
      } else if (event.key.toLowerCase() === 'o') {
        event.preventDefault()
        setExpanded((value) => !value)
      } else if (/^[1-8]$/.test(event.key) && evalPass === false) {
        event.preventDefault()
        const idx = Number(event.key) - 1
        const category = FAILURE_CATEGORIES[idx]
        if (category) {
          toggleCategory(category)
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enableShortcuts, shortcutsBlocked, evalNotesBody, categories, evalPass])

  const tokens = (trace.prompt_tokens ?? 0) + (trace.completion_tokens ?? 0)
  const dateStr = new Date(trace.created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const featureLabel = FEATURE_LABELS[trace.feature] ?? trace.feature.replace(/_/g, ' ')

  return (
    <div
      ref={rowRef}
      className={`border-b border-border ${evalPass === true ? 'bg-success/10' : evalPass === false ? 'bg-destructive/10' : ''} ${enableShortcuts ? 'ring-1 ring-border ring-inset' : ''}`}
      onMouseDown={() => onActivate?.(trace.id)}
    >
      <div className="px-5 py-4 flex items-start gap-4">

        {/* Pass / Fail column */}
        <div className="flex flex-col gap-1.5 shrink-0 pt-0.5">
          <Toggle
            pressed={evalPass === true}
            onPressedChange={() => setRating(evalPass === true ? null : true)}
            aria-keyshortcuts="P"
            className={`px-3 py-1.5 rounded text-[12px] font-bold cursor-pointer transition-colors w-14 h-auto ${
              evalPass === true
                ? 'bg-success aria-pressed:bg-success text-success-foreground hover:bg-success'
                : 'bg-muted text-foreground hover:bg-success/10 hover:text-foreground'
            }`}
          >
            Pass
          </Toggle>
          <Toggle
            pressed={evalPass === false}
            onPressedChange={() => setRating(evalPass === false ? null : false)}
            aria-keyshortcuts="F"
            className={`px-3 py-1.5 rounded text-[12px] font-bold cursor-pointer transition-colors w-14 h-auto ${
              evalPass === false
                ? 'bg-destructive aria-pressed:bg-destructive text-destructive-foreground hover:bg-destructive'
                : 'bg-muted text-foreground hover:bg-destructive/10 hover:text-foreground'
            }`}
          >
            Fail
          </Toggle>
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">

          {/* Metadata row */}
          <div className="flex items-center gap-3 flex-wrap mb-2.5">
            <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">
              {featureLabel}
            </span>
            {enableShortcuts && (
              <Badge variant="secondary" className="text-[10px] tracking-[0.08em] uppercase">
                Active
              </Badge>
            )}
            <span className="text-[11px] text-muted-foreground">{dateStr}</span>
            {trace.latency_ms != null && (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">{(trace.latency_ms / 1000).toFixed(1)}s</Badge>
            )}
            {tokens > 0 && (
              <Badge variant="outline" className="text-[11px] text-muted-foreground">{tokens.toLocaleString()} tok</Badge>
            )}
            {trace.user_id && (
              <Badge variant="outline" className="text-[11px] font-mono text-foreground">{trace.user_id.slice(0, 8)}</Badge>
            )}
          </div>

          {/* Input snapshot */}
          {!denseMode && trace.input_snapshot && Object.keys(trace.input_snapshot).length > 0 && (
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-0.5">
              {Object.entries(trace.input_snapshot).map(([k, v]) => (
                <span key={k} className="text-[11px] font-mono text-muted-foreground">
                  {k}: <span className="text-muted-foreground">{String(v)}</span>
                </span>
              ))}
            </div>
          )}

          {/* Output snapshot */}
          {trace.output_snapshot && (
            <Collapsible open={expanded} onOpenChange={setExpanded} className="mb-3">
              <CollapsibleTrigger
                aria-keyshortcuts="O"
                className="text-[11px] text-muted-foreground bg-transparent border-0 cursor-pointer p-0 mb-1.5"
              >
                Output {expanded ? '▲' : '▼'}
              </CollapsibleTrigger>
              {!expanded && (
                !denseMode ? (
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    {trace.output_snapshot.slice(0, 220)}{trace.output_snapshot.length > 220 ? '…' : ''}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Collapsed in dense mode. Expand output when needed.</p>
                )
              )}
              <CollapsibleContent>
                <ScrollArea className="max-h-[500px] bg-background/60 border border-border rounded">
                  <pre className="text-[12px] text-foreground whitespace-pre-wrap leading-relaxed p-3">
                    {trace.output_snapshot}
                  </pre>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Notes */}
          <ToggleGroup
            value={categories}
            onValueChange={setCategoriesAndPersist}
            variant="outline"
            className="mb-2 w-full flex-wrap justify-start"
          >
            {FAILURE_CATEGORIES.map((category, idx) => {
              const active = categories.includes(category)
              return (
                <ToggleGroupItem
                  key={category}
                  value={category}
                  aria-keyshortcuts={String(idx + 1)}
                  className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                    active
                      ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                      : 'bg-muted/40 text-foreground border-border hover:border-border'
                  }`}
                >
                  <span className="mr-1 font-semibold">{idx + 1}</span>{category}
                </ToggleGroupItem>
              )
            })}
          </ToggleGroup>

          <Textarea
            value={evalNotesBody}
            onChange={e => setEvalNotesBody(e.target.value)}
            onBlur={saveNotes}
            placeholder="Open coding: what is wrong (or strong) about this output?"
            rows={denseMode ? 1 : 2}
            className="w-full text-[12px] text-foreground border-border px-3 py-2 placeholder:text-muted-foreground resize-none bg-muted/40"
          />
          <p className="mt-1.5 text-[10px] text-muted-foreground">Shortcuts: P = pass, F = fail, U = unrated, O = output, J/K = active row, 1-8 = fail tags.</p>
        </div>
      </div>
    </div>
  )
}

export function TraceViewer({
  traces,
  currentFeature,
  unratedOnly,
  page,
  totalPages,
  totalCount,
}: {
  traces: Trace[]
  currentFeature: string
  unratedOnly: boolean
  page: number
  totalPages: number
  totalCount: number
}) {
  const [visibleTraces, setVisibleTraces] = useState(traces)
  const [sessionLabeled, setSessionLabeled] = useState<Record<string, boolean>>({})
  const [sessionFailureTagsByTrace, setSessionFailureTagsByTrace] = useState<Record<string, string[]>>({})
  const [failureSummaryMode, setFailureSummaryMode] = useState<'page' | 'session'>('page')
  const [isApplyingTopTag, setIsApplyingTopTag] = useState(false)
  const [isUndoingTopTag, setIsUndoingTopTag] = useState(false)
  const [lastBulkApply, setLastBulkApply] = useState<{ tag: string; changes: BulkApplyUndoChange[] } | null>(null)
  const [lastAction, setLastAction] = useState<LastActionState | null>(null)
  const [includeZeroCountsInCopy, setIncludeZeroCountsInCopy] = useState(false)
  const [copyFormat, setCopyFormat] = useState<'list' | 'table'>('list')
  const [showCopyPreview, setShowCopyPreview] = useState(false)
  const [trimForSlack, setTrimForSlack] = useState(false)
  const [showCopyActions, setShowCopyActions] = useState(false)
  const [activeRowId, setActiveRowId] = useState<string | null>(traces[0]?.id ?? null)
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const focusMode = unratedOnly && currentFeature === 'prep_brief'
  const [denseMode, setDenseMode] = useState(focusMode)

  useEffect(() => {
    setVisibleTraces(traces)
    setActiveRowId(traces[0]?.id ?? null)
  }, [traces])

  useEffect(() => {
    if (visibleTraces.length === 0) {
      setActiveRowId(null)
      return
    }

    if (activeRowId && visibleTraces.some((trace) => trace.id === activeRowId)) {
      return
    }

    setActiveRowId(visibleTraces[0]?.id ?? null)
  }, [visibleTraces, activeRowId])

  useEffect(() => {
    setSessionLabeled({})
    setSessionFailureTagsByTrace({})
    setFailureSummaryMode('page')
    setIncludeZeroCountsInCopy(false)
    setCopyFormat('list')
    setShowCopyPreview(false)
    setShowCopyActions(false)
    setTrimForSlack(false)
    setLastBulkApply(null)
    setLastAction(null)
  }, [currentFeature, unratedOnly, page])

  useEffect(() => {
    setDenseMode(focusMode)
  }, [focusMode])

  useEffect(() => {
    if (!focusMode || !activeRowId) return
    const rowElement = rowRefs.current[activeRowId]
    if (!rowElement) return
    rowElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [focusMode, activeRowId])

  useEffect(() => {
    if (visibleTraces.length === 0) return

    function onKeyDown(event: KeyboardEvent) {
      if (showCopyActions) return

      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName.toLowerCase()
        if (tagName === 'textarea' || tagName === 'input' || tagName === 'select' || target.isContentEditable) return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return

      const key = event.key.toLowerCase()
      if (key === 'a' && !isApplyingTopTag) {
        event.preventDefault()
        void applyTopTagToUntaggedFails()
        return
      }
      if (key === 'z' && lastBulkApply && !isUndoingTopTag) {
        event.preventDefault()
        void undoLastBulkApplyTopTag()
        return
      }
      if (key === 'd' && focusMode) {
        event.preventDefault()
        setDenseMode((value) => !value)
        return
      }
      if (key === 'g') {
        event.preventDefault()
        const nextIndex = event.shiftKey ? visibleTraces.length - 1 : 0
        setActiveRowId(visibleTraces[nextIndex]?.id ?? null)
        return
      }
      if (key !== 'j' && key !== 'k') return

      event.preventDefault()
      const currentIndex = activeRowId
        ? visibleTraces.findIndex((trace) => trace.id === activeRowId)
        : -1
      const safeIndex = currentIndex >= 0 ? currentIndex : 0
      const delta = key === 'j' ? 1 : -1
      const nextIndex = Math.max(0, Math.min(visibleTraces.length - 1, safeIndex + delta))
      setActiveRowId(visibleTraces[nextIndex]?.id ?? null)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    visibleTraces,
    activeRowId,
    showCopyActions,
    isApplyingTopTag,
    lastBulkApply,
    isUndoingTopTag,
    focusMode,
  ])

  function handleRated(traceId: string, prevPass: boolean | null, nextPass: boolean | null, categories: string[]) {
    setSessionLabeled((prev) => {
      const next = { ...prev }
      const wasCounted = Object.prototype.hasOwnProperty.call(next, traceId)

      if (prevPass === null && nextPass !== null) {
        next[traceId] = nextPass
      } else if (nextPass === null && wasCounted) {
        delete next[traceId]
      } else if (nextPass !== null && wasCounted) {
        next[traceId] = nextPass
      }

      return next
    })

    setSessionFailureTagsByTrace((prev) => {
      const next = { ...prev }
      if (nextPass === false) {
        next[traceId] = [...new Set(categories)]
      } else {
        delete next[traceId]
      }
      return next
    })

    if (!unratedOnly || nextPass === null) return

    const nextActiveRowId = resolveNextActiveRowId(visibleTraces, traceId, activeRowId)
    const nextVisible = visibleTraces.filter((trace) => trace.id !== traceId)
    setVisibleTraces(nextVisible)
    setActiveRowId(nextActiveRowId)
  }

  const sessionTotal = Object.keys(sessionLabeled).length
  const sessionPass = Object.values(sessionLabeled).filter(Boolean).length
  const sessionFail = sessionTotal - sessionPass
  const pageFailureCategoryCounts = visibleTraces.reduce<Record<string, number>>((acc, trace) => {
    if (trace.eval_pass !== false) return acc
    const { categories } = parseEvalNotes(trace.eval_notes)
    for (const category of categories) {
      acc[category] = (acc[category] ?? 0) + 1
    }
    return acc
  }, {})
  const pageFailureCategoryRows = Object.entries(pageFailureCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const sessionFailureCategoryCounts = Object.values(sessionFailureTagsByTrace).reduce<Record<string, number>>((acc, tags) => {
    for (const tag of tags) {
      acc[tag] = (acc[tag] ?? 0) + 1
    }
    return acc
  }, {})
  const sessionFailureCategoryRows = Object.entries(sessionFailureCategoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
  const summaryRows = failureSummaryMode === 'session' ? sessionFailureCategoryRows : pageFailureCategoryRows
  const topFailureTheme = summaryRows[0] ?? null
  const modeLabel = failureSummaryMode === 'session' ? 'session' : 'current page'
  const sourceCounts = failureSummaryMode === 'session' ? sessionFailureCategoryCounts : pageFailureCategoryCounts
  const allKnownTags = [...new Set([...FAILURE_CATEGORIES, ...Object.keys(sourceCounts)])]
  const rowsForCopy = includeZeroCountsInCopy
    ? allKnownTags
        .map((tag) => [tag, sourceCounts[tag] ?? 0] as const)
        .sort((a, b) => b[1] - a[1])
    : summaryRows
  const rowsForCopySlack = trimForSlack ? rowsForCopy.slice(0, 6) : rowsForCopy
  const rowsOmittedForSlack = Math.max(0, rowsForCopy.length - rowsForCopySlack.length)
  const untaggedFailedTraces = visibleTraces.filter((trace) => {
    if (trace.eval_pass !== false) return false
    return parseEvalNotes(trace.eval_notes).categories.length === 0
  })
  const activeRowIndex = activeRowId
    ? visibleTraces.findIndex((trace) => trace.id === activeRowId)
    : -1

  const copyPreviewPayload = summaryRows.length > 0
    ? buildFailureSummaryPayload(rowsForCopy, {
      modeLabel,
      includeZeroCounts: includeZeroCountsInCopy,
      trimForSlack,
      copyFormat,
      topFailureTheme,
    })
    : ''
  const copyPreviewChars = copyPreviewPayload.length
  const copyPreviewLines = copyPreviewPayload.length > 0 ? copyPreviewPayload.split('\n').length : 0
  const slackCharLimit = 4000
  const githubCommentCharLimit = 65000
  const fitsSlack = copyPreviewChars <= slackCharLimit
  const fitsGithubComment = copyPreviewChars <= githubCommentCharLimit
  const shouldSuggestTrimForSlack = !fitsSlack && !trimForSlack

  async function applyTopTagToUntaggedFails() {
    if (!topFailureTheme || untaggedFailedTraces.length === 0 || isApplyingTopTag) return

    const topTag = topFailureTheme[0]
    const snapshotById = Object.fromEntries(visibleTraces.map((trace) => [trace.id, trace]))
    const changes: BulkApplyUndoChange[] = untaggedFailedTraces.map((trace) => ({
      traceId: trace.id,
      prevNotes: snapshotById[trace.id]?.eval_notes ?? null,
      prevSessionTags: sessionFailureTagsByTrace[trace.id],
    }))

    setIsApplyingTopTag(true)
    try {
      for (const trace of untaggedFailedTraces) {
        const parsed = parseEvalNotes(trace.eval_notes)
        const nextCategories = [...new Set([...parsed.categories, topTag])]
        const nextNotes = composeEvalNotes(parsed.body, nextCategories)

        const result = await rateTrace(trace.id, false, nextNotes)
        if (!result.ok) throw new Error('save failed')

        setVisibleTraces((prev) => prev.map((row) => (
          row.id === trace.id
            ? { ...row, eval_notes: nextNotes }
            : row
        )))

        setSessionFailureTagsByTrace((prev) => ({
          ...prev,
          [trace.id]: nextCategories,
        }))
      }

      if (changes.length > 0) {
        setLastBulkApply({ tag: topTag, changes })
        toast.success(`Applied ${topTag} to ${changes.length} trace${changes.length === 1 ? '' : 's'}.`)
        setLastAction({
          message: `Applied ${topTag} to ${changes.length} trace${changes.length === 1 ? '' : 's'}`,
          at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        })
      }
    } catch {
      toast.error('Could not apply top tag. Try again.')
    } finally {
      setIsApplyingTopTag(false)
    }
  }

  async function undoLastBulkApplyTopTag() {
    if (!lastBulkApply || isUndoingTopTag) return

    const undoCount = lastBulkApply.changes.length
    setIsUndoingTopTag(true)
    try {
      for (const change of lastBulkApply.changes) {
        const restoredNotes = change.prevNotes ?? ''
        const result = await rateTrace(change.traceId, false, restoredNotes)
        if (!result.ok) throw new Error('undo failed')

        setVisibleTraces((prev) => prev.map((row) => (
          row.id === change.traceId
            ? { ...row, eval_notes: change.prevNotes }
            : row
        )))

        setSessionFailureTagsByTrace((prev) => {
          const next = { ...prev }
          if (change.prevSessionTags === undefined) {
            delete next[change.traceId]
          } else {
            next[change.traceId] = change.prevSessionTags
          }
          return next
        })
      }

      setLastBulkApply(null)
      toast.success(`Undid bulk tag on ${undoCount} trace${undoCount === 1 ? '' : 's'}.`)
      setLastAction({
        message: `Undid bulk tag on ${undoCount} trace${undoCount === 1 ? '' : 's'}`,
        at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      })
    } catch {
      toast.error('Could not undo bulk tag. Try again.')
    } finally {
      setIsUndoingTopTag(false)
    }
  }

  async function copyTopTheme() {
    if (!topFailureTheme) return
    try {
      await navigator.clipboard.writeText(topFailureTheme[0])
      toast.success(`Copied top theme: ${topFailureTheme[0]}`)
      setLastAction({
        message: `Copied top theme ${topFailureTheme[0]}`,
        at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      })
    } catch {
      toast.error('Could not copy top theme.')
    }
  }

  async function copyFailureSummary() {
    if (summaryRows.length === 0) return
    const payload = copyPreviewPayload

    try {
      await navigator.clipboard.writeText(payload)
      toast.success(`Copied ${modeLabel} failure summary.`)
      setLastAction({
        message: `Copied ${modeLabel} failure summary (${copyFormat})`,
        at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      })
    } catch {
      toast.error('Could not copy failure summary.')
    }
  }

  async function copyCompactSummary() {
    if (summaryRows.length === 0) return

    const compactRows = summaryRows.slice(0, 6)
    const omitted = Math.max(0, summaryRows.length - compactRows.length)
    const lines = [
      `Failure tags (${modeLabel}, compact)`,
      ...compactRows.map(([tag, count]) => `- ${tag}: ${count}`),
    ]

    if (omitted > 0) {
      lines.push(`(${omitted} additional tag${omitted === 1 ? '' : 's'} omitted)`)
    }

    if (topFailureTheme) {
      lines.push(`Top theme: ${topFailureTheme[0]} (${topFailureTheme[1]})`)
    }

    const payload = lines.join('\n')

    try {
      await navigator.clipboard.writeText(payload)
      toast.success(`Copied compact ${modeLabel} summary.`)
      setLastAction({
        message: `Copied compact ${modeLabel} summary`,
        at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      })
    } catch {
      toast.error('Could not copy compact summary.')
    }
  }

  async function copyCompactSummaryTable() {
    if (summaryRows.length === 0) return

    const compactRows = summaryRows.slice(0, 6)
    const omitted = Math.max(0, summaryRows.length - compactRows.length)
    const lines = [
      `Failure tags (${modeLabel}, compact table)`,
      '',
      '| Tag | Count |',
      '| --- | ---: |',
      ...compactRows.map(([tag, count]) => `| ${tag} | ${count} |`),
    ]

    if (omitted > 0) {
      lines.push('', `(${omitted} additional tag${omitted === 1 ? '' : 's'} omitted)`)
    }

    if (topFailureTheme) {
      lines.push('', `Top theme: **${topFailureTheme[0]}** (${topFailureTheme[1]})`)
    }

    const payload = lines.join('\n')

    try {
      await navigator.clipboard.writeText(payload)
      toast.success(`Copied compact table ${modeLabel} summary.`)
      setLastAction({
        message: `Copied compact table ${modeLabel} summary`,
        at: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      })
    } catch {
      toast.error('Could not copy compact table summary.')
    }
  }

  return (
    <>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <ToggleGroup value={[currentFeature]} variant="outline" className="flex-wrap">
          {FEATURES.map(f => (
            <ToggleGroupItem
              key={f}
              value={f}
              render={<Link href={buildUrl({ feature: f || undefined, unrated: unratedOnly ? '1' : undefined })} />}
              className={`h-auto text-[12px] font-semibold px-3 py-1.5 rounded transition-colors ${
                currentFeature === f
                  ? 'bg-card aria-pressed:bg-card text-foreground'
                  : 'bg-muted/40 border border-border text-muted-foreground hover:border-border'
              }`}
            >
              {FEATURE_LABELS[f]}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="ml-auto">
          <Toggle
            pressed={unratedOnly}
            render={<Link href={buildUrl({ feature: currentFeature || undefined, unrated: unratedOnly ? undefined : '1' })} />}
            className={`h-auto text-[12px] font-semibold px-3 py-1.5 rounded transition-colors ${
              unratedOnly
                ? 'bg-warning aria-pressed:bg-warning text-warning-foreground'
                : 'bg-muted/40 border border-border text-foreground hover:border-border'
            }`}
          >
            Unrated only
          </Toggle>
        </div>
      </div>

      <div className="mb-4 bg-muted/40 border border-border rounded px-3 py-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
        <span className="font-semibold text-foreground">Session labeled: {sessionTotal}</span>
        <span>Pass: {sessionPass}</span>
        <span>Fail: {sessionFail}</span>
        {focusMode && activeRowIndex >= 0 && (
          <span className="text-muted-foreground">Active row: {activeRowIndex + 1}/{visibleTraces.length}</span>
        )}
        {focusMode && (
          <Toggle
            pressed={denseMode}
            onPressedChange={() => setDenseMode((v) => !v)}
            aria-keyshortcuts="D"
            className="ml-auto h-auto text-[11px] font-semibold border border-border bg-muted/40 text-foreground px-2 py-1 rounded transition-colors"
          >
            {denseMode ? 'Dense view: on' : 'Dense view: off'}
          </Toggle>
        )}
      </div>

      <div className="mb-4 bg-muted/40 border border-border rounded px-3 py-2">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <div>
            <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-muted-foreground">
              Failure tags ({failureSummaryMode === 'session' ? 'session' : 'current page'})
            </p>
            {lastAction && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Last action: <span className="text-muted-foreground">{lastAction.message}</span> <span className="text-muted-foreground">at {lastAction.at}</span>
              </p>
            )}
            {topFailureTheme && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Top theme: <span className="font-semibold text-foreground">{topFailureTheme[0]}</span> ({topFailureTheme[1]})
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">Keyboard: A = apply top tag, Z = undo last bulk apply, D = toggle dense view.</p>
          </div>
          <div className="flex items-center gap-1">
            {topFailureTheme && untaggedFailedTraces.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={applyTopTagToUntaggedFails}
                disabled={isApplyingTopTag}
                aria-keyshortcuts="A"
                className="h-auto text-[10px] px-2 py-1 rounded border-border bg-muted/40 text-muted-foreground"
              >
                {isApplyingTopTag ? 'Applying…' : `Apply top tag to ${untaggedFailedTraces.length}`}
              </Button>
            )}
            {topFailureTheme && (
              <Button
                type="button"
                variant="outline"
                onClick={copyTopTheme}
                className="h-auto text-[10px] px-2 py-1 rounded border-border bg-muted/40 text-muted-foreground"
              >
                Copy top theme
              </Button>
            )}
            {summaryRows.length > 0 && (
              <DropdownMenu open={showCopyActions} onOpenChange={setShowCopyActions}>
                <DropdownMenuTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      className={`h-auto text-[10px] px-2 py-1 rounded ${
                        showCopyActions
                          ? 'bg-primary text-primary-foreground border-primary/30'
                          : 'bg-muted/40 text-foreground border-border hover:border-border'
                      }`}
                    />
                  }
                >
                  Copy actions
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => void copyFailureSummary()}>
                    Copy summary
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void copyCompactSummary()}>
                    Copy compact
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void copyCompactSummaryTable()}>
                    Copy compact table
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {summaryRows.length > 0 && (
              <Toggle
                pressed={showCopyPreview}
                onPressedChange={() => setShowCopyPreview((value) => !value)}
                className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                  showCopyPreview
                    ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                    : 'bg-muted/40 text-foreground border-border hover:border-border'
                }`}
              >
                {showCopyPreview ? 'Hide preview' : 'Preview copy'}
              </Toggle>
            )}
            <Toggle
              pressed={copyFormat === 'table'}
              onPressedChange={() => setCopyFormat((value) => (value === 'list' ? 'table' : 'list'))}
              className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                copyFormat === 'table'
                  ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                  : 'bg-muted/40 text-foreground border-border hover:border-border'
              }`}
            >
              Format: {copyFormat}
            </Toggle>
            <Toggle
              pressed={includeZeroCountsInCopy}
              onPressedChange={() => setIncludeZeroCountsInCopy((value) => !value)}
              className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                includeZeroCountsInCopy
                  ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                  : 'bg-muted/40 text-foreground border-border hover:border-border'
              }`}
            >
              Include zeros: {includeZeroCountsInCopy ? 'on' : 'off'}
            </Toggle>
            <Toggle
              pressed={trimForSlack}
              onPressedChange={() => setTrimForSlack((value) => !value)}
              className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                trimForSlack
                  ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                  : 'bg-muted/40 text-foreground border-border hover:border-border'
              }`}
            >
              Trim for Slack: {trimForSlack ? 'on' : 'off'}
            </Toggle>
            {lastBulkApply && (
              <Button
                type="button"
                variant="outline"
                onClick={undoLastBulkApplyTopTag}
                disabled={isUndoingTopTag}
                aria-keyshortcuts="Z"
                className="h-auto text-[10px] px-2 py-1 rounded border-border bg-muted/40 text-muted-foreground"
              >
                {isUndoingTopTag ? 'Undoing…' : `Undo ${lastBulkApply.tag}`}
              </Button>
            )}
            <ToggleGroup
              value={[failureSummaryMode]}
              onValueChange={(values) => {
                const next = values[0]
                if (next === 'page' || next === 'session') setFailureSummaryMode(next)
              }}
              variant="outline"
            >
              <ToggleGroupItem
                value="page"
                className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                  failureSummaryMode === 'page'
                    ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                    : 'bg-muted/40 text-foreground border-border hover:border-border'
                }`}
              >
                Page
              </ToggleGroupItem>
              <ToggleGroupItem
                value="session"
                className={`h-auto text-[10px] px-2 py-1 rounded border transition-colors ${
                  failureSummaryMode === 'session'
                    ? 'bg-primary aria-pressed:bg-primary text-primary-foreground border-primary/30'
                    : 'bg-muted/40 text-foreground border-border hover:border-border'
                }`}
              >
                Session
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        {summaryRows.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {summaryRows.map(([category, count]) => (
              <span key={category} className="text-[10px] px-2 py-1 rounded border border-border bg-muted/40 text-muted-foreground">
                {category} <span className="font-semibold text-foreground">{count}</span>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            {failureSummaryMode === 'session'
              ? 'No session failure tags yet.'
              : 'No failed traces with category tags on this page yet.'}
          </p>
        )}
        {showCopyPreview && summaryRows.length > 0 && (
          <div className="mt-2 border border-border rounded bg-muted/40 p-2">
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[10px] font-semibold text-muted-foreground">Copy payload preview</p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground">{copyPreviewChars} chars · {copyPreviewLines} lines</p>
                <Badge variant={fitsSlack ? 'success' : 'warning'} className="text-[10px]">
                  {fitsSlack ? 'Fits Slack' : 'Over 4k'}
                </Badge>
                <Badge variant={fitsGithubComment ? 'success' : 'warning'} className="text-[10px]">
                  {fitsGithubComment ? 'Fits GitHub comment' : 'Over 65k'}
                </Badge>
              </div>
            </div>
            {shouldSuggestTrimForSlack && (
              <Alert variant="warning" className="mb-2 flex items-center justify-between gap-2 px-2 py-1.5">
                <AlertDescription className="text-[10px] text-warning">Payload exceeds Slack-friendly length. Enable Trim for Slack?</AlertDescription>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTrimForSlack(true)}
                  className="h-auto text-[10px] font-semibold rounded border-warning/30 bg-warning/10 text-warning px-2 py-1"
                >
                  Enable trim
                </Button>
              </Alert>
            )}
            <ScrollArea className="max-h-40">
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {copyPreviewPayload}
              </pre>
            </ScrollArea>
          </div>
        )}
      </div>

      {unratedOnly && visibleTraces.length > 0 && (
        <p className="text-[11px] text-muted-foreground mb-3">
          Focus mode: shortcuts apply to the active trace. Use J/K to change active row, G/Shift+G for first/last row, D for dense view, and 1-8 for fail tags. Rate and it auto-advances.
        </p>
      )}

      {/* Trace list */}
      {totalCount === 0 ? (
        <Card variant="glass" className="p-10 text-center">
          <p className="text-[14px] text-muted-foreground">
            No traces yet. Traces are written on every Claude API call once migration 040 is applied.
          </p>
        </Card>
      ) : visibleTraces.length === 0 ? (
        <Card variant="glass" className="p-10 text-center">
          <p className="text-[14px] text-muted-foreground">This page of unrated traces is complete.</p>
          {unratedOnly && page < totalPages - 1 ? (
            <>
              <p className="text-[12px] text-muted-foreground mt-1">Move to the next unrated page to continue labeling.</p>
              <Button
                variant="outline"
                className="mt-3"
                render={<Link href={buildUrl({ feature: currentFeature || undefined, unrated: '1', page: String(page + 1) })} />}
              >
                Next unrated page
              </Button>
            </>
          ) : (
            <p className="text-[12px] text-muted-foreground mt-1">No more unrated traces on remaining pages for this filter.</p>
          )}
        </Card>
      ) : (
        <Card variant="glass" className="gap-0 p-0 overflow-hidden mb-5">
          {visibleTraces.map((t, idx) => (
            <TraceRow
              key={t.id}
              trace={t}
              enableShortcuts={t.id === activeRowId || (activeRowId == null && idx === 0)}
              shortcutsBlocked={showCopyActions}
              denseMode={denseMode}
              rowRef={(element) => {
                if (element) {
                  rowRefs.current[t.id] = element
                } else {
                  delete rowRefs.current[t.id]
                }
              }}
              onActivate={setActiveRowId}
              onRated={handleRated}
            />
          ))}
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination className="justify-between">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={page > 0 ? buildUrl({ feature: currentFeature || undefined, unrated: unratedOnly ? '1' : undefined, page: String(page - 1) }) : '#'}
                className={page === 0 ? 'opacity-40 pointer-events-none' : ''}
              />
            </PaginationItem>
          </PaginationContent>
          <span className="text-[12px] text-muted-foreground">
            Page {page + 1} of {totalPages} &middot; {totalCount} total
          </span>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext
                href={page < totalPages - 1 ? buildUrl({ feature: currentFeature || undefined, unrated: unratedOnly ? '1' : undefined, page: String(page + 1) }) : '#'}
                className={page >= totalPages - 1 ? 'opacity-40 pointer-events-none' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}


