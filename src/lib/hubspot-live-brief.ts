import { getLiveBriefControls } from '@/lib/live-brief-controls'

export type LiveBriefHubSpotMilestone =
  | 'request_created'
  | 'profile_reviewed'
  | 'scan_started'
  | 'scan_completed'
  | 'brief_finalized'
  | 'delivery_released'
  | 'delivery_opened'
  | 'delivery_cta_clicked'
  | 'delivery_revoked'
  | 'request_deleted'

export type LiveBriefHubSpotPayload = {
  contactId: string
  dealId?: string | null
  milestone: LiveBriefHubSpotMilestone
  occurredAt: string
  requestSource?: 'inbound_email' | 'call' | 'referral' | 'other'
  deliveryState?: 'not_delivered' | 'delivered' | 'opened' | 'booked' | 'revoked'
}

export type LiveBriefHubSpotSyncResult =
  | { enabled: false; reason: 'feature_disabled' | 'not_configured' }
  | { enabled: true; accepted: true }

type HubSpotEnvironment = Partial<Record<'LIVE_BRIEF_HUBSPOT_SYNC_ENABLED' | 'HUBSPOT_PRIVATE_APP_TOKEN' | 'HUBSPOT_API_BASE_URL', string>>

const ALLOWED_MILESTONES = new Set<LiveBriefHubSpotMilestone>([
  'request_created', 'profile_reviewed', 'scan_started', 'scan_completed',
  'brief_finalized', 'delivery_released', 'delivery_opened', 'delivery_cta_clicked',
  'delivery_revoked', 'request_deleted',
])

export function liveBriefHubSpotSyncEnabled(env: HubSpotEnvironment = process.env as HubSpotEnvironment): boolean {
  return getLiveBriefControls(env).hubspotSyncEnabled
}

export function validateLiveBriefHubSpotPayload(payload: LiveBriefHubSpotPayload): string[] {
  const errors: string[] = []
  if (!payload.contactId.trim()) errors.push('contactId is required')
  if (!ALLOWED_MILESTONES.has(payload.milestone)) errors.push('milestone is not allowed')
  if (Number.isNaN(new Date(payload.occurredAt).getTime())) errors.push('occurredAt must be an ISO timestamp')
  return errors
}

export async function syncLiveBriefHubSpotMilestone(
  payload: LiveBriefHubSpotPayload,
  env: HubSpotEnvironment = process.env as HubSpotEnvironment,
): Promise<LiveBriefHubSpotSyncResult> {
  const errors = validateLiveBriefHubSpotPayload(payload)
  if (errors.length) throw new Error(`Invalid HubSpot milestone: ${errors.join('; ')}`)
  if (!liveBriefHubSpotSyncEnabled(env)) return { enabled: false, reason: 'feature_disabled' }
  if (!env.HUBSPOT_PRIVATE_APP_TOKEN || !env.HUBSPOT_API_BASE_URL) return { enabled: false, reason: 'not_configured' }

  // Provider calls are intentionally not enabled until scopes, object model, and
  // retry/dead-letter policy are approved in the Phase 1 integration preflight.
  return { enabled: false, reason: 'not_configured' }
}
