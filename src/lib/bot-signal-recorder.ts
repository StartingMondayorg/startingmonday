import {
  type BotSignalOutcome,
  classifyRequest,
  hashIp,
  hashIpPrefix,
} from '@/lib/bot-signals'

// SMK-467: persistence for bot traffic observations.
//
// Contract, matching logEvent in @/lib/events: never throws, never blocks the
// caller, never changes what the caller returns. If this fails we lose a row of
// telemetry, which is always preferable to failing a user's request.

type RecordInput = {
  headers: { get(name: string): string | null }
  method: string
  route: string
  rateLimitKey: string
  ip: string
  outcome: BotSignalOutcome
}

const MAX_USER_AGENT_LENGTH = 256

function isDisabled(): boolean {
  if (process.env.BOT_SIGNAL_RECORDING === '0') return true
  // Vitest and CI runs have no Supabase to write to and no reason to try.
  if (process.env.NODE_ENV === 'test') return true
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY
}

export function buildBotSignalRow(input: RecordInput) {
  const classification = classifyRequest({ headers: input.headers, method: input.method })
  const userAgent = input.headers.get('user-agent')?.slice(0, MAX_USER_AGENT_LENGTH) ?? null

  return {
    route: input.route,
    rate_limit_key: input.rateLimitKey,
    ip_hash: hashIp(input.ip),
    ip_prefix_hash: hashIpPrefix(input.ip),
    outcome: input.outcome,
    user_agent: userAgent,
    ua_class: classification.uaClass,
    bot_score: classification.score,
    country: input.headers.get('cf-ipcountry'),
    details: { reasons: classification.reasons, method: input.method.toUpperCase() },
  }
}

/**
 * Write one observation. Deliberately not awaited by the guard -- the caller
 * fires and forgets so no user-visible latency is added.
 */
export async function recordBotSignal(input: RecordInput): Promise<void> {
  if (isDisabled()) return

  try {
    const { createAdminClient } = await import('@/lib/supabase/admin')
    // bot_signal_events is newer than the generated Supabase types.
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const admin = createAdminClient() as any
    await admin.from('bot_signal_events').insert(buildBotSignalRow(input))
  } catch {
    // Intentionally silent. Telemetry must not interrupt product flows.
  }
}
