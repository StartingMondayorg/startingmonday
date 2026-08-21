import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import * as Sentry from '@sentry/nextjs'
import { classifyGraphStalls } from '@/lib/action-scores'
import { createClient } from '@/lib/supabase/server'
import { anthropic, MODELS, TEMP } from '@/lib/ai/anthropic'
import { logEvent } from '@/lib/events'
import { isEnabledFlag } from '@/lib/feature-flags'
import { greetingInTz } from '@/lib/date'
import { shouldShowFirstSessionGuidedBriefing } from '@/lib/onboarding/briefing-first-session'
import { logBriefingAction, saveBriefingDailyNote } from './actions'
import {
  applyDashboardSignalContract,
  DASHBOARD_COMPANY_SIGNAL_LIMIT,
  DASHBOARD_PATTERN_ALERT_LIMIT,
} from '@/lib/intelligence/dashboard-signal-contract'
import { LogoutButton } from '../logout-button'
import { HelpQuickButton } from '@/app/components/HelpQuickButton'
import { BriefingPulseSupport } from './BriefingPulseSupport'
import { BriefingHeader } from './BriefingHeader'
import { parseBriefingJson } from './briefing-json'
import { Alert, AlertDescription, AlertTitle, Badge, Button, Card, Progress, Skeleton, Tabs, TabsList, TabsTrigger } from '@/components/ui'
export const metadata = {
  title: 'Daily Briefing',
}

const SIGNAL_LABELS: Record<string, string> = {
  funding:        'Funding',
  exec_departure: 'Exec Departure',
  exec_hire:      'Exec Hire',
  acquisition:    'Acquisition',
  expansion:      'Expansion',
  layoffs:        'Layoffs',
  ipo:            'IPO',
  new_product:    'New Product',
  award:          'Award',
}

type BriefingJson = {
  subject?: string
  intro?: string
  signalAlerts?: { company: string; signalType: string; summary: string; angle?: string }[]
  matchInsights?: { company: string; roles: string[]; insight: string }[]
  followUpSuggestions?: { person: string; action: string; suggestion: string }[]
  closing?: string
}

type StallLaneSnapshot = {
  lane: 'signals' | 'pipeline' | 'preparation'
  state: 'healthy' | 'watch' | 'stalled'
  reason: string
}

type GeneratedBriefing = {
  briefing: BriefingJson
  usedFallback: boolean
  modelTier: 'haiku' | 'sonnet'
  fallbackReason: 'credits_exhausted' | 'json_parse_error' | 'timeout' | null
}

type WeeklyPulse = {
  state: 'building' | 'steady' | 'watch'
  label: string
  headline: string
  support: string
  whyNow: string
  ctaTarget: '/dashboard' | '/dashboard/signals' | '/dashboard/calendar'
  ctaLabel: string
  meterWidthClass: string
  mailtoHref: string
}

const BRIEFING_MATCH_LIMIT = 3
const BRIEFING_FOLLOW_UP_LIMIT = 3
const BRIEFING_SUMMARY_CHAR_LIMIT = 280
const BRIEFING_GENERATION_TIMEOUT_MS = 15_000
const BRIEFING_CACHE_TTL_MS = 10 * 60 * 1000

const briefingGenerationCache = new Map<string, { expiresAt: number; value: GeneratedBriefing }>()

function getBriefingCacheKey(userId: string, context: Awaited<ReturnType<typeof assembleBriefing>>): string {
  const signalStamp = context.signals.map((signal) => `${signal.id}:${signal.signalDate}`).join('|')
  const matchStamp = context.newMatches.map((match) => `${match.companyName}:${match.aiScore ?? 0}`).join('|')
  const followUpStamp = context.followUps.map((followUp) => `${followUp.id}:${followUp.dueDate}`).join('|')
  return `${userId}:${context.todayStr}:${signalStamp}:${matchStamp}:${followUpStamp}`
}

function getCachedBriefing(cacheKey: string): GeneratedBriefing | null {
  const cached = briefingGenerationCache.get(cacheKey)
  if (!cached) return null
  if (cached.expiresAt < Date.now()) {
    briefingGenerationCache.delete(cacheKey)
    return null
  }
  return cached.value
}

function setCachedBriefing(cacheKey: string, value: GeneratedBriefing) {
  briefingGenerationCache.set(cacheKey, {
    expiresAt: Date.now() + BRIEFING_CACHE_TTL_MS,
    value,
  })
}

