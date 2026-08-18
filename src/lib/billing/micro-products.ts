export type MicroProductChannel = 'executives' | 'coaches' | 'outplacement' | 'search_firms'

export type MicroProductDefinition = {
  slug: string
  name: string
  summary: string
  channel: MicroProductChannel
  persona: string
  billingType: 'one_time' | 'subscription'
  defaultInterval: 'one_time' | 'month' | 'year'
  amountCents: number
  audienceType: 'b2c' | 'b2b'
  ctaHref: string
  ctaLabel: string
}

export const MICRO_PRODUCT_DEFINITIONS: readonly MicroProductDefinition[] = [
  {
    slug: 'coach-session-anti-drift-kit',
    name: 'Coach Session Anti-Drift Kit',
    summary: 'Pre-session briefs, session-close scripts, and weekly accountability templates to reduce context rebuild.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 7900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/coach-session-anti-drift-kit',
    ctaLabel: 'View product',
  },
  {
    slug: 'shadow-search-governance-pack',
    name: 'Shadow Search Governance Pack',
    summary: 'Communication protocols and risk templates for coaches supporting confidential board-sensitive transitions.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 9900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/shadow-search-governance-pack',
    ctaLabel: 'View product',
  },
  {
    slug: 'executive-positioning-narrative-builder',
    name: 'Executive Positioning Narrative Builder',
    summary: 'Positioning worksheets, proof-point sorting, and story prompts for sharper executive narratives.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 5900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/executive-positioning-narrative-builder',
    ctaLabel: 'View product',
  },
  {
    slug: 'first-30-days-transition-conversation-pack',
    name: 'First 30 Days Transition Conversation Pack',
    summary: 'Transition planning pages, stakeholder maps, and reflection prompts for fragile role-change moments.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 7900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/first-30-days-transition-conversation-pack',
    ctaLabel: 'View product',
  },
  {
    slug: 'executive-proof-library-builder',
    name: 'Executive Proof Library Builder',
    summary: 'Win-capture pages, metrics prompts, and reusable proof organization for stronger executive stories.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 6900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/executive-proof-library-builder',
    ctaLabel: 'View product',
  },
  {
    slug: 'board-stakeholder-update-writing-kit',
    name: 'Board and Stakeholder Update Writing Kit',
    summary: 'Memo templates, tone guards, and revision prompts for sharper sensitive executive updates.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 8900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/board-stakeholder-update-writing-kit',
    ctaLabel: 'View product',
  },
  {
    slug: 'interview-debrief-recovery-pack',
    name: 'Interview Debrief and Recovery Pack',
    summary: 'Debrief templates, missed-signal reviews, and reset worksheets for post-interview recovery.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 4900,
    audienceType: 'b2b',
    ctaHref: '/for-coaches/micro-products/interview-debrief-recovery-pack',
    ctaLabel: 'View product',
  },
  {
    slug: 'exec-interview-narrative-pack',
    name: 'Executive Interview Narrative Pack',
    summary: 'Role-specific story architecture and interview narrative drills for C-suite loops.',
    channel: 'executives',
    persona: 'active_mode',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 14900,
    audienceType: 'b2c',
    ctaHref: '/settings/billing?addOn=exec-interview-narrative-pack',
    ctaLabel: 'Buy add-on',
  },
  {
    slug: 'board-transition-brief-kit',
    name: 'Board Transition Brief Kit',
    summary: 'Board-facing transition brief templates for optionality and discreet positioning.',
    channel: 'executives',
    persona: 'passive_mode',
    billingType: 'subscription',
    defaultInterval: 'month',
    amountCents: 7900,
    audienceType: 'b2c',
    ctaHref: '/settings/billing?addOn=board-transition-brief-kit',
    ctaLabel: 'Buy add-on',
  },
  {
    slug: 'coach-client-readiness-kit',
    name: 'Coach Client Readiness Kit',
    summary: 'Coach-facing readiness scorecards and weekly accountability templates.',
    channel: 'coaches',
    persona: 'coach_practice',
    billingType: 'subscription',
    defaultInterval: 'month',
    amountCents: 5900,
    audienceType: 'b2b',
    ctaHref: '/partners#apply',
    ctaLabel: 'Request pilot',
  },
  {
    slug: 'outplacement-operator-pack',
    name: 'Outplacement Operator Pack',
    summary: 'Pilot launch scorecards, intervention triggers, and customer success scripts.',
    channel: 'outplacement',
    persona: 'practice_leader',
    billingType: 'subscription',
    defaultInterval: 'month',
    amountCents: 9900,
    audienceType: 'b2b',
    ctaHref: '/for-outplacement',
    ctaLabel: 'View operator pack',
  },
  {
    slug: 'search-firm-brief-accelerator',
    name: 'Search-Firm Brief Accelerator',
    summary: 'Search kickoff templates and intake-to-brief turnaround support for retained teams.',
    channel: 'search_firms',
    persona: 'retained_search_lead',
    billingType: 'one_time',
    defaultInterval: 'one_time',
    amountCents: 12900,
    audienceType: 'b2b',
    ctaHref: '/partners#apply',
    ctaLabel: 'Request pilot',
  },
]

export function getMicroProductsForChannel(channel: MicroProductChannel): MicroProductDefinition[] {
  return MICRO_PRODUCT_DEFINITIONS.filter((item) => item.channel === channel)
}

export function getMicroProductBySlug(slug: string): MicroProductDefinition | undefined {
  return MICRO_PRODUCT_DEFINITIONS.find((item) => item.slug === slug)
}

export function formatMicroProductPrice(amountCents: number, interval: MicroProductDefinition['defaultInterval']): string {
  const amount = `$${(amountCents / 100).toFixed(0)}`
  if (interval === 'month') return `${amount}/mo`
  if (interval === 'year') return `${amount}/yr`
  return amount
}
