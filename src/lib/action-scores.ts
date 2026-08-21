export type ScoreGroup =
  | 'onboarding'
  | 'pipeline'
  | 'intelligence'
  | 'signals'
  | 'communication'
  | 'profile'

export type ActionScore = {
  label: string
  group: ScoreGroup
  // 1-10: how emotionally significant is this moment for the user
  emotion: number
  // 1-10: mental effort required (NASA-TLX simplified). Lower = better UX.
  cognitive_load: number
  // 1-10: impact on subscription renewal probability
  retention: number
}

export const ACTION_SCORES: Record<string, ActionScore> = {
  // Onboarding
  onboarding_completed:     { label: 'Onboarding completed',       group: 'onboarding',    emotion: 8, cognitive_load: 7, retention: 10 },
  activation_complete:      { label: 'Activation milestone (6)',   group: 'onboarding',    emotion: 9, cognitive_load: 1, retention: 10 },
  onboarding_started:       { label: 'Onboarding started',         group: 'onboarding',    emotion: 5, cognitive_load: 2, retention: 7  },
  onboarding_step_completed:{ label: 'Onboarding step completed',  group: 'onboarding',    emotion: 5, cognitive_load: 3, retention: 7  },
  onboarding_nudge_shown:   { label: 'Onboarding nudge shown',     group: 'onboarding',    emotion: 4, cognitive_load: 1, retention: 6  },
  onboarding_low_energy_enabled: { label: 'Low-energy mode enabled', group: 'onboarding',  emotion: 6, cognitive_load: 1, retention: 8  },
  onboarding_first_value_ready: { label: 'Onboarding first value ready', group: 'onboarding', emotion: 8, cognitive_load: 2, retention: 9 },

  // Pipeline
  company_added:            { label: 'Company added',              group: 'pipeline',      emotion: 7, cognitive_load: 3, retention: 9  },
  contact_added:            { label: 'Contact added',              group: 'pipeline',      emotion: 6, cognitive_load: 3, retention: 7  },
  pipeline_stage_changed:   { label: 'Pipeline stage changed',     group: 'pipeline',      emotion: 7, cognitive_load: 2, retention: 6  },
  offer_accepted:           { label: 'Offer accepted',             group: 'pipeline',      emotion: 10, cognitive_load: 1, retention: 2 },
  follow_up_set:            { label: 'Follow-up set',              group: 'pipeline',      emotion: 4, cognitive_load: 2, retention: 6  },

  // Intelligence
  prep_brief_generated:     { label: 'Prep brief generated',       group: 'intelligence',  emotion: 9, cognitive_load: 2, retention: 10 },
  strategy_brief_generated: { label: 'Strategy brief generated',   group: 'intelligence',  emotion: 8, cognitive_load: 2, retention: 9  },
  briefing_viewed:          { label: 'Briefing viewed',            group: 'intelligence',  emotion: 6, cognitive_load: 2, retention: 8  },
  briefing_action_clicked:  { label: 'Briefing action clicked',    group: 'intelligence',  emotion: 7, cognitive_load: 2, retention: 9  },
  brief_rated:              { label: 'Brief rated (feedback)',      group: 'intelligence',  emotion: 3, cognitive_load: 1, retention: 4  },

  // Signals
  signals_page_viewed:      { label: 'Signals page viewed',        group: 'signals',       emotion: 8, cognitive_load: 3, retention: 8  },
  signal_classified:        { label: 'Signal classified (system)', group: 'signals',       emotion: 5, cognitive_load: 1, retention: 6  },
  signal_outreach_generated:{ label: 'Signal outreach generated',  group: 'signals',       emotion: 8, cognitive_load: 2, retention: 9  },

  // Communication
  outreach_draft_generated: { label: 'Outreach draft generated',   group: 'communication', emotion: 7, cognitive_load: 2, retention: 8  },

  // Profile
  resume_uploaded:          { label: 'Resume uploaded',            group: 'profile',       emotion: 5, cognitive_load: 4, retention: 8  },
  briefing_configured:      { label: 'Briefing configured',        group: 'profile',       emotion: 5, cognitive_load: 4, retention: 8  },
  positioning_saved:        { label: 'Positioning saved',          group: 'profile',       emotion: 7, cognitive_load: 6, retention: 7  },
  linkedin_imported:        { label: 'LinkedIn imported',          group: 'profile',       emotion: 6, cognitive_load: 3, retention: 7  },
}

