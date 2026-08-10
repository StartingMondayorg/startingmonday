export function isEnabledFlag(value: string | null | undefined): boolean {
  if (value == null) return false

  const normalized = value.trim().toLowerCase()
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on'
}

export const RELATIONSHIP_NETWORK_MATCHING_ENABLED_FLAG = 'NEXT_PUBLIC_RELATIONSHIP_NETWORK_MATCHING_ENABLED'

export function isRelationshipNetworkMatchingEnabled(): boolean {
  return isEnabledFlag(process.env[RELATIONSHIP_NETWORK_MATCHING_ENABLED_FLAG])
}