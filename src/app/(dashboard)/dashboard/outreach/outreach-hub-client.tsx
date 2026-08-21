'use client'

import { useEffect, useMemo, useState } from 'react'
import { detectLegacyTemplateCopy } from '@/lib/outreach/legacy-copy-guard'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, Checkbox, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, ToggleGroup, ToggleGroupItem } from '@/components/ui'
const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'reached_out', label: 'Reached Out' },
  { value: 'in_conversation', label: 'In Conversation' },
  { value: 'meeting_scheduled', label: 'Meeting Set' },
  { value: 'closed', label: 'Closed' },
]

const CHANNEL_OPTIONS = [
  { value: 'executives', label: 'Executives' },
  { value: 'search_firms', label: 'Search Firms' },
  { value: 'coaches', label: 'Coaches' },
  { value: 'outplacement_firms', label: 'Outplacement Firms' },
] as const

const CONFIDENCE_OPTIONS = [
  { value: 'high', label: 'High Confidence' },
  { value: 'medium', label: 'Medium Confidence' },
  { value: 'low', label: 'Low Confidence' },
  { value: 'all', label: 'All Confidence' },
] as const

const FOLLOW_UP_BATCH_SIZE = 5
const FOLLOW_UP_BATCH_DELAY_MS = 1250
const FOLLOW_UP_RETRY_DELAY_MS = 1500
const COACH_WORKSHEET_URL = 'https://startingmonday.app/for-coaches/coach-prep-worksheet'
const FOLLOW_UP_MAX_ATTEMPTS = 2
const FOLLOW_UP_CAMPAIGN_STEP = 'followup_bulk_v1'
const FOLLOW_UP_POLL_INITIAL_DELAY_MS = 1500
const FOLLOW_UP_POLL_MAX_DELAY_MS = 10000
const FOLLOW_UP_POLL_TIMEOUT_MS = 180000

type ProspectRow = {
  fullName: string
  roleBucket: string
  company: string
  email: string
  emailConfidence: 'high' | 'medium' | 'low'
  status: string
  followUpSent: boolean
  hasLiveOutreach: boolean
  emailOpening: string
  emailBodyCore: string
  defaultSubject: string
  defaultBody: string
  outreachChannel: 'executives' | 'search_firms' | 'coaches' | 'outplacement_firms'
  fitTier: 'strong' | 'medium'
  personaFocus: string
  campaignTag?: 'coach_day1_60'
}

type Props = {
  rows: ProspectRow[]
  fromAddressLabel: string
  buildVersion: string
}

type ErrorDisplay = {
  title: string
  detail: string
  rawReason?: string
}

type BatchStatusSummary = {
  totalJobs: number
  queuedJobs: number
  sendingJobs: number
  acceptedJobs: number
  deliveredJobs: number
  bouncedJobs: number
  complainedJobs: number
  repliedJobs: number
  failedJobs: number
  completedJobs: number
  failedRecipients: Array<{ jobId: string; recipientEmail: string; code: string; message: string }>
}

export { detectLegacyTemplateCopy }

function legacyCopyBlockedError(hits: string[]): ErrorDisplay {
  return {
    title: 'Legacy draft blocked',
    detail: 'Legacy outreach copy markers were detected in this draft. Sending is blocked to prevent stale templates from going out.',
    rawReason: hits.join(', '),
  }
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>
    }
    return null
  } catch {
    return null
  }
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : []
}

async function readApiPayload(response: Response): Promise<{ payload: Record<string, unknown>; fallbackError: string }> {
  const fallbackError = `Request failed (${response.status})`
  const rawText = await response.text().catch(() => '')

  if (!rawText.trim()) {
    return { payload: {}, fallbackError }
  }

  const parsed = parseJsonObject(rawText)
  if (parsed) {
    return { payload: parsed, fallbackError }
  }

  return {
    payload: { error: `${fallbackError}: ${rawText.trim().slice(0, 220)}` },
    fallbackError,
  }
}

function isHtmlErrorPayload(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.includes('<!doctype html') || normalized.includes('<html')
}

function isTransientFollowUpError(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized.includes('request failed (502)')
    || normalized.includes('request failed (503)')
    || normalized.includes('request failed (504)')
    || normalized.includes('internal server error')
    || isHtmlErrorPayload(normalized)
}

