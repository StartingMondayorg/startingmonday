type FirstSessionGuidedBriefingInput = {
  userId: string | null | undefined
  accountCreatedAt: string | null | undefined
  totalCompanies: number
  rolloutEnabled: boolean
  rolloutPercentage?: number
  maxAccountAgeHours?: number
}

export function chooseDeterministicRolloutBucket(seed: string, modulo = 100): number {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % modulo
}

export function isInDeterministicRollout(seed: string, percentage: number): boolean {
  if (percentage <= 0) return false
  if (percentage >= 100) return true
  return chooseDeterministicRolloutBucket(seed, 100) < percentage
}

export function shouldShowFirstSessionGuidedBriefing(input: FirstSessionGuidedBriefingInput): boolean {
  if (!input.rolloutEnabled) return false
  const userId = (input.userId ?? '').trim()
  if (!userId) return false

  const createdAtRaw = (input.accountCreatedAt ?? '').trim()
  if (!createdAtRaw) return false
  const createdAtTs = Date.parse(createdAtRaw)
  if (Number.isNaN(createdAtTs)) return false

  const maxAgeHours = input.maxAccountAgeHours ?? 48
  const ageHours = (Date.now() - createdAtTs) / 3600000
  if (ageHours >= maxAgeHours) return false

  if (input.totalCompanies > 1) return false

  const rolloutPercentage = input.rolloutPercentage ?? 50
  return isInDeterministicRollout(userId, rolloutPercentage)
}
