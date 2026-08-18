type RelationshipInput = {
  title: string | null
  status: string | null
  channel: string | null
  isPriority: boolean
  leadScore: number | null
  lastRoleDiscussed: string | null
}

export type RelationshipScoreResult = {
  score: number
  isRecruiter: boolean
  tier: 'tier_1' | 'tier_2' | 'tier_3'
  reasons: string[]
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function isRecruiterTitle(title: string | null): boolean {
  const normalized = (title ?? '').toLowerCase()
  return /(recruit|talent|sourcer|staffing)/.test(normalized)
}

export function scoreRelationshipTarget(input: RelationshipInput): RelationshipScoreResult {
  const reasons: string[] = []
  let score = 40

  const recruiter = isRecruiterTitle(input.title)
  if (recruiter) {
    score += 20
    reasons.push('Recruiter-aligned contact for role matching and process velocity.')
  }

  if (input.isPriority) {
    score += 15
    reasons.push('Marked as priority contact.')
  }

  if ((input.status ?? '').toLowerCase() === 'active') {
    score += 10
    reasons.push('Active contact status indicates reachable relationship path.')
  }

  if ((input.channel ?? '').toLowerCase() === 'linkedin') {
    score += 5
    reasons.push('LinkedIn channel available for warm-path sequencing.')
  }

  if ((input.lastRoleDiscussed ?? '').trim().length > 0) {
    score += 8
    reasons.push('Role context already discussed with this contact.')
  }

  if (typeof input.leadScore === 'number' && Number.isFinite(input.leadScore)) {
    const leadAdjustment = clamp(Math.round(input.leadScore / 6), -5, 20)
    score += leadAdjustment
    reasons.push('Lead score contributes to relationship targeting confidence.')
  }

  score = clamp(score, 0, 100)

  const tier: RelationshipScoreResult['tier'] =
    score >= 80 ? 'tier_1' :
    score >= 65 ? 'tier_2' :
    'tier_3'

  return { score, isRecruiter: recruiter, tier, reasons }
}