function normalizeFollowUpFailureReason(value: string): string {
  if (isHtmlErrorPayload(value)) {
    return 'Send route returned an HTML 502/503 page instead of JSON.'
  }

  return value
}

export function formatOutreachErrorMessage(error: string | null | undefined, sendMode: 'dry_run' | 'test_to_self' | 'live'): ErrorDisplay {
  const normalized = (error ?? '').trim()

  if (!normalized) {
    return {
      title: 'Email was not sent',
      detail: sendMode === 'test_to_self'
        ? 'The test email did not go out. Review the message and try again.'
        : 'The outreach message did not go out. Review the details below and try again.',
    }
  }

  if (normalized.toLowerCase().startsWith('blocked by email council gate:')) {
    return {
      title: 'Send blocked before delivery',
      detail: 'This draft did not meet the live email quality gate, so no email was sent. Tighten the copy and run a test to yourself before sending live.',
      rawReason: normalized,
    }
  }

  if (normalized === 'Recipient is suppressed. Remove suppression before sending.') {
    return {
      title: 'Recipient is suppressed',
      detail: 'This contact is currently blocked from outreach. Remove the suppression entry before trying again.',
    }
  }

  if (normalized === 'Could not resolve test recipient email.') {
    return {
      title: 'Test send could not start',
      detail: 'Your account email could not be resolved for Send Test To Me. Confirm your signed-in user has a valid email address.',
    }
  }

  if (normalized === 'OUTREACH_FROM_ADDRESS must use richard@startingmonday.app.') {
    return {
      title: 'Sender configuration error',
      detail: 'The outreach sender is misconfigured in the environment. No email was sent.',
    }
  }

  return {
    title: 'Email was not sent',
    detail: sendMode === 'test_to_self'
      ? 'The test email failed before delivery.'
      : 'The outreach email failed before delivery.',
    rawReason: normalized,
  }
}

function followUpIdempotencyKey(row: ProspectRow): string {
  return `${FOLLOW_UP_CAMPAIGN_STEP}:${row.email.toLowerCase()}`
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

async function sendFollowUpRequest(target: ProspectRow, mode: 'dry_run' | 'test_to_self' | 'live', batchId: string) {
  const res = await fetch('/api/outreach/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: target.fullName,
      company: target.company,
      roleBucket: target.roleBucket,
      emailTo: target.email,
      statusAfter: 'reached_out',
      mode,
      outreachChannel: target.outreachChannel,
      fitTier: target.fitTier,
      personaFocus: target.personaFocus,
      useLatestTemplateDraft: true,
      templateStep: 'followup_1',
      campaignStep: FOLLOW_UP_CAMPAIGN_STEP,
      idempotencyKey: followUpIdempotencyKey(target),
      batchId,
    }),
  })

  const { payload, fallbackError } = await readApiPayload(res)

  if (!res.ok) {
    const reason = typeof payload.error === 'string' && payload.error.trim().length > 0
      ? payload.error
      : fallbackError
    return {
      ok: false as const,
      duplicate: false,
      reason,
      transient: isTransientFollowUpError(reason),
      batchId: null,
    }
  }

  return {
    ok: true as const,
    duplicate: payload.duplicate === true,
    reason: '',
    transient: false,
    batchId: typeof payload.batchId === 'string' ? payload.batchId : null,
  }
}

async function sendFollowUpWithRetry(target: ProspectRow, mode: 'dry_run' | 'test_to_self' | 'live', batchId: string) {
  for (let attempt = 1; attempt <= FOLLOW_UP_MAX_ATTEMPTS; attempt += 1) {
    const result = await sendFollowUpRequest(target, mode, batchId)
    if (result.ok || !result.transient || attempt === FOLLOW_UP_MAX_ATTEMPTS) {
      return result
    }

    await sleep(FOLLOW_UP_RETRY_DELAY_MS)
  }

  return {
    ok: false as const,
    duplicate: false,
    reason: 'Unknown follow-up retry failure.',
    transient: false,
    batchId: null,
  }
}

