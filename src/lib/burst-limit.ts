// Per-minute burst limiter for AI routes. Prevents rapid-fire requests.
// Counters live in Postgres (public.check_rate_limit, migration 189) so they
// are shared across replicas and survive deploys. If the shared store is not
// configured or not reachable, this falls back to a per-process window.

import {
  consumeSharedRateLimit,
  isSharedRateLimitConfigured,
  toStoredRateLimitKey,
} from '@/lib/rate-limit-store'

const WINDOW_MS = 60_000
const BURST_LIMIT = 10

const windows = new Map<string, { count: number; resetAt: number }>()

function checkBurstLimitInMemory(key: string): boolean {
  const now = Date.now()
  const entry = windows.get(key)

  if (!entry || now > entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= BURST_LIMIT) return false
  entry.count++
  return true
}

export function __resetBurstWindowsForTests() {
  windows.clear()
}

export async function checkBurstLimit(key: string): Promise<boolean> {
  if (!isSharedRateLimitConfigured()) {
    return checkBurstLimitInMemory(key)
  }

  const shared = await consumeSharedRateLimit(
    toStoredRateLimitKey('burst', key),
    BURST_LIMIT,
    WINDOW_MS,
  )
  if (!shared) {
    return checkBurstLimitInMemory(key)
  }

  return shared.allowed
}