# 09 Worker Automations

## Scheduler Core
- worker/index.js (cron scheduler, health endpoint, lock/timeout behavior)

## Job Families
- Scanning and signals:
  - worker/jobs/scan-job.js
  - worker/jobs/signal-job.js
  - worker/jobs/executive-scan-job.js
  - worker/jobs/opportunity-radar-job.js
- Briefing and follow-up:
  - worker/jobs/briefing-job.js
  - worker/jobs/followup-job.js
  - worker/jobs/briefing-watchdog-job.js
- Reliability and watchdogs:
  - worker/jobs/edgar-freshness-audit-job.js
  - worker/jobs/edgar-watchdog-job.js
  - worker/jobs/provider-quality-audit-job.js
- Growth and reporting:
  - worker/jobs/pulse-job.js
  - worker/jobs/weekly-report-job.js
  - worker/jobs/market-digest-job.js
  - worker/jobs/ideas-monthly-job.js
- Outreach lifecycle:
  - worker/jobs/outreach-digest-job.js
  - worker/jobs/outreach-reconcile-job.js
  - worker/jobs/outreach-tone-guard-job.js

## Worker Runtime Config
- worker/package.json
- worker/railway.toml
- worker/lib/* (supabase client, logger, notifications, checkpoints)