async function pollOutreachBatchStatus(batchId: string): Promise<{ ok: true; status: string; summary: BatchStatusSummary } | { ok: false; reason: string }> {
  const startedAt = Date.now()
  let delayMs = FOLLOW_UP_POLL_INITIAL_DELAY_MS

  while (Date.now() - startedAt < FOLLOW_UP_POLL_TIMEOUT_MS) {
    const res = await fetch(`/api/outreach/send/batch-status?batchId=${encodeURIComponent(batchId)}`, {
      method: 'GET',
      cache: 'no-store',
    })
    const { payload, fallbackError } = await readApiPayload(res)
    if (!res.ok) {
      return {
        ok: false,
        reason: typeof payload.error === 'string' && payload.error.trim().length > 0 ? payload.error : fallbackError,
      }
    }

    const status = typeof payload.status === 'string' ? payload.status : 'queued'
    const summary = (payload.summary ?? {}) as BatchStatusSummary
    if (status === 'completed' || status === 'completed_with_failures') {
      return { ok: true, status, summary }
    }

    await sleep(delayMs)
    delayMs = Math.min(Math.floor(delayMs * 1.5), FOLLOW_UP_POLL_MAX_DELAY_MS)
  }

  return { ok: false, reason: 'Timed out waiting for batch completion.' }
}

function prefillForRow(row: ProspectRow): { subject: string; body: string } {
  void row
  return {
    subject: '',
    body: '',
  }
}

function statusBadgeVariant(status: string): 'info' | 'warning' | 'success' | 'secondary' {
  if (status === 'reached_out') return 'info'
  if (status === 'in_conversation') return 'warning'
  if (status === 'meeting_scheduled') return 'success'
  return 'secondary'
}

function statusText(status: string): string {
  const hit = STATUS_OPTIONS.find(s => s.value === status)
  return hit?.label ?? 'Prospect'
}

