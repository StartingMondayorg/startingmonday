// Frequent monitors use a 5h freshness window: observed GitHub cron drift
// reaches 143-254 minutes off-hours (SMK-451), so 30-90m windows flagged
// scheduler delay rather than real monitoring stalls. Kept in step with the
// windows in .github/workflows/monitoring-watchdog.yml.
export const reliabilityWorkflows = [
  {
    id: 'production-synthetics.yml',
    name: 'Production Synthetics',
    maxAgeMinutes: 60 * 5,
    recommendation: 'Triage failing synthetic checks, quarantine flaky probes, and verify production auth/session health.',
  },
  {
    id: 'dashboard-behavior-baseline.yml',
    name: 'Dashboard Behavior Baseline Agent',
    maxAgeMinutes: 60 * 30,
    recommendation: 'Dispatch the baseline agent and validate dashboard route contracts and credentials.',
  },
  {
    id: 'monitoring.yml',
    name: 'Production Monitoring',
    maxAgeMinutes: 60 * 5,
    recommendation: 'Review production monitors and reconnect failing checks to service owners and runbooks.',
  },
  {
    id: 'monitoring-watchdog.yml',
    name: 'Monitoring Watchdog',
    maxAgeMinutes: 60 * 5,
    recommendation: 'Resolve watchdog freshness failures quickly to prevent silent monitoring outages.',
  },
  {
    id: 'deployment-watchdog.yml',
    name: 'Deployment Watchdog',
    maxAgeMinutes: 60 * 5,
    recommendation: 'Inspect deployment gate failures and verify branch-to-environment promotion health.',
  },
]
