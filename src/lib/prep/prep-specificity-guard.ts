import type { PrepClaimProvenance } from '@/lib/prep/prep-provenance'

type SpecificityGuardResult = {
  text: string
  wasSanitized: boolean
}

const MONTH_DATE_REGEX = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*\d{4})?\b/
const YEAR_REGEX = /\b(?:19|20)\d{2}\b/
const MULTI_WORD_PROPER_NOUN_REGEX = /\b[A-Z][a-z]+\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/
const TITLE_WITH_NAME_REGEX = /\b(?:CEO|CFO|CTO|COO|CISO|CHRO|CPO|Chief\s+[A-Z][a-z]+)\s+[A-Z][a-z]+\b/

function normalizeLine(line: string): string {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function hasUnsupportedSpecificity(claimText: string): boolean {
  return (
    MONTH_DATE_REGEX.test(claimText) ||
    YEAR_REGEX.test(claimText) ||
    TITLE_WITH_NAME_REGEX.test(claimText) ||
    MULTI_WORD_PROPER_NOUN_REGEX.test(claimText)
  )
}

function needsRewrite(claim: PrepClaimProvenance): boolean {
  const hasEvidence = Array.isArray(claim.sourceEvidence) && claim.sourceEvidence.length > 0
  if (hasEvidence) return false
  return hasUnsupportedSpecificity(claim.claimText)
}

function rewriteToPatternLanguage(rawLine: string): string {
  const generic = 'companies at this stage typically focus on operating cadence, decision clarity, and measurable outcomes.'
  const bulletMatch = rawLine.match(/^(\s*[-*]\s+)/)
  if (bulletMatch) return `${bulletMatch[1]}${generic}`

  const numberedMatch = rawLine.match(/^(\s*\d+[.)]\s+)/)
  if (numberedMatch) return `${numberedMatch[1]}${generic}`

  return generic.charAt(0).toUpperCase() + generic.slice(1)
}

export function enforcePrepSpecificityGuard(
  text: string,
  claims: PrepClaimProvenance[],
): SpecificityGuardResult {
  const flaggedClaims = new Set(
    claims
      .filter(needsRewrite)
      .map((claim) => claim.claimText),
  )

  if (flaggedClaims.size === 0) {
    return { text, wasSanitized: false }
  }

  const lines = text.split('\n')
  let changed = false
  const rewritten = lines.map((line) => {
    const normalized = normalizeLine(line)
    if (!normalized || !flaggedClaims.has(normalized)) return line
    changed = true
    return rewriteToPatternLanguage(line)
  })

  return {
    text: changed ? rewritten.join('\n') : text,
    wasSanitized: changed,
  }
}
