# Release Note - Compatibility Sunset Readiness and Migration Controls

Date: 2026-08-10
Tickets: REM-01, SMK-404, SMK-441
Owner: Engineering + Product

## Scope covered in this release series
1. Compatibility-route deprecation telemetry and migration signaling for provider-first cron routing.
2. Admin observability fields for compatibility sunset readiness and removal gating.
3. CI/governance hardening for rollback readiness and release-note freshness controls.

## User-visible changes
1. Legacy compatibility route `/api/cron/apollo-quality-audit` now returns explicit deprecation metadata and successor-route guidance.
2. Internal admin status payload for `/api/admin/edgar-status` now includes compatibility sunset readiness fields (`hitCount`, `hitBudget`, `sunsetReady`, `lastSeenAt`).
3. Compatibility usage telemetry is now captured in monitoring state for controlled sunset decisions.

## KPI intent
1. Reduce residual compatibility-route traffic toward zero before final route removal.
2. Prevent accidental deprecation removals without telemetry-backed readiness.
3. Improve release confidence with explicit rollback documentation coverage for risky migrations.

## Rollback triggers
1. Compatibility telemetry introduces request latency or route instability in cron execution paths.
2. Admin status consumers fail due to payload contract drift after compatibility fields are added.
3. Migration rollback readiness gate fails for required high-risk migrations in active release windows.

## Rollback plan
1. Revert compatibility telemetry and deprecation-header changes as a single rollback commit if cron behavior regresses.
2. Revert admin status compatibility fields if downstream consumers break.
3. Apply the dedicated migration rollback playbook for migration 166 if source-constraint tightening must be temporarily reopened.

## Post-release verification checklist
1. Confirm `/api/cron/apollo-quality-audit` responds with compatibility and deprecation headers.
2. Confirm `/api/admin/edgar-status` includes `compatibilitySunset` and `status.compatRouteUsage` fields.
3. Confirm monitoring alert key `apollo-quality-audit-compat-hit` is present and updating in expected environments.
4. Confirm strict gates pass for migration rollback readiness and release-note artifact freshness.
