export function isEnabledFlag(value: string | null | undefined): boolean {
  if (value == null) return false

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export const RELATIONSHIP_NETWORK_MATCHING_ENABLED_FLAG = 'NEXT_PUBLIC_RELATIONSHIP_NETWORK_MATCHING_ENABLED'

export const STARTING_MONDAY_HERO_EVIDENCE_ENABLED_FLAG = 'NEXT_PUBLIC_SM_HERO_EVIDENCE_ENABLED'

export const STARTING_MONDAY_DASHBOARD_SIMPLIFICATION_ENABLED_FLAG = 'NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED'

export const SIGNAL_BRIEF_PREVIEW_ENABLED_FLAG = 'SIGNAL_BRIEF_PREVIEW_ENABLED'

export function isRelationshipNetworkMatchingEnabled(): boolean {
  return isEnabledFlag(process.env[RELATIONSHIP_NETWORK_MATCHING_ENABLED_FLAG])
}

export function isStartingMondayHeroEvidenceEnabled(): boolean {
  return isEnabledFlag(process.env[STARTING_MONDAY_HERO_EVIDENCE_ENABLED_FLAG])
}

export function isStartingMondayDashboardSimplificationEnabled(): boolean {
  return isEnabledFlag(process.env[STARTING_MONDAY_DASHBOARD_SIMPLIFICATION_ENABLED_FLAG])
}

export function isSignalBriefPreviewEnabled(): boolean {
  return isEnabledFlag(process.env[SIGNAL_BRIEF_PREVIEW_ENABLED_FLAG])
}