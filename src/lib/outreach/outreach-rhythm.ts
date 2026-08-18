export type OutreachStage = 'watching' | 'researching' | 'applied' | 'interviewing' | 'offer' | 'unknown'

export type OutreachCadence = {
  nextTouchDays: number
  rationale: string
}

export function recommendOutreachRhythm(stage: OutreachStage, isWarmPath: boolean): OutreachCadence {
  if (stage === 'offer') {
    return {
      nextTouchDays: 1,
      rationale: 'Offer-stage opportunities move quickly; review and follow up within 24 hours.',
    }
  }

  if (stage === 'interviewing') {
    return {
      nextTouchDays: isWarmPath ? 2 : 3,
      rationale: isWarmPath
        ? 'Warm interview paths benefit from a tighter follow-up window.'
        : 'Interviewing paths should keep regular momentum without over-touching.',
    }
  }

  if (stage === 'applied') {
    return {
      nextTouchDays: isWarmPath ? 3 : 5,
      rationale: isWarmPath
        ? 'Warm applied paths should be nudged quickly to keep context active.'
        : 'Applied cold paths generally need a modest wait before the next touch.',
    }
  }

  if (stage === 'researching') {
    return {
      nextTouchDays: isWarmPath ? 5 : 7,
      rationale: 'Researching stage cadence should balance progress with signal collection.',
    }
  }

  if (stage === 'watching') {
    return {
      nextTouchDays: isWarmPath ? 7 : 10,
      rationale: 'Watching stage cadence keeps low-friction motion while avoiding noise.',
    }
  }

  return {
    nextTouchDays: isWarmPath ? 5 : 7,
    rationale: 'Default cadence for unknown stage preserves weekly progress.',
  }
}
