import type { AlertClass } from './fingerprint'
import { normalizeTestNames } from './fingerprint'

// Maps a Slack message in #alerts-prod onto an alert class plus the signal that
// identifies *which* instance of that class it is. Two sources feed this:
// Block Kit messages we author in .github/workflows/ (stable, discriminated by
// the top-level `text`), and Sentry's own Slack app (vendor-formatted, so we
// key off the issue URL rather than any prose we do not control).

export type SlackMessageEvent = {
  type?: string
  subtype?: string
  text?: string
  ts?: string
  thread_ts?: string
  channel?: string
  bot_id?: string
  username?: string
  app_id?: string
  blocks?: unknown
  attachments?: unknown
}

export type Classification = {
  alertClass: AlertClass
  signalKey: string
  /** Fields worth handing the agent as evidence. Redacted before storage. */
  evidence: Record<string, string>
}

/** Flattens every human-readable string in the message into one haystack. */
export function flattenText(event: SlackMessageEvent): string {
  const parts: string[] = []
  if (typeof event.text === 'string') parts.push(event.text)

  const walk = (node: unknown): void => {
    if (typeof node === 'string') {
      parts.push(node)
      return
    }
    if (Array.isArray(node)) {
      for (const child of node) walk(child)
      return
    }
    if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
        // `type` is Block Kit structure ("mrkdwn", "section"), not content --
        // including it would let a block name collide with an alert phrase.
        if (key === 'type') continue
        walk(value)
      }
    }
  }

  walk(event.blocks)
  walk(event.attachments)
  return parts.join('\n')
}

/** Reads `*Label:* value` out of a Block Kit field, unwrapping `<url|text>`. */
export function extractField(haystack: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = haystack.match(new RegExp(`\\*${escaped}:\\*\\s*([^\\n]+)`, 'i'))
  if (!match) return null
  const value = match[1].trim()
  const link = value.match(/^<[^|>]+\|([^>]+)>$/)
  return (link ? link[1] : value).trim() || null
}

function shortSha(value: string | null): string | null {
  if (!value) return null
  const match = value.match(/[0-9a-f]{7,40}/i)
  return match ? match[0].toLowerCase().slice(0, 8) : null
}

export function classify(event: SlackMessageEvent): Classification | null {
  const text = flattenText(event)
  if (!text.trim()) return null

  // Sentry first: its messages are vendor-formatted, so a prose match would be
  // brittle. The issue id in the permalink is the stable identity, and it is
  // exactly what Sentry itself dedupes on.
  const sentryIssue = text.match(/sentry\.io\/[^\s>|]*issues\/(\d+)/i)
  if (sentryIssue) {
    const isRate = /metric alert|error rate|events? in the last/i.test(text)
    return {
      alertClass: isRate ? 'app-error-rate' : 'app-error-new',
      signalKey: sentryIssue[1],
      evidence: { sentry_issue_id: sentryIssue[1], summary: text.slice(0, 2000) },
    }
  }

  const uptime = text.match(/sentry\.io\/[^\s>|]*alerts\/uptime\/(\d+)/i)
  if (uptime) {
    return { alertClass: 'uptime', signalKey: uptime[1], evidence: { monitor_id: uptime[1] } }
  }

  if (/Pushed SHA did not reach production/i.test(text)) {
    const sha = shortSha(extractField(text, 'SHA')) ?? 'unknown'
    return {
      alertClass: 'sha-not-live',
      signalKey: sha,
      evidence: {
        sha,
        state: extractField(text, 'State') ?? 'unknown',
        branch: extractField(text, 'Branch') ?? 'unknown',
      },
    }
  }

  if (/Deployment has not completed/i.test(text)) {
    const sha = shortSha(extractField(text, 'Latest production SHA')) ?? 'unknown'
    return {
      alertClass: 'deploy-stalled',
      signalKey: sha,
      evidence: {
        sha,
        age_minutes: extractField(text, 'Age') ?? 'unknown',
        state: extractField(text, 'State') ?? 'unknown',
      },
    }
  }

  if (/Production smoke check failed/i.test(text)) {
    const branch = (text.match(/Branch:\s*([^\s\n<]+)/i)?.[1] ?? 'unknown').trim()
    return {
      alertClass: 'smoke-failure',
      signalKey: `monitoring:${branch}`,
      evidence: { branch },
    }
  }

  if (/Canary [Gg]ate [Ff]ailed/i.test(text)) {
    // This payload carries no SHA and no failing check name, so every canary
    // failure collapses into one bucket. That is deliberate: there is nothing
    // in the message to tell two of them apart. Enriching the payload in
    // post-deploy.yml is the prerequisite for splitting it.
    return { alertClass: 'canary-gate', signalKey: 'canary-gate', evidence: {} }
  }

  if (/ROLLBACK REQUIRED|Post-Deploy Synthetic Failure/i.test(text)) {
    const tests = extractField(text, 'Tests') ?? ''
    return {
      alertClass: 'post-deploy-synthetics',
      signalKey: normalizeTestNames(tests) || 'unknown',
      evidence: {
        tests,
        sha: shortSha(extractField(text, 'Deploy SHA')) ?? 'unknown',
        failed: extractField(text, 'Failed checks') ?? 'unknown',
        rollback_required: String(/ROLLBACK REQUIRED/i.test(text)),
      },
    }
  }

  if (/P0 Synthetic [Ff]ailure/i.test(text)) {
    const tests = extractField(text, 'Tests') ?? ''
    return {
      alertClass: 'synthetics-p0',
      signalKey: normalizeTestNames(tests) || 'unknown',
      evidence: {
        tests,
        sha: shortSha(extractField(text, 'Deploy SHA')) ?? 'unknown',
        failed: extractField(text, 'Failed checks') ?? 'unknown',
        journey_risk: extractField(text, 'Journey risk') ?? 'unknown',
      },
    }
  }

  if (/FAST-BURN ALERT|Fast-Burn Alert/i.test(text)) {
    // Only one fast burn can be live at a time, so it is a singleton by nature.
    return { alertClass: 'fast-burn', signalKey: 'fast-burn', evidence: { summary: text.slice(0, 2000) } }
  }

  return null
}
