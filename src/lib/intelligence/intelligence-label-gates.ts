import type { IntelligenceGateStatus } from './intelligence-gate-status'

export function thresholdStatus(current: number, target: number): IntelligenceGateStatus {
  return current >= target ? 'pass' : 'in_progress'
}

export function availabilityStatus(current: number): IntelligenceGateStatus {
  return current > 0 ? 'pass' : 'no_data'
}

export function buildLabelAndBacktestGates(input: {
  openingCount: number
  labelCount: number
  labelSourceCount: number
  precursorStatCount: number
  cohortCount: number
  replayCohortCount: number
  replayControlCount: number
  patternCount: number
  latestReplayStatus: string | null
}) {
  return {
    labeledOpenings: {
      target: 500,
      current: input.openingCount,
      status: thresholdStatus(input.openingCount, 500),
    },
    eventOutcomeLabels: {
      target: 1000,
      current: input.labelCount,
      status: thresholdStatus(input.labelCount, 1000),
    },
    labelSources: {
      target: 4,
      current: input.labelSourceCount,
      status: thresholdStatus(input.labelSourceCount, 4),
    },
    precursorStats: {
      target: 1,
      current: input.precursorStatCount,
      status: availabilityStatus(input.precursorStatCount),
    },
    backtestCohorts: {
      target: 300,
      current: input.cohortCount,
      status: thresholdStatus(input.cohortCount, 300),
    },
    matchedControls: {
      target: input.replayCohortCount * 3,
      current: input.replayControlCount,
      status: input.replayCohortCount === 0
        ? 'no_data' as const
        : thresholdStatus(input.replayControlCount, input.replayCohortCount * 3),
    },
    patternBacktests: {
      target: 1,
      current: input.patternCount,
      latestReplayStatus: input.latestReplayStatus,
      status: input.patternCount > 0 && input.latestReplayStatus === 'complete'
        ? 'pass' as const
        : input.patternCount === 0
          ? 'no_data' as const
          : 'in_progress' as const,
    },
  }
}