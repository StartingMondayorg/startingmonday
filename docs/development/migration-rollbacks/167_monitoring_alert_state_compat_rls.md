# 167_monitoring_alert_state_compat_rls rollback

Goal:
- Restore the original monitoring status constraint if compatibility telemetry or service-role access regresses.

Risk triggers:
- Monitoring writers fail after the constraint replacement.
- Service-role cron routes cannot read or write `public.monitoring_alert_state` after RLS is enabled.

Pre-rollback safety checks:
- Capture the current constraint definition and RLS state.
- Confirm no row currently uses `last_status = 'deprecated-route-hit'` before restoring the narrower constraint.
- Keep compatibility-route removal blocked while telemetry is unavailable.

Rollback SQL:
```sql
ALTER TABLE public.monitoring_alert_state
  DROP CONSTRAINT IF EXISTS monitoring_alert_state_last_status_check;

ALTER TABLE public.monitoring_alert_state
  ADD CONSTRAINT monitoring_alert_state_last_status_check
  CHECK (last_status IN ('unknown', 'fresh', 'stale'));

ALTER TABLE public.monitoring_alert_state DISABLE ROW LEVEL SECURITY;
```

Validation queries:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.monitoring_alert_state'::regclass
  AND conname = 'monitoring_alert_state_last_status_check';

SELECT relrowsecurity
FROM pg_class
WHERE oid = 'public.monitoring_alert_state'::regclass;
```

Forward-fix plan:
- Reapply migration 167 after correcting the service-role or writer regression.
- Verify provider quality, compatibility telemetry, and the admin sunset contract before any route-removal decision.