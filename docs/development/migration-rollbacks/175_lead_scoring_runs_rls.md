# Migration 175 Rollback: lead_scoring_runs RLS

Migration 175 enables row level security on `public.lead_scoring_runs`, adds the
deny-all policy `lead_scoring_runs_admin_only`, and revokes the `anon` and
`authenticated` grants. The table was created without RLS in migration 097 while
`public` is exposed through PostgREST, so any holder of the anon key could read,
insert, or delete rows. Inserts also fire
`trg_automation_alert_lead_scoring_runs`, which injects rows into the admin
monitoring alert table.

The migration is flagged risky only because it contains `drop policy if exists`,
which is there to make re-application idempotent. It drops no data and no
columns.

## Blast Radius

None expected. Every code path uses the service role, which bypasses RLS:
writes in `src/lib/lead-scoring-runner.ts`, and the only read is the admin CRM
page through `createAdminClient()`. No user-context reader exists. The same
configuration has been live on `startingmonday-prod` since before this migration
was written.

## Preferred Forward Fix

If a legitimate reader is found to be broken:

1. confirm the caller is using the service role, not a user JWT;
2. if it is a genuine user-facing reader, add a scoped policy that restricts
   rows to the requesting user rather than widening access; and
3. prove that `anon` is still denied before deployment.

Do not restore blanket `anon` or `authenticated` grants to recover a reader.

## Emergency Runtime Kill

Not applicable. The migration adds no job, trigger, or scheduled work. If the
admin CRM lead-scoring panel fails to load, that page reads through
`createAdminClient()` and is unaffected by this change; look elsewhere first.

## Schema Rollback

Only with explicit risk acceptance. This restores the pre-migration state, in
which the table is readable and writable by any holder of the public anon key:

```sql
begin;

drop policy if exists "lead_scoring_runs_admin_only" on public.lead_scoring_runs;
alter table public.lead_scoring_runs disable row level security;

grant select, insert, update, delete on public.lead_scoring_runs to anon, authenticated;

commit;
```

A safer partial rollback keeps RLS enabled and drops only the policy. RLS with
zero policies still denies `anon` and `authenticated` while `service_role`
bypasses it, which is exactly how `sec_ingestion_runs` and
`sec_freshness_audit_state` run after migration 176:

```sql
drop policy if exists "lead_scoring_runs_admin_only" on public.lead_scoring_runs;
```

## Verification

After any rollback, confirm the intended state and that the admin path still
works:

```sql
select c.relname, c.relrowsecurity,
       (select count(*) from pg_policy p where p.polrelid = c.oid) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'lead_scoring_runs';
```

Then confirm a service-role read of `lead_scoring_runs` still returns rows, and
check the Supabase security advisor: a full rollback reintroduces the
`rls_disabled_in_public` ERROR for this table.
