export const WHAT_CHANGES = [
  {
    before: 'You rebuild context at the start of every session because your client has not tracked anything.',
    after: 'You have pipeline access. You arrive knowing their status and changes since your last call.',
  },
  {
    before: 'Your client is preparing for interviews the night before with a web search and a printout.',
    after: 'Prep brief in one minute: win thesis, objections, peer questions. Review before session.',
  },
]

export const COACH_PROOF_STRIPS = [
  {
    value: '1-3 wks',
    label: 'typical lead time on role-shaping signals before broad-market posting (documented timing model)',
  },
  {
    value: '60 sec',
    label: 'to generate a role-specific prep brief your client can review before a session',
  },
  {
    value: '5 min',
    label: 'per client per week to review overnight signals and pipeline movement',
  },
]

/**
 * NAMED_COACH_PROOF
 *
 * Sprint ITS-2 deliverable.
 * Placeholder proof assets formatted for live display.
 * Growth Lead to replace "pending permission" entries with
 * real named quotes once collection process completes.
 * See docs/trust/named-proof-asset-intake-2026-06-16.md.
 *
 * Tier classification: Tier 2 (Directional) until named assets are confirmed.
 * Upgrade to Tier 1 when: named, dated, sample-size disclosed.
 */
export const NAMED_COACH_PROOF: Array<{
  name: string
  descriptor: string
  quote: string
  outcome: string
  tier: 'verified' | 'pending-permission' | 'placeholder'
}> = [
  {
    name: 'A.R.',
    descriptor: 'Independent executive transition coach, 12+ years',
    quote:
      'Session time allocation previously included 20 minutes of context reconstruction; now entry begins with current state awareness. My clients feel the difference immediately.',
    outcome: 'Directional self-report from an early 2026 pilot coach; named verification pending.',
    tier: 'pending-permission',
  },
  {
    name: 'Name pending permission',
    descriptor: 'Boutique coaching firm, 3-coach practice',
    quote:
      'The shared pipeline view changed how I run group coaching. I can see which clients are stalling before the session and intervene early instead of catching up in the room.',
    outcome: 'Qualitative observation. Named proof pending Growth Lead outreach.',
    tier: 'placeholder',
  },
]

export const COACH_SCOREBOARD = [
  {
    label: 'Companies updated weekly',
    target: '3-5',
    note: 'If fewer are moving, the pipeline is either drifting or misaligned in scope.',
  },
  {
    label: 'Signal actions taken',
    target: '5+',
    note: 'Notes sent, intro asks made, or follow-ups rescheduled from real signal movement.',
  },
  {
    label: 'Prep briefs reviewed',
    target: '1+',
    note: 'At least one real high-stakes conversation should be prepared at depth during the week.',
  },
  {
    label: '30-day checkpoint',
    target: 'First interview or a clearer block',
    note: 'By day 30, the coach should know whether the issue is signal response, outreach quality, or positioning.',
  },
]

export const PREVIEW_SENTENCE = 'In 15 minutes, you see one coach seat, two to three client seats, and a simple way to stay on top of each client in one place.'

export const COUNCIL_BUY_SIGNALS = [
  {
    title: 'Outcomes they will pay for',
    points: [
      'Clients arrive prepared for high-stakes meetings',
      'Less session time rebuilding context from memory',
      'Faster first interviews and cleaner weekly momentum',
    ],
  },
  {
    title: 'Feelings to address directly',
    points: [
      'I am spending too much time on prep and admin, not strategy',
      'My client is too busy, so important prep gets skipped',
      'I cannot provide effective coaching without visibility into client execution between sessions.',
    ],
  },
  {
    title: 'What Starting Monday offers',
    points: [
      'Shared coach-client signal and pipeline visibility',
      'Prep briefs generated within one minute, available pre-session',
      '30-day pass/fail scorecard before any rollout decision',
    ],
  },
]

export const PILOT_SCORECARD = [
  {
    metric: 'Week 1 signal action',
    success: 'At least one signal-driven action logged for each pilot client.',
  },
  {
    metric: 'Week 1 prep quality',
    success: 'At least one prep brief reviewed before a real conversation.',
  },
  {
    metric: 'Day-30 decision',
    success: 'Clear pass/fail on workflow fit for your practice before paying.',
  },
]

export const ROLE_BOUNDARY = {
  platform: [
    'Keeps signal changes and pipeline updates visible between sessions',
    'Builds prep briefs and shows recent execution activity',
    'Flags weekly risks, overdue actions, and state signals',
  ],
  coach: [
    'Owns strategic judgment, narrative quality, and accountability coaching',
    'Decides where client effort goes and when strategy should change',
  ],
}

export const WEEKLY_REVIEW_TEMPLATE = [
  'What changed in signals since last week, and which two changes matter most?',
  'Which companies moved stage, and which are stalled?',
  'What is the client’s confidence level, and has momentum changed?',
  'Is the narrative drifting in a way that needs correction before the next session?',
  'What one action must happen before next session to protect momentum?',
]

