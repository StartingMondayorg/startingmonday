# 02 Observability and Alerting

## Health Surfaces
- src/app/api/health/route.ts
- src/app/api/readiness/route.ts
- worker/index.js (/health endpoint)

## Alerting Workflows
- .github/workflows/deploy-alerts.yml
- .github/workflows/slack-alert-test.yml
- .github/workflows/slack-simulated-failure.yml
- .github/workflows/fast-burn-alert.yml
- .github/workflows/data-integrity-alerts.yml
- .github/workflows/monitoring-watchdog.yml
- .github/workflows/deployment-watchdog.yml

## Reliability and Freshness Scripts
- scripts/slo-report.mjs
- scripts/check-mobile-production-thresholds.mjs
- scripts/production-smoke-check.mjs
- scripts/check-site-monitoring-readiness.mjs

## Worker Reliability Jobs
- worker/jobs/briefing-watchdog-job.js
- worker/jobs/edgar-freshness-audit-job.js
- worker/jobs/edgar-watchdog-job.js
- worker/jobs/provider-quality-audit-job.js
- worker/jobs/usage-monitor-job.js

## Documentation
- docs/site-monitoring-dashboard.md
- docs/site-monitoring-runbook.md
- docs/security-audit-runbook.md
- docs/alerts/
