export const PREP_EVIDENCE_THRESHOLD = 3

type GroundingCountsInput = {
  hasCompanyNotes: boolean
  signalCount: number
  documentCount: number
  contactCount?: number
  hasScanSummary?: boolean
}

export type PrepGroundingAssessment = {
  evidenceCount: number
  isGrounded: boolean
}

export function assessPrepGrounding(input: GroundingCountsInput): PrepGroundingAssessment {
  const evidenceCount =
    Number(input.hasCompanyNotes) +
    input.signalCount +
    input.documentCount +
    (input.contactCount ?? 0) +
    Number(input.hasScanSummary ?? false)

  return {
    evidenceCount,
    isGrounded: evidenceCount >= PREP_EVIDENCE_THRESHOLD,
  }
}

export function prepGroundingNotice(): string {
  return [
    '## Verification Status',
    'Pattern analysis, not verified intel.',
    'This section used limited evidence from your workspace and is intentionally written as pattern language.',
    'Add company notes, documents, contacts, or fresh signals, then regenerate for verified company-specific insight.',
  ].join('\n\n')
}
