import { findSensitive } from './redact'

// The contract between the agent and the workflow that publishes its findings.
// The agent runs in a job with no write credentials; everything it produces is
// untrusted text until it has been parsed and gated here.

export type Verdict = 'code-fix' | 'not-code-fixable' | 'insufficient-evidence'

export type Diagnosis = {
  verdict: Verdict
  summary: string
  reasoning: string
  files: string[]
  suggested_fix?: string
}

const VERDICTS: Verdict[] = ['code-fix', 'not-code-fixable', 'insufficient-evidence']

/**
 * Pulls the first complete JSON object out of the agent's stdout. Models wrap
 * JSON in prose or fences often enough that demanding a bare object would fail
 * for cosmetic reasons, so scan for the first balanced {...} instead -- while
 * respecting string literals so a brace inside a message cannot end the object
 * early.
 */
export function extractJson(raw: string): string | null {
  const start = raw.indexOf('{')
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false

  for (let i = start; i < raw.length; i += 1) {
    const ch = raw[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth += 1
    if (ch === '}') {
      depth -= 1
      if (depth === 0) return raw.slice(start, i + 1)
    }
  }
  return null
}

export type ParseResult =
  | { ok: true; diagnosis: Diagnosis }
  | { ok: false; error: string }

export function parseDiagnosis(raw: string): ParseResult {
  const json = extractJson(raw ?? '')
  if (!json) return { ok: false, error: 'no JSON object found in agent output' }

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch (error) {
    return { ok: false, error: `invalid JSON: ${(error as Error).message}` }
  }

  const value = parsed as Partial<Diagnosis>
  if (!value || typeof value !== 'object') return { ok: false, error: 'not an object' }
  if (!VERDICTS.includes(value.verdict as Verdict)) {
    return { ok: false, error: `verdict must be one of ${VERDICTS.join(', ')}` }
  }
  if (typeof value.summary !== 'string' || !value.summary.trim()) {
    return { ok: false, error: 'summary is required' }
  }
  // Reasoning is mandatory for every verdict, including the negative ones.
  // Without it "not-code-fixable" becomes a free pass the agent can take
  // whenever a problem looks hard.
  if (typeof value.reasoning !== 'string' || !value.reasoning.trim()) {
    return { ok: false, error: 'reasoning is required' }
  }
  const files = Array.isArray(value.files) ? value.files.filter(f => typeof f === 'string') : []

  return {
    ok: true,
    diagnosis: {
      verdict: value.verdict as Verdict,
      summary: value.summary.trim(),
      reasoning: value.reasoning.trim(),
      files,
      ...(typeof value.suggested_fix === 'string' ? { suggested_fix: value.suggested_fix } : {}),
    },
  }
}

const VERDICT_LABEL: Record<Verdict, string> = {
  'code-fix': ':wrench: Code fix identified',
  'not-code-fixable': ':information_source: Not fixable in code',
  'insufficient-evidence': ':grey_question: Not enough evidence',
}

/** Slack mrkdwn for the thread reply. Length-capped; Slack truncates at 40k. */
export function renderThreadMessage(input: {
  diagnosis: Diagnosis
  alertClass: string
  runUrl?: string
  dryRun?: boolean
}): string {
  const { diagnosis, alertClass, runUrl, dryRun } = input
  const lines = [
    `${VERDICT_LABEL[diagnosis.verdict]}  ·  \`${alertClass}\``,
    '',
    diagnosis.summary,
    '',
    `*Why:* ${diagnosis.reasoning}`,
  ]

  if (diagnosis.files.length) {
    lines.push('', `*Files:* ${diagnosis.files.slice(0, 8).map(f => `\`${f}\``).join(', ')}`)
  }
  if (diagnosis.suggested_fix) {
    lines.push('', `*Suggested fix:* ${diagnosis.suggested_fix}`)
  }
  if (dryRun) {
    lines.push('', '_Dry run: no ticket filed and no PR opened._')
  }
  if (runUrl) {
    lines.push('', `<${runUrl}|View agent run>`)
  }

  const text = lines.join('\n')
  return text.length > 3800 ? `${text.slice(0, 3800)}\n…(truncated)` : text
}

/**
 * The enforcing gate. The agent is *told* not to include secrets or customer
 * data, but instructions are a suggestion; this is what actually stops it.
 * Runs over rendered output, immediately before anything is published.
 */
export function assertPublishable(text: string): { safe: true } | { safe: false; hits: string[] } {
  const hits = findSensitive(text)
  return hits.length ? { safe: false, hits } : { safe: true }
}
