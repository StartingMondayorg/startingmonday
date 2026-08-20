export const PREP_PROVENANCE_VERSION = 1

export type ClaimOriginClass = 'user_provided' | 'system_detected' | 'inferred'

export type SourceEvidenceKind =
  | 'career_history'
  | 'resume_text'
  | 'star_story'
  | 'company_signals'
  | 'scan_results'
  | 'company_notes'
  | 'interview_notes'
  | 'contact_records'
  | 'company_documents'
  | 'job_description'

export type SensitivePolicyHook =
  | 'compensation_claim'
  | 'legal_risk_claim'
  | 'security_incident_claim'

export type PrepClaimProvenance = {
  claimText: string
  originClass: ClaimOriginClass
  section: string | null
  sensitivePolicyHooks: SensitivePolicyHook[]
  sourceEvidence: SourceEvidenceKind[]
  sourceContextIds?: string[]
}

export type PrepProvenanceValidationError = {
  index: number
  code:
    | 'missing_claim_text'
    | 'missing_origin_class'
    | 'invalid_origin_class'
    | 'invalid_source_context_ids'
    | 'sensitive_inferred_block'
    | 'sensitive_requires_evidence'
  message: string
}

const ORIGIN_CLASSES: ClaimOriginClass[] = ['user_provided', 'system_detected', 'inferred']
const USER_EVIDENCE: SourceEvidenceKind[] = ['career_history', 'resume_text', 'star_story']
const SYSTEM_EVIDENCE: SourceEvidenceKind[] = [
  'company_signals',
  'scan_results',
  'company_notes',
  'interview_notes',
  'contact_records',
  'company_documents',
  'job_description',
]

