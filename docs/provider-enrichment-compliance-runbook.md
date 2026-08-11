# Provider Enrichment Compliance Runbook

Updated: 2026-06-07
Owner: Growth + Product + Engineering

## Purpose
Define compliant handling for Apollo-derived contact enrichment in discovery and outreach workflows.

## Scope
- Recommendation suggestions generated via Apollo provider adapter.
- Contacts created from recommendation detail actions.
- Retention/deletion handling for provider-derived contacts.

## Controls
1. Source transparency in UI
- Suggested people cards display source and confidence.
- Recommendation telemetry stores coverage and quality rates.

2. Controlled provider usage
- Apollo enrichment requires APOLLO_ENRICHMENT_ENABLED=true and APOLLO_API_KEY.
- Fallback mode continues discovery without provider access.

3. Retention policy
- Provider-derived contacts use retention expiry timestamp.
- Daily cron cleanup archives expired provider-derived contacts.
- Cleanup route: /api/cron/enrichment-contact-retention.

4. Auditable events
- discover_recommendations_generated
- discover_recommendation_opened
- company_added with discover source attribution
- contact_added with discover recommendation source attribution

## Operational checks (weekly)
1. Verify provider quality audit status is fresh.
2. Verify enrichment retention cleanup archived count is non-error.
3. Spot check recommendation detail cards for source/confidence visibility.
4. Confirm admin EDGAR/intelligence status endpoint returns expected summary.
5. Confirm `/api/admin/edgar-status` `compatibilitySunset` reports `hitCount` at or below `hitBudget` before removing `/api/cron/apollo-quality-audit` compatibility route.
6. Use `compatibilitySunset.recommendation` as the default action signal:
	- `remove_compat_route` means no recent compatibility traffic in the active window.
	- `monitor` means within budget but still active.
	- `migrate_callers` means over budget and caller migration should be prioritized.
7. Use decision context fields to justify action in weekly updates:
	- `compatibilitySunset.overBudgetBy` quantifies current overage beyond budget.
	- `compatibilitySunset.inactivityWindowElapsed` confirms whether the inactivity threshold has elapsed.
	- `compatibilitySunset.recommendationReason` provides a machine-readable reason code for automation (`no_hits_and_inactive`, `within_budget`, `over_budget`).
	- `compatibilitySunset.eligibleForRouteRemoval` and `compatibilitySunset.requiresCallerMigration` provide direct boolean guards for automation workflows.
	- `compatibilitySunset.blockingReasons` enumerates explicit blockers to route removal (`compat_hits_over_budget`, `compat_route_still_active`, `inactivity_window_not_elapsed`).
	- `compatibilitySunset.hitWindowSource` clarifies whether `hitWindowHours` came from live alert telemetry (`alert_state`) or local default fallback (`default_fallback`).
	- `compatibilitySunset.inactivityWindowRemainingHours` quantifies remaining time before inactivity criteria is met (or `null` when `lastSeenAt` is unavailable).

## Incident response
1. If enrichment quality degrades, disable APOLLO_ENRICHMENT_ENABLED.
2. Run /api/cron/provider-quality-audit?health=1 and inspect stale reasons.
3. If retention cleanup fails, run /api/cron/enrichment-contact-retention?dry_run=1 and inspect dueCount.
4. If compatibility route traffic spikes, investigate callers still using /api/cron/apollo-quality-audit and schedule migration to /api/cron/provider-quality-audit.
5. Escalate in Slack with route payloads and timestamps.

## Required environment variables
- APOLLO_ENRICHMENT_ENABLED
- APOLLO_API_KEY
- CRON_SECRET
- SLACK_WEBHOOK_URL or Slack token/channel envs
