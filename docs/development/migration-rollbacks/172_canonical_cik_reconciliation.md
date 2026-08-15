# Migration 172 Rollback: Canonical CIK Reconciliation

Migration 172 adds a unique partial CIK index, a service-only reconciliation
ledger, and an atomic reconciliation RPC. It does not run the writer.

## Disable First

Do not invoke `scripts/reconcile-canonical-ciks.mjs --apply`. No scheduler or
customer reader uses this path.

## Data Rollback For One Authorized Run

Within the declared rollback window, replace `<run-id>` and execute in one
transaction after confirming no later reconciliation exists for those
canonical companies:

```sql
begin;

do $$
begin
  if exists (
    select 1
    from public.canonical_cik_reconciliation_ledger target
    join public.canonical_cik_reconciliation_ledger later
      on later.canonical_company_id = target.canonical_company_id
     and later.applied_at > target.applied_at
     and later.rolled_back_at is null
    where target.run_id = '<run-id>'::uuid
  ) then
    raise exception 'later_reconciliation_exists';
  end if;
end;
$$;

update public.canonical_companies company
set sec_cik_padded = ledger.previous_cik_padded,
    updated_at = now()
from public.canonical_cik_reconciliation_ledger ledger
where ledger.run_id = '<run-id>'::uuid
  and ledger.rolled_back_at is null
  and company.id = ledger.canonical_company_id
  and company.sec_cik_padded = ledger.applied_cik_padded;

update public.canonical_cik_reconciliation_ledger
set rolled_back_at = now(),
    rollback_reason = 'operator rollback for migration 172 authorized run'
where run_id = '<run-id>'::uuid
  and rolled_back_at is null;

commit;
```

Re-run the XS-01 dry-run and verify the pre-write 36/16/48 disposition, zero
duplicate populated CIKs, and unchanged E3/E6 counts.

## Schema Rollback

Only after data disposition is complete:

```sql
begin;
revoke all on function public.reconcile_canonical_company_ciks(uuid, jsonb, text) from public, anon, authenticated, service_role;
drop function if exists public.reconcile_canonical_company_ciks(uuid, jsonb, text);
drop table if exists public.canonical_cik_reconciliation_ledger;
drop index if exists public.canonical_companies_sec_cik_unique_idx;
commit;
```

Dropping the schema does not reverse canonical CIK values. Prefer a forward fix
when downstream evidence has consumed the reconciled identity.