export const RECENT_AUTH_MAX_AGE_SECONDS = 15 * 60
const CLOCK_SKEW_SECONDS = 60

type AuthenticationMethodReference = {
  timestamp?: unknown
}

export function hasRecentAuthentication(
  amr: unknown,
  nowSeconds = Math.floor(Date.now() / 1_000),
): boolean {
  if (!Array.isArray(amr)) return false

  return amr.some((entry) => {
    if (!entry || typeof entry !== 'object') return false
    const timestamp = (entry as AuthenticationMethodReference).timestamp
    return typeof timestamp === 'number'
      && Number.isFinite(timestamp)
      && timestamp <= nowSeconds + CLOCK_SKEW_SECONDS
      && timestamp >= nowSeconds - RECENT_AUTH_MAX_AGE_SECONDS
  })
}