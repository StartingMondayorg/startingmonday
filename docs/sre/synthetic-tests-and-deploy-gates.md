# Production Synthetics and Deploy Gate Specification

Last updated: 2026-05-18

## Objective

Catch regressions before and immediately after deploy for all P0 workflows.

## Synthetic Test Suite v1

Run from two regions every 5 minutes (staggered by 2.5 minutes).

### Synthetic-01: Login Page Loads

1. GET /login
2. Assert status 200
3. Assert sign-in form elements present (email, password, submit)
4. Budget: <= 3 seconds end-to-end

### Synthetic-02: Auth API Health (Credentials Check)

1. POST /api/auth/verify-and-signin using dedicated synthetic account
2. Assert status 200
3. Assert session cookie set
4. Budget: <= 2 seconds

### Synthetic-03: Dashboard Landing

1. Use session from Synthetic-02
2. GET /dashboard
3. Assert status 200 and key dashboard markers
4. Budget: <= 4 seconds

### Synthetic-04: Feedback Submission

1. POST /api/feedback/items with synthetic account session
2. Assert status 201
3. Assert response contains item id
4. Cleanup created item by synthetic cleanup job
5. Budget: <= 2 seconds

### Synthetic-05: Optimize Flow

1. POST /api/optimize with browser UA and valid payload
2. Assert status is 200 or 429
3. Assert response does not include captcha-related errors
4. Budget: <= 6 seconds first-byte

### Synthetic-06: Contact Follow-up Lifecycle

1. Create synthetic contact (DB-backed synthetic account)
2. Create 2 pending follow_ups
3. Execute close flow mutation logic
4. Assert pending_after = 0 and completed_after = 2
5. Cleanup synthetic data
6. Budget: <= 10 seconds

### Synthetic-07: Billing Portal Path

1. POST /api/billing/portal with synthetic paid-seat account
2. Assert status 200 and redirect URL
3. Budget: <= 3 seconds

### Synthetic-08: Stripe Webhook Readiness

1. POST signed test event to /api/webhooks/stripe
2. Assert 2xx and idempotent handling of replay event
3. Budget: <= 2 seconds

## Deploy Gate Policy

## Pre-merge Gates (required)

1. Typecheck: npx tsc --noEmit
2. Unit tests: vitest pass
3. Integration tests: critical API contracts pass
4. E2E smoke in preview: auth, dashboard, feedback, optimize, follow-up lifecycle

## Pre-production Gates (required)

1. Latest synthetic suite pass rate >= 99% over prior 60 minutes
2. No open Sev-1 or Sev-2 incident
3. No fast-burn alert currently active
4. DB migration checks pass on staging dataset

## Post-deploy Gates (required)

1. Auto-run synthetic suite immediately after deploy
2. Block rollout completion if any P0 synthetic fails
3. Automatic rollback if 2 consecutive post-deploy synthetic runs fail
4. 15-minute watch window with elevated telemetry sampling
5. Run EMI post-deploy smoke gate (`npm run emi:smoke:postdeploy`). The gate fails only on pipeline health: any automation route returning non-200, an operational route reporting `ok=false`, no KPI snapshots written for the current week, or any metric with `metric_status=query_error`. Business-criteria shortfalls and stale instrumentation are reported as advisory warnings and do not fail the gate (SMK-444)

## Rollback Rules

1. Immediate rollback on any Sev-1 condition introduced by deploy
2. Rollback if P0 failure ratio exceeds threshold for 10 minutes post-deploy
3. Rollback if authentication or billing path fails synthetics once and cannot be mitigated in 5 minutes

## Ownership

1. CI and gate ownership: Engineering
2. Synthetic monitors ownership: SRE owner on rotation
3. Alert routing ownership: Incident Commander and On-call Primary

## Tooling Requirements

1. Playwright for browser-level synthetics
2. API synthetic runner for direct route checks
3. Central dashboard tying synthetic runs to deploy SHA and release version
4. Nightly synthetic cleanup job for generated test data