export function OutreachHubClient({ rows, fromAddressLabel, buildVersion }: Props) {
  const [items, setItems] = useState(rows)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [confidenceFilter, setConfidenceFilter] = useState<'all' | 'high' | 'medium' | 'low'>('high')
  const [activeChannel, setActiveChannel] = useState<'executives' | 'search_firms' | 'coaches' | 'outplacement_firms'>('executives')
  const [activeCampaign, setActiveCampaign] = useState<'all' | 'coach_day1_60'>('all')
  const [selectedIndex, setSelectedIndex] = useState<number>(0)
  const [subject, setSubject] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sendMode, setSendMode] = useState<'dry_run' | 'test_to_self' | 'live'>('dry_run')
  const [confirmLive, setConfirmLive] = useState(false)
  const [sending, setSending] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)
  const [sendingFollowUps, setSendingFollowUps] = useState(false)
  const [suppressing, setSuppressing] = useState(false)
  const [saveBusyEmail, setSaveBusyEmail] = useState<string | null>(null)
  const [error, setError] = useState<ErrorDisplay | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [guardrailWarnings, setGuardrailWarnings] = useState<string[]>([])
  const [guardrailViolations, setGuardrailViolations] = useState<string[]>([])
  const [googleFollowUp3Url, setGoogleFollowUp3Url] = useState<string | null>(null)
  const [googleFollowUp7Url, setGoogleFollowUp7Url] = useState<string | null>(null)

  function insertCoachWorksheetLink() {
    setMessageText((current) => {
      const normalized = current.replace(/\r\n/g, '\n').trim()
      if (normalized.includes(COACH_WORKSHEET_URL)) return current

      const linkLine = `Here is the one-page coach prep worksheet: ${COACH_WORKSHEET_URL}`
      if (!normalized) return linkLine
      return `${normalized}\n\n${linkLine}`
    })
  }

  // Load current Supabase contact status for all rows on mount
  useEffect(() => {
    const emails = rows.map(r => r.email)
    if (emails.length === 0) return

    fetch('/api/outreach/current-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emails }),
    })
      .then(res => res.json())
      .then(data => {
        const statusByEmail = data.statusByEmail ?? {}
        const merged = rows.map(r => {
          const dbStatus = statusByEmail[r.email]
          return {
            ...r,
            status: dbStatus?.outreach_status ?? r.status,
          }
        })
        setItems(merged)
      })
      .catch(err => console.error('Failed to fetch current statuses:', err))
  }, [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter((r) => {
      const matchesChannel = r.outreachChannel === activeChannel
      const matchesCampaign = activeCampaign === 'all' || r.campaignTag === activeCampaign
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      const matchesConfidence = confidenceFilter === 'all' || r.emailConfidence === confidenceFilter
      const matchesQuery = !q
        || r.fullName.toLowerCase().includes(q)
        || r.company.toLowerCase().includes(q)
        || r.roleBucket.toLowerCase().includes(q)
        || r.email.toLowerCase().includes(q)
      return matchesChannel && matchesCampaign && matchesStatus && matchesConfidence && matchesQuery
    })
  }, [items, search, statusFilter, confidenceFilter, activeChannel, activeCampaign])

  const selected = filtered[selectedIndex] ?? filtered[0] ?? null
  const isCoachComposer = selected?.outreachChannel === 'coaches'
  const followUpTargets = useMemo(() => items.filter(r => r.status === 'reached_out' && !r.followUpSent && r.hasLiveOutreach), [items])

  async function hydrateTemplateForRow(row: ProspectRow) {
    setTemplateLoading(true)
    setSubject('')
    setMessageText('')
    try {
      const response = await fetch('/api/outreach/template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: row.fullName,
          company: row.company,
          roleBucket: row.roleBucket,
          outreachChannel: row.outreachChannel,
          personaFocus: row.personaFocus,
          templateStep: 'first_touch',
        }),
      })

      const { payload } = await readApiPayload(response)
      if (!response.ok) {
        setError({
          title: 'Template refresh failed',
          detail: 'Could not load the latest server template for this row. Sending is blocked until template refresh succeeds.',
        })
        return
      }

      const nextSubject = typeof payload.subject === 'string' ? payload.subject : ''
      const nextBody = typeof payload.body === 'string' ? payload.body : ''
      if (nextSubject.trim() && nextBody.trim()) {
        setSubject(nextSubject)
        setMessageText(nextBody)
        setError(null)
      }
    } finally {
      setTemplateLoading(false)
    }
  }

  useEffect(() => {
    const row = filtered[selectedIndex] ?? filtered[0]
    if (!row) return
    void hydrateTemplateForRow(row)
    setGuardrailWarnings([])
    setSuccess(null)
  }, [filtered, selectedIndex])

  function resetComposerFor(index: number) {
    const next = filtered[index]
    if (!next) return
    setSelectedIndex(index)
    void hydrateTemplateForRow(next)
    setError(null)
    setGuardrailWarnings([])
    setSuccess(null)
    setGuardrailViolations([])
    setGoogleFollowUp3Url(null)
    setGoogleFollowUp7Url(null)
    setConfirmLive(false)
  }

  async function updateStatus(email: string, fullName: string, company: string, status: string) {
    setSaveBusyEmail(email)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/outreach/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, fullName, company, status }),
    })
    const { payload, fallbackError } = await readApiPayload(res)

    setSaveBusyEmail(null)

    if (!res.ok) {
      setError({
        title: 'Status update failed',
        detail: (payload.error as string) ?? fallbackError,
      })
      return
    }

    setItems(prev => prev.map((r) => (r.email === email ? { ...r, status } : r)))
    setSuccess(`Updated status for ${fullName}.`)
  }

  async function sendSelected() {
    if (!selected || sending) return

    const staleHits = detectLegacyTemplateCopy(subject, messageText)
    if (staleHits.length > 0) {
      setError(legacyCopyBlockedError(staleHits))
      setGuardrailWarnings([`Legacy markers detected: ${staleHits.join(', ')}`])
      setSuccess(null)
      return
    }

    setSending(true)
    setError(null)
    setSuccess(null)
    setGuardrailWarnings([])
    setGuardrailViolations([])

    const res = await fetch('/api/outreach/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: selected.fullName,
        company: selected.company,
        roleBucket: selected.roleBucket,
        emailTo: selected.email,
        subject,
        messageText,
        statusAfter: 'reached_out',
        mode: sendMode,
        outreachChannel: selected.outreachChannel,
        fitTier: selected.fitTier,
        personaFocus: selected.personaFocus,
      }),
    })

    const { payload: data, fallbackError } = await readApiPayload(res)
    setSending(false)

    if (!res.ok) {
      const violations = toStringList(data.violations)
      const warnings = toStringList(data.warnings)
      setGuardrailViolations(violations)
      setGuardrailWarnings(warnings)
      const resolvedError = typeof data.error === 'string' && data.error.trim().length > 0
        ? data.error
        : fallbackError
      setError(formatOutreachErrorMessage(resolvedError, sendMode))
      return
    }

    const warnings = toStringList(data.warnings)
    setGuardrailWarnings(warnings)

    const maybeGoogle3 = typeof data.googleFollowUp3Url === 'string' ? data.googleFollowUp3Url : null
    const maybeGoogle7 = typeof data.googleFollowUp7Url === 'string' ? data.googleFollowUp7Url : null
    setGoogleFollowUp3Url(maybeGoogle3)
    setGoogleFollowUp7Url(maybeGoogle7)

    if (sendMode === 'live') {
      setSuccess(`Queued live send to ${selected.fullName} from ${fromAddressLabel}. Delivery updates will appear as webhooks arrive.`)
      setConfirmLive(false)
    } else if (sendMode === 'test_to_self') {
      setSuccess('Queued test email to your own inbox. Review rendering and tone before live send.')
    } else {
      setSuccess('Dry run complete. No email was sent.')
    }
  }

  async function suppressSelected() {
    if (!selected || suppressing) return

    setSuppressing(true)
    setError(null)
    setSuccess(null)

    const res = await fetch('/api/outreach/suppression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: selected.email,
        reason: 'manual suppression from outreach hub',
        source: 'manual',
      }),
    })
    const { payload, fallbackError } = await readApiPayload(res)

    setSuppressing(false)

    if (!res.ok) {
      setError({
        title: 'Suppression update failed',
        detail: (payload.error as string) ?? fallbackError,
      })
      return
    }

    setItems(prev => prev.map((r) => (r.email === selected.email ? { ...r, status: 'closed' } : r)))
    setSuccess(`Suppressed ${selected.fullName}. Future sends are blocked until unsuppressed.`)
  }

  async function sendCrossChannelFollowUps() {
    if (sendingFollowUps) return
    if (followUpTargets.length === 0) {
      setError({
        title: 'No follow-up targets',
        detail: 'No contacts are currently marked Reached Out across channels.',
      })
      return
    }

    if (sendMode === 'live') {
      const confirmed = window.confirm(`Send follow-up emails to ${followUpTargets.length} reached-out contacts across all channels?`)
      if (!confirmed) return
    }

    setSendingFollowUps(true)
    setError(null)
    setSuccess(null)
    setGuardrailWarnings([])
    setGuardrailViolations([])

    let queuedCount = 0
    let preflightBlockedCount = 0
    let duplicateCount = 0
    const failures: string[] = []
    const sendQueue: ProspectRow[] = []
    const sharedBatchId = globalThis.crypto?.randomUUID?.() ?? `followup_${Date.now()}`
    let resolvedBatchId: string | null = null

    for (const target of followUpTargets) {
      const preflightRes = await fetch('/api/outreach/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: target.fullName,
          company: target.company,
          roleBucket: target.roleBucket,
          emailTo: target.email,
          statusAfter: 'followup_1_sent',
          mode: 'dry_run',
          outreachChannel: target.outreachChannel,
          fitTier: target.fitTier,
          personaFocus: target.personaFocus,
          useLatestTemplateDraft: true,
          templateStep: 'followup_1',
          campaignStep: FOLLOW_UP_CAMPAIGN_STEP,
          idempotencyKey: followUpIdempotencyKey(target),
        }),
      })

      const { payload: preflightPayload, fallbackError: preflightFallback } = await readApiPayload(preflightRes)
      if (!preflightRes.ok) {
        const reason = typeof preflightPayload.error === 'string' && preflightPayload.error.trim().length > 0
          ? preflightPayload.error
          : preflightFallback
        preflightBlockedCount += 1
        failures.push(`${target.fullName}: ${reason}`)
        continue
      }

      sendQueue.push(target)
    }

    if (sendMode === 'dry_run') {
      setSendingFollowUps(false)
      if (preflightBlockedCount > 0) {
        setError({
          title: 'Dry run found blocked follow-ups',
          detail: `${sendQueue.length} ready, ${preflightBlockedCount} blocked in preflight across all channels.`,
          rawReason: failures.slice(0, 4).join(' | '),
        })
      } else {
        setSuccess(`Dry run passed for ${sendQueue.length} follow-up emails across all channels.`)
      }
      return
    }

    for (let i = 0; i < sendQueue.length; i += FOLLOW_UP_BATCH_SIZE) {
      const batch = sendQueue.slice(i, i + FOLLOW_UP_BATCH_SIZE)

      const batchResults = await Promise.all(batch.map(async (target) => {
        const result = await sendFollowUpWithRetry(target, sendMode, sharedBatchId)
        if (!result.ok) {
          return {
            ok: false,
            duplicate: false,
            reason: `${target.fullName}: ${normalizeFollowUpFailureReason(result.reason)}`,
            batchId: null as string | null,
          }
        }

        return { ok: true, duplicate: result.duplicate, reason: '', batchId: result.batchId }
      }))

      for (const result of batchResults) {
        if (!result.ok) {
          failures.push(result.reason)
          continue
        }
        if (result.duplicate) {
          duplicateCount += 1
          continue
        }
        queuedCount += 1
        if (result.batchId) {
          resolvedBatchId = result.batchId
        }
      }

      if (i + FOLLOW_UP_BATCH_SIZE < sendQueue.length) {
        await sleep(FOLLOW_UP_BATCH_DELAY_MS)
      }
    }

    if (queuedCount === 0) {
      setSendingFollowUps(false)
      if (failures.length > 0) {
        setError({
          title: 'No follow-ups were queued',
          detail: `${duplicateCount} duplicates skipped and ${preflightBlockedCount} preflight blocks across ${followUpTargets.length} targets in ${sendMode} mode.`,
          rawReason: failures.slice(0, 4).join(' | '),
        })
        return
      }

      setSuccess(`No new follow-ups queued. ${duplicateCount} duplicate sends were skipped.`)
      return
    }

    if (!resolvedBatchId) {
      setSendingFollowUps(false)
      setError({
        title: 'Batch tracking failed',
        detail: 'Follow-up jobs were queued, but no batch id was returned for status tracking.',
      })
      return
    }

    setSuccess(`Queued ${queuedCount} follow-up emails. Waiting for delivery processing...`)
    const batchStatus = await pollOutreachBatchStatus(resolvedBatchId)
    setSendingFollowUps(false)

    if (!batchStatus.ok) {
      setError({
        title: 'Batch status unavailable',
        detail: `Queued ${queuedCount} follow-ups, but could not confirm completion.`,
        rawReason: batchStatus.reason,
      })
      return
    }

    const summary = batchStatus.summary
    if (summary.failedJobs > 0 || failures.length > 0) {
      const workerFailures = (summary.failedRecipients ?? []).map(item => `${item.recipientEmail}: ${item.message}`)
      setError({
        title: 'Some follow-ups failed',
        detail: `Queued ${queuedCount}; processed ${summary.completedJobs}/${summary.totalJobs}. Failed ${summary.failedJobs}, duplicates ${duplicateCount}, preflight blocks ${preflightBlockedCount}.`,
        rawReason: [...failures, ...workerFailures].slice(0, 4).join(' | '),
      })
      return
    }

    const sentEmails = new Set(sendQueue.map((row) => row.email))
    setItems(prev => prev.map((row) => (sentEmails.has(row.email) ? { ...row, followUpSent: true } : row)))

    const deliveredLike = summary.deliveredJobs + summary.acceptedJobs + summary.repliedJobs
    setSuccess(`Completed follow-up batch: ${deliveredLike} accepted/delivered/replied, ${summary.bouncedJobs} bounced, ${summary.complainedJobs} complained. ${duplicateCount > 0 ? `${duplicateCount} duplicates were skipped.` : ''}`.trim())
  }


  const staleComposerHits = useMemo(() => detectLegacyTemplateCopy(subject, messageText), [subject, messageText])
  const staleBlocked = staleComposerHits.length > 0
  const liveBlocked = sendMode === 'live' && !confirmLive

  const channelToggleValue = activeChannel === 'coaches' && activeCampaign === 'coach_day1_60'
    ? 'coaches:day1'
    : activeChannel

  return (
    <Card className="overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-[16px] font-bold text-foreground">Send Queue</h2>
        <p className="text-[12px] text-muted-foreground mt-1">Defaults to high-confidence emails. Filter by confidence and status, review content, then send from {fromAddressLabel}.</p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ToggleGroup
            value={[channelToggleValue]}
            onValueChange={(values) => {
              const next = values[0]
              if (!next) return
              if (next === 'coaches:day1') {
                setActiveChannel('coaches')
                setActiveCampaign('coach_day1_60')
              } else {
                setActiveChannel(next as typeof activeChannel)
                setActiveCampaign('all')
              }
              setSelectedIndex(0)
              setSearch('')
            }}
            className="flex-wrap gap-2"
          >
            {CHANNEL_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} variant="outline" className="text-[12px] font-semibold px-3 py-1.5 h-auto bg-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:border-border">
                {option.label}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem value="coaches:day1" variant="outline" className="text-[12px] font-semibold px-3 py-1.5 h-auto bg-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:border-primary/30">
              Day 1 Coach List (60)
            </ToggleGroupItem>
          </ToggleGroup>
          <Button
            onClick={sendCrossChannelFollowUps}
            disabled={sendingFollowUps || sending || suppressing}
            className="text-[12px] px-3 py-1.5 h-auto"
            title="Send follow-up emails to all reached-out contacts across all channels"
          >
            {sendingFollowUps
              ? 'Sending Follow-ups...'
              : `Send First Follow-Ups (Eligible${followUpTargets.length > 0 ? `: ${followUpTargets.length}` : ''})`}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] min-h-[640px]">
        <div className="border-r border-border">
          <div className="px-4 py-3 border-b border-border flex flex-wrap gap-2">
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setSelectedIndex(0)
              }}
              placeholder="Search name, company, role, email"
              className="flex-1 min-w-[220px] text-[13px]"
            />
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                if (value == null) return
                setStatusFilter(value)
                setSelectedIndex(0)
              }}
            >
              <SelectTrigger aria-label="Filter prospects by status" title="Filter prospects by status" className="text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={confidenceFilter}
              onValueChange={(value) => {
                setConfidenceFilter(value as 'all' | 'high' | 'medium' | 'low')
                setSelectedIndex(0)
              }}
            >
              <SelectTrigger aria-label="Filter prospects by email confidence" title="Filter prospects by email confidence" className="text-[13px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONFIDENCE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-[13px] text-muted-foreground">No prospects match this channel, confidence, and status filter.</div>
            )}

            {filtered.map((row, idx) => (
              <button
                key={`${row.email}-${idx}`}
                onClick={() => resetComposerFor(idx)}
                className={[
                  'w-full text-left px-4 py-3 hover:bg-muted transition-colors',
                  selected?.email === row.email ? 'bg-muted' : 'bg-card',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{row.fullName}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{row.roleBucket} · {row.company}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">{row.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">{row.outreachChannel.replace('_', ' ')}</span>
                      <Badge variant={row.fitTier === 'strong' ? 'success' : 'warning'} className="text-[10px]">
                        {row.fitTier}
                      </Badge>
                      <Badge
                        variant={row.emailConfidence === 'high' ? 'success' : row.emailConfidence === 'medium' ? 'warning' : 'destructive'}
                        className="text-[10px] uppercase"
                      >
                        {row.emailConfidence}
                      </Badge>
                    </div>
                  </div>
                  <Badge variant={statusBadgeVariant(row.status)} className="text-[10px]">
                    {statusText(row.status)}
                  </Badge>
                </div>

                <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={row.status}
                    onValueChange={(value) => { if (value != null) updateStatus(row.email, row.fullName, row.company, value) }}
                    disabled={saveBusyEmail === row.email}
                  >
                    <SelectTrigger aria-label={`Set status for ${row.fullName}`} title={`Set status for ${row.fullName}`} size="sm" className="text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.filter(s => s.value !== 'all').map(option => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-[11px] text-muted-foreground">Review and send on right</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-3">
          {selected ? (
            <>
              <Card className="bg-muted p-3">
                <p className="text-[11px] text-muted-foreground">To</p>
                <p className="text-[13px] font-semibold text-foreground">{selected.fullName} ({selected.email})</p>
                <p className="text-[12px] text-muted-foreground mt-1">Channel: {selected.outreachChannel.replace('_', ' ')} · Fit: {selected.fitTier}</p>
                <p className="text-[12px] text-muted-foreground mt-1">Email confidence: {selected.emailConfidence}</p>
                <p className="text-[12px] text-muted-foreground mt-1">Persona focus: {selected.personaFocus}</p>
                <p className="text-[12px] text-muted-foreground mt-1">From: {fromAddressLabel}</p>
                <p className="text-[11px] text-muted-foreground mt-2">Template build: {buildVersion}</p>
              </Card>

              <div>
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground mb-1.5">Subject</Label>
                <Input
                  aria-label="Email subject"
                  title="Email subject"
                  placeholder="Subject line"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-[13px]"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Message</Label>
                  {isCoachComposer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={insertCoachWorksheetLink}
                      className="text-[11px] h-auto py-1"
                      title="Insert coach worksheet link"
                    >
                      Send worksheet
                    </Button>
                  )}
                </div>
                <Textarea
                  aria-label="Email message"
                  title="Email message"
                  placeholder="Review and edit message before sending"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  rows={16}
                  className="w-full text-[13px]"
                />
              </div>

              <Card className="bg-muted p-3 space-y-2">
                <Label className="block text-[11px] font-bold tracking-[0.08em] uppercase text-muted-foreground">Send Mode</Label>
                <Select
                  value={sendMode}
                  onValueChange={(value) => {
                    const next = value as 'dry_run' | 'test_to_self' | 'live'
                    setSendMode(next)
                    if (next !== 'live') setConfirmLive(false)
                  }}
                >
                  <SelectTrigger aria-label="Select send mode" title="Select send mode" className="w-full text-[13px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dry_run">Dry Run (no send)</SelectItem>
                    <SelectItem value="test_to_self">Send Test To Me</SelectItem>
                    <SelectItem value="live">Send Live To Prospect</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Start with Dry Run, then Send Test To Me, then Send Live.
                </p>
                {sendMode === 'live' && (
                  <Label className="flex items-start gap-2 text-[12px] text-muted-foreground font-normal normal-case tracking-normal">
                    <Checkbox
                      checked={confirmLive}
                      onCheckedChange={(checked) => setConfirmLive(checked === true)}
                      className="mt-0.5"
                    />
                    I reviewed this message and confirm it is personalized and ready for live send.
                  </Label>
                )}
              </Card>

              {guardrailViolations.length > 0 && (
                <Alert variant="destructive">
                  <AlertTitle>Guardrail violations</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc ml-5 space-y-1">
                      {guardrailViolations.map((v, i) => <li key={`v-${i}`}>{v}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {guardrailWarnings.length > 0 && (
                <Alert variant="warning">
                  <AlertTitle>Quality warnings</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc ml-5 space-y-1">
                      {guardrailWarnings.map((w, i) => <li key={`w-${i}`}>{w}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {staleBlocked && (
                <Alert variant="destructive">
                  <AlertTitle>Legacy template markers detected</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc ml-5 space-y-1">
                      {staleComposerHits.map((hit, i) => <li key={`legacy-${i}`}>{hit}</li>)}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>{error.title}</AlertTitle>
                  <AlertDescription>
                    <p>{error.detail}</p>
                    {error.rawReason && (
                      <p className="text-[11px] mt-2">Reason: {error.rawReason}</p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
              {success && <p className="text-[12px] text-success">{success}</p>}

              {(googleFollowUp3Url || googleFollowUp7Url) && (
                <Card className="bg-muted p-3">
                  <p className="text-[12px] font-semibold text-muted-foreground mb-2">Follow-up reminders created</p>
                  <div className="flex flex-wrap gap-2">
                    {googleFollowUp3Url && (
                      <Button variant="outline" size="sm" className="text-[12px] h-auto py-1.5" render={<a href={googleFollowUp3Url} target="_blank" rel="noreferrer" />}>
                        Add Follow-up 1 to Google Calendar
                      </Button>
                    )}
                    {googleFollowUp7Url && (
                      <Button variant="outline" size="sm" className="text-[12px] h-auto py-1.5" render={<a href={googleFollowUp7Url} target="_blank" rel="noreferrer" />}>
                        Add Follow-up 2 to Google Calendar
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              <Button
                onClick={sendSelected}
                disabled={sending || templateLoading || !subject.trim() || !messageText.trim() || liveBlocked || staleBlocked}
                className="w-full text-[13px]"
              >
                {sending
                  ? 'Processing...'
                  : templateLoading
                    ? 'Refreshing from server template...'
                    : sendMode === 'dry_run'
                      ? 'Run Dry Run Check'
                      : sendMode === 'test_to_self'
                        ? 'Send Test To Me'
                        : `Send Live To ${selected.fullName}`}
              </Button>

              <Button
                variant="outline"
                onClick={suppressSelected}
                disabled={suppressing}
                className="w-full text-[13px]"
              >
                {suppressing ? 'Updating...' : `Suppress ${selected.fullName}`}
              </Button>
            </>
          ) : (
            <p className="text-[13px] text-muted-foreground">Select a person to review and send.</p>
          )}
        </div>
      </div>
    </Card>
  )
}