function normalizeLine(line: string): string {
  return line
    .replace(/^[-*]\s+/, '')
    .replace(/^\d+[.)]\s+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sectionHeader(line: string): string | null {
  if (!line.startsWith('## ')) return null
  return line.slice(3).trim() || null
}

function detectSourceEvidence(claimText: string, section: string | null): SourceEvidenceKind[] {
  const text = claimText.toLowerCase()
  const sectionText = (section ?? '').toLowerCase()
  const matches = new Set<SourceEvidenceKind>()

  if (
    text.includes('resume') ||
    text.includes('career history') ||
    text.includes('candidate-verified') ||
    sectionText.includes('background match')
  ) {
    matches.add('resume_text')
    matches.add('career_history')
  }

  if (text.includes('story') || text.includes('star')) {
    matches.add('star_story')
  }

  if (text.includes('signal') || text.includes('announcement') || text.includes('filing')) {
    matches.add('company_signals')
  }

  if (text.includes('scan')) {
    matches.add('scan_results')
  }

  if (text.includes('company notes') || text.includes('notes')) {
    matches.add('company_notes')
  }

  if (text.includes('interview notes') || text.includes('prior interview')) {
    matches.add('interview_notes')
  }

  if (text.includes('contact') || text.includes('recruiter') || text.includes('hiring manager')) {
    matches.add('contact_records')
  }

  if (text.includes('document') || text.includes('job description') || sectionText.includes('requirement')) {
    matches.add('company_documents')
  }

  if (text.includes('job description') || sectionText.includes('requirement')) {
    matches.add('job_description')
  }

  if (sectionText.includes('situation') || sectionText.includes('focus')) {
    matches.add('company_notes')
    matches.add('company_signals')
  }

  return Array.from(matches)
}

function inferOriginClass(claimText: string, sourceEvidence: SourceEvidenceKind[]): ClaimOriginClass {
  if (sourceEvidence.some((e) => USER_EVIDENCE.includes(e)) && !sourceEvidence.some((e) => SYSTEM_EVIDENCE.includes(e))) {
    return 'user_provided'
  }

  if (sourceEvidence.some((e) => SYSTEM_EVIDENCE.includes(e))) {
    return 'system_detected'
  }

  const text = claimText.toLowerCase()

  if (
    text.includes('candidate') ||
    text.includes('your resume') ||
    text.includes('verified') ||
    text.includes('career history') ||
    text.includes('star story')
  ) {
    return 'user_provided'
  }

  if (
    text.includes('signal') ||
    text.includes('scan') ||
    text.includes('pipeline') ||
    text.includes('company notes') ||
    text.includes('interview notes') ||
    text.includes('contact') ||
    text.includes('document')
  ) {
    return 'system_detected'
  }

  return 'inferred'
}

function detectSensitivePolicyHooks(claimText: string): SensitivePolicyHook[] {
  const text = claimText.toLowerCase()
  const hooks: SensitivePolicyHook[] = []

  if (/(salary|compensation|equity|cash|bonus|\$|k\b)/i.test(text)) {
    hooks.push('compensation_claim')
  }
  if (/(lawsuit|litigation|regulatory|sec inquiry|legal exposure|compliance breach)/i.test(text)) {
    hooks.push('legal_risk_claim')
  }
  if (/(breach|incident|ransomware|security event|data exfiltration|cyberattack)/i.test(text)) {
    hooks.push('security_incident_claim')
  }

  return hooks
}

function contextIdsFromEvidence(sourceEvidence: SourceEvidenceKind[]): string[] {
  const ids = new Set<string>()
  for (const evidence of sourceEvidence) {
    if (evidence === 'career_history') ids.add('ctx_career_history')
    if (evidence === 'resume_text') ids.add('ctx_resume_text')
    if (evidence === 'star_story') ids.add('ctx_star_story')
    if (evidence === 'company_signals') ids.add('ctx_company_signals')
    if (evidence === 'scan_results') ids.add('ctx_scan_results')
    if (evidence === 'company_notes') ids.add('ctx_company_notes')
    if (evidence === 'interview_notes') ids.add('ctx_interview_notes')
    if (evidence === 'contact_records') ids.add('ctx_contact_records')
    if (evidence === 'company_documents') ids.add('ctx_company_documents')
    if (evidence === 'job_description') ids.add('ctx_job_description')
  }
  return Array.from(ids)
}

export function buildPrepClaimProvenance(outputText: string): PrepClaimProvenance[] {
  const lines = outputText.split('\n')
  const claims: PrepClaimProvenance[] = []
  let currentSection: string | null = null

  for (const rawLine of lines) {
    const maybeSection = sectionHeader(rawLine.trim())
    if (maybeSection) {
      currentSection = maybeSection
      continue
    }

    const claimText = normalizeLine(rawLine)
    if (!claimText) continue
    if (claimText.startsWith('#')) continue
    if (claimText === '---' || claimText === '***') continue
    if (claimText.length < 24) continue

    const sourceEvidence = detectSourceEvidence(claimText, currentSection)

    claims.push({
      claimText,
      originClass: inferOriginClass(claimText, sourceEvidence),
      section: currentSection,
      sensitivePolicyHooks: detectSensitivePolicyHooks(claimText),
      sourceEvidence,
      sourceContextIds: contextIdsFromEvidence(sourceEvidence),
    })

    if (claims.length >= 80) break
  }

  return claims
}

export function validatePrepClaimProvenance(claims: PrepClaimProvenance[]): PrepProvenanceValidationError[] {
  const errors: PrepProvenanceValidationError[] = []

  for (const [index, claim] of claims.entries()) {
    if (!claim.claimText || !claim.claimText.trim()) {
      errors.push({
        index,
        code: 'missing_claim_text',
        message: 'Claim text is required for each provenance record.',
      })
    }

    if (!('originClass' in claim)) {
      errors.push({
        index,
        code: 'missing_origin_class',
        message: 'Every claim must include an originClass.',
      })
      continue
    }

    if (!ORIGIN_CLASSES.includes(claim.originClass)) {
      errors.push({
        index,
        code: 'invalid_origin_class',
        message: `originClass must be one of: ${ORIGIN_CLASSES.join(', ')}.`,
      })
      continue
    }

    if ('sourceContextIds' in claim && claim.sourceContextIds !== undefined) {
      if (!Array.isArray(claim.sourceContextIds) || claim.sourceContextIds.some((id) => typeof id !== 'string' || !id.trim())) {
        errors.push({
          index,
          code: 'invalid_source_context_ids',
          message: 'sourceContextIds must be an array of non-empty strings when provided.',
        })
      }
    }

    if ((claim.sensitivePolicyHooks?.length ?? 0) > 0 && claim.originClass === 'inferred') {
      errors.push({
        index,
        code: 'sensitive_inferred_block',
        message: 'Sensitive claims cannot be stored with inferred originClass.',
      })
    }

    if ((claim.sensitivePolicyHooks?.length ?? 0) > 0 && claim.originClass !== 'inferred') {
      const evidence = Array.isArray(claim.sourceEvidence) ? claim.sourceEvidence : []
      if (evidence.length === 0) {
        errors.push({
          index,
          code: 'sensitive_requires_evidence',
          message: 'Sensitive claims must include at least one sourceEvidence marker.',
        })
        continue
      }

      const expectedEvidence = claim.originClass === 'user_provided' ? USER_EVIDENCE : SYSTEM_EVIDENCE
      if (!evidence.some((item) => expectedEvidence.includes(item))) {
        errors.push({
          index,
          code: 'sensitive_requires_evidence',
          message: `Sensitive claims with ${claim.originClass} originClass must include matching sourceEvidence markers.`,
        })
      }
    }
  }

  return errors
}

export function applyAttributionV2(
  claims: PrepClaimProvenance[],
  allowedContextIds: string[],
): PrepClaimProvenance[] {
  const allowed = new Set(allowedContextIds.map((id) => id.trim()).filter(Boolean))

  return claims.map((claim) => {
    const candidateIds = (claim.sourceContextIds ?? []).map((id) => id.trim()).filter(Boolean)
    const matchedIds = candidateIds.filter((id) => allowed.has(id))

    if (matchedIds.length === 0) {
      return {
        ...claim,
        originClass: 'inferred',
        sourceEvidence: [],
        sensitivePolicyHooks: [],
        sourceContextIds: [],
      }
    }

    return {
      ...claim,
      originClass: claim.originClass === 'inferred' ? 'system_detected' : claim.originClass,
      sourceContextIds: matchedIds,
    }
  })
}
