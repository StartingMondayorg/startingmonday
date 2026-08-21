-- SMK-470: enable RLS on the SEC ingestion scanner tables.
--
-- Neither table has a migration in this repo; both were created directly
-- against the databases. startingmonday-prod already has RLS enabled on them
-- with no policies, so this records that state and brings staging into line.
--
-- Row level security with zero policies denies all access to anon and
-- authenticated while service_role continues to bypass it, which is why the
-- scanner is unaffected -- prod has run this way already.
--
-- Deliberately no deny-all policy and no revoke of the anon/authenticated
-- grants, unlike 175: prod does neither, and the goal here is parity rather
-- than a stricter staging posture. Effective access is identical either way.

alter table public.sec_ingestion_runs enable row level security;
alter table public.sec_freshness_audit_state enable row level security;
