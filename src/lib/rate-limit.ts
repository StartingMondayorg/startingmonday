import {
  consumeSharedRateLimit,
  isSharedRateLimitConfigured,
  toStoredRateLimitKey,
} from '@/lib/rate-limit-store'

type Bucket = { count: number; resetAt: number }

// Used only when the shared Postgres store (public.check_rate_limit) is not
// configured or not reachable. Per process, so it resets on deploy.
const buckets = new Map<string, Bucket>()

type RateLimitResult = { allowed: boolean; retryAfter?: number }

function checkRateLimitInMemory(
  key: string,
  maxPerWindow: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const existing = buckets.get(key)

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  if (existing.count >= maxPerWindow) {
    return { allowed: false, retryAfter: Math.ceil((existing.resetAt - now) / 1000) }
  }

  existing.count++
  return { allowed: true }
}

export function __resetRateLimitBucketsForTests() {
  buckets.clear()
}

export async function checkRateLimit(
  key: string,
  maxPerWindow = 20,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (!isSharedRateLimitConfigured()) {
    return checkRateLimitInMemory(key, maxPerWindow, windowMs)
  }

  const shared = await consumeSharedRateLimit(
    toStoredRateLimitKey('rl', key),
    maxPerWindow,
    windowMs,
  )
  if (!shared) {
    return checkRateLimitInMemory(key, maxPerWindow, windowMs)
  }

  if (shared.allowed) {
    return { allowed: true }
  }

  const retryAfter = Math.ceil((shared.resetAt - Date.now()) / 1000)
  return { allowed: false, retryAfter: Math.max(1, retryAfter) }
}