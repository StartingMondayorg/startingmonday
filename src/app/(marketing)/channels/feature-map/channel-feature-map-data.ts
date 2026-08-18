// Static channel feature-map content extracted from ChannelFeatureMapClient for maintainability.
// Pure data + types; no client runtime. Covered by channel-feature-map-data.test.ts.
export type ChannelKey = 'coaches' | 'outplacement' | 'executives' | 'search_firms'

export type TimelineFeature = {
  name: string
  benefit: string
  visual: string
  dashboardTag: string
}

export type TimelineStage = {
  phase: string
  goal: string
  cadence: string
  features: TimelineFeature[]
}

export type ChannelMap = {
  label: string
  accent: string
  border: string
  glow: string
  intro: string
  status: 'ready' | 'coming_soon'
  stages: TimelineStage[]
}

export const CHANNEL_MAPS: Record<ChannelKey, ChannelMap> = {
  coaches: {
    label: 'Executive Coaches',
    accent: 'text-amber-200',
    border: 'border-amber-400/40',
    glow: 'shadow-[0_24px_90px_rgba(245,158,11,0.18)]',
    intro:
      'Coach operating rhythm from session prep to sponsor readout, with visibility to client progress between sessions.',
    status: 'ready',
    stages: [
      {
        phase: 'Discover',
        goal: 'Surface client inflection points before each coaching conversation',
        cadence: 'Before session',
        features: [
          {
            name: 'Pre-Session Snapshot',
              benefit: 'Documents behavioral movement since the last session, enabling strategy over recap.',
            visual: 'Signal drift strip + top 3 deltas',
            dashboardTag: 'Dashboard / Coach / Pre-session',
          },
          {
            name: 'Client Data View',
            benefit: 'Combines signal and action context to link daily execution to leadership growth outcomes.',
            visual: 'Client timeline panel',
            dashboardTag: 'Dashboard / Coach / Client view',
          },
          {
            name: 'Priority Outreach Queue',
            benefit: 'Highlights relationship actions prioritized by leverage to support progress between sessions.',
            visual: 'Priority queue lane',
            dashboardTag: 'Dashboard / Coach / Outreach queue',
          },
        ],
      },
      {
        phase: 'Activate',
        goal: 'Translate coaching insight into weekly behavior change',
        cadence: 'Weekly cycle',
        features: [
          {
            name: 'Weekly Review State',
            benefit: 'Tracks confidence, momentum, and narrative consistency as weekly transformation markers.',
            visual: 'Three-state marker cards',
            dashboardTag: 'Dashboard / Coach / Weekly review',
            },
          {
            name: 'Follow-up Commitments',
            benefit: 'Converts session commitments into owned actions so behavior change continues outside the room.',
            visual: 'Commitment lane board',
            dashboardTag: 'Dashboard / Coach / Follow-ups',
          },
          {
            name: 'Session Action Planner',
            benefit: 'Builds a weekly action script that turns coaching strategy into client execution.',
            visual: 'Action planner checklist',
            dashboardTag: 'Dashboard / Coach / Session planner',
          },
        ],
      },
      {
        phase: 'Operate',
        goal: 'Sustain transformation quality across the portfolio',
        cadence: 'Daily + weekly',
        features: [
          {
            name: 'Command Center Summary',
              benefit: 'Shows coverage, risk, and execution quality, enabling proactive, precision intervention.',
            visual: 'Compact KPI strip + risk badges',
            dashboardTag: 'Dashboard / Coach / Command center',
          },
          {
            name: 'Intervention Cues',
              benefit: 'Flags commitment drift for immediate intervention.',
            visual: 'Exception queue panel',
            dashboardTag: 'Dashboard / Coach / Alerts',
          },
          {
            name: 'Portfolio Heatmap',
              benefit: 'Identifies clients requiring immediate attention to sustain engagement momentum.',
            visual: 'Coverage heatmap',
            dashboardTag: 'Dashboard / Coach / Portfolio heatmap',
          },
        ],
      },
      {
        phase: 'Report',
        goal: 'Demonstrate client transformation without admin drag',
        cadence: 'Monthly',
        features: [
          {
            name: 'Outcome Readout',
            benefit: 'Packages concrete progress and behavior proof in stakeholder-trust language.',
            visual: 'Readout card layout',
            dashboardTag: 'Dashboard / Coach / Readout',
          },
          {
            name: 'Sponsor Digest',
              benefit: 'Builds a concise sponsor narrative linking coaching activity to visible transformation.',
            visual: 'Sponsor digest card',
            dashboardTag: 'Dashboard / Coach / Sponsor digest',
          },
        ],
      },
    ],
  },
  outplacement: {
    label: 'Outplacement Programs',
    accent: 'text-sky-200',
    border: 'border-sky-400/40',
    glow: 'shadow-[0_24px_90px_rgba(56,189,248,0.18)]',
    intro:
      'Outplacement delivery flow from cohort activation to sponsor decision gates, with evidence supporting expand, hold, or close decisions.',
    status: 'ready',
    stages: [
      {
        phase: 'Discover',
        goal: 'Establish cohort scope and baseline risk before sponsor scrutiny',
        cadence: 'Week 0-1',
        features: [
          {
            name: 'Cohort Baseline Scope',
            benefit: 'Maps participants into cohorts and books so sponsors can verify scope before budget expansion.',
            visual: 'Book and cohort roster map',
            dashboardTag: 'Dashboard / Outplacement / Firm admin',
          },
          {
            name: 'Activation Health',
            benefit: 'Shows activation coverage against thresholds used in day-30 sponsor reviews.',
            visual: 'Activation benchmark cards',
            dashboardTag: 'Dashboard / Outplacement / Operator',
          },
          {
            name: 'Confidence Baseline',
            benefit: 'Establishes confidence and readiness baselines to anchor sponsor conversation rigor.',
            visual: 'Confidence baseline strip',
            dashboardTag: 'Dashboard / Outplacement / Confidence',
          },
        ],
      },
      {
        phase: 'Activate',
        goal: 'Drive signal-to-action cadence that holds in sponsor reviews',
        cadence: 'Week 1-2',
        features: [
          {
            name: 'Action Velocity',
            benefit: 'Measures weekly outreach per participant as an early signal of program traction.',
            visual: 'Velocity trend tile',
            dashboardTag: 'Dashboard / Outplacement / Operator',
          },
          {
            name: 'Prep Usage Coverage',
            benefit: 'Tracks prep usage before critical conversations that influence outcomes and sponsor confidence.',
            visual: 'Coverage meter',
            dashboardTag: 'Dashboard / Outplacement / Operator',
          },
          {
            name: 'Follow-up SLA Tracker',
            benefit: 'Shows follow-ups at risk of missing service targets used to judge delivery quality.',
            visual: 'SLA tracker rail',
            dashboardTag: 'Dashboard / Outplacement / Follow-up SLA',
          },
        ],
      },
      {
        phase: 'Operate',
        goal: 'Intervene early to protect sponsor confidence and outcomes',
        cadence: 'Daily + weekly',
        features: [
          {
            name: 'Exception Queue',
            benefit: 'Surfaces inactivity and prep gaps before escalation risk materializes.',
            visual: 'Severity-ranked queue',
            dashboardTag: 'Dashboard / Outplacement / Operator',
          },
          {
            name: 'Book vs Cohort Comparison',
            benefit: 'Compares activation and risk by book and cohort for precise sponsor allocation decisions.',
            visual: 'Split comparison tables',
            dashboardTag: 'Dashboard / Outplacement / Firm admin',
          },
          {
            name: 'Counselor Capacity View',
            benefit: 'Balances intervention load so at-risk participants receive support before sponsor check-ins.',
            visual: 'Capacity allocation board',
            dashboardTag: 'Dashboard / Outplacement / Capacity',
          },
        ],
      },
      {
        phase: 'Report',
        goal: 'Equip sponsor decision gates with clear expand/hold/close evidence',
        cadence: 'Day 30 / 60 / 90',
        features: [
          {
            name: 'Sponsor-Ready Readout',
            benefit: 'Summarizes cohort trajectory with decision-ready evidence for expand, hold, or close calls.',
            visual: 'Decision gate summary card',
            dashboardTag: 'Dashboard / Outplacement / Sponsor report',
          },
          {
            name: 'Expansion Trigger Summary',
            benefit: 'Shows whether each book has met thresholds for expansion decisions and budget release.',
            visual: 'Expansion trigger panel',
            dashboardTag: 'Dashboard / Outplacement / Expansion signals',
          },
        ],
      },
    ],
  },
  executives: {
    label: 'Executives',
    accent: 'text-violet-200',
    border: 'border-violet-400/35',
    glow: 'shadow-[0_24px_90px_rgba(139,92,246,0.16)]',
    intro:
      'Executive transition flow across leadership, technical leadership, and delivery leadership lanes: identify signals early, manage communications, and act before shortlist closure.',
    status: 'ready',
    stages: [
      {
        phase: 'Discover',
        goal: 'Spot role-shaping signals before mandate visibility spikes',
        cadence: 'Before shortlist hardens',
        features: [
          {
            name: 'Signal Timing Line',
            benefit: 'Surfaces role-shaping signals early to enable engagement before broad market visibility.',
            visual: 'Opportunity timing strip',
            dashboardTag: 'Dashboard / Executive / Signal view',
          },
          {
            name: 'Target Company Watchlist',
            benefit: 'Maintains mandate and relationship visibility to preserve competitive timing.',
            visual: 'Priority relationship list',
            dashboardTag: 'Dashboard / Executive / Target watchlist',
          },
          {
            name: 'Role-Match Scanner',
            benefit: 'Highlights mandates where your evidence is strongest so outreach starts with conviction.',
            visual: 'Role-match matrix',
            dashboardTag: 'Dashboard / Executive / Role match',
          },
          {
            name: 'Relationship Signal Feed',
            benefit: 'Tracks movement across sponsors, search partners, and operators so you react before windows close.',
            visual: 'Relationship signal feed',
            dashboardTag: 'Dashboard / Executive / Relationship feed',
          },
        ],
      },
      {
        phase: 'Activate',
        goal: 'Convert target context into narrative control across decision audiences',
        cadence: 'When outreach begins',
        features: [
          {
            name: 'Narrative Cue Cards',
            benefit: 'Converts target-company context into executive narrative framing to anticipate objections.',
            visual: 'Board-ready narrative cards',
            dashboardTag: 'Dashboard / Executive / Narrative prep',
          },
          {
            name: 'Interview Brief',
            benefit: 'Packages story, likely objections, and mandate framing so you control the first minutes.',
            visual: 'Prep brief panel',
            dashboardTag: 'Dashboard / Executive / Interview prep',
          },
          {
            name: 'Objection Library',
            benefit: 'Prepares concise responses to board and search-firm objections before engagement windows narrow.',
            visual: 'Objection-response cards',
            dashboardTag: 'Dashboard / Executive / Objection prep',
          },
          {
            name: 'Audience Adaptation View',
            benefit: 'Reframes one core narrative for recruiter, board, and operator audiences without losing control.',
            visual: 'Audience switch panel',
            dashboardTag: 'Dashboard / Executive / Audience adaptation',
          },
        ],
      },
      {
        phase: 'Operate',
        goal: 'Run high-tempo outreach and prep cadence with accountability',
        cadence: 'Weekly rhythm',
        features: [
          {
            name: 'Cadence Board',
            benefit: 'Sustains outreach cadence and prep visibility across weekly cycles.',
            visual: 'Weekly cadence board',
            dashboardTag: 'Dashboard / Executive / Weekly board',
          },
          {
            name: 'Progress Strip',
            benefit: 'Shows progress across conversations and prep tasks so you can redirect quickly.',
            visual: 'Progress strip',
            dashboardTag: 'Dashboard / Executive / Progress view',
          },
          {
            name: 'Follow-up Tracker',
            benefit: 'Maintains conversation momentum to avoid losing ground to competing candidates.',
            visual: 'Follow-up due tracker',
            dashboardTag: 'Dashboard / Executive / Follow-ups',
          },
          {
            name: 'Momentum Health Check',
            benefit: 'Flags outreach or prep slowdowns before shortlist odds drop.',
            visual: 'Momentum health meter',
            dashboardTag: 'Dashboard / Executive / Momentum',
          },
        ],
      },
    ],
  },
  search_firms: {
    label: 'Search Firms',
    accent: 'text-emerald-200',
    border: 'border-emerald-400/35',
    glow: 'shadow-[0_24px_90px_rgba(16,185,129,0.16)]',
    intro:
      'Retained-search operating flow from mandate intake through shortlist review, with boardroom accountability for cycle speed and quality.',
    status: 'ready',
    stages: [
      {
        phase: 'Discover',
        goal: 'Frame mandate economics and lane context before kickoff',
        cadence: 'Before kickoff',
        features: [
          {
            name: 'Role-Lane Brief Panel',
            benefit: 'Captures role context and market framing so kickoff starts with clarity and less rework.',
            visual: 'Role-lane brief panel',
            dashboardTag: 'Search firms / Brief intake',
          },
          {
            name: 'Lane Selection',
            benefit: 'Separates lane mandates so consultant effort goes where search economics are highest.',
            visual: 'Lane selection grid',
            dashboardTag: 'Search firms / Lane selection',
          },
          {
            name: 'Mandate Trigger Snapshot',
            benefit: 'Highlights trigger context such as sponsor moves and executive transitions that affect urgency.',
            visual: 'Trigger snapshot tiles',
            dashboardTag: 'Search firms / Mandate triggers',
          },
          {
            name: 'Client Context Pack',
            benefit: 'Consolidates mandate context into one intake artifact that reduces re-briefing overhead.',
            visual: 'Client context card',
            dashboardTag: 'Search firms / Client context',
          },
        ],
      },
      {
        phase: 'Activate',
        goal: 'Deliver ROI-relevant pre-search brief before kickoff',
        cadence: 'At kickoff',
        features: [
          {
            name: 'Kickoff Readiness Timeline',
            benefit: 'Ensures kickoff starts with a crisp briefing, reducing early-cycle churn and rework.',
            visual: 'Kickoff readiness timeline',
            dashboardTag: 'Search firms / Kickoff prep',
          },
          {
            name: 'Candidate Framing Card',
            benefit: 'Gives consultants a reusable framing artifact that improves first-pass candidate quality.',
            visual: 'Framing card',
            dashboardTag: 'Search firms / Candidate framing',
          },
          {
            name: 'Consultant Prep Workspace',
            benefit: 'Centralizes prep artifacts so principals and consultants stay aligned on quality.',
            visual: 'Prep workspace board',
            dashboardTag: 'Search firms / Consultant prep',
          },
          {
            name: 'Kickoff QA Checklist',
            benefit: 'Enforces a consistent quality gate that protects mandate economics from kickoff misses.',
            visual: 'Kickoff checklist',
            dashboardTag: 'Search firms / Kickoff QA',
          },
        ],
      },
      {
        phase: 'Operate',
        goal: 'Improve shortlist quality, speed, and margin by reducing resets',
        cadence: 'Throughout the search',
        features: [
          {
            name: 'Shortlist Quality Scoreboard',
            benefit: 'Tracks slate strength and prep quality as leading indicators of placement efficiency.',
            visual: 'Shortlist quality scoreboard',
            dashboardTag: 'Search firms / Shortlist review',
          },
          {
            name: 'Reset Watchlist',
            benefit: 'Flags mandate drift early so the team can correct before cycle-time slippage compounds.',
            visual: 'Reset warning panel',
            dashboardTag: 'Search firms / Search resets',
          },
          {
            name: 'Mandate Health Meter',
            benefit: 'Displays search status across cycle speed, shortlist quality, and reset risk.',
            visual: 'Mandate health meter',
            dashboardTag: 'Search firms / Mandate health',
          },
          {
            name: 'Client Readout Pack',
            benefit: 'Presents search progress in terms relevant to sponsor decision-making.',
            visual: 'Client readout cards',
            dashboardTag: 'Search firms / Client readout',
          },
        ],
      },
    ],
  },
}