// Higher = better interaction moment. Used for top/bottom rankings.
export function compositeScore(s: ActionScore): number {
  return s.emotion + s.retention - s.cognitive_load
}

export const GROUP_LABELS: Record<ScoreGroup, string> = {
  onboarding:    'Onboarding',
  pipeline:      'Pipeline',
  intelligence:  'Intelligence',
  signals:       'Signals',
  communication: 'Communication',
  profile:       'Profile',
}

// Chart tokens rather than fixed hexes, so score charts follow the active theme.
export const GROUP_COLORS: Record<ScoreGroup, string> = {
  onboarding:    'var(--chart-1)',
  pipeline:      'var(--chart-2)',
  intelligence:  'var(--chart-3)',
  signals:       'var(--chart-4)',
  communication: 'var(--chart-5)',
  profile:       'var(--chart-6)',
}

export type StallLane = 'signals' | 'pipeline' | 'preparation'

export type StallState = 'healthy' | 'watch' | 'stalled'

export type StallSnapshotInput = {
  activePipelineCount: number
  overdueActions: number
  lastSignalDays: number
  lastBriefDays: number
  signalsSinceBaseline: number
  pipelineChangesSinceBaseline: number
  briefReviewsSinceBaseline: number
}

export type StallSnapshot = {
  lane: StallLane
  state: StallState
  reason: string
}

export const STALL_THRESHOLDS = {
  signalsWatchDays: 7,
  signalsStalledDays: 14,
  briefWatchDays: 7,
  briefStalledDays: 14,
  overdueActionsWatch: 1,
  overdueActionsStalled: 3,
} as const

function humanizeAge(days: number, fallback: string) {
  if (!Number.isFinite(days) || days >= 365) return fallback
  return `${days} days`
}

export function classifyGraphStalls(input: StallSnapshotInput): StallSnapshot[] {
  const stalls: StallSnapshot[] = []

  if (input.signalsSinceBaseline === 0) {
    if (input.lastSignalDays >= STALL_THRESHOLDS.signalsStalledDays) {
      stalls.push({
        lane: 'signals',
        state: 'stalled',
        reason: `No fresh signals for ${humanizeAge(input.lastSignalDays, 'a while')}.`,
      })
    } else if (input.lastSignalDays >= STALL_THRESHOLDS.signalsWatchDays) {
      stalls.push({
        lane: 'signals',
        state: 'watch',
        reason: `Signal intake is aging at ${humanizeAge(input.lastSignalDays, 'an unknown interval')}.`,
      })
    }
  }

  if (input.briefReviewsSinceBaseline === 0) {
    if (input.lastBriefDays >= STALL_THRESHOLDS.briefStalledDays) {
      stalls.push({
        lane: 'preparation',
        state: 'stalled',
        reason: input.lastBriefDays >= 365
          ? 'No recent brief review progress yet.'
          : `No brief review progress for ${input.lastBriefDays} days.`,
      })
    } else if (input.lastBriefDays >= STALL_THRESHOLDS.briefWatchDays) {
      stalls.push({
        lane: 'preparation',
        state: 'watch',
        reason: `Prep activity is aging at ${input.lastBriefDays} days.`,
      })
    }
  }

  if (input.activePipelineCount > 0 && input.pipelineChangesSinceBaseline === 0) {
    if (input.overdueActions >= STALL_THRESHOLDS.overdueActionsStalled) {
      stalls.push({
        lane: 'pipeline',
        state: 'stalled',
        reason: `${input.overdueActions} overdue actions with no pipeline movement since the last session.`,
      })
    } else if (input.overdueActions >= STALL_THRESHOLDS.overdueActionsWatch) {
      stalls.push({
        lane: 'pipeline',
        state: 'watch',
        reason: `Pipeline has ${input.overdueActions} overdue action${input.overdueActions === 1 ? '' : 's'} and no recent movement.`,
      })
    }
  }

  return stalls
}