function trimBriefingText(value: string | null | undefined, maxLength = BRIEFING_SUMMARY_CHAR_LIMIT) {
  const text = value?.trim()
  if (!text) return ''
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength - 1).trimEnd()}...`
}

function normalizeLaneReason(reason: string) {
  return reason
    .replace(/\bstalled\b/gi, 'watch')
    .replace(/\bno pipeline movement\b/gi, 'pipeline movement slowed')
}

function normalizeLaneState(state: 'healthy' | 'watch' | 'stalled'): 'healthy' | 'watch' {
  return state === 'stalled' ? 'watch' : state
}

function buildWeeklyPulse(
  context: Awaited<ReturnType<typeof assembleBriefing>>,
  firstName: string,
  todayLabel: string,
): WeeklyPulse {
  const hasSignals = context.signals.length > 0
  const hasMatches = context.newMatches.length > 0
  const hasFollowUps = context.followUps.length > 0
  const stalledLane = context.stalledLanes.find((lane) => lane.state === 'stalled')
  const watchLane = context.stalledLanes.find((lane) => lane.state === 'watch')

  let state: WeeklyPulse['state'] = 'steady'
  if (stalledLane || (!hasSignals && !hasMatches && context.followUps.length >= 3)) {
    state = 'watch'
  } else if ((hasSignals && (hasMatches || hasFollowUps)) || context.signals.length >= 2 || context.newMatches.length > 0) {
    state = 'building'
  }

  let headline = 'Your search is holding a good line this week.'
  let support = 'One deliberate move today keeps the week composed and moving in the right direction.'
  let whyNow = 'A short, well-timed follow-through usually compounds better than a wider push. The goal today is position, not volume.'
  let ctaTarget: WeeklyPulse['ctaTarget'] = '/dashboard'
  let ctaLabel = 'Open the next move'

  if (state === 'building') {
    if (hasFollowUps) {
      const nextPerson = context.followUps[0]?.contact?.name ?? 'your next contact'
      headline = `${firstName}, your search is in a strong position this week.`
      support = `A timely follow-through with ${nextPerson} keeps the relationship side of the search moving without adding noise.`
      whyNow = 'You already have context and timing on your side. Acting while the signal is fresh improves recall and makes the outreach feel easier to place.'
      ctaTarget = '/dashboard/calendar'
      ctaLabel = 'Open the next move'
    } else if (hasSignals) {
      const company = context.signals[0]?.companyName ?? 'a target company'
      headline = `${company} moved. Your timing improved.`
      support = 'Review the opening now, then decide whether it belongs in this week\'s outreach mix.'
      whyNow = 'Fresh signals matter because they sharpen timing. You do not need a large push. You need one informed move while the window is still clear.'
      ctaTarget = '/dashboard/signals'
      ctaLabel = 'Review the signal'
    } else if (hasMatches) {
      const company = context.newMatches[0]?.companyName ?? 'a target company'
      headline = `${company} is worth a closer look today.`
      support = 'You have at least one role that looks directionally right. A quick review now protects momentum later in the week.'
      whyNow = 'A match is most useful when it turns into a decision quickly: pursue, hold, or ignore. Fast clarity lowers cognitive drag.'
      ctaTarget = '/dashboard'
      ctaLabel = 'Open the company view'
    }
  }

  if (state === 'steady') {
    if (hasFollowUps) {
      const nextPerson = context.followUps[0]?.contact?.name ?? 'one relationship'
      headline = 'Your search is steady. Keep it easy to keep moving.'
      support = `One clean follow-through with ${nextPerson} is enough to keep the week pointed forward.`
      whyNow = 'When the search is steady, the best move is usually the simplest one already in front of you. Do the known next step and keep the week light.'
      ctaTarget = '/dashboard/calendar'
      ctaLabel = 'Keep momentum moving'
    } else if (hasSignals || hasMatches) {
      headline = 'You have enough movement to stay well-positioned.'
      support = 'Review one new development now so the rest of the week stays easier to manage.'
      whyNow = 'A small review step now prevents the search from feeling heavier later. The product should help you stay early and calm, not busy.'
      ctaTarget = hasSignals ? '/dashboard/signals' : '/dashboard'
      ctaLabel = hasSignals ? 'Review the signal' : 'Open the company view'
    }
  }

  if (state === 'watch') {
    headline = 'This week needs one corrective move, not a bigger push.'
    support = normalizeLaneReason(stalledLane?.reason ?? watchLane?.reason ?? 'A small, well-chosen action today is enough to settle the search back into rhythm.')
    whyNow = 'Watch states should narrow the field, not create pressure. One corrective move is usually more effective than trying to catch up everywhere at once.'

    if (hasFollowUps) {
      ctaTarget = '/dashboard/calendar'
      ctaLabel = 'Handle the top follow-through'
    } else if (hasSignals) {
      ctaTarget = '/dashboard/signals'
      ctaLabel = 'Review the freshest signal'
    } else {
      ctaTarget = '/dashboard'
      ctaLabel = 'Open the dashboard view'
    }
  }

  const label = state === 'building' ? 'Building' : state === 'steady' ? 'Steady' : 'Watch'
  const meterWidthClass = state === 'building' ? 'w-4/5' : state === 'steady' ? 'w-3/5' : 'w-2/5'
  const emailSubject = encodeURIComponent(`Starting Monday plan for ${todayLabel}`)
  const emailBody = encodeURIComponent(
    `${headline}\n\n${support}\n\nWhy this matters now: ${whyNow}\n\nNext step: ${ctaLabel}`,
  )

  return {
    state,
    label,
    headline,
    support,
    whyNow,
    ctaTarget,
    ctaLabel,
    meterWidthClass,
    mailtoHref: `mailto:?subject=${emailSubject}&body=${emailBody}`,
  }
}

async function assembleBriefing(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, tz: string) {
  const now = new Date()
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const since7d   = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const since14d  = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const since30d  = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const todayStr  = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(now)

  const [profileResult, companiesResult, recentScansResult, followUpsResult, companySignalsResult, patternSignalsResult, signalHealthResult, briefsResult, pipelineEventsResult, scanCoverageResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('full_name, target_titles')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('companies')
      .select('id, name, stage')
      .eq('user_id', userId)
      .is('archived_at', null)
      .order('created_at', { ascending: true }),
    supabase
      .from('scan_results')
      .select('company_id, scanned_at, ai_score, ai_summary, raw_hits')
      .eq('user_id', userId)
      .eq('status', 'success')
      .gte('scanned_at', since24h.toISOString())
      .gt('ai_score', 0)
      .order('ai_score', { ascending: false }),
    supabase
      .from('follow_ups')
      .select('id, due_date, action, contact_id, contacts(id, name, title)')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lte('due_date', todayStr)
      .order('due_date', { ascending: true }),
    supabase
      .from('company_signals')
      .select('id, company_id, signal_type, signal_summary, outreach_angle, signal_date, confidence, source_kind, companies(id, name)')
      .eq('user_id', userId)
      .gte('signal_date', since7d.toISOString().split('T')[0])
      .neq('signal_type', 'pattern_alert')
      .order('signal_date', { ascending: false })
      .limit(DASHBOARD_COMPANY_SIGNAL_LIMIT),
    supabase
      .from('company_signals')
      .select('id, company_id, signal_type, signal_summary, outreach_angle, signal_date, confidence, source_kind, companies(id, name)')
      .eq('user_id', userId)
      .eq('signal_type', 'pattern_alert')
      .gte('signal_date', since14d.toISOString().split('T')[0])
      .order('signal_date', { ascending: false })
      .limit(DASHBOARD_PATTERN_ALERT_LIMIT),
    supabase
      .from('company_signals')
      .select('signal_date')
      .eq('user_id', userId)
      .gte('signal_date', since30d.toISOString().split('T')[0])
      .order('signal_date', { ascending: false })
      .limit(30),
    supabase
      .from('briefs')
      .select('created_at, reviewed_at, used_at, lifecycle_state')
      .eq('user_id', userId)
      .in('type', ['prep', 'prep_section'])
      .gte('created_at', since30d.toISOString())
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('user_events')
      .select('event_name, created_at')
      .eq('user_id', userId)
      .gte('created_at', since7d.toISOString())
      .in('event_name', ['company_added', 'pipeline_stage_changed']),
    supabase
      .from('scan_results')
      .select('company_id')
      .eq('user_id', userId)
      .eq('status', 'success')
      .gte('scanned_at', since24h.toISOString()),
  ])

  const profile     = profileResult.data
  const companies   = companiesResult.data ?? []
  const recentScans = recentScansResult.data ?? []
  const rawFollowUps = followUpsResult.data ?? []
  const rawCompanySignals = companySignalsResult.data ?? []
  const rawPatternSignals = patternSignalsResult.data ?? []
  const signalHealthRows = (signalHealthResult.data ?? []) as Array<{ signal_date: string }>
  const briefs = (briefsResult.data ?? []) as Array<{ created_at: string; reviewed_at: string | null; used_at: string | null; lifecycle_state: string | null }>
  const pipelineEvents = (pipelineEventsResult.data ?? []) as Array<{ event_name: string; created_at: string }>
  const scanCoverageRows = (scanCoverageResult.data ?? []) as Array<{ company_id: string }>

  const companyById = Object.fromEntries(companies.map(c => [c.id, c]))

  const newMatches = recentScans
    .map(scan => {
      const hits = (scan.raw_hits ?? []) as { title: string; score: number; is_match: boolean; is_new?: boolean; summary: string }[]
      return {
        companyName: companyById[scan.company_id]?.name ?? 'Unknown Company',
        aiScore: scan.ai_score,
        aiSummary: scan.ai_summary as string | null,
        matchingRoles: hits.filter(h => h.is_match).map(h => ({ title: h.title, score: h.score, isNew: h.is_new, summary: h.summary })),
      }
    })
    .filter(m => m.matchingRoles.length > 0)
    .slice(0, BRIEFING_MATCH_LIMIT)

  const scannedCompanyCount = new Set(scanCoverageRows.map(r => r.company_id)).size
  const passedCompanyCount = new Set(
    recentScans
      .filter(scan => ((scan.raw_hits ?? []) as { is_match: boolean }[]).some(h => h.is_match))
      .map(scan => scan.company_id),
  ).size
  const scanCoverage = {
    scanned: scannedCompanyCount,
    ruledOut: Math.max(0, scannedCompanyCount - passedCompanyCount),
    passed: passedCompanyCount,
  }

  const followUps = rawFollowUps.map(f => ({
    id: f.id,
    dueDate: f.due_date,
    action: f.action as string | null,
    contact: (f.contacts as unknown as { id: string; name: string; title: string | null } | null) ?? null,
  })).slice(0, BRIEFING_FOLLOW_UP_LIMIT)

  type BriefingSignalRow = {
    id: string
    company_id: string
    signal_type: string
    signal_summary: string
    outreach_angle: string | null
    signal_date: string
    confidence?: number | null
    source_kind?: string | null
    companies: { id: string; name: string } | { id: string; name: string }[] | null
  }

  const briefingSignalRows: BriefingSignalRow[] = [...rawCompanySignals, ...rawPatternSignals].map((row) => {
    const signalRow = row as BriefingSignalRow
    return {
      ...signalRow,
      companies: signalRow.companies ?? null,
    }
  })

  const { mergedSignals } = applyDashboardSignalContract(
    briefingSignalRows,
    {
      companySince: since7d.toISOString().split('T')[0],
      patternSince: since14d.toISOString().split('T')[0],
    },
  )

  const signals = mergedSignals.map(s => ({
    id: s.id,
    companyName: companyById[s.company_id]?.name ?? 'Unknown Company',
    signalType: s.signal_type,
    summary: s.signal_summary as string,
    outreachAngle: s.outreach_angle as string | null,
    signalDate: s.signal_date,
  }))

  const activePipelineCount = companies.filter(
    (company) => company.stage === 'applied' || company.stage === 'interviewing' || company.stage === 'offer',
  ).length
  const lastSignalDays = signalHealthRows.length > 0
    ? Math.ceil((Date.now() - new Date(signalHealthRows[0].signal_date).getTime()) / (1000 * 60 * 60 * 24))
    : 999
  const lastBriefProgressAt = briefs.reduce<string | null>((latest, brief) => {
    const candidate = brief.used_at ?? brief.reviewed_at ?? brief.created_at
    if (!latest) return candidate
    return new Date(candidate).getTime() > new Date(latest).getTime() ? candidate : latest
  }, null)
  const lastBriefDays = lastBriefProgressAt
    ? Math.ceil((Date.now() - new Date(lastBriefProgressAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999
  const briefReviewsSinceLastWeek = briefs.filter((brief) => brief.reviewed_at && new Date(brief.reviewed_at).getTime() >= since7d.getTime()).length
  const stalledLanes = classifyGraphStalls({
    activePipelineCount,
    overdueActions: followUps.length,
    lastSignalDays,
    lastBriefDays,
    signalsSinceBaseline: signalHealthRows.filter((signal) => new Date(signal.signal_date).getTime() >= since7d.getTime()).length,
    pipelineChangesSinceBaseline: pipelineEvents.length,
    briefReviewsSinceBaseline: briefReviewsSinceLastWeek,
  }) as StallLaneSnapshot[]

  return {
    userName: profile?.full_name ?? 'there',
    targetTitles: (profile?.target_titles as string[] | null) ?? [],
    totalCompanies: companies.length,
    trackedCompanies: companies.map((company) => ({ id: company.id, name: company.name })),
    newMatches,
    followUps,
    signals,
    todayStr,
    stalledLanes,
    scanCoverage,
    hasContent: newMatches.length > 0 || followUps.length > 0 || signals.length > 0 || stalledLanes.length > 0,
  }
}

async function generateBriefing(context: Awaited<ReturnType<typeof assembleBriefing>>): Promise<GeneratedBriefing> {
  const { userName, targetTitles, totalCompanies, newMatches, followUps, signals, todayStr } = context

  const matchesText = newMatches.length
    ? newMatches.map(m =>
        `Company: ${m.companyName}\nMatching roles: ${m.matchingRoles.slice(0, 3).map(r => `${r.title} (score ${r.score}/100${r.isNew ? ', NEW' : ''})`).join('; ')}\nSummary: ${trimBriefingText(m.aiSummary)}`
      ).join('\n\n')
    : 'No new matches.'

  const followUpsText = followUps.length
    ? followUps.map(f => {
        const who = f.contact ? `${f.contact.name}${f.contact.title ? ` (${f.contact.title})` : ''}` : null
        return `Due: ${f.dueDate}${who ? `\nContact: ${who}` : ''}\nAction: ${f.action ?? 'Follow up'}`
      }).join('\n\n')
    : 'No overdue follow-ups.'

  const signalsText = signals.length
    ? signals.map(s => `Company: ${s.companyName}\nType: ${s.signalType}\nWhat happened: ${trimBriefingText(s.summary)}${s.outreachAngle ? `\nOpening: ${trimBriefingText(s.outreachAngle, 180)}` : ''}`).join('\n\n')
    : 'No new signals.'

  const prompt = `You are writing a morning intelligence briefing for ${userName}, a senior technology executive in active job search.
