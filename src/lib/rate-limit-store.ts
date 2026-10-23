import { createHash } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'

// Shared fixed-window counter backed by public.check_rate_limit (migration 189).
// Returns null when the shared store is unavailable so callers can fall back
// to their in-memory limiter.

export type SharedRateLimitResult = {
  allowed: boolean
  remaining: number
  resetAt: number
}

const EMAIL_PATTERN = /[^\s:@]+@[^\s:@]+\.[^\s:@]+/g
const MAX_STORED_KEY_LENGTH = 200

let fallbackWarned = false

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

export function toStoredRateLimitKey(namespace: string, key: string): string {
  // Hash oversized keys before any regex runs so header-derived input cannot
  // make key processing expensive.
  if (key.length > MAX_STORED_KEY_LENGTH) {
    return `${namespace}:sha256:${sha256Hex(key)}`
  }
  const withoutEmails = key.includes('@')
    ? key.replace(
      EMAIL_PATTERN,
      (email) => `email_sha256:${sha256Hex(email.trim().toLowerCase()).slice(0, 32)}`,
    )
    : key
  const stored = `${namespace}:${withoutEmails}`
  if (stored.length <= MAX_STORED_KEY_LENGTH) return stored
  return `${namespace}:sha256:${sha256Hex(withoutEmails)}`
}

export function isSharedRateLimitConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL
    && process.env.SUPABASE_SERVICE_ROLE_KEY
    && process.env.RATE_LIMIT_FORCE_MEMORY !== '1',
  )
}

function warnFallbackOnce(reason: string) {
  if (fallbackWarned) return
  fallbackWarned = true
  console.warn(
    '[rate_limit]',
    JSON.stringify({ event: 'shared_store_unavailable_using_memory', reason }),
  )
}

type CheckRateLimitRow = {
  allowed?: unknown
  remaining?: unknown
  reset_at?: unknown
}

function parseRow(data: unknown): SharedRateLimitResult | null {
  const row = (Array.isArray(data) ? data[0] : data) as CheckRateLimitRow | null | undefined
  if (!row || typeof row.allowed !== 'boolean') return null
  const resetAt = typeof row.reset_at === 'string' ? Date.parse(row.reset_at) : Number.NaN
  if (!Number.isFinite(resetAt)) return null
  return {
    allowed: row.allowed,
    remaining: typeof row.remaining === 'number' ? row.remaining : 0,
    resetAt,
  }
}

export async function consumeSharedRateLimit(
  storedKey: string,
  maxPerWindow: number,
  windowMs: number,
): Promise<SharedRateLimitResult | null> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: storedKey,
      p_window_seconds: Math.max(1, Math.ceil(windowMs / 1000)),
      p_max: Math.max(1, Math.floor(maxPerWindow)),
    })
    if (error) {
      warnFallbackOnce(error.code ? `rpc_error:${error.code}` : 'rpc_error')
      return null
    }
    const result = parseRow(data)
    if (!result) {
      warnFallbackOnce('unexpected_rpc_response')
      return null
    }
    fallbackWarned = false
    return result
  } catch (error) {
    warnFallbackOnce(error instanceof Error ? `exception:${error.name}` : 'exception')
    return null
  }
}

export function __resetSharedRateLimitWarningForTests() {
  fallbackWarned = false
}
