import { appendFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

export type EmailCouncilChannel = 'executives' | 'coaches' | 'search_firms' | 'outplacement_firms' | 'general'

export type EmailCouncilScores = {
  open: number
  understand: number
  reply: number
  productLift: number
  ejes: number
}

export type EmailCouncilEvaluation = {
  channel: EmailCouncilChannel
  subject: string
  html: string
  text: string
  scores: EmailCouncilScores
  blockers: string[]
  warnings: string[]
  passes: boolean
}

export type EmailCouncilRefinement = {
  evaluation: EmailCouncilEvaluation
  refinedSubject: string
  refinedHtml: string
  rewritesApplied: string[]
  passesAfterRefine: boolean
}

const FORBIDDEN_LABELS = [
  'trigger this week',
  'choice:',
  'state:',
  'signal:',
  'decision:',
  'action:',
  'proof:',
]

const SCORE_LOG_PATH = path.join(process.cwd(), '.logs', 'email-council-scores.jsonl')

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value))
}

function toText(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])\s*\/?>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<p[^>]*>|<div[^>]*>|<h[1-6][^>]*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

function sentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(Boolean)
}

function words(text: string): string[] {
  return text
    .split(/\s+/)
    .map(w => w.trim())
    .filter(Boolean)
}

function paragraphCount(text: string): number {
  return text.split(/\n\n+/).map(p => p.trim()).filter(Boolean).length
}

function includesYesPass(text: string): boolean {
  return /reply\s+yes/i.test(text) && /reply\s+pass/i.test(text)
}

function hasCurrentCtaShape(text: string): boolean {
  const hasReplyPass = /reply\s+pass|close\s+the\s+loop|not\s+relevant\s+right\s+now/i.test(text)
  const hasOfferToSend = /if\s+helpful,?\s+i\s+can\s+send|if\s+useful,?\s+i\s+can\s+send|if\s+you\s+want\s+it,?\s+reply\s+yes\s+and\s+i\s+will\s+send|reply\s+yes\s+and\s+i\s+will\s+send/i.test(text)
  return hasReplyPass && hasOfferToSend
}

function hasProofShape(text: string): boolean {
  if (/\bn=\d+\b/i.test(text) || /\bpilot\b/i.test(text)) return true

  // Current outplacement templates intentionally avoid explicit denominators,
  // but still include time-bounded directional proof language.
  return /across\s+[a-z]{3,9}\s*[-–]\s*[a-z]{3,9}\s+20\d{2}.*(cases|cohorts|engagements|teams\s+saw)/i.test(text)
}

function hasCaveat(text: string): boolean {
  return /results vary|not a guarantee|directional evidence/i.test(text)
}

function hasStartingMonday(text: string): boolean {
  return /starting monday/i.test(text)
}

function countForbiddenLabels(text: string): number {
  const lower = text.toLowerCase()
  return FORBIDDEN_LABELS.reduce((sum, token) => sum + (lower.includes(token) ? 1 : 0), 0)
}

function calcOpenScore(subject: string): number {
  let score = 0.7
  const len = subject.trim().length
  if (len >= 35 && len <= 65) score += 0.12
  if (/[A-Za-z]/.test(subject) && /\bfor\b/i.test(subject)) score += 0.06
  if (/quick question/i.test(subject)) score -= 0.1
  return clamp01(score)
}

function calcUnderstandScore(text: string): { score: number; warnings: string[]; blockers: string[] } {
  const ws: string[] = []
  const bs: string[] = []
  const sents = sentences(text)
  const sentWordCounts = sents.map(s => words(s).length)
  const avg = sentWordCounts.length ? sentWordCounts.reduce((a, b) => a + b, 0) / sentWordCounts.length : 0
  const maxSentence = sentWordCounts.length ? Math.max(...sentWordCounts) : 0
  const paras = paragraphCount(text)
  const labels = countForbiddenLabels(text)

  let score = 0.75
  if (avg <= 16) score += 0.12
  else if (avg > 20) score -= 0.16
  if (maxSentence > 28) score -= 0.12
  if (paras > 6) score -= 0.08
  if (labels > 0) score -= Math.min(0.2, labels * 0.05)

  if (labels > 0) ws.push('Framework labels found in body copy.')
  if (maxSentence > 28) ws.push('At least one sentence is too long for one-pass comprehension.')
  if (avg > 20) ws.push('Average sentence length is high.')
  if (paras > 6) ws.push('Too many paragraphs for quick mobile reading.')

  if (score < 0.6) bs.push('Understand score is below required floor.')

  return { score: clamp01(score), warnings: ws, blockers: bs }
}

function calcReplyScore(text: string): { score: number; warnings: string[] } {
  const ws: string[] = []
  let score = 0.68
  if (includesYesPass(text)) {
    score += 0.2
  } else if (hasCurrentCtaShape(text)) {
    score += 0.18
  } else {
    ws.push('Clear CTA/exit language not found.')
  }

  if (/if useful/i.test(text)) score += 0.05
  if (/close the loop|archive this thread/i.test(text)) score += 0.04

  return { score: clamp01(score), warnings: ws }
}

