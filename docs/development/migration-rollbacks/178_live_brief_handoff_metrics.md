# Migration 178: Live Brief Handoff Metrics

## Scope

Adds a service-role-only, count-only table and atomic RPC for `linkedin` and `apollo` handoff clicks. It stores delivery ID, destination, count, and first/last timestamps only.

## Pre-apply

1. Confirm migration 176 and the Live Brief foundation tests pass.
2. Confirm no migration version `178` exists in the target history.
3. Keep `LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED` disabled.

## Rollback

Disable `LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED` first. Then, only if no deployed reader or writer references the RPC:

```sql
drop function if exists public.record_live_brief_handoff_click(uuid, text);
drop table if exists public.live_brief_handoff_metrics;
```

Accepted aggregate counts may instead be retained and the application reverted. Never add raw click payloads to simulate recovery.

## Forward Fix

Prefer an additive function replacement or table constraint/index correction. Preserve the `(delivery_id, destination)` identity and count semantics.

## Verification

- Flag-off renders the prior private brief.
- Authenticated and anonymous roles cannot read/write the table or execute the RPC.
- Service role can execute the RPC.
- Repeated calls increment one row without storing search or contact data.