-- 172: Atomic, service-only canonical CIK reconciliation from already-linked
-- company rows. No external source collection or customer reader is added.

create unique index if not exists canonical_companies_sec_cik_unique_idx
  on public.canonical_companies (sec_cik_padded)
  where sec_cik_padded is not null;

create table if not exists public.canonical_cik_reconciliation_ledger (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  canonical_company_id uuid not null references public.canonical_companies(id) on delete restrict,
  previous_cik_padded text,
  applied_cik_padded text not null,
  policy_version text not null,
  applied_at timestamptz not null default now(),
  rolled_back_at timestamptz,
  rollback_reason text,
  constraint canonical_cik_reconciliation_cik_check check (
    applied_cik_padded ~ '^[0-9]{10}$'
    and applied_cik_padded <> '0000000000'
  ),
  constraint canonical_cik_reconciliation_run_company_key unique (run_id, canonical_company_id)
);

create index if not exists canonical_cik_reconciliation_company_idx
  on public.canonical_cik_reconciliation_ledger (canonical_company_id, applied_at desc);

alter table public.canonical_cik_reconciliation_ledger enable row level security;

revoke all on table public.canonical_cik_reconciliation_ledger from public;
revoke all on table public.canonical_cik_reconciliation_ledger from anon;
revoke all on table public.canonical_cik_reconciliation_ledger from authenticated;
grant select on table public.canonical_cik_reconciliation_ledger to service_role;

create or replace function public.reconcile_canonical_company_ciks(
  p_run_id uuid,
  p_candidates jsonb,
  p_policy_version text
)
returns table (proposed_rows integer, applied_rows integer, already_aligned_rows integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_proposed integer;
  v_applied integer := 0;
  v_existing_run_rows integer;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_policy_version <> 'linked-company-cik-global-unique-v1' then
    raise exception 'unsupported_reconciliation_policy';
  end if;
  if p_run_id is null then
    raise exception 'run_id_required';
  end if;
  if jsonb_typeof(p_candidates) <> 'array' then
    raise exception 'candidates_must_be_array';
  end if;

  v_proposed := jsonb_array_length(p_candidates);
  if v_proposed > 500 then
    raise exception 'candidate_batch_too_large';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_candidates) candidate
    where jsonb_typeof(candidate) <> 'object'
      or coalesce(candidate->>'canonical_company_id', '') !~
        '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89aAbB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$'
      or coalesce(candidate->>'sec_cik_padded', '') !~ '^[0-9]{10}$'
      or candidate->>'sec_cik_padded' = '0000000000'
  ) then
    raise exception 'invalid_candidate_payload';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_candidates) candidate(
      canonical_company_id uuid,
      sec_cik_padded text
    )
    group by candidate.canonical_company_id
    having count(*) > 1
  ) then
    raise exception 'duplicate_candidate_company';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_candidates) candidate(
      canonical_company_id uuid,
      sec_cik_padded text
    )
    group by candidate.sec_cik_padded
    having count(*) > 1
  ) then
    raise exception 'duplicate_candidate_cik';
  end if;

  perform pg_advisory_xact_lock(917230172);

  select count(*)::integer
  into v_existing_run_rows
  from public.canonical_cik_reconciliation_ledger
  where run_id = p_run_id;

  if v_existing_run_rows > 0 then
    if v_existing_run_rows <> v_proposed or exists (
      select 1
      from public.canonical_cik_reconciliation_ledger ledger
      where ledger.run_id = p_run_id
        and not exists (
          select 1
          from jsonb_to_recordset(p_candidates) candidate(
            canonical_company_id uuid,
            sec_cik_padded text
          )
          where candidate.canonical_company_id = ledger.canonical_company_id
            and candidate.sec_cik_padded = ledger.applied_cik_padded
        )
    ) then
      raise exception 'run_id_reuse_conflict';
    end if;
    return query select v_proposed, 0, v_proposed;
    return;
  end if;

  if (
    select count(*)
    from public.canonical_companies company
    join jsonb_to_recordset(p_candidates) candidate(
      canonical_company_id uuid,
      sec_cik_padded text
    ) on candidate.canonical_company_id = company.id
  ) <> v_proposed then
    raise exception 'candidate_company_not_found';
  end if;

  if exists (
    select 1
    from public.canonical_companies company
    join jsonb_to_recordset(p_candidates) candidate(
      canonical_company_id uuid,
      sec_cik_padded text
    ) on candidate.canonical_company_id = company.id
    where company.sec_cik_padded is not null
      and company.sec_cik_padded is distinct from candidate.sec_cik_padded
  ) then
    raise exception 'canonical_cik_state_drift';
  end if;

  if exists (
    select 1
    from public.canonical_companies owner
    join jsonb_to_recordset(p_candidates) candidate(
      canonical_company_id uuid,
      sec_cik_padded text
    ) on candidate.sec_cik_padded = owner.sec_cik_padded
    where owner.id <> candidate.canonical_company_id
  ) then
    raise exception 'canonical_cik_already_owned';
  end if;

  insert into public.canonical_cik_reconciliation_ledger (
    run_id,
    canonical_company_id,
    previous_cik_padded,
    applied_cik_padded,
    policy_version
  )
  select
    p_run_id,
    company.id,
    company.sec_cik_padded,
    candidate.sec_cik_padded,
    p_policy_version
  from public.canonical_companies company
  join jsonb_to_recordset(p_candidates) candidate(
    canonical_company_id uuid,
    sec_cik_padded text
  ) on candidate.canonical_company_id = company.id
  where company.sec_cik_padded is null;

  update public.canonical_companies company
  set sec_cik_padded = candidate.sec_cik_padded,
      updated_at = now()
  from jsonb_to_recordset(p_candidates) candidate(
    canonical_company_id uuid,
    sec_cik_padded text
  )
  where company.id = candidate.canonical_company_id
    and company.sec_cik_padded is null;
  get diagnostics v_applied = row_count;

  return query select v_proposed, v_applied, v_proposed - v_applied;
end;
$$;

revoke all on function public.reconcile_canonical_company_ciks(uuid, jsonb, text) from public;
revoke all on function public.reconcile_canonical_company_ciks(uuid, jsonb, text) from anon;
revoke all on function public.reconcile_canonical_company_ciks(uuid, jsonb, text) from authenticated;
grant execute on function public.reconcile_canonical_company_ciks(uuid, jsonb, text) to service_role;