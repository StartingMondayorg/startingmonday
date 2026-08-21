import { describe, expect, it } from 'vitest'
import { liveBriefHubSpotSyncEnabled, syncLiveBriefHubSpotMilestone, validateLiveBriefHubSpotPayload } from './hubspot-live-brief'

const payload = {
  contactId: 'contact-1',
  milestone: 'delivery_released' as const,
  occurredAt: '2026-08-20T12:00:00.000Z',
  deliveryState: 'delivered' as const,
}

describe('live brief HubSpot boundary', () => {
  it('is disabled by default and never sends without configuration', async () => {
    expect(liveBriefHubSpotSyncEnabled({})).toBe(false)
    await expect(syncLiveBriefHubSpotMilestone(payload, {})).resolves.toEqual({ enabled: false, reason: 'feature_disabled' })
  })

  it('keeps the minimized milestone payload contract bounded', () => {
    expect(validateLiveBriefHubSpotPayload(payload)).toEqual([])
    expect(validateLiveBriefHubSpotPayload({ ...payload, contactId: '' })).toContain('contactId is required')
    expect(validateLiveBriefHubSpotPayload({ ...payload, milestone: 'raw_profile' as never })).toContain('milestone is not allowed')
    expect(validateLiveBriefHubSpotPayload({ ...payload, occurredAt: 'invalid' })).toContain('occurredAt must be an ISO timestamp')
  })

  it('fails closed as not configured even when the flag is enabled without approved provider setup', async () => {
    await expect(syncLiveBriefHubSpotMilestone(payload, {
      LIVE_BRIEF_HUBSPOT_SYNC_ENABLED: 'true',
      HUBSPOT_PRIVATE_APP_TOKEN: 'placeholder',
      HUBSPOT_API_BASE_URL: 'https://api.hubspot.com',
    })).resolves.toEqual({ enabled: false, reason: 'not_configured' })
  })
})
