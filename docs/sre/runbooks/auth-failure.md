# Runbook: Auth Failure (P0)

Owner: On-call engineer
Tier: P0
Last Verified: 2026-05-18

## Trigger Conditions

- Alert: P0 Fast-Burn — Auth/Feedback/Optimize fires in Sentry or via fast-burn-alert.yml
- Synthetic-02 (Auth API Health) fails in monitoring.yml
- Users report inability to sign in or session drops
- 3+ consecutive production monitoring runs fail

False positives to check first:
1. Monitoring test account credentials expired (rotate secret `PLAYWRIGHT_TEST_EMAIL` / `PLAYWRIGHT_TEST_PASSWORD`)
2. Supabase status page shows incident (check dependency-health.yml alert context)
3. Rate limit triggered by test account (clear in Supabase auth.users or wait 1 minute)

## Impact Assessment

- **Affected journeys**: Login, signup, session refresh, OAuth
- **Affected users**: All users attempting to sign in; active sessions may also be affected if Supabase JWTs are not refreshing
- **Data integrity risk**: None — auth failures do not corrupt data

## Immediate Actions (First 10 Minutes)

1. Acknowledge alert and post in `#incidents`: "Auth incident opened — investigating"
2. Open Sentry > Performance > P0 Routes dashboard — check `/api/auth/*` error rate spike
3. Check Railway logs filtered to `"path":"/api/auth/` — look for 5xx responses with `correlation_id`
4. Check Supabase status: https://status.supabase.com
5. Check last deployment: `git log --oneline -5` — if deploy was < 30 minutes ago, correlate
6. If deploy-related: initiate rollback immediately (see Mitigations)

## Diagnostics Checklist

```sql
-- Check recent auth error rate (if Supabase logs are available):
select count(*), error_code
from auth.audit_log_entries
where created_at > now() - interval '15 minutes'
  and error_code is not null
group by error_code
order by count desc;
```

```bash
# Railway log filter for auth 5xx:
# In Railway UI: filter "api/auth" AND "status\":5

# Rate limits are shared in Postgres (public.rate_limit_counters, migration 189).
# A '[rate_limit] shared_store_unavailable_using_memory' log line means the app
# fell back to per-process counters (migration missing or RPC failing).
```

```sql
-- Keys being limited right now (login: rl:login:<ip>, rl:login_submit:<ip>)
select key, window_start, count
from public.rate_limit_counters
where window_start > now() - interval '15 minutes'
order by count desc
limit 50;

-- Clear a wrongly blocked key
delete from public.rate_limit_counters where key = 'rl:login:<ip>';
```

Traces to inspect:
- Sentry > Performance > filter transaction `/api/auth/verify-and-signin` > sort by duration descending
- Look for Supabase SDK timeout spans (should show as child spans)

## Mitigations

In order of escalation:

1. **Restart Railway service** — clears stuck in-process state (rate limits are in Postgres and survive restarts; clear them with the SQL above)
2. **Rollback deploy** — if correlated with recent deploy:
   - Railway: Deployments > prior deploy > Redeploy
   - GitHub: `git revert HEAD && git push`
3. **Disable feature flag** — if new auth feature is behind a flag, disable it
4. **Supabase incident** — if external: post status update, monitor Supabase status page, no action needed other than communication

## Recovery Validation

1. Synthetic-02 passes two consecutive runs (1 minute wait between)
2. Sentry `/api/auth/*` error rate returns below 0.05%
3. Test login manually with a real account
4. Confirm `#sre-alerts` shows no new fast-burn alerts for 15 minutes

## Communication Template

**Internal (every 15 min for Sev-1):**
> `[hh:mm UTC]` Auth incident in progress. Impact: users cannot sign in. Status: [investigating / identified / mitigating]. Next update in 15 minutes.

**Resolution:**
> `[hh:mm UTC]` Auth incident resolved. Root cause: [brief]. Duration: [X] minutes. Postmortem due [date].

## Follow-up Actions

1. Open postmortem within 24 hours if duration > 15 minutes
2. Add/update unit test for the code path that caused failure
3. If Supabase-caused: evaluate circuit breaker or graceful fallback for auth