function calcProductLiftScore(text: string): { score: number; warnings: string[] } {
  const ws: string[] = []
  let score = 0.62

  if (hasStartingMonday(text)) score += 0.18
  else ws.push('Starting Monday is not explicitly named in body.')

  if (hasProofShape(text)) score += 0.1
  else ws.push('Proof line is missing a concrete evidence marker.')

  if (hasCaveat(text)) score += 0.06
  else ws.push('Caveat language is missing.')

  return { score: clamp01(score), warnings: ws }
}

function ejes(open: number, understand: number, reply: number, productLift: number): number {
  const score = 100 * Math.pow(open, 0.25) * Math.pow(understand, 0.35) * Math.pow(reply, 0.25) * Math.pow(productLift, 0.15)
  return Math.round(score)
}

export function evaluateEmailCouncilQuality({
  channel,
  subject,
  html,
  minEjes = 80,
}: {
  channel?: EmailCouncilChannel
  subject: string
  html: string
  minEjes?: number
}): EmailCouncilEvaluation {
  const safeChannel = channel ?? 'general'
  const text = toText(html)
  const blockers: string[] = []
  const warnings: string[] = []

  const open = calcOpenScore(subject)
  const understandResult = calcUnderstandScore(text)
  const replyResult = calcReplyScore(text)
  const productResult = calcProductLiftScore(text)

  warnings.push(...understandResult.warnings, ...replyResult.warnings, ...productResult.warnings)
  blockers.push(...understandResult.blockers)

  if (paragraphCount(text) > 8) blockers.push('Paragraph count is too high for fast-read outreach.')

  const score = ejes(open, understandResult.score, replyResult.score, productResult.score)
  if (score < minEjes) blockers.push(`EJES ${score} is below required ${minEjes}.`)

  return {
    channel: safeChannel,
    subject,
    html,
    text,
    scores: {
      open,
      understand: understandResult.score,
      reply: replyResult.score,
      productLift: productResult.score,
      ejes: score,
    },
    blockers,
    warnings,
    passes: blockers.length === 0,
  }
}

function applySafeRewritePass(subject: string, html: string): { subject: string; html: string; changes: string[] } {
  let nextSubject = subject
  let nextHtml = html
  const changes: string[] = []

  const before = nextHtml
  nextHtml = nextHtml.replace(/\bTrigger this week:\s*/gi, 'I saw ')
  if (nextHtml !== before) changes.push('Removed Trigger this week label.')

  const beforeChoice = nextHtml
  nextHtml = nextHtml.replace(/\bChoice:\s*/gi, 'Most teams ')
  if (nextHtml !== beforeChoice) changes.push('Removed Choice label.')

  const beforeQuick = nextSubject
  nextSubject = nextSubject.replace(/quick question\s*[:\-]?\s*/i, '')
  if (nextSubject !== beforeQuick) changes.push('Removed quick question subject prefix.')

  if (nextSubject.length > 70) {
    nextSubject = nextSubject.slice(0, 70).trim()
    changes.push('Trimmed long subject for readability.')
  }

  return { subject: nextSubject, html: nextHtml, changes }
}

export function autoRefineEmailDraft({
  channel,
  subject,
  html,
  minEjes = 80,
  maxPasses = 2,
}: {
  channel?: EmailCouncilChannel
  subject: string
  html: string
  minEjes?: number
  maxPasses?: number
}): EmailCouncilRefinement {
  let currentSubject = subject
  let currentHtml = html
  const rewrites: string[] = []

  let evaluation = evaluateEmailCouncilQuality({ channel, subject: currentSubject, html: currentHtml, minEjes })

  for (let i = 0; i < maxPasses && !evaluation.passes; i++) {
    const pass = applySafeRewritePass(currentSubject, currentHtml)
    currentSubject = pass.subject
    currentHtml = pass.html
    rewrites.push(...pass.changes)
    evaluation = evaluateEmailCouncilQuality({ channel, subject: currentSubject, html: currentHtml, minEjes })
    if (pass.changes.length === 0) break
  }

  return {
    evaluation,
    refinedSubject: currentSubject,
    refinedHtml: currentHtml,
    rewritesApplied: rewrites,
    passesAfterRefine: evaluation.passes,
  }
}

export async function logEmailCouncilScore(entry: {
  to: string
  channel: EmailCouncilChannel
  subject: string
  scores: EmailCouncilScores
  blocked: boolean
  blockers: string[]
  warnings: string[]
}): Promise<void> {
  await mkdir(path.dirname(SCORE_LOG_PATH), { recursive: true })
  const line = JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n'
  await appendFile(SCORE_LOG_PATH, line, 'utf8')
}

export function emailCouncilScoreLogPath(): string {
  return SCORE_LOG_PATH
}
