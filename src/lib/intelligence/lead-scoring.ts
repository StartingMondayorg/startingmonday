export type ScoreReason = {
  label: string
  points: number
}

export type LeadScoreInput = {
  title: string | null
  channel: string | null
  outreachStatus: string | null
  isPriority: boolean
  hasEmail: boolean
  hasLinkedIn: boolean
  hasNotes: boolean
  leadAgeDays: number
  status: string
}

export type LeadRouting = {
  tier: 'hot' | 'warm' | 'nurture'
  queue: 'hot' | 'warm' | 'nurture'
}

const CHANNEL_POINTS: Record<string, number> = {
  referral: 38,
  inbound: 34,
  recruiter: 30,
  linkedin: 20,
  event: 18,
  cold: 8,
}

const OUTREACH_POINTS: Record<string, number> = {
  meeting_scheduled: 36,
  in_conversation: 26,
  reached_out: 8,
  prospect: 0,
  closed: -15,
}

export const ROUTING_THRESHOLDS = {
  hot: 75,
  warm: 50,
} as const

const SENIORITY_KEYWORDS = [
  'chief',
  'c-level',
  'ciso',
  'cio',
  'cdo',
  'ceo',
  'cto',
  'vp',
  'head',
  'director',
  'partner',
  'founder',
]

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n))
}

function agePoints(days: number): number {
  if (days <= 7) return 14
  if (days <= 30) return 9
  if (days <= 90) return 4
  if (days <= 180) return -2
  return -8
}

function containsSeniority(title: string | null): boolean {
  if (!title) return false
  const value = title.toLowerCase()
  return SENIORITY_KEYWORDS.some((keyword) => value.includes(keyword))
}

export function scoreLead(input: LeadScoreInput): { score: number; reasons: ScoreReason[] } {
  const reasons: ScoreReason[] = []

  const channelKey = (input.channel ?? '').toLowerCase().trim()
  const channelScore = CHANNEL_POINTS[channelKey] ?? 10
  reasons.push({ label: `Channel: ${channelKey || 'unknown'}`, points: channelScore })

  const outreachKey = (input.outreachStatus ?? 'prospect').toLowerCase().trim()
  const outreachScore = OUTREACH_POINTS[outreachKey] ?? 0
  reasons.push({ label: `Outreach stage: ${outreachKey}`, points: outreachScore })

  if (input.isPriority) reasons.push({ label: 'Marked priority', points: 12 })
  if (containsSeniority(input.title)) reasons.push({ label: 'Senior title match', points: 12 })
  if (input.hasEmail) reasons.push({ label: 'Email available', points: 10 })
  if (input.hasLinkedIn) reasons.push({ label: 'LinkedIn profile available', points: 4 })
  if (input.hasNotes) reasons.push({ label: 'Notes/context available', points: 6 })

  const recency = agePoints(input.leadAgeDays)
  reasons.push({ label: `Lead age: ${input.leadAgeDays}d`, points: recency })

  if (input.status !== 'active') reasons.push({ label: 'Inactive lead penalty', points: -20 })

  const total = reasons.reduce((sum, r) => sum + r.points, 0)
  return { score: clamp(total, 0, 100), reasons }
}

export function routeLead(score: number): LeadRouting {
  if (score >= ROUTING_THRESHOLDS.hot) return { tier: 'hot', queue: 'hot' }
  if (score >= ROUTING_THRESHOLDS.warm) return { tier: 'warm', queue: 'warm' }
  return { tier: 'nurture', queue: 'nurture' }
}
