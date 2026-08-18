import { buildPrepClaimProvenance } from '@/lib/prep/prep-provenance'

export type PrepConfidenceResult = {
  score: number
  band: 'high' | 'medium' | 'low'
  factors: {
    structuredSections: number
    provenanceCoverage: number
    inferredSharePenalty: number
  }
  remediation: string[]
}

const REQUIRED_SECTIONS = [
  'Bottom Line',
  'The Situation',
  'Win Thesis',
  'Anticipated Pushback',
  'Likely Questions',
]

function clamp(num: number, min: number, max: number) {
  return Math.max(min, Math.min(max, num))
}

export function scorePrepBriefConfidence(text: string): PrepConfidenceResult {
  const claims = buildPrepClaimProvenance(text)
  const claimCount = claims.length
  const inferredCount = claims.filter((c) => c.originClass === 'inferred').length

  const structuredSections = REQUIRED_SECTIONS.filter((section) => text.includes(`## ${section}`)).length
  const provenanceCoverage = claimCount > 0 ? 1 : 0
  const inferredShare = claimCount > 0 ? inferredCount / claimCount : 1
  const inferredSharePenalty = Math.round(inferredShare * 20)

  let score = 45
  score += Math.round((structuredSections / REQUIRED_SECTIONS.length) * 30)
  score += Math.round(provenanceCoverage * 25)
  score -= inferredSharePenalty

  score = clamp(score, 0, 100)

  const remediation: string[] = []
  if (structuredSections < REQUIRED_SECTIONS.length) {
    remediation.push('Regenerate to restore all required executive sections before export.')
  }
  if (claimCount < 10) {
    remediation.push('Add company notes, interview notes, and role context to increase evidence-backed claims.')
  }
  if (inferredShare > 0.45) {
    remediation.push('Reduce inferred claims by adding stronger user-provided and system-detected evidence inputs.')
  }

  const band: PrepConfidenceResult['band'] =
    score >= 80 ? 'high' :
    score >= 65 ? 'medium' :
    'low'

  return {
    score,
    band,
    factors: {
      structuredSections,
      provenanceCoverage,
      inferredSharePenalty,
    },
    remediation,
  }
}
