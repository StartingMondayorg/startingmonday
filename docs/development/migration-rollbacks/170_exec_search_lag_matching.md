# 170_exec_search_lag_matching rollback

Goal:

- Remove the E3 deterministic search-lag writer if matching, idempotency, or
  atomic position linkage is incorrect.

Risk triggers:

- A persisted pair is not the unique earliest exact-CIK/exact-role successor.
- An appointment is reused or an existing successor/predecessor is overwritten.
- Dry-run and persisted denominators do not reconcile.
- Anon or authenticated roles can execute the writer RPC.

Pre-rollback safety checks:

- Disable operator execution of `scripts/compute-search-lag.mjs --apply`.
- Export aggregate counts and the affected row IDs to restricted evidence.
- Confirm no customer-facing reader consumes `exec_search_lag`.
- Preserve the read-only baseline artifact and source position rows.

Rollback SQL:

```sql
begin;

update public.executive_positions position
set successor_id = null,
    days_to_successor = null,
    updated_at = now()
from public.exec_search_lag lag
where lag.matching_policy_version = 'cik-role-earliest-v1'
  and position.id = lag.departure_id
  and position.successor_id = lag.appointment_id;

update public.executive_positions position
set predecessor_id = null,
    updated_at = now()
from public.exec_search_lag lag
where lag.matching_policy_version = 'cik-role-earliest-v1'
  and position.id = lag.appointment_id
  and position.predecessor_id = lag.departure_id;

delete from public.exec_search_lag
where matching_policy_version = 'cik-role-earliest-v1';

do $$
declare
  remaining_v1_rows_before_schema_drop bigint;
begin
  select count(*) into remaining_v1_rows_before_schema_drop
  from public.exec_search_lag
  where matching_policy_version = 'cik-role-earliest-v1';
  if remaining_v1_rows_before_schema_drop <> 0 then
    raise exception 'search-lag rollback row cleanup failed';
  end if;
end;
$$;

drop function if exists public.upsert_exec_search_lag_match(uuid, uuid, text, date);

alter table public.exec_search_lag
  drop constraint if exists exec_search_lag_departure_key,
  drop constraint if exists exec_search_lag_appointment_key,
  drop constraint if exists exec_search_lag_positive_lag_check,
  drop constraint if exists exec_search_lag_matching_evidence_check,
  drop column if exists matching_policy_version,
  drop column if exists as_of_date,
  drop column if exists computed_at;

commit;
```

Validation:

```sql
select to_regprocedure(
  'public.upsert_exec_search_lag_match(uuid,uuid,text,date)'
) is null as writer_removed;

select count(*) = 0 as evidence_columns_removed
from information_schema.columns
where table_schema = 'public'
  and table_name = 'exec_search_lag'
  and column_name in ('matching_policy_version', 'as_of_date', 'computed_at');
```

Forward-fix:

- Correct the pure matcher and database invariant together.
- Reapply migration 170 through the guarded hosted workflow.
- Run dry-run evidence before any new apply.
- Reapply only after exact-head review and denominator reconciliation.
