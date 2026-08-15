# Migration 173 Rollback: Person-Signal Rights Containment

Migration 173 replaces four global authenticated read policies with policies
that require a user-owned `contact_people` or `company_people_candidates` link.
The paired worker change makes missing, unreadable, unknown, or non-explicit
source rights fail closed.

## Preferred Forward Fix

If a legitimate user cannot read a linked person record:

1. keep `person-signal-job` fail closed;
2. verify the user's relationship link exists and is tenant-owned;
3. correct the scoped policy or missing link; and
4. prove cross-tenant denial before deployment.

Do not restore `using (true)` merely to recover a reader.

## Emergency Runtime Kill

Stop or disable the `person-signal-job` schedule. The source-registry helper
continues to block registry errors, misses, and non-explicit rights.

## Schema Rollback

Only with explicit risk acceptance and after confirming all four affected
tables contain zero rows:

```sql
begin;

drop policy if exists "Users read linked people" on public.people;
drop policy if exists "Users read linked person sources" on public.person_sources;
drop policy if exists "Users read linked person affiliations" on public.person_affiliations;
drop policy if exists "Users read linked person signals" on public.person_signals;

create policy "Authenticated can read people"
  on public.people for select to authenticated using (true);
create policy "Authenticated can read person sources"
  on public.person_sources for select to authenticated using (true);
create policy "Authenticated can read person affiliations"
  on public.person_affiliations for select to authenticated using (true);
create policy "Authenticated can read person signals"
  on public.person_signals for select to authenticated using (true);

commit;
```

After any rollback, verify policy identity, all affected row counts, and that no
customer-visible person reader can cross tenant boundaries. Prefer an audited
forward fix once any person row exists.