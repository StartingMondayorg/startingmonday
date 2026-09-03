// Runs at ingest, before anything is written to agent_incidents, so the agent
// never receives raw production data and cannot echo it into a public PR. The
// repo is public: a stack trace that reaches a PR body is world-readable and
// stays in the git history of the fork network even after deletion.
//
// This is a deny-list plus an entropy heuristic, which means it is not a
// guarantee. scripts/agent-response/check-agent-output-safety.mjs runs the same
// patterns over rendered output as the enforcing gate.

type Rule = { name: string; pattern: RegExp; replacement: string }

const RULES: Rule[] = [
  { name: 'jwt', pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, replacement: '[REDACTED_JWT]' },
  { name: 'bearer', pattern: /\bBearer\s+[A-Za-z0-9._~+/-]{16,}=*/gi, replacement: 'Bearer [REDACTED]' },
  { name: 'stripe-secret', pattern: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{8,}/g, replacement: '[REDACTED_STRIPE_KEY]' },
  { name: 'stripe-webhook', pattern: /\bwhsec_[A-Za-z0-9]{8,}/g, replacement: '[REDACTED_STRIPE_WHSEC]' },
  { name: 'stripe-object', pattern: /\b(cus|sub|pi|in|seti|price)_[A-Za-z0-9]{8,}/g, replacement: '[REDACTED_STRIPE_ID]' },
  { name: 'anthropic', pattern: /\bsk-ant-[A-Za-z0-9_-]{8,}/g, replacement: '[REDACTED_ANTHROPIC_KEY]' },
  { name: 'github-token', pattern: /\bgh[pousr]_[A-Za-z0-9]{16,}/g, replacement: '[REDACTED_GITHUB_TOKEN]' },
  { name: 'slack-token', pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}/g, replacement: '[REDACTED_SLACK_TOKEN]' },
  { name: 'slack-webhook', pattern: /https:\/\/hooks\.slack\.com\/services\/[A-Za-z0-9/]+/g, replacement: '[REDACTED_SLACK_WEBHOOK]' },
  { name: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, replacement: '[REDACTED_EMAIL]' },
  { name: 'supabase-url', pattern: /https:\/\/[a-z0-9]{16,}\.supabase\.(?:co|in)/gi, replacement: '[REDACTED_SUPABASE_URL]' },
  { name: 'railway-internal', pattern: /\b[A-Za-z0-9-]+\.railway\.internal\b/g, replacement: '[REDACTED_INTERNAL_HOST]' },
  { name: 'uuid', pattern: /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, replacement: '[REDACTED_UUID]' },
  { name: 'ipv4', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g, replacement: '[REDACTED_IP]' },
]

// Catches credentials whose prefix we have never seen. Tuned to ignore hex
// (git SHAs are legitimate evidence and must survive) and to require genuine
// mixed-alphabet randomness.
const HIGH_ENTROPY = /\b(?![0-9a-f]{20,}\b)[A-Za-z0-9_-]{32,}\b/g

function looksRandom(token: string): boolean {
  const classes =
    Number(/[a-z]/.test(token)) +
    Number(/[A-Z]/.test(token)) +
    Number(/[0-9]/.test(token)) +
    Number(/[_-]/.test(token))
  if (classes < 3) return false
  const unique = new Set(token).size
  return unique / token.length > 0.45
}

export function redact(input: string): string {
  if (!input) return input
  let out = input
  for (const rule of RULES) out = out.replace(rule.pattern, rule.replacement)
  return out.replace(HIGH_ENTROPY, match => (looksRandom(match) ? '[REDACTED_SECRET]' : match))
}

export function redactRecord(input: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(input).map(([key, value]) => [key, redact(String(value))]))
}

/** Reports which rules fired. Used by the output gate to fail loudly. */
export function findSensitive(input: string): string[] {
  const hits = RULES.filter(rule => new RegExp(rule.pattern.source, rule.pattern.flags).test(input)).map(r => r.name)
  const entropy = input.match(HIGH_ENTROPY)?.some(looksRandom) ?? false
  return entropy ? [...hits, 'high-entropy'] : hits
}
