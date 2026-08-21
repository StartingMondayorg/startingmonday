export type LiveBriefControls = {
  hubspotSyncEnabled: boolean
  engagementTasksEnabled: boolean
}

export function getLiveBriefControls(env: Record<string, string | undefined> = process.env): LiveBriefControls {
  return {
    hubspotSyncEnabled: env.LIVE_BRIEF_HUBSPOT_SYNC_ENABLED === 'true',
    engagementTasksEnabled: env.LIVE_BRIEF_ENGAGEMENT_TASKS_ENABLED === 'true',
  }
}
