'use client'
import { useState, useEffect } from 'react'
import { ALLOWED_EMOTIONAL_ANGLES, type EmotionalAngle } from '@/lib/social-council-check'
import { Alert, AlertDescription, Badge, Button, Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Skeleton, Textarea, Toggle } from '@/components/ui'
type SocialPost = {
  id: string
  post_date: string
  pillar: string
  draft_text: string
  is_posted: boolean
  posted_at: string | null
  buffer_update_id: string | null
  buffer_scheduled_at: string | null
  notes: string | null
}

type TodayResponse =
  | { isPostDay: false; dateStr: string; nextPostDays: string[] }
  | {
      isPostDay: true
      dateStr: string
      pillar: string
      pillarLabel: string
      audience?: string
      audienceLabel?: string
      recommendedTimeCt?: string
      post: SocialPost
    }

type HandoffHistoryRun = {
  batchId: string
  createdAt: string
  articleTitle: string | null
  dates: string[]
}

type ShortFormCouncilCheck = {
  score: number
  characterCount: number
  recommendation: 'publish' | 'revise' | 'rewrite-opening'
  councilPass?: boolean
  emotionalAngle?: EmotionalAngle | null
  previousEmotionalAngle?: EmotionalAngle | null
  categories: {
    hook: number
    specificity: number
    credibility: number
    wit: number
    compression: number
    cta: number
  }
  checks: {
    under1200: boolean
    oneCoreIdea: boolean
    oneCta: boolean
    oneHumorLineMax: boolean
    realDetail: boolean
    honestClaim: boolean
    emotionalAnglePresent?: boolean
    emotionalAngleRotation?: boolean
  }
  topFixes: string[]
}

const LINKEDIN_URL = 'https://www.linkedin.com/feed/'
const LINKEDIN_MESSAGING_URL = 'https://www.linkedin.com/messaging/compose/'
const LINKEDIN_MYNETWORK_URL = 'https://www.linkedin.com/mynetwork/'
const GOOGLE_CALENDAR_EVENT_BASE = 'https://calendar.google.com/calendar/u/0/r/eventedit'
const APPROVED_TOKEN = 'approval_status=approved'
const REVIEW_REMINDER_FILENAME = 'startingmonday-social-review-reminder.ics'

const PILLAR_OPTIONS = [
  { value: 'search_craft', label: 'Search Craft' },
  { value: 'market_intel', label: 'Market Intelligence' },
  { value: 'behind_build', label: 'Behind the Build' },
  { value: 'user_story', label: 'User Story' },
  { value: 'engagement', label: 'Engagement' },
] as const

const CONNECTION_TEMPLATES = [
  {
    label: 'Cold - exec in search',
    text: `Hi [Name], I'm building Starting Monday - daily market intelligence for senior tech execs in active search. Thought it might be useful given where you are. Happy to connect.`,
  },
  {
    label: 'Warm - referred or met',
    text: `Hi [Name], [Referrer] suggested I reach out. I'm building Starting Monday for CIOs and CTOs navigating a search. Would love to stay connected.`,
  },
  {
    label: 'Follow-up - after content',
    text: `Hi [Name], glad the post resonated. I built Starting Monday for exactly the dynamic you described - would love to connect and hear more about what you're seeing.`,
  },
]

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })
}

function hasApprovedToken(notes: string | null | undefined): boolean {
  if (!notes) return false
  return notes.includes(APPROVED_TOKEN)
}

function setApprovedToken(notes: string | null | undefined, approved: boolean): string | null {
  const tokens = (notes ?? '')
    .split('|')
    .map(token => token.trim())
    .filter(Boolean)
    .filter(token => !token.startsWith('approval_status='))

  if (approved) tokens.unshift(APPROVED_TOKEN)
  return tokens.length > 0 ? tokens.join(' | ') : null
}

function getChicagoDateParts(date: Date): { year: string; month: string; day: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = parts.find(part => part.type === 'year')?.value ?? '2026'
  const month = parts.find(part => part.type === 'month')?.value ?? '01'
  const day = parts.find(part => part.type === 'day')?.value ?? '01'
  return { year, month, day }
}

