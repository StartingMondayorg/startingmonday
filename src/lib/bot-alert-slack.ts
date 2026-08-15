import { sendSlackMessage } from '@/lib/slack'
import type { BotTrafficAlert, BotTrafficSnapshot } from '@/lib/bot-traffic-report'

// SMK-467: Slack delivery for bot traffic alerts.
//
// BOT_ALERT_SLACK_TARGETS is an optional comma-separated list of Slack channel
// or user IDs, so Chris and Rich can be DM'd directly. When it is unset we fall
// back to the shared alert channel that @/lib/slack already knows about, which
// means a missing config degrades to "everyone sees it" rather than "nobody
// does".

const SEVERITY_ICON: Record<BotTrafficAlert['severity'], string> = {
  high: ':rotating_light:',
  medium: ':warning:',
  low: ':information_source:',
}

export function getSlackTargets(): string[] {
  return (process.env.BOT_ALERT_SLACK_TARGETS ?? '')
    .split(',')
    .map((target) => target.trim())
    .filter(Boolean)
}

export function buildAlertMessage(
  alerts: BotTrafficAlert[],
  snapshot: BotTrafficSnapshot,
  dashboardUrl: string,
): string {
  const lines = [
    `${SEVERITY_ICON[alerts[0].severity]} *Bot traffic alert - Starting Monday*`,
    '',
    ...alerts.map((alert) => `${SEVERITY_ICON[alert.severity]} *${alert.message}*\n> ${alert.detail}`),
    '',
    `Last hour: ${snapshot.botRequests1h} suspected-bot requests. `
      + `Last 24h: ${snapshot.botRequests24h} of ${snapshot.totalRequests24h} requests `
      + `(${Math.round(snapshot.botShare24h * 100)}%) from ${snapshot.distinctPrefixes24h} networks.`,
    `Baseline: ${snapshot.baselineHourlyMedian} suspected-bot requests/hour over the trailing 7 days.`,
    '',
    `Dashboard: ${dashboardUrl}`,
    '',
    '_Turnstile is intentionally paused. This alert is information, not an incident page --'
      + ' check the dashboard before changing anything._',
  ]

  return lines.join('\n')
}

async function postToTarget(channel: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.SLACK_BOT_TOKEN ?? process.env.SLACK_USER_TOKEN ?? process.env.SLACK_TOKEN
  if (!token) return { ok: false, error: 'Slack token not configured' }

  try {
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text }),
    })
    const payload = (await response.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (!response.ok || !payload.ok) {
      return { ok: false, error: `Slack API failed (${response.status}) ${payload.error ?? ''}`.trim() }
    }
    return { ok: true }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'Slack API call failed' }
  }
}

export async function deliverBotAlert(text: string): Promise<{ delivered: number; errors: string[] }> {
  const targets = getSlackTargets()
  const errors: string[] = []

  if (targets.length === 0) {
    const result = await sendSlackMessage({ text })
    if (result.ok) return { delivered: 1, errors }
    return { delivered: 0, errors: [result.error] }
  }

  let delivered = 0
  for (const target of targets) {
    const result = await postToTarget(target, text)
    if (result.ok) delivered += 1
    else errors.push(`${target}: ${result.error ?? 'unknown error'}`)
  }

  return { delivered, errors }
}
