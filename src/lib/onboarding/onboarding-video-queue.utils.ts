const DEFAULT_MAX_RETRIES = 3
const MAX_RETRIES_LIMIT = 10

export type MilestoneEventName =
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_first_value_ready'

export function clampLimit(limit: number | undefined, fallback: number, max: number): number {
  const value = Number(limit ?? fallback)
  if (!Number.isFinite(value)) return fallback
  return Math.max(1, Math.min(Math.floor(value), max))
}

export function normalizeMaxRetries(maxRetries: number | undefined): number {
  const value = Number(maxRetries ?? DEFAULT_MAX_RETRIES)
  if (!Number.isFinite(value)) return DEFAULT_MAX_RETRIES
  return Math.max(0, Math.min(Math.floor(value), MAX_RETRIES_LIMIT))
}

export function computeRetryDelayMs(retryCount: number): number {
  const base = 2 * 60 * 1000
  const exponent = Math.max(0, retryCount)
  const jitter = Math.floor(Math.random() * 15_000)
  return Math.min(base * Math.pow(2, exponent) + jitter, 2 * 60 * 60 * 1000)
}

export function mapMilestoneToFlow(
  eventName: MilestoneEventName,
  properties: Record<string, string | number | boolean | null>,
): string {
  if (eventName === 'onboarding_started') return 'onboarding_first_day'

  if (eventName === 'onboarding_first_value_ready') {
    const channel = String(properties.channel ?? properties.onboarding_channel ?? 'executive').toLowerCase()
    if (channel.includes('coach')) return 'coach_channel_playbook'
    if (channel.includes('founder')) return 'founder_channel_playbook'
    return 'executive_channel_playbook'
  }

  const step = String(properties.step ?? properties.step_id ?? properties.step_name ?? '').toLowerCase()
  if (step.includes('follow')) return 'follow_up_rhythm'
  if (step.includes('brief')) return 'briefing_workflow'
  if (step.includes('outreach')) return 'outreach_launch'
  return 'onboarding_step_checkpoint'
}