function buildCalendarReminderIcs(now: Date): string {
  const { year, month, day } = getChicagoDateParts(now)
  const dtStamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  const dtStart = `${year}${month}${day}T081500`
  const dtEnd = `${year}${month}${day}T083000`

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Starting Monday//Social Review Reminder//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    'UID:social-review-upcoming-posts@startingmonday.app',
    `DTSTAMP:${dtStamp}`,
    `DTSTART;TZID=America/Chicago:${dtStart}`,
    `DTEND;TZID=America/Chicago:${dtEnd}`,
    'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR',
    'SUMMARY:Review upcoming LinkedIn posts',
    'DESCRIPTION:Open https://startingmonday.app/dashboard/admin/social and review upcoming drafts before the daily post window.',
    'LOCATION:https://startingmonday.app/dashboard/admin/social',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function buildGoogleCalendarReminderUrl(now: Date): string {
  const { year, month, day } = getChicagoDateParts(now)
  const dates = `${year}${month}${day}T081500/${year}${month}${day}T083000`
  const params = new URLSearchParams({
    text: 'Review upcoming LinkedIn posts',
    dates,
    ctz: 'America/Chicago',
    recur: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR',
    details: 'Open https://startingmonday.app/dashboard/admin/social and review upcoming drafts before the daily post window.',
    location: 'https://startingmonday.app/dashboard/admin/social',
    add: 'richard@startingmonday.app',
  })
  return `${GOOGLE_CALENDAR_EVENT_BASE}?${params.toString()}`
}

function countMatches(text: string, pattern: RegExp): number {
  const matches = text.match(pattern)
  return matches ? matches.length : 0
}

function evaluateShortFormCouncil(text: string): ShortFormCouncilCheck {
  const trimmed = text.trim()
  const characterCount = trimmed.length
  const lines = trimmed.split('\n').map(line => line.trim()).filter(Boolean)
  const firstLine = lines[0] ?? ''

  const ctaHits = countMatches(trimmed, /(comment|reply|dm|message me|send me|if you want|if this is useful|open to)/gi)
  const humorHits = countMatches(trimmed, /(funny|joke|laugh|smile|recap theater|recap theatre|ironic|irony)/gi)
  const detailHits = countMatches(trimmed, /(\d|week|today|yesterday|client|call|session|pilot|quote|"|')/gi)
  const hedgeHits = countMatches(trimmed, /(usually|often|most|in our pilot|in week one|we are seeing|pattern)/gi)
  const overclaimHits = countMatches(trimmed, /(always|never|everyone|no one|guaranteed|proves)/gi)

  const under1200 = characterCount <= 1200
  const oneCta = ctaHits >= 1 && ctaHits <= 2
  const oneHumorLineMax = humorHits <= 1
  const realDetail = detailHits >= 2
  const honestClaim = overclaimHits === 0 || hedgeHits >= 1
  const oneCoreIdea = countMatches(trimmed, /(\n\n)/g) <= 7

  const hook = firstLine.length >= 28 && firstLine.length <= 140 ? 22 : 15
  const specificity = realDetail ? 17 : 11
  const credibility = honestClaim ? 17 : 10
  const wit = oneHumorLineMax ? (humorHits === 1 ? 14 : 10) : 6
  const compression = under1200 ? (characterCount <= 1100 ? 10 : 8) : 3
  const cta = oneCta ? 9 : 5

  const score = hook + specificity + credibility + wit + compression + cta

  const recommendation: ShortFormCouncilCheck['recommendation'] =
    score >= 84 ? 'publish' : score >= 72 ? 'revise' : 'rewrite-opening'

  const topFixes: string[] = []
  if (!under1200) topFixes.push('Trim to 1200 characters or less before publishing.')
  if (!realDetail) topFixes.push('Add one lived detail: a role, week marker, or direct quote.')
  if (!oneCta) topFixes.push('Keep exactly one clear CTA in the final two lines.')
  if (!honestClaim) topFixes.push('Replace absolute claims with precise, evidence-backed language.')
  if (!oneHumorLineMax) topFixes.push('Use one subtle smile line only; remove extra humor beats.')
  if (hook < 19) topFixes.push('Rewrite the first line to be more specific and operator-level.')

  if (topFixes.length === 0) {
    topFixes.push('Strong draft. Keep the opening and publish after a final read-aloud pass.')
  }

  return {
    score,
    characterCount,
    recommendation,
    categories: { hook, specificity, credibility, wit, compression, cta },
    checks: {
      under1200,
      oneCoreIdea,
      oneCta,
      oneHumorLineMax,
      realDetail,
      honestClaim,
    },
    topFixes: topFixes.slice(0, 3),
  }
}


export function SocialClient() {
  const [state, setState] = useState<TodayResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draftText, setDraftText] = useState('')
  const [notesText, setNotesText] = useState('')
  const [saving, setSaving] = useState(false)
  const [savingNotes, setSavingNotes] = useState(false)
  const [copied, setCopied] = useState(false)
  const [markingPosted, setMarkingPosted] = useState(false)
  const [posting, setPosting] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [togglingApproval, setTogglingApproval] = useState(false)
  const [handoffSubmitting, setHandoffSubmitting] = useState(false)
  const [handoffMessage, setHandoffMessage] = useState('')
  const [handoffTitle, setHandoffTitle] = useState('')
  const [handoffUrl, setHandoffUrl] = useState('')
  const [handoffSummary, setHandoffSummary] = useState('')
  const [handoffAudience, setHandoffAudience] = useState('')
  const [handoffVariants, setHandoffVariants] = useState(3)
  const [handoffPillar, setHandoffPillar] = useState<(typeof PILLAR_OPTIONS)[number]['value']>('market_intel')
  const [handoffHistory, setHandoffHistory] = useState<HandoffHistoryRun[]>([])
  const [handoffHistoryLoading, setHandoffHistoryLoading] = useState(true)
  const [calendarReminderSaved, setCalendarReminderSaved] = useState(false)
  const [googleCalendarOpened, setGoogleCalendarOpened] = useState(false)
  const [councilCheck, setCouncilCheck] = useState<ShortFormCouncilCheck | null>(null)
  const [councilChecking, setCouncilChecking] = useState(false)
  const [emotionalAngle, setEmotionalAngle] = useState<EmotionalAngle>('conviction')
  const [copiedTemplate, setCopiedTemplate] = useState<number | null>(null)
  const [connectionTexts, setConnectionTexts] = useState<string[]>(
    CONNECTION_TEMPLATES.map(t => t.text)
  )

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (!state?.isPostDay) return
    if (!handoffSummary.trim()) {
      const summarySeed = state.post.draft_text.split('\n').filter(Boolean).slice(0, 2).join(' ')
      setHandoffSummary(summarySeed)
    }
  }, [state, handoffSummary])

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/social/today')
      if (!res.ok) { setError(`Failed to load (${res.status})`); return }
      const data: TodayResponse = await res.json()
      setState(data)
      if (data.isPostDay) {
        setDraftText(data.post.draft_text)
        setNotesText(data.post.notes ?? '')
      }
      await loadHandoffHistory()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  async function loadHandoffHistory() {
    setHandoffHistoryLoading(true)
    try {
      const res = await fetch('/api/admin/social/handoff-approved')
      if (!res.ok) return
      const data = await res.json() as { runs?: HandoffHistoryRun[] }
      setHandoffHistory(data.runs ?? [])
    } finally {
      setHandoffHistoryLoading(false)
    }
  }

  async function handleSave() {
    if (!state?.isPostDay || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/social/${state.post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_text: draftText }),
      })
      if (!res.ok) { setError('Save failed'); return }
      const data = await res.json() as { post?: SocialPost }
      const updatedPost = data.post
      if (!updatedPost) { setError('Save failed'); return }
      setState(prev => prev?.isPostDay ? { ...prev, post: updatedPost } : prev)
    } finally {
      setSaving(false)
    }
  }

  async function handleNotesSave() {
    if (!state?.isPostDay || savingNotes) return
    setSavingNotes(true)
    try {
      await fetch(`/api/admin/social/${state.post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      })
      setState(prev => prev?.isPostDay ? { ...prev, post: { ...prev.post, notes: notesText || null } } : prev)
    } finally {
      setSavingNotes(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(draftText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (state?.isPostDay && draftText !== state.post.draft_text) await handleSave()
  }

  async function handleMarkPosted() {
    if (!state?.isPostDay || markingPosted) return
    setMarkingPosted(true)
    try {
      if (draftText !== state.post.draft_text) await handleSave()
      const res = await fetch(`/api/admin/social/${state.post.id}/mark-posted`, { method: 'POST' })
      if (!res.ok) { setError('Failed to mark posted'); return }
      const data = await res.json() as { post?: SocialPost }
      const updatedPost = data.post
      if (!updatedPost) { setError('Failed to mark posted'); return }
      setState(prev => prev?.isPostDay ? { ...prev, post: updatedPost } : prev)
    } finally {
      setMarkingPosted(false)
    }
  }

  async function handlePost() {
    if (!state?.isPostDay || posting) return
    setPosting(true)
    setError('')
    try {
      if (draftText !== state.post.draft_text) await handleSave()
      const res = await fetch(`/api/admin/social/${state.post.id}/schedule`, { method: 'POST' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string; detail?: string }
        setError(body.error ?? 'Failed to post to LinkedIn')
        return
      }
      const data = await res.json() as { post?: SocialPost }
      const updatedPost = data.post
      if (!updatedPost) { setError('Failed to post to LinkedIn'); return }
      setState(prev => prev?.isPostDay ? { ...prev, post: updatedPost } : prev)
    } finally {
      setPosting(false)
    }
  }

  async function handleCopyTemplate(index: number) {
    await navigator.clipboard.writeText(connectionTexts[index])
    setCopiedTemplate(index)
    setTimeout(() => setCopiedTemplate(null), 2000)
  }

  async function handleRegenerate() {
    if (!state?.isPostDay || regenerating) return
    setRegenerating(true)
    setError('')
    try {
      await fetch(`/api/admin/social/${state.post.id}`, { method: 'DELETE' }).catch(() => {})
      const res = await fetch(`/api/admin/social/today?regen=${Date.now()}`)
      if (!res.ok) { setError('Regeneration failed'); return }
      const data: TodayResponse = await res.json()
      setState(data)
      if (data.isPostDay) {
        setDraftText(data.post.draft_text)
        setNotesText(data.post.notes ?? '')
      }
    } finally {
      setRegenerating(false)
    }
  }

  async function handleToggleApproval() {
    if (!state?.isPostDay || togglingApproval) return
    setTogglingApproval(true)
    setError('')
    try {
      const nextApproved = !hasApprovedToken(state.post.notes)
      const nextNotes = setApprovedToken(state.post.notes, nextApproved)

      const res = await fetch(`/api/admin/social/${state.post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: nextNotes }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setError(data.error ?? 'Failed to update approval status')
        return
      }

      const data = await res.json() as { post?: SocialPost }
      const updated = data.post
      if (updated) {
        setState(prev => prev?.isPostDay ? { ...prev, post: updated } : prev)
        setNotesText(updated.notes ?? '')
      }
    } finally {
      setTogglingApproval(false)
    }
  }

  async function handleApprovedHandoff() {
    if (!state?.isPostDay || handoffSubmitting) return
    setHandoffSubmitting(true)
    setHandoffMessage('')
    setError('')

    try {
      const title = handoffTitle.trim() || `${formatDate(state.dateStr)} approved social article`
      const summary = handoffSummary.trim() || draftText.trim()
      if (!summary) {
        setError('Article summary is required for handoff')
        return
      }

      const variants = Math.max(1, Math.min(5, Math.floor(handoffVariants || 3)))
      const approvedNotes = setApprovedToken(state.post.notes, true)

      if (!hasApprovedToken(state.post.notes)) {
        const approvalRes = await fetch(`/api/admin/social/${state.post.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: approvedNotes }),
        })
        if (approvalRes.ok) {
          const approvalData = await approvalRes.json() as { post?: SocialPost }
          const approvedPost = approvalData.post
          if (approvedPost) {
            setState(prev => prev?.isPostDay ? { ...prev, post: approvedPost } : prev)
            setNotesText(approvedPost.notes ?? '')
          }
        }
      }

      const res = await fetch('/api/admin/social/handoff-approved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalStatus: 'approved',
          pillar: handoffPillar,
          audience: handoffAudience.trim() || undefined,
          variantCount: variants,
          article: {
            title,
            url: handoffUrl.trim() || undefined,
            summary,
            keyTakeaways: summary
              .split(/[\n\.]/)
              .map(part => part.trim())
              .filter(Boolean)
              .slice(0, 2),
          },
        }),
      })

      const data = await res.json().catch(() => ({})) as {
        error?: string
        queued?: number
        posts?: Array<{ post_date: string }>
      }

      if (!res.ok) {
        setError(data.error ?? 'Approved handoff failed')
        return
      }

      const firstDate = data.posts?.[0]?.post_date
      setHandoffMessage(
        typeof data.queued === 'number'
          ? `Queued ${data.queued} approved posts${firstDate ? ` starting ${formatDate(firstDate)}` : ''}.`
          : 'Approved handoff queued successfully.'
      )
      await loadHandoffHistory()
    } finally {
      setHandoffSubmitting(false)
    }
  }

  function handleAddCalendarReminder() {
    const ics = buildCalendarReminderIcs(new Date())
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = REVIEW_REMINDER_FILENAME
    anchor.click()
    URL.revokeObjectURL(url)
    setCalendarReminderSaved(true)
    window.setTimeout(() => setCalendarReminderSaved(false), 2200)
  }

  function handleAddGoogleCalendarReminder() {
    const url = buildGoogleCalendarReminderUrl(new Date())
    window.open(url, '_blank', 'noopener,noreferrer')
    setGoogleCalendarOpened(true)
    window.setTimeout(() => setGoogleCalendarOpened(false), 2200)
  }

  async function handleRunShortFormCouncilCheck() {
    if (!state?.isPostDay || councilChecking || !draftText.trim()) return
    setCouncilChecking(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/social/${state.post.id}/council-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftText,
          emotionalAngle,
        }),
      })

      const data = await res.json().catch(() => ({})) as {
        error?: string
        result?: ShortFormCouncilCheck
        post?: SocialPost
      }

      if (!res.ok || !data.result) {
        setError(data.error ?? 'Failed to run council check')
        return
      }

      setCouncilCheck(data.result)
      const updatedPost = data.post
      if (updatedPost) {
        setState(prev => prev?.isPostDay ? { ...prev, post: updatedPost } : prev)
        setNotesText(updatedPost.notes ?? '')
      }
    } finally {
      setCouncilChecking(false)
    }
  }

  if (loading) {
    return (
      <Card className="p-8 flex items-center gap-2">
        <Skeleton className="w-1.5 h-1.5 rounded-full" />
        <Skeleton className="w-1.5 h-1.5 rounded-full [animation-delay:150ms]" />
        <Skeleton className="w-1.5 h-1.5 rounded-full [animation-delay:300ms]" />
      </Card>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          <p className="mb-3">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { setError(''); load() }}
          >
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  if (!state) return null

  if (!state.isPostDay) {
    return (
      <Card className="p-8 text-center">
        <p className="text-[14px] font-semibold text-foreground mb-2">No post scheduled today.</p>
        <p className="text-[13px] text-muted-foreground">Posts go out every weekday with audience rotation.</p>
        {state.nextPostDays.length > 0 && (
          <p className="text-[12px] text-muted-foreground mt-3">
            Next: {state.nextPostDays.map(d => formatDate(d)).join(', ')}
          </p>
        )}
      </Card>
    )
  }

  const { post, pillarLabel, dateStr } = state
  const isApproved = hasApprovedToken(post.notes)
  const isDirty = draftText !== post.draft_text
  const isNotesDirty = notesText !== (post.notes ?? '')
  const busy = saving || savingNotes || markingPosted || posting || regenerating || togglingApproval || handoffSubmitting

  return (
    <div className="flex flex-col gap-4">

      {/* Date + pillar header */}
      <Card className="px-6 py-5 flex-row items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-foreground">{formatDate(dateStr)}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <Badge>{pillarLabel}</Badge>
            {state.audienceLabel && (
              <Badge variant="info">{state.audienceLabel}</Badge>
            )}
            {state.recommendedTimeCt && !post.is_posted && (
              <Badge variant="secondary">Target {state.recommendedTimeCt}</Badge>
            )}
            {post.is_posted && (
              <Badge variant="success">
                Posted {post.posted_at ? new Date(post.posted_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : ''}
              </Badge>
            )}
            <Toggle
              pressed={isApproved}
              onPressedChange={handleToggleApproval}
              disabled={busy || post.is_posted}
              className={`h-auto text-[11px] font-bold px-2 py-0.5 rounded border ${
                isApproved
                  ? 'bg-success/10 text-success border-success/30 hover:bg-success/10 hover:border-success/30'
                  : 'bg-muted text-muted-foreground border-border hover:bg-muted hover:border-border'
              }`}
            >
              {togglingApproval ? 'Saving…' : isApproved ? 'Approved' : 'Unapproved'}
            </Toggle>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={handleRegenerate}
          disabled={busy}
          className="shrink-0"
        >
          {regenerating ? 'Generating…' : 'Regenerate'}
        </Button>
      </Card>

      {/* Draft editor */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Post Draft</p>
          {isDirty && !saving && (
            <span className="text-[11px] text-warning font-medium">Unsaved edits</span>
          )}
          {saving && (
            <span className="text-[11px] text-muted-foreground">Saving…</span>
          )}
        </div>
        <Textarea
          value={draftText}
          onChange={e => setDraftText(e.target.value)}
          onBlur={isDirty ? handleSave : undefined}
          disabled={busy}
          rows={14}
          className="text-[14px] leading-relaxed resize-none"
          placeholder="Draft will appear here…"
        />
        <p className="mt-1.5 text-[11px] text-muted-foreground">{draftText.length} characters · Edits save on blur</p>
      </Card>

      {/* Character count advisory */}
      {draftText.length > 3000 && (
        <Alert variant="warning">
          <AlertDescription>
            LinkedIn limits posts to 3,000 characters. This draft is {draftText.length} characters -- trim before posting.
          </AlertDescription>
        </Alert>
      )}

      {/* Short-form council helper */}
      <Card id="content-checker" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Run Short-Form Council Check</p>
            <p className="text-[12px] text-muted-foreground mt-1">Server-enforced council gate for posts under 1200 characters.</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={emotionalAngle} onValueChange={v => setEmotionalAngle(v as EmotionalAngle)}>
              <SelectTrigger title="Primary emotional angle" aria-label="Primary emotional angle">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOWED_EMOTIONAL_ANGLES.map(angle => (
                  <SelectItem key={angle} value={angle}>{angle.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={handleRunShortFormCouncilCheck}
              disabled={!draftText.trim() || councilChecking}
            >
              {councilChecking ? 'Checking…' : 'Run Short-Form Council Check'}
            </Button>
          </div>
        </div>

        {councilCheck && (
          <div className="mt-4 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[12px] font-bold text-foreground">Score {councilCheck.score}/100</span>
              <Badge variant="secondary">{councilCheck.characterCount} chars</Badge>
              {councilCheck.emotionalAngle && (
                <Badge variant="info">Angle: {councilCheck.emotionalAngle.replace('_', ' ')}</Badge>
              )}
              <Badge variant={
                councilCheck.recommendation === 'publish'
                  ? 'success'
                  : councilCheck.recommendation === 'revise'
                    ? 'warning'
                    : 'destructive'
              }>
                {councilCheck.recommendation === 'publish' ? 'Publish' : councilCheck.recommendation === 'revise' ? 'Revise' : 'Rewrite opening'}
              </Badge>
              <Badge variant={councilCheck.councilPass ? 'success' : 'destructive'}>
                {councilCheck.councilPass ? 'Council pass' : 'Council fail'}
              </Badge>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              <p className="text-[11px] text-muted-foreground">Hook: <span className="font-semibold text-foreground">{councilCheck.categories.hook}/25</span></p>
              <p className="text-[11px] text-muted-foreground">Specificity: <span className="font-semibold text-foreground">{councilCheck.categories.specificity}/20</span></p>
              <p className="text-[11px] text-muted-foreground">Credibility: <span className="font-semibold text-foreground">{councilCheck.categories.credibility}/20</span></p>
              <p className="text-[11px] text-muted-foreground">Wit: <span className="font-semibold text-foreground">{councilCheck.categories.wit}/15</span></p>
              <p className="text-[11px] text-muted-foreground">Compression: <span className="font-semibold text-foreground">{councilCheck.categories.compression}/10</span></p>
              <p className="text-[11px] text-muted-foreground">CTA: <span className="font-semibold text-foreground">{councilCheck.categories.cta}/10</span></p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
              <p className="text-[11px] text-muted-foreground">Under 1200: <span className="font-semibold text-foreground">{councilCheck.checks.under1200 ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">One core idea: <span className="font-semibold text-foreground">{councilCheck.checks.oneCoreIdea ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">One CTA: <span className="font-semibold text-foreground">{councilCheck.checks.oneCta ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">One humor line max: <span className="font-semibold text-foreground">{councilCheck.checks.oneHumorLineMax ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">Real detail present: <span className="font-semibold text-foreground">{councilCheck.checks.realDetail ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">Honest claim: <span className="font-semibold text-foreground">{councilCheck.checks.honestClaim ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">Angle selected: <span className="font-semibold text-foreground">{councilCheck.checks.emotionalAnglePresent ? 'PASS' : 'FAIL'}</span></p>
              <p className="text-[11px] text-muted-foreground">Angle rotated: <span className="font-semibold text-foreground">{councilCheck.checks.emotionalAngleRotation ? 'PASS' : 'FAIL'}</span></p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-muted-foreground mb-1">Top fixes</p>
              <ul className="list-disc pl-5 text-[11px] text-muted-foreground space-y-1">
                {councilCheck.topFixes.map(fix => (
                  <li key={fix}>{fix}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          onClick={handlePost}
          disabled={busy || !draftText.trim() || post.is_posted}
          className="flex-1"
        >
          {posting ? 'Posting…' : 'Post to LinkedIn'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={handleCopy}
          disabled={busy || !draftText.trim()}
          className="flex-1"
        >
          {copied ? 'Copied!' : 'Copy to clipboard'}
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          render={<a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer" />}
          variant="outline"
          className="flex-1"
        >
          Open LinkedIn
        </Button>
        {!post.is_posted ? (
          <Button
            type="button"
            variant="outline"
            onClick={handleMarkPosted}
            disabled={busy}
            className="flex-1 text-success border-success/30 bg-success/10"
          >
            {markingPosted ? 'Saving…' : 'Mark posted (manual)'}
          </Button>
        ) : (
          <div className="flex-1 text-center text-[13px] font-semibold text-success border border-success/30 rounded px-5 py-3 bg-success/10">
            Posted
          </div>
        )}
      </div>

      {/* Approved article handoff */}
      <Card className="p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Handoff approved article</p>
            <p className="text-[12px] text-muted-foreground mt-1">
              One click queues approved variants into upcoming open social slots.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddCalendarReminder}>
                Add calendar reminder (.ics)
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={handleAddGoogleCalendarReminder}>
                Add to Google Calendar
              </Button>
              {calendarReminderSaved && (
                <span className="text-[11px] text-success">Downloaded</span>
              )}
              {googleCalendarOpened && (
                <span className="text-[11px] text-success">Opened</span>
              )}
            </div>
          </div>
          <Badge variant={isApproved ? 'success' : 'warning'}>
            {isApproved ? 'Current draft approved' : 'Current draft not approved'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="block text-[11px] font-semibold text-muted-foreground mb-1">Article title</Label>
            <Input
              value={handoffTitle}
              onChange={e => setHandoffTitle(e.target.value)}
              placeholder="Context rebuild and executive transitions"
            />
          </div>
          <div>
            <Label className="block text-[11px] font-semibold text-muted-foreground mb-1">Article URL (optional)</Label>
            <Input
              value={handoffUrl}
              onChange={e => setHandoffUrl(e.target.value)}
              placeholder="https://startingmonday.app/blog/..."
            />
          </div>
          <div>
            <Label className="block text-[11px] font-semibold text-muted-foreground mb-1">Pillar</Label>
            <Select value={handoffPillar} onValueChange={v => setHandoffPillar(v as (typeof PILLAR_OPTIONS)[number]['value'])}>
              <SelectTrigger title="Select pillar" aria-label="Select pillar" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PILLAR_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block text-[11px] font-semibold text-muted-foreground mb-1">Audience (optional)</Label>
            <Input
              value={handoffAudience}
              onChange={e => setHandoffAudience(e.target.value)}
              placeholder="executive_coaches"
            />
          </div>
        </div>

        <div className="mt-3">
          <Label className="block text-[11px] font-semibold text-muted-foreground mb-1">Article summary</Label>
          <Textarea
            value={handoffSummary}
            onChange={e => setHandoffSummary(e.target.value)}
            rows={4}
            className="resize-none"
            placeholder="Paste the approved article summary or leave the draft-derived default."
          />
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-end sm:justify-between">
          <Label className="flex-col items-start text-[11px] font-semibold text-muted-foreground">
            Variant count (1-5)
            <Input
              type="number"
              min={1}
              max={5}
              value={handoffVariants}
              onChange={e => setHandoffVariants(Number(e.target.value || 3))}
              className="mt-1 w-32"
            />
          </Label>

          <Button
            type="button"
            onClick={handleApprovedHandoff}
            disabled={busy || !handoffSummary.trim()}
            className="bg-success text-primary-foreground hover:bg-success/80"
          >
            {handoffSubmitting ? 'Queueing…' : 'Handoff approved article'}
          </Button>
        </div>

        {handoffMessage && (
          <Alert variant="success" className="mt-3">
            <AlertDescription>{handoffMessage}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 border-t border-border pt-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Recent handoff runs</p>
            {handoffHistoryLoading && <span className="text-[11px] text-muted-foreground">Loading…</span>}
          </div>

          {!handoffHistoryLoading && handoffHistory.length === 0 && (
            <p className="text-[12px] text-muted-foreground">No approved handoff runs yet.</p>
          )}

          {handoffHistory.length > 0 && (
            <div className="flex flex-col gap-2">
              {handoffHistory.slice(0, 5).map(run => (
                <Card key={run.batchId} className="p-3 bg-muted">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="text-[12px] font-semibold text-foreground truncate">
                      {run.articleTitle || 'Approved handoff'}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                    </p>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Queued dates: {run.dates.map(date => formatDate(date)).join(', ')}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Connection outreach */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">LinkedIn Connection Messages</p>
          <div className="flex gap-2">
            <Button render={<a href={LINKEDIN_MESSAGING_URL} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm">
              Open Messaging
            </Button>
            <Button render={<a href={LINKEDIN_MYNETWORK_URL} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm">
              My Network
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          {CONNECTION_TEMPLATES.map((template, i) => (
            <Card key={template.label} className="p-4 bg-muted">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.07em]">{template.label}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => handleCopyTemplate(i)}>
                  {copiedTemplate === i ? 'Copied!' : 'Copy'}
                </Button>
              </div>
              <Textarea
                value={connectionTexts[i]}
                onChange={e => setConnectionTexts(prev => prev.map((t, j) => j === i ? e.target.value : t))}
                rows={3}
                title={template.label}
                placeholder="Edit connection message…"
                className="leading-relaxed resize-none bg-card"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">{connectionTexts[i].length} chars</p>
            </Card>
          ))}
        </div>
      </Card>

      {/* Notes */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-muted-foreground">Notes (engagement, replies, reach)</p>
          {isNotesDirty && !savingNotes && (
            <span className="text-[11px] text-warning font-medium">Unsaved</span>
          )}
          {savingNotes && (
            <span className="text-[11px] text-muted-foreground">Saving…</span>
          )}
        </div>
        <Textarea
          value={notesText}
          onChange={e => setNotesText(e.target.value)}
          onBlur={isNotesDirty ? handleNotesSave : undefined}
          disabled={busy}
          rows={3}
          className="leading-relaxed resize-none"
          placeholder="Likes, comments, notable replies… saves on blur"
        />
      </Card>

    </div>
  )
}
