import { describe, expect, it } from 'vitest'
import { getLiveBriefControls } from './live-brief-controls'

describe('getLiveBriefControls', () => {
  it('keeps outbound controls disabled by default', () => {
    expect(getLiveBriefControls({})).toEqual({
      hubspotSyncEnabled: false,
      engagementTasksEnabled: false,
    })
  })

  it('evaluates HubSpot sync and engagement tasks independently', () => {
    expect(getLiveBriefControls({
      LIVE_BRIEF_HUBSPOT_SYNC_ENABLED: 'true',
      LIVE_BRIEF_ENGAGEMENT_TASKS_ENABLED: 'false',
    })).toEqual({ hubspotSyncEnabled: true, engagementTasksEnabled: false })

    expect(getLiveBriefControls({
      LIVE_BRIEF_HUBSPOT_SYNC_ENABLED: 'false',
      LIVE_BRIEF_ENGAGEMENT_TASKS_ENABLED: 'true',
    })).toEqual({ hubspotSyncEnabled: false, engagementTasksEnabled: true })
  })
})
