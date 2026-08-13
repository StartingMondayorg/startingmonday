# E6 Search-Lag Refresh Readiness

Date: 2026-08-13

Status: `IMPLEMENTED_LOCAL_READY_FOR_STAGING`

Scope: descriptive search-lag refresh and staff-only context.

## Governance

- Historical roadmap: E6.1 through E6.3, narrowed to search-lag fields.
- Canonical relationship: descriptive measurement input only; this does not
  start WS6 hazard modeling, prediction, shadow scoring, or customer promotion.
- Source policy: verified E3 `cik-role-earliest-v1` pairs only.
- Product-local repository: Starting Monday.

## Controls

- Company-role context requires at least 3 pairs.
- Industry-stage-role context requires at least 10 pairs.
- Missing SIC, stage, role, or support suppresses the cohort.
- Blank E3 company names are enriched only from canonical companies sharing
  the exact normalized SEC CIK.
- Industry context remains suppressed until SIC and stage coverage exist.
- Measured company/industry support is insufficient; role-level context is the
  accepted bounded re-plan and requires n ≥ 20.
- Output is descriptive median/average lag with support and period; no
  probability or causal language.
- Context is rendered only on the staff-gated intelligence admin page.
- Weekly refresh uses an advisory lock and atomic service-only replacement RPC.
- Customer signal summaries, briefings, emails, and outreach are unchanged.

## Rollback and Kill

- Remove the weekly cron registration.
- Roll back migration 171 with the dedicated playbook.
- Leave the staff panel in a no-data state.
- Preserve all E3 source pairs and evidence.

## Acceptance

- Pure aggregate fixtures pass support, suppression, policy, and median rules.
- Production readiness command emits aggregate counts only.
- Migration/RPC privileges and support constraints pass hosted verification.
- One controlled refresh reconciles source coverage to persisted supported rows.
- Staff page shows freshness, support floors, and one bounded context example.
- No customer-facing reader accesses the stats tables in this slice.

## Measured Disposition

- Source rows: 267.
- Supported role cohorts: 1, covering 249 rows at n ≥ 20.
- Supported company cohorts: 0; withheld at n < 3.
- Supported industry cohorts: 0; withheld because SIC/stage support is absent.
- Global descriptive median: 95 days; middle 50%: 3–245 days.
- Independent review: `READY_FOR_STAGING`, no unresolved P0/P1.

This is a bounded re-plan from company/industry context to supported role
context. It does not lower company or industry thresholds.
