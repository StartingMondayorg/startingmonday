export type StartingMondayHeroTimelineEvent = {
  date: string
  isoDate: string
  event: string
  sourceClass?: string
}

export type StartingMondayHeroProofCase = {
  descriptor: string
  events: readonly StartingMondayHeroTimelineEvent[]
  status: string
  caption: string
  illustrative: boolean
}

export const STARTING_MONDAY_HERO_CONTENT = {
  eyebrow: 'Career intelligence for managers and executives.',
  heading: 'Be on the shortlist before the role is posted.',
  subhead:
    'Starting Monday reads public signals. Leadership changes, funding, expansion, filings. You see roles forming before the job ad exists, and who to know before you apply.',
  privacy:
    "Private by default. No one knows you're looking until you decide they do.",
  primaryCta: 'Get access',
  primaryCtaHref: '/signup',
  secondaryCta: 'See a live example',
  secondaryCtaHref: '/example',
  timelineAlt:
    'Example signal timeline showing three public signals that a role is forming at an anonymized company.',
  pilotMicrocopy: null as string | null,
  proofCase: {
    descriptor: "Bob's Building Supplies",
    events: [
      {
        date: 'May 18, 2026',
        isoDate: '2026-05-18',
        event: 'COO and CHRO succession plan announced',
        sourceClass: 'company announcement',
      },
      {
        date: 'June 5, 2026',
        isoDate: '2026-06-05',
        event: 'Officer appointment disclosure filed',
        sourceClass: 'SEC 8-K filing',
      },
      {
        date: 'July 30, 2026',
        isoDate: '2026-07-30',
        event: 'Quarterly report and earnings disclosure filed',
        sourceClass: 'SEC 10-Q and 8-K filings',
      },
    ],
    status: 'Status: leadership transition documented.',
    caption:
      'Example signal timeline showing three public signals around an anonymized leadership transition.',
    illustrative: false,
  },
  exampleClosingLine: null as string | null,
  contentVersion: '2026-08-18-v1-gated',
} as const

function collectRenderableStrings(value: unknown, output: string[] = []): string[] {
  if (typeof value === 'string') {
    output.push(value)
    return output
  }

  if (Array.isArray(value)) {
    for (const item of value) collectRenderableStrings(item, output)
    return output
  }

  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectRenderableStrings(item, output)
  }

  return output
}

export function getStartingMondayHeroRenderableStrings(): string[] {
  return collectRenderableStrings(STARTING_MONDAY_HERO_CONTENT)
}

export function findStartingMondayHeroCopyViolations(strings: string[] = getStartingMondayHeroRenderableStrings()): string[] {
  const banned = /[\u2013\u2014]|\blikely\b|\bpredict(?:ion)?\b|\bprobability\b|\bchance\b|\bodds\b|\bscored?\b|\bguarantee(?:d)?\b|ai-powered|decision-makers|map of the people/i

  return strings.filter((value) => banned.test(value) || /%/.test(value))
}