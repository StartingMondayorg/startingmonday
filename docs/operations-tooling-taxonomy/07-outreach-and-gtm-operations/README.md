# 07 Outreach and GTM Operations

## Outreach Reliability and Audits
- scripts/audit-outreach-db.mjs
- scripts/audit-outreach-sends.mjs
- scripts/nightly-outreach-audit.mjs
- scripts/human-tone-guard-audit.mjs
- scripts/refine-outreach-templates-by-council.mjs

## Send and Reconcile Pipelines
- worker/jobs/outreach-digest-job.js
- worker/jobs/outreach-reconcile-job.js
- worker/jobs/outreach-tone-guard-job.js
- src/app/api/outreach/send/route.ts
- src/app/api/outreach/send/batch-status/route.ts
- src/app/api/outreach/status/route.ts

## GTM and Pipeline Tooling
- scripts/refresh-coach-outreach-queue.mjs
- scripts/import-coach-outreach.mjs
- scripts/import-coaches-comprehensive.mjs
- scripts/resolve-ciks.mjs

## Documentation
- docs/outreach-playbook.md
- docs/outreach-trigger-field-reference.md
- docs/provider-enrichment-compliance-runbook.md
