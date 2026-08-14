export const experienceAgents = [
  {
    id: 'route-inventory-agent.yml',
    name: 'Route Inventory Agent',
    status: 'Done',
    maxAgeMinutes: 60 * 30,
    recommendation: 'Regenerate inventory and reconcile newly added or removed routes before claiming full-site compliance.',
  },
  {
    id: 'experience-vitals-agent.yml',
    name: 'Experience Vitals Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 4, // Tightened from 8h to 4h after weekly verify
    sesWired: true,
    recommendation: 'Triage tier-level vitals budget breaches (now sourced from SES) and reconcile baseline drift before regressions harden.',
  },
  {
    id: 'cognitive-load-agent.yml',
    name: 'Cognitive Load Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 4, // Tightened from 8d to 4d after weekly verify
    sesWired: true,
    recommendation: 'Review high-density public routes and reduce CTA competition or paragraph density before fluency regresses further.',
  },
  {
    id: 'cognitive-fluency-calibration-dispatch.yml',
    name: 'Cognitive Fluency Calibration Dispatch',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 20, // Tightened from 40d to 20d based on monthly cycle
    recommendation: 'Run Page Experience Auditor on the monthly worst routes packet and feed the resulting corrections back into deterministic scoring.',
  },
  {
    id: 'trust-integrity-agent.yml',
    name: 'Trust Integrity Agent',
    status: 'Done',
    maxAgeMinutes: 60 * 12, // Tightened from 24h to 12h after weekly verify
    sesWired: true,
    recommendation: 'Monitor dashboard signal parity contracts and relative-time staleness violations; escalate P0 count mismatches immediately.',
  },
  {
    id: 'trust-escalation-agent.yml',
    name: 'Trust Escalation Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 2, // 2h - Route P0 findings to teams immediately
    sesWired: true,
    recommendation: 'Classify trust contract violations and route to owning teams; escalate P0 findings with 1h SLA.',
  },
  {
    id: 'visual-sentinel-agent.yml',
    name: 'Visual Sentinel Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 6, // Tightened from 12h to 6h with screenshot diffing
    sesWired: true,
    recommendation: 'Monitor screenshot diffs and validate visual regressions; address font-family and accent-color drift immediately.',
  },
  {
    id: 'journey-synthetic-agent.yml',
    name: 'Journey Synthetic Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 3, // Tightened from 6h to 3h with journey-step critical detection
    sesWired: true,
    recommendation: 'Detect and respond to critical journey step latency immediately; prioritize abandonment-risk mitigation before conversion impact.',
  },
  {
    id: 'accessibility-sweep-agent.yml',
    name: 'Accessibility Sweep Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 7, // 1 week - Color contrast, landmarks, ARIA labels
    sesWired: true,
    recommendation: 'Fix P0 landmark violations immediately; address WCAG AA contrast on public/funnel routes; improve heading hierarchy.',
  },
  {
    id: 'mobile-responsive-validator.yml',
    name: 'Mobile Responsive Validator',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24, // 1 day - Touch targets, font sizes, overflow on mobile
    sesWired: true,
    recommendation: 'Address P1 touch target violations and horizontal overflow on phones; improve font sizes for readability.',
  },
  {
    id: 'trends-forecasting-agent.yml',
    name: 'Trends Forecasting Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 7, // 1 week - Weekly velocity + risk scoring
    sesWired: true,
    recommendation: 'Track weekly issue velocity across all agents; forecast risk level based on open P0/P1 count and trend direction.',
  },
  {
    id: 'sla-attainment-agent.yml',
    name: 'SLA Attainment Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24, // 1 day - Team SLA performance tracking
    sesWired: true,
    recommendation: 'Monitor team SLA compliance (P0=60m, P1=4h, P2=24h); escalate if attainment falls below 80%.',
  },
  {
    id: 'directional-signals-agent.yml',
    name: 'Directional Signals Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 7, // 1 week - Weekly trend analysis
    sesWired: true,
    recommendation: 'Track improving vs declining categories; forecast days-to-SLA-failure; alert on trend inflection points.',
  },
  {
    id: 'team-coaching-agent.yml',
    name: 'Team Coaching Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24, // 1 day - Team health and coaching recommendations
    sesWired: true,
    recommendation: 'Monitor team SLA attainment and issue velocity; generate coaching recommendations for teams with high violation counts.',
  },
  {
    id: 'stakeholder-dashboard-agent.yml',
    name: 'Stakeholder Dashboard Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 6, // 6 hours - Real-time executive dashboard
    sesWired: true,
    recommendation: 'Generate real-time executive scorecard with P0/P1/P2 breakdown, top overdue issues, and recommended actions.',
  },
  {
    id: 'historical-trends-agent.yml',
    name: 'Historical Trends Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 7, // 1 week - 4-week moving averages
    sesWired: true,
    recommendation: 'Calculate 4-week moving averages and velocity trends; identify accelerating vs decelerating categories.',
  },
  {
    id: 'predictive-forecast-agent.yml',
    name: 'Predictive Forecast Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 7, // 1 week - 4-week forecasts
    sesWired: true,
    recommendation: 'Project issue counts 4 weeks ahead using linear regression; estimate days-to-threshold for each category.',
  },
  {
    id: 'team-comparison-agent.yml',
    name: 'Team Comparison Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24, // 1 day - Team benchmarking
    sesWired: true,
    recommendation: 'Compare team performance vs benchmark; identify underperforming and top-performing teams.',
  },
  {
    id: 'monthly-review-agent.yml',
    name: 'Monthly Review Agent',
    status: 'In Progress',
    maxAgeMinutes: 60 * 24 * 30, // 1 month - Monthly reviews
    sesWired: true,
    recommendation: 'Generate executive monthly business review with KPIs, achievements, focus areas, and recommendations.',
  },
]