Target titles: ${targetTitles.join(', ') || 'CIO and senior technology leadership roles'}
Companies tracked: ${totalCompanies}

TODAY'S DATA (${todayStr}):

COMPANY SIGNALS (news events that create hiring openings):
${signalsText}

NEW JOB MATCHES (last 24 hours):
${matchesText}

OVERDUE FOLLOW-UPS:
${followUpsText}

Write a morning briefing as JSON with exactly these keys:
- "subject": email subject line (max 75 chars). Specific and factual - name the company or action. No generic phrases. If there are signals, lead with that.
- "intro": 1-2 sentences. State what changed overnight and what matters today. No preamble.
- "signalAlerts": array of at most ${DASHBOARD_COMPANY_SIGNAL_LIMIT + DASHBOARD_PATTERN_ALERT_LIMIT} items, each { company, signalType, summary, angle (one sentence on why this matters for the candidate's search) }.
- "matchInsights": array of at most ${BRIEFING_MATCH_LIMIT} items, each { company, roles (string[] up to 3), insight (1-2 sentences, specific to this role and this person's background) }.
- "followUpSuggestions": array of at most ${BRIEFING_FOLLOW_UP_LIMIT} items, each { person, action, suggestion (one concrete sentence - what to do and how) }.
- "closing": 1 sentence. Calm, confident observation about pipeline state. No motivational clichés.

Tone: direct, precise, senior-to-senior. Short sentences. No em dashes. No filler phrases. Write as a trusted advisor, not a coach.
Keep the full JSON under 1600 characters.
Output valid JSON only, no markdown fences.`

  const modelTier: 'haiku' | 'sonnet' = (signals.length > 0 || newMatches.length > 0) ? 'sonnet' : 'haiku'
  const model = modelTier === 'sonnet' ? MODELS.sonnet : MODELS.haiku

  let message
  const requestController = new AbortController()
  const requestTimer = setTimeout(() => requestController.abort(), BRIEFING_GENERATION_TIMEOUT_MS)
  try {
    message = await anthropic.messages.create({
      model,
      max_tokens: 1200,
      temperature: TEMP.factual,
      messages: [{ role: 'user', content: prompt }],
    }, {
      signal: requestController.signal,
    })
  } catch (err: any) {
    const isTimeoutError = String(err?.name ?? '').toLowerCase().includes('abort')
      || String(err?.message ?? '').toLowerCase().includes('abort')

    if (isTimeoutError) {
      Sentry.captureMessage('Briefing generation timed out; using fallback briefing.', {
        level: 'warning',
        extra: {
          errorType: 'anthropic_timeout',
          model,
          timeoutMs: BRIEFING_GENERATION_TIMEOUT_MS,
        },
      })
      return {
        briefing: {
          intro: `Here is your search update for ${todayStr}.`,
          signalAlerts: signals.map(s => ({ company: s.companyName, signalType: s.signalType, summary: s.summary, angle: s.outreachAngle ?? undefined })),
          matchInsights: newMatches.map(m => ({ company: m.companyName, roles: m.matchingRoles.map(r => r.title), insight: m.aiSummary ?? '' })),
          followUpSuggestions: followUps.map(f => ({ person: f.contact?.name ?? 'Contact', action: f.action ?? 'Follow up', suggestion: 'Reach out today.' })),
          closing: `${totalCompanies} companies in your pipeline.`,
        },
        usedFallback: true,
        modelTier,
        fallbackReason: 'timeout',
      }
    }

    // Handle Anthropic API errors (e.g., insufficient credits)
    const status = err.status ?? err.statusCode
    const errorType = String(err?.error?.error?.type ?? '').toLowerCase()
    const errorMessage = String(err?.error?.error?.message ?? err?.message ?? '').toLowerCase()
    const isCreditsError = status === 400 && errorType === 'invalid_request_error' && (errorMessage.includes('credit') || errorMessage.includes('balance'))

    if (isCreditsError) {
      Sentry.captureMessage('Anthropic credits exhausted for briefing generation; using fallback briefing.', {
        level: 'warning',
        extra: {
          errorType: 'anthropic_insufficient_credits',
          model,
          status,
        },
      })
      // Return fallback briefing when credits are exhausted
      return {
        briefing: {
          intro: `Here is your search update for ${todayStr}.`,
          signalAlerts: signals.map(s => ({ company: s.companyName, signalType: s.signalType, summary: s.summary, angle: s.outreachAngle ?? undefined })),
          matchInsights: newMatches.map(m => ({ company: m.companyName, roles: m.matchingRoles.map(r => r.title), insight: m.aiSummary ?? '' })),
          followUpSuggestions: followUps.map(f => ({ person: f.contact?.name ?? 'Contact', action: f.action ?? 'Follow up', suggestion: 'Reach out today.' })),
          closing: `${totalCompanies} companies in your pipeline.`,
        },
        usedFallback: true,
        modelTier,
        fallbackReason: 'credits_exhausted',
      }
    }
    // Re-throw other API errors
    throw err
  } finally {
    clearTimeout(requestTimer)
  }

  if (message.stop_reason === 'max_tokens') {
    Sentry.captureMessage('Briefing generation truncated by max_tokens', { level: 'warning', extra: { model } })
  }

  const raw = (message.content[0] as { type: string; text?: string })?.text?.trim() ?? '{}'
  const parsed = parseBriefingJson(raw)
  if (parsed) {
    return {
      briefing: parsed as BriefingJson,
      usedFallback: false,
      modelTier,
      fallbackReason: null,
    }
  }

  Sentry.captureMessage('Briefing model returned invalid JSON; using fallback briefing.', {
    level: 'warning',
    extra: { errorType: 'briefing_json_parse_error', model, rawLength: raw.length },
  })
  return {
    briefing: {
      intro: `Here is your search update for ${todayStr}.`,
      signalAlerts: signals.map(s => ({ company: s.companyName, signalType: s.signalType, summary: s.summary, angle: s.outreachAngle ?? undefined })),
      matchInsights: newMatches.map(m => ({ company: m.companyName, roles: m.matchingRoles.map(r => r.title), insight: m.aiSummary ?? '' })),
      followUpSuggestions: followUps.map(f => ({ person: f.contact?.name ?? 'Contact', action: f.action ?? 'Follow up', suggestion: 'Reach out today.' })),
      closing: `${totalCompanies} companies in your pipeline.`,
    },
    usedFallback: true,
    modelTier,
    fallbackReason: 'json_parse_error',
  }
}

// --- Suspense skeleton shown while Claude generates the briefing --------------

function BriefingBodySkeleton() {
  return (
    <Card variant="glass" className="rounded-b-2xl border-t-0 px-5 sm:px-8 py-6 sm:py-8 shadow-xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <p className="text-[13px] text-muted-foreground">Assembling your briefing...</p>
      </div>
      <div className="mb-8 space-y-2">
        <Skeleton className="h-4 w-full rounded bg-muted/60" />
        <Skeleton className="h-4 w-4/5 rounded bg-muted/60" />
      </div>
      <div className="mb-8">
        <Skeleton className="h-2 w-28 rounded mb-4 bg-muted/60" />
        <Card variant="glass" className="p-4 bg-warning/10 border-warning/20 rounded-r space-y-2">
          <Skeleton className="h-4 w-32 rounded bg-warning/10" />
          <Skeleton className="h-3.5 w-full rounded bg-warning/10" />
          <Skeleton className="h-3.5 w-3/4 rounded bg-warning/10" />
        </Card>
      </div>
      <div className="mb-8">
        <Skeleton className="h-2 w-24 rounded mb-4 bg-muted/60" />
        <Card variant="glass" className="p-4 rounded-r space-y-2">
          <Skeleton className="h-4 w-40 rounded bg-muted/60" />
          <Skeleton className="h-3.5 w-full rounded bg-muted/60" />
          <Skeleton className="h-3.5 w-2/3 rounded bg-muted/60" />
        </Card>
      </div>
    </Card>
  )
}

// --- Async component - triggers the Claude call -------------------------------

type BriefingContext = Awaited<ReturnType<typeof assembleBriefing>>

async function BriefingBody({
  context,
  userId,
  mode,
}: {
  context: BriefingContext
  userId: string
  mode: 'focused' | 'full'
}) {
  const briefingCacheKey = getBriefingCacheKey(userId, context)
  let generated: GeneratedBriefing | null = null
  if (context.hasContent) {
    generated = getCachedBriefing(briefingCacheKey)
    if (!generated) {
      generated = await generateBriefing(context)
      setCachedBriefing(briefingCacheKey, generated)
    }
  }
  const briefing = generated?.briefing ?? null
  const usedFallback = generated?.usedFallback ?? false
  const fallbackReason = generated?.fallbackReason ?? null
  const maxItems = mode === 'focused' ? 1 : 3
  const signalAlerts  = (briefing?.signalAlerts ?? []).slice(0, maxItems)
  const matchInsights = (briefing?.matchInsights ?? []).slice(0, maxItems)
  const followUpItems = (briefing?.followUpSuggestions ?? []).slice(0, maxItems)
  const stalledLanes = context.stalledLanes ?? []

  return (
    <Card variant="glass" className="rounded-b-2xl border-t-0 px-5 sm:px-8 py-8 sm:py-10 shadow-xl">
      {!context.hasContent ? (
        <div className="text-center py-12">
          <p className="text-[16px] sm:text-[18px] font-semibold text-foreground mb-3">Nothing urgent is pulling at the search today.</p>
          <p className="text-[14px] sm:text-[15px] text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            No new matches, relationship follow-through, or company signals need attention right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button render={<Link href="/dashboard/companies/new" />}>
              Add a company
            </Button>
            <Button variant="outline" render={<Link href="/dashboard" />}>
              Back to dashboard
            </Button>
          </div>
        </div>
      ) : (
        <>
          {usedFallback && (
            <Alert variant="warning" className="mb-8 p-5">
              <AlertTitle>Fallback briefing from live data</AlertTitle>
              <AlertDescription>
                {fallbackReason === 'credits_exhausted'
                  ? 'AI generation credits were unavailable. This briefing is a deterministic summary of your current signals, matches, and follow-ups.'
                  : fallbackReason === 'timeout'
                    ? 'AI generation took too long. This briefing is a deterministic summary of your current signals, matches, and follow-ups.'
                  : 'AI output formatting failed validation. This briefing is a deterministic summary of your current signals, matches, and follow-ups.'}
              </AlertDescription>
            </Alert>
          )}

          {briefing?.intro && (
            <p className="text-[15px] text-foreground leading-relaxed mb-8">{briefing.intro}</p>
          )}

          {/* TENET 1: FIND ROLES FIRST */}
          <section id="tenet-find-roles" className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-primary rounded-full" />
                <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.08em] text-foreground">
                  Find Roles First
                </h2>
              </div>

              <section id="signals-to-review" className="mb-6">
                <h3 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-muted-foreground pb-3 border-b border-border mb-4">
                  Signals to review
                </h3>
                {signalAlerts.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-3">
                      {signalAlerts.map((s, i) => (
                        <Card key={i} variant="glass" className="p-4 sm:p-5 bg-gradient-to-br from-warning/10 to-muted/5 border-warning/20 border-l-[4px] border-l-primary/30 rounded-lg shadow-lg hover:shadow-lg transition-shadow">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <span className="font-bold text-[16px] sm:text-[17px] text-foreground">{s.company}</span>
                            <Badge variant="warning">
                              {SIGNAL_LABELS[s.signalType] ?? s.signalType}
                            </Badge>
                          </div>
                          <p className="text-[15px] sm:text-[16px] text-foreground leading-relaxed mb-2">{s.summary}</p>
                          {s.angle && (
                            <p className="text-[14px] text-muted-foreground italic leading-relaxed">{s.angle}</p>
                          )}
                        </Card>
                      ))}
                    </div>
                    <div className="mt-5">
                      <form action={logBriefingAction}>
                        <input type="hidden" name="section" value="signals_to_review" />
                        <input type="hidden" name="target" value="/dashboard/signals" />
                        <Button type="submit">
                          Signals &rarr;
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <Card variant="glass" className="rounded-lg p-4 sm:p-5">
                    <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
                      No new market signals are competing for attention right now. Keep your current follow-through moving.
                    </p>
                  </Card>
                )}
              </section>
            </section>

          {/* TENET 2: TALK TO THE RIGHT PEOPLE */}
          <section id="tenet-talk-to-people" className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-success rounded-full" />
                <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.08em] text-foreground">
                  Talk to the Right People
                </h2>
              </div>

              <section id="people-to-reach" className="mb-6">
                <h3 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-muted-foreground pb-3 border-b border-border mb-4">
                  People to reach
                </h3>
                {matchInsights.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-3">
                      {matchInsights.map((m, i) => (
                        <Card key={i} variant="glass" className="p-4 sm:p-5 border-l-[4px] border-l-success/30 rounded-lg shadow-lg hover:shadow-lg transition-shadow">
                          <div className="font-bold text-[16px] sm:text-[17px] text-foreground mb-2">{m.company}</div>
                          <div className="text-[11px] font-semibold tracking-[0.08em] uppercase text-muted-foreground mb-3">
                            {(m.roles ?? []).join(' · ')}
                          </div>
                          <p className="text-[15px] sm:text-[16px] text-foreground leading-relaxed">{m.insight}</p>
                        </Card>
                      ))}
                    </div>
                    <div className="mt-5">
                      <form action={logBriefingAction}>
                        <input type="hidden" name="section" value="people_to_reach" />
                        <input type="hidden" name="target" value="/dashboard/contacts" />
                        <Button type="submit">
                          Move one relationship forward &rarr;
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <Card variant="glass" className="rounded-lg p-4 sm:p-5">
                    <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
                      No new role-to-contact matches surfaced yet. Use one existing relationship to keep the week moving.
                    </p>
                  </Card>
                )}
              </section>
            </section>

          {/* TENET 3: FOLLOW A CLEAR PLAN */}
          <section id="tenet-clear-plan" className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-7 bg-info rounded-full" />
                <h2 className="text-[18px] sm:text-[20px] font-bold tracking-[0.08em] text-foreground">
                  Follow a Clear Plan
                </h2>
              </div>

              <section id="keep-momentum" className="mb-6">
                <h3 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-muted-foreground pb-3 border-b border-border mb-4">
                  Keep momentum
                </h3>
                {stalledLanes.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {stalledLanes.map((lane, index) => (
                      <Card
                        key={`${lane.lane}-${index}`}
                        variant="glass"
                        className={`p-4 sm:p-5 rounded-lg border-l-[4px] shadow-lg transition-shadow hover:shadow-lg ${lane.state === 'stalled' ? 'bg-gradient-to-br from-warning/10 to-muted/5 border-warning/20 border-l-warning/30' : 'bg-gradient-to-br from-warning/5 to-muted/5 border-warning/15 border-l-warning/30'}`}
                      >
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="font-bold text-[16px] sm:text-[17px] text-foreground capitalize">{lane.lane}</span>
                          <Badge variant="warning">
                            {normalizeLaneState(lane.state)}
                          </Badge>
                        </div>
                        <p className="text-[15px] sm:text-[16px] text-foreground leading-relaxed">{normalizeLaneReason(lane.reason)}</p>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card variant="glass" className="rounded-lg p-4 sm:p-5">
                    <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
                      Your current cadence is steady. Keep one relationship move active and protect follow-through quality.
                    </p>
                  </Card>
                )}
              </section>

              <section id="best-next-moves" className="mb-0">
                <h3 className="text-[12px] font-semibold tracking-[0.12em] uppercase text-muted-foreground pb-3 border-b border-border mb-4">
                  Best next moves
                </h3>
                {followUpItems.length > 0 ? (
                  <>
                    <div className="flex flex-col gap-2">
                      {followUpItems.map((f, i) => (
                        <Card key={i} variant="glass" className="p-4 sm:p-5 bg-gradient-to-br from-muted/5 to-background/30 border-l-[4px] border-l-info/30 rounded-lg shadow-lg hover:shadow-lg transition-shadow">
                          <div className="font-semibold text-[15px] sm:text-[16px] text-foreground mb-1">
                            {f.person} <span className="font-normal text-muted-foreground">·</span> {f.action}
                          </div>
                          <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">{f.suggestion}</p>
                        </Card>
                      ))}
                    </div>
                    <div className="mt-5">
                      <form action={logBriefingAction}>
                        <input type="hidden" name="section" value="best_next_moves" />
                        <input type="hidden" name="target" value="/dashboard/calendar" />
                        <Button type="submit">
                          Map your week &rarr;
                        </Button>
                      </form>
                    </div>
                  </>
                ) : (
                  <Card variant="glass" className="rounded-lg p-4 sm:p-5">
                    <p className="text-[14px] sm:text-[15px] text-foreground leading-relaxed">
                      Nothing urgent is due right now. Hold focus on one proactive relationship move to stay ahead of timing.
                    </p>
                  </Card>
                )}
              </section>
            </section>

          {briefing?.closing && (
            <p className="text-[14px] text-muted-foreground leading-relaxed border-t border-border pt-6 mb-6">
              {briefing.closing}
            </p>
          )}

          <div className="text-center">
            <Button className="px-8 py-3" render={<Link href="/dashboard" />}>
              Back to dashboard
            </Button>
          </div>
        </>
      )}
    </Card>
  )
}

function FirstSessionGuidedState({
  firstName,
  companyName,
  companySignals,
  prepHref,
}: {
  firstName: string
  companyName: string | null
  companySignals: Array<{ signalType: string; summary: string; signalDate: string }>
  prepHref: string
}) {
  return (
    <Card variant="glass" className="px-5 py-6 sm:px-8 sm:py-8 shadow-xl">
      <p className="text-[11px] font-semibold tracking-[0.12em] uppercase text-muted-foreground mb-3">Guided first session</p>
      <h2 className="text-[22px] sm:text-[24px] font-bold text-foreground leading-tight mb-2">
        {firstName}, here is your first move.
      </h2>
      <p className="text-[14px] text-muted-foreground leading-relaxed mb-6">
        Start with one company and one prep brief so today&apos;s outreach is specific, calm, and timely.
      </p>

      <div className="rounded-xl border border-border bg-background/40 p-4 sm:p-5 mb-5">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-1">Company being watched</p>
        <p className="text-[16px] font-semibold text-foreground">{companyName ?? 'Add your first company'}</p>
      </div>

      <div className="rounded-xl border border-border bg-background/40 p-4 sm:p-5 mb-6">
        <p className="text-[11px] font-semibold tracking-[0.1em] uppercase text-muted-foreground mb-2">Live signals</p>
        {companySignals.length === 0 ? (
          <p className="text-[14px] text-muted-foreground leading-relaxed">
            No fresh signal yet. Generate your prep brief now so you are ready when the next change appears.
          </p>
        ) : (
          <ul className="space-y-2">
            {companySignals.map((signal, index) => (
              <li key={`${signal.signalDate}-${index}`} className="text-[14px] text-foreground leading-relaxed">
                <span className="font-semibold text-foreground">{SIGNAL_LABELS[signal.signalType] ?? signal.signalType}:</span>{' '}
                {signal.summary}
              </li>
            ))}
          </ul>
        )}
      </div>

      <form action={logBriefingAction}>
        <input type="hidden" name="section" value="first_session_guided" />
        <input type="hidden" name="action" value="primary_prep_cta_clicked" />
        <input type="hidden" name="target" value={prepHref} />
        <Button type="submit" className="min-h-[44px] px-6 py-3">
          Generate prep brief now
        </Button>
      </form>

      <p className="text-[12px] text-muted-foreground mt-4">
        Your full briefing unlocks as your search builds.
      </p>
    </Card>
  )
}

// --- Page - shell renders immediately, body streams in ------------------------

export default async function BriefingPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string; note_saved?: string; error?: string }>
}) {
  const { mode: rawMode, note_saved: noteSaved, error: errorCode } = await searchParams
  const mode: 'focused' | 'full' = rawMode === 'focused' ? 'focused' : 'full'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, briefing_timezone, onboarding_completed_at')
    .eq('user_id', user.id)
    .single()

  if (!profile?.onboarding_completed_at) redirect('/onboarding')

  const tz = profile?.briefing_timezone ?? 'UTC'
  const context = await assembleBriefing(supabase, user.id, tz)

  const guidedRolloutEnabled = isEnabledFlag(process.env.FF_BRIEFING_FIRST_SESSION_GUIDED_BRIEFING)
  const showGuidedFirstSessionState = shouldShowFirstSessionGuidedBriefing({
    userId: user.id,
    accountCreatedAt: user.created_at ?? null,
    totalCompanies: context.totalCompanies,
    rolloutEnabled: guidedRolloutEnabled,
    rolloutPercentage: 50,
    maxAccountAgeHours: 48,
  })

  void logEvent(user.id, 'briefing_viewed', {
    signals: context.signals.length,
    matches: context.newMatches.length,
    due_today: context.followUps.length,
    total_companies: context.totalCompanies,
    first_session_guided_state: showGuidedFirstSessionState,
  })

  if (showGuidedFirstSessionState) {
    void logEvent(user.id, 'briefing_first_session_guided_viewed', {
      total_companies: context.totalCompanies,
      account_age_hours: user.created_at
        ? Math.round((Date.now() - new Date(user.created_at).getTime()) / 3600000)
        : null,
      rollout_percentage: 50,
    })
  }

  // Activation milestone: first brief viewed with at least one company tracked. Logged once per user.
  if (context.totalCompanies >= 1) {
    const { data: activationEvent } = await supabase
      .from('user_events')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_name', 'activation_reached')
      .limit(1)
      .maybeSingle()
    if (!activationEvent) {
      void logEvent(user.id, 'activation_reached', {
        total_companies: context.totalCompanies,
        signals: context.signals.length,
      })
    }
  }

  const firstName = profile?.full_name?.split(' ')[0] ?? 'there'
  const firstTrackedCompany = context.trackedCompanies[0] ?? null
  const firstCompanySignals = firstTrackedCompany
    ? context.signals.filter((signal) => signal.companyName === firstTrackedCompany.name).slice(0, 2)
    : []
  const guidedPrepHref = firstTrackedCompany?.id
    ? `/dashboard/companies/${firstTrackedCompany.id}/prep`
    : '/dashboard/companies/new'
  const todayLabel = new Date(context.todayStr + 'T12:00:00Z').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })
  const pulse = buildWeeklyPulse(context, firstName, todayLabel)

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">

      <header className="border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-12 sm:h-14 flex items-center justify-between">
          <span className="text-[13px] sm:text-[14px] font-bold tracking-[0.14em] uppercase text-muted-foreground">
            <span className="text-foreground">Starting </span><span className="text-primary">Monday</span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="min-h-[44px] border-border text-muted-foreground hover:text-foreground"
              render={<Link href="/dashboard" />}
            >
              Dashboard
            </Button>
            <LogoutButton label="Sign out" />
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-5 sm:py-10">
      <p className="sr-only">Briefing</p>
        {noteSaved === '1' && (
          <Alert variant="success" className="mb-4 px-4 py-3">
            <AlertTitle>Today&apos;s note saved.</AlertTitle>
            <AlertDescription>Your weekly pulse plan is now captured in your daily notes.</AlertDescription>
          </Alert>
        )}

        {errorCode === 'note-save-failed' && (
          <Alert variant="warning" className="mb-4 px-4 py-3">
            <AlertTitle>We could not save that note right now.</AlertTitle>
            <AlertDescription>Please try again in a moment. Your plan is still visible on this page.</AlertDescription>
          </Alert>
        )}

        {/* Header - Phase 1a redesign with primary stat card */}
        <BriefingHeader
          firstName={firstName}
          serverGreeting={greetingInTz(tz)}
          todayLabel={todayLabel}
          totalCompanies={context.totalCompanies}
          signalCount={context.signals.length}
          matchCount={context.newMatches.length}
          movesReadyCount={context.followUps.length}
        />

        {context.scanCoverage.scanned > 0 && (
          <p className="mb-5 text-[13px] text-muted-foreground">
            In the last 24 hours we scanned{' '}
            <span className="font-semibold text-foreground">{context.scanCoverage.scanned}</span>{' '}
            {context.scanCoverage.scanned === 1 ? 'company' : 'companies'},{' '}
            ruled out <span className="font-semibold text-foreground">{context.scanCoverage.ruledOut}</span> with no
            matching roles, and flagged{' '}
            <span className="font-semibold text-foreground">{context.scanCoverage.passed}</span> for you below.
          </p>
        )}

        <Card variant="glass" id="weekly-pulse" className="px-5 py-6 sm:px-8 sm:py-8 shadow-xl">
          <div className="rounded-2xl border border-border/80 bg-card/85 p-6 sm:p-8 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/90">This week&apos;s position</p>
                <div className="mt-3 inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1.5 text-[12px] font-semibold text-foreground/95">
                  {pulse.label}
                </div>
              </div>
              <div className="w-full max-w-[200px]">
                <Progress
                  value={pulse.state === 'building' ? 80 : pulse.state === 'steady' ? 60 : 40}
                  className={`h-2 bg-muted/60 ${pulse.state === 'watch' ? '[&_[data-slot=progress-indicator]]:bg-warning' : pulse.state === 'steady' ? '[&_[data-slot=progress-indicator]]:bg-muted' : '[&_[data-slot=progress-indicator]]:bg-primary'}`}
                />
              </div>
            </div>

            <p className="text-[18px] sm:text-[20px] font-semibold leading-tight text-foreground mb-6">
              {pulse.support}
            </p>

            <div className="mt-6 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
              <form action={logBriefingAction}>
                <input type="hidden" name="section" value="weekly_pulse_primary" />
                <input type="hidden" name="action" value="primary_move_clicked" />
                <input type="hidden" name="target" value={pulse.ctaTarget} />
                <input type="hidden" name="pulse_state" value={pulse.state} />
                <Button type="submit" className="min-h-[44px] w-full sm:w-auto px-5 py-3">
                  {pulse.ctaLabel}
                </Button>
              </form>

              <BriefingPulseSupport state={pulse.state} whyNow={pulse.whyNow} mailtoHref={pulse.mailtoHref} />

              <form action={saveBriefingDailyNote} className="sm:ml-auto">
                <input type="hidden" name="title" value={`Starting Monday plan for ${todayLabel}`} />
                <input
                  type="hidden"
                  name="body"
                  value={`${pulse.headline}\n\n${pulse.support}\n\nWhy this matters now: ${pulse.whyNow}\n\nNext step: ${pulse.ctaLabel}`}
                />
                <input type="hidden" name="pulse_state" value={pulse.state} />
                <Button type="submit" variant="outline" className="min-h-[44px] w-full sm:w-auto px-5 py-3">
                  Save as today&apos;s note
                </Button>
              </form>
            </div>
          </div>
        </Card>



        {showGuidedFirstSessionState ? (
          <FirstSessionGuidedState
            firstName={firstName}
            companyName={firstTrackedCompany?.name ?? null}
            companySignals={firstCompanySignals}
            prepHref={guidedPrepHref}
          />
        ) : (
          <>
            <Card variant="glass" id="briefing-mode" className="flex-row px-5 sm:px-8 py-3 items-center gap-2 shadow-xl">
              <h2 className="text-[11px] font-semibold text-muted-foreground">View:</h2>
              <Tabs value={mode}>
                <TabsList>
                  <TabsTrigger value="focused" render={<Link href="/dashboard/briefing?mode=focused" />}>
                    Focused
                  </TabsTrigger>
                  <TabsTrigger value="full" render={<Link href="/dashboard/briefing?mode=full" />}>
                    Full
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </Card>

            {/* Briefing body - streams in after Claude call completes */}
            <Suspense fallback={<BriefingBodySkeleton />}>
              <BriefingBody context={context} userId={user.id} mode={mode} />
            </Suspense>
          </>
        )}

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Starting Monday &middot; Daily Intelligence Briefing
        </p>

      </main>
      <HelpQuickButton source="briefing" />
    </div>
  )
}

