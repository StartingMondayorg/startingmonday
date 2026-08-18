// Executive risk model for the dashboard. Pure computation extracted from
// dashboard/page.tsx: given campaign counters, produce risk items, the
// primary risk, and the decision brief shown in executive mode.

export type ExecutiveRiskInputs = {
  daysSinceLastAction: number | null
  daysSinceOnboard: number | null
  totalCount: number
  profileScore: number
  sponsorCoveragePercent: number
  offerCount: number
  signalCount: number
  overdueCount: number
}

export type RiskItem = {
  id: string
  label: string
  level: 'low' | 'medium' | 'high'
  detail: string
  href: string
  cta: string
}

export type ExecutivePrimaryRisk = {
  label: string
  level: 'low' | 'medium' | 'high'
  href: string
  cta: string
}

export type ExecutiveDecisionBrief = {
  changed: string
  whyNow: string
  recommendedMove: string
  downsideIfDelayed: string
  href: string
  cta: string
}

export function buildExecutiveRiskModel(inputs: ExecutiveRiskInputs): {
  riskItems: RiskItem[]
  executivePrimaryRisk: ExecutivePrimaryRisk
  executiveDecisionBrief: ExecutiveDecisionBrief
} {
  const {
    daysSinceLastAction,
    daysSinceOnboard,
    totalCount,
    profileScore,
    sponsorCoveragePercent,
    offerCount,
    signalCount,
    overdueCount,
  } = inputs

  const threatRiskHigh =
    (daysSinceLastAction ?? 0) >= 14 ||
    (totalCount === 0 && (daysSinceOnboard ?? 0) > 7)
  const perfectionRiskHigh =
    profileScore < 80 && totalCount === 0 && (daysSinceOnboard ?? 0) > 5
  const isolationRiskHigh = totalCount >= 3 && sponsorCoveragePercent < 50
  const decisionRiskHigh = offerCount > 0 && (daysSinceLastAction ?? 0) >= 7

  const riskItems: RiskItem[] = [
    {
      id: 'threat-state',
      label: 'Threat and uncertainty state',
      level: threatRiskHigh ? 'high' : signalCount > 0 ? 'low' : 'medium',
      detail: threatRiskHigh
        ? 'Activity decay suggests rising uncertainty. Use one concrete move to restore control today.'
        : 'Signal and action flow is stable enough to keep confidence anchored in execution.',
      href: '/dashboard/briefing',
      cta: 'Briefing',
    },
    {
      id: 'perfection-loop',
      label: 'Perfection loop risk',
      level: perfectionRiskHigh ? 'high' : profileScore < 100 ? 'medium' : 'low',
      detail: perfectionRiskHigh
        ? 'You may be polishing inputs without enough market activation. Ship one outreach action.'
        : 'Profile quality is improving. Keep edits tied to live outreach outcomes.',
      href: profileScore < 100 ? '/dashboard/profile' : '/dashboard/strategy',
      cta: profileScore < 100 ? 'Profile' : 'Strategy brief',
    },
    {
      id: 'isolation-risk',
      label: 'Sponsor map depth',
      level: isolationRiskHigh ? 'high' : sponsorCoveragePercent < 70 ? 'medium' : 'low',
      detail: isolationRiskHigh
        ? 'Coverage is low for an executive search. Relationship depth is likely the bottleneck now.'
        : 'Sponsor coverage is trending in the right direction. Keep adding depth at top targets.',
      href: '/dashboard/contacts',
      cta: 'Sponsors',
    },
    {
      id: 'decision-drag',
      label: 'Decision drag risk',
      level: decisionRiskHigh ? 'high' : offerCount > 0 ? 'medium' : 'low',
      detail:
        offerCount > 0
          ? 'Offer context exists. Decision quality drops when timeline and no-go criteria stay implicit.'
          : 'No active offer context. Keep criteria explicit before final-round intensity rises.',
      href: offerCount > 0 ? '/dashboard/offers' : '/dashboard/strategy',
      cta: offerCount > 0 ? 'Offer compare' : 'Criteria',
    },
  ]

  const executivePrimaryRisk: ExecutivePrimaryRisk = (() => {
    if (decisionRiskHigh)
      return { label: 'Decision drag', level: 'high' as const, href: '/dashboard/offers', cta: 'Offer compare' }
    if (isolationRiskHigh)
      return { label: 'Sponsor depth gap', level: 'high' as const, href: '/dashboard/contacts', cta: 'Sponsors' }
    if (threatRiskHigh)
      return { label: 'Momentum decay', level: 'high' as const, href: '/dashboard/briefing', cta: 'Briefing' }
    if (perfectionRiskHigh)
      return { label: 'Perfection loop', level: 'medium' as const, href: '/dashboard/profile', cta: 'Profile' }
    return { label: 'Managed', level: 'low' as const, href: '/dashboard/briefing', cta: 'Briefing' }
  })()

  const executiveDecisionBrief: ExecutiveDecisionBrief = (() => {
    if (offerCount > 0) {
      return {
        changed: `${offerCount} offer ${offerCount === 1 ? 'is' : 'are'} in play and decision pressure is rising.`,
        whyNow: 'Late-stage ambiguity increases regret risk more than almost any other phase.',
        recommendedMove:
          'Run the offer comparison and lock explicit no-go criteria before new conversations start.',
        downsideIfDelayed: 'Decision lag weakens negotiation leverage and increases reactive choices.',
        href: '/dashboard/offers',
        cta: 'Run offer comparison',
      }
    }

    if (signalCount > 0) {
      return {
        changed: `${signalCount} fresh market signal${signalCount === 1 ? '' : 's'} landed this week.`,
        whyNow: 'Signal freshness decays quickly unless converted to relationship action.',
        recommendedMove: 'Convert one high-relevance signal into a warm outreach draft today.',
        downsideIfDelayed: 'You lose timing edge and return to generic outreach.',
        href: '/dashboard/signals',
        cta: 'Signals',
      }
    }

    if (overdueCount > 0) {
      return {
        changed: `${overdueCount} follow-up ${overdueCount === 1 ? 'is' : 'are'} overdue.`,
        whyNow: 'At executive level, delay is often interpreted as loss of conviction.',
        recommendedMove: 'Clear the next due relationship action before adding new scope.',
        downsideIfDelayed: 'Pipeline credibility drops and conversation velocity slows.',
        href: '/dashboard/calendar',
        cta: 'Calendar',
      }
    }

    return {
      changed: 'No urgent blockers, but sponsor depth and cadence still determine outcomes.',
      whyNow: 'Quiet weeks are where high-quality systems get built.',
      recommendedMove: 'Add one sponsor at a priority company and schedule one next step.',
      downsideIfDelayed: 'Momentum looks stable but conversion quality erodes over time.',
      href: '/dashboard/contacts',
      cta: 'Strengthen sponsor map',
    }
  })()

  return { riskItems, executivePrimaryRisk, executiveDecisionBrief }
}