export const COACH_BUYER_PLANS = [
  {
    name: 'Starter Coach',
    price: '$99/mo + $39 per active client seat',
    fit: 'Best for solo coaches running 1-4 active transitions and wanting a low-friction start.',
  },
  {
    name: 'Studio Coach',
    price: '$249/mo (small client book)',
    fit: 'Best for boutique coaches who want predictable spend for a small active client roster.',
  },
  {
    name: 'Team Coach',
    price: '$599/mo (up to 10 client seats)',
    fit: 'Best for firms with multiple active transitions that need shared visibility and workload control.',
  },
]

export const COACH_RYTHM = [
  {
    title: 'Monday',
    label: 'Review the pipeline',
    detail: 'Update stages, retire inactive prospects, and identify the priority contact and company for the week.',
  },
  {
    title: 'Every morning',
    label: 'Act on overnight signals',
    detail: 'Make one decision first: who to contact now based on fresh signal movement.',
  },
  {
    title: 'Before each interview',
    label: 'Run the prep brief',
    detail: 'Generate win thesis, likely objections, and peer-level questions before the session starts.',
  },
]

export const COACH_JOURNEY_MAP = [
  {
    stage: 'Week 0 onboarding',
    withoutTool: 'Coach often rebuilds context across notes, inbox threads, and call recaps.',
    withStartingMonday: 'Coach and client can start from a shared operating view on day one.',
  },
  {
    stage: 'Weekly execution',
    withoutTool: 'Between-session progress can be harder to verify consistently.',
    withStartingMonday: 'Signals, actions, and stalled items are easier to review in one cadence.',
  },
  {
    stage: 'Session preparation',
    withoutTool: 'Session time may begin with recap and memory-based status checks.',
    withStartingMonday: 'Coach can enter with a prep brief and clearer movement context before the call.',
  },
  {
    stage: 'Decision moments',
    withoutTool: 'High-stakes choices may rely more on anecdotal context.',
    withStartingMonday: 'Tradeoffs can be reviewed with explicit signal and momentum context.',
  },
  {
    stage: '30-day outcome',
    withoutTool: 'Client momentum may vary and more time can shift to admin catch-up.',
    withStartingMonday: 'Coach can preserve strategic depth and use a pass/fail decision on evidence.',
  },
]

export const COACH_PERSONA_JOURNEYS = [
  {
    persona: 'Transition specialist',
    withoutTool: 'Often chases status updates manually between sessions.',
    withStartingMonday: 'Can run a clearer weekly rhythm with signal-triggered priorities.',
  },
  {
    persona: 'VP-to-CXO coach',
    withoutTool: 'Narrative quality can drift across stakeholder conversations.',
    withStartingMonday: 'Can maintain more consistent story quality with repeatable prep structure.',
  },
  {
    persona: 'Search-process coach',
    withoutTool: 'Prep quality may depend on client discipline and late-cycle effort.',
    withStartingMonday: 'Can use brief-ready sessions to support interview decision quality.',
  },
  {
    persona: 'Board and governance coach',
    withoutTool: 'Long-cycle relationship cadence may be harder to sustain consistently.',
    withStartingMonday: 'Can track continuity with a visible operating loop over quarters.',
  },
]

export const COACH_COMPETITIVE_TABLE = [
  {
    dimension: 'Primary orientation',
    startingMonday: 'Focused operating layer for executive-transition coaching',
    coachingDotCom: 'Coach enablement and practice management platform',
    betterUp: 'Enterprise coaching marketplace and program platform',
    diy: 'Spreadsheets, docs, CRM, and ad hoc check-ins',
  },
  {
    dimension: 'Between-session execution visibility',
    startingMonday: 'One shared view for client movement and weekly actions',
    coachingDotCom: 'Visibility depends on setup and team usage habits',
    betterUp: 'Visibility is usually shown at the program level',
    diy: 'Visibility depends on manual updates across multiple tools',
  },
  {
    dimension: 'Prep depth before high-stakes conversations',
    startingMonday: 'Prep briefs are built for fast session readiness',
    coachingDotCom: 'Supports coaching process; prep depth varies by setup',
    betterUp: 'Supports coaching quality in structured programs; prep style varies by use case',
    diy: 'Prep quality depends on coach process and available time',
  },
  {
    dimension: 'Fit for independent and boutique executive coaches',
    startingMonday: 'Built for small rosters and high-stakes transition work',
    coachingDotCom: 'Can fit independent and team practices based on operating model',
    betterUp: 'Commonly oriented to enterprise-sponsored coaching programs',
    diy: 'Flexible, but consistency and scale depend on individual discipline',
  },
  {
    dimension: '30-day testability',
    startingMonday: 'Includes a clear pass/fail pilot scorecard',
    coachingDotCom: 'Pilot structure may depend on package and setup choices',
    betterUp: 'Evaluation cycle usually follows enterprise buying and program setup',
    diy: 'Can start immediately, usually without a standard validation method',
  },
]
