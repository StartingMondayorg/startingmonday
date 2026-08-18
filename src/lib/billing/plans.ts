import { PRICING } from './pricing'

export const PLANS = {
  passive: {
    name: PRICING.passive.name,
    amount: 4900,
    annualAmount: 47000,
    description: 'Company signal monitoring, exec moves, funding rounds, and weekly digest',
    features: [
      'Pipeline tracking for up to 25 companies',
      'Signal scans 3x per week',
      'Exec move and funding alerts',
      'Weekly signal digest',
      'Contact tracker',
    ],
  },
  active: {
    name: PRICING.active.name,
    amount: 19900,
    annualAmount: 202980,
    description: 'Full active campaign infrastructure with AI briefs, daily briefing, and outreach',
    features: [
      'Everything in Monitor',
      'AI Interview Prep Briefs',
      'Search Strategy Brief',
      'AI Chat advisor',
      'Outreach drafting',
      'Resume tailoring',
      'Daily morning briefing',
    ],
  },
  executive: {
    name: PRICING.executive.name,
    amount: 49900,
    annualAmount: 479000,
    description: 'For C-suite candidates who need daily intelligence and salary leverage',
    features: [
      'Everything in Active',
      'Unlimited company pipeline',
      'Daily career page scanning (2x/day)',
      'Salary intelligence and negotiation scripts',
      'Recruiter tracker with firm grouping',
      'Priority contact flagging and CSV export',
      'Immediate pattern and exec departure alerts',
      'Opus AI for interview prep briefs',
    ],
  },
} as const

export const COACH_PLAN = {
  coach: {
    name: 'Coach',
    amount: 59900,
    description: 'Monitor up to 10 clients. Multi-client dashboard, white-label briefings, Momentum Score tracking.',
    features: [
      'Up to 10 client seats',
      'Multi-client Momentum Score dashboard',
      'White-label briefings with your firm name',
      'Overdue and at-risk client alerts',
      'Client invite flow',
    ],
  },
} as const

export const WAITLIST_PLANS = {
  campaign: {
    name: 'Campaign',
    amount: 99900,
    description: '90-day managed campaign with human delivery. Built for the search that cannot afford to miss.',
    features: [
      'Everything in Executive',
      '1:1 strategy session with a search expert',
      'Curated recruiter introductions',
      'Concierge brief review and coaching',
      '3-month minimum, limited availability',
    ],
    cta: 'Apply for Campaign',
  },
} as const

export type PlanKey = keyof typeof PLANS
export type BillingInterval = 'monthly' | 'annual'
