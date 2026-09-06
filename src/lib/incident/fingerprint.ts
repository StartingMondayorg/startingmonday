import { createHash } from 'crypto'

// An incident's identity is "what broke", never "when" or "how badly". Run ids,
// URLs, timestamps, latency percentiles and failure counts all change between
// two alerts about the same outage -- folding any of them in would give
// production-synthetics.yml (which fires every 5 minutes with no cooldown) a
// fresh fingerprint every tick, and the dedup table would grow 12 rows an hour
// while the agent re-diagnosed the same failure each time.

export type AlertClass =
  | 'app-error-new'
  | 'app-error-rate'
  | 'uptime'
  | 'post-deploy-synthetics'
  | 'synthetics-p0'
  | 'deploy-stalled'
  | 'sha-not-live'
  | 'smoke-failure'
  | 'canary-gate'
  | 'fast-burn'

export function fingerprint(alertClass: AlertClass, signalKey: string): string {
  return createHash('sha256').update(`${alertClass}|${signalKey}`).digest('hex').slice(0, 32)
}

// Playwright does not guarantee a stable ordering for failed specs, so the same
// two tests can arrive as "a|b" or "b|a". Sorting is what makes those one
// incident instead of two.
export function normalizeTestNames(raw: string): string {
  // Sources disagree on the separator: production-synthetics.yml renders
  // "- a.spec.ts - b.spec.ts" while post-deploy.yml joins with "|". Splitting on
  // " - " rather than "-" keeps hyphenated filenames intact.
  const names = raw
    .split(/\s+-\s+|[|,\n]/)
    .map(part => part.trim().replace(/^[-*\s]+/, ''))
    .map(part => part.split('/').pop() ?? part)
    .map(part => part.trim().toLowerCase())
    .filter(Boolean)

  return [...new Set(names)].sort().join(',')
}
