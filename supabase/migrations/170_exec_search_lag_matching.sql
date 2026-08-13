-- 170: Deterministic, idempotent E3 departure-to-appointment matching.
-- The writer remains operator-invoked and default off. This migration adds
-- evidence fields, one-to-one constraints, and one atomic service-only RPC.

alter table public.exec_search_lag
  add column if not exists matching_policy_version text,
  add column if not exists as_of_date date,
  add column if not exists computed_at timestamptz not null default now();

alter table public.exec_search_lag
  drop constraint if exists exec_search_lag_departure_key,
  add constraint exec_search_lag_departure_key unique (departure_id),
  drop constraint if exists exec_search_lag_appointment_key,
  add constraint exec_search_lag_appointment_key unique (appointment_id),
  drop constraint if exists exec_search_lag_positive_lag_check,
  add constraint exec_search_lag_positive_lag_check check (lag_days is null or lag_days > 0),
  drop constraint if exists exec_search_lag_matching_evidence_check,
  add constraint exec_search_lag_matching_evidence_check check (
    matching_policy_version is null
    or (
      departure_id is not null
      and appointment_id is not null
      and lag_days is not null
      and as_of_date is not null
    )
  );

create or replace function public.upsert_exec_search_lag_match(
  p_departure_id uuid,
  p_appointment_id uuid,
  p_matching_policy_version text,
  p_as_of_date date
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_departure public.executive_positions%rowtype;
  v_appointment public.executive_positions%rowtype;
  v_earliest_date date;
  v_earliest_count integer;
  v_result_id uuid;
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_matching_policy_version <> 'cik-role-earliest-v1' then
    raise exception 'unsupported_matching_policy';
  end if;
  if p_as_of_date is null then
    raise exception 'as_of_date_required';
  end if;

  select * into v_departure
  from public.executive_positions
  where id = p_departure_id
  for update;
  if not found then raise exception 'departure_not_found'; end if;

  select * into v_appointment
  from public.executive_positions
  where id = p_appointment_id
  for update;
  if not found then raise exception 'appointment_not_found'; end if;

  if v_departure.executive_id is null or v_appointment.executive_id is null then
    raise exception 'executive_identity_required';
  end if;
  if v_departure.executive_id = v_appointment.executive_id then
    raise exception 'same_executive_not_successor';
  end if;
  if v_departure.end_date is null or v_appointment.start_date is null then
    raise exception 'dated_positions_required';
  end if;
  if v_departure.title_normalized is null
     or v_departure.title_normalized is distinct from v_appointment.title_normalized then
    raise exception 'role_identity_mismatch';
  end if;
    if regexp_replace(regexp_replace(coalesce(v_departure.company_cik, ''), '[^0-9]', '', 'g'), '^0+', '') = ''
      or regexp_replace(regexp_replace(coalesce(v_departure.company_cik, ''), '[^0-9]', '', 'g'), '^0+', '')
        is distinct from regexp_replace(regexp_replace(coalesce(v_appointment.company_cik, ''), '[^0-9]', '', 'g'), '^0+', '') then
    raise exception 'company_identity_mismatch';
  end if;
  if v_appointment.start_date <= v_departure.end_date
     or v_appointment.start_date > (v_departure.end_date + interval '18 months')::date
     or v_appointment.start_date > p_as_of_date then
    raise exception 'appointment_outside_window';
  end if;

  select min(position.start_date)
  into v_earliest_date
  from public.executive_positions position
  where position.id <> v_departure.id
    and regexp_replace(regexp_replace(coalesce(position.company_cik, ''), '[^0-9]', '', 'g'), '^0+', '') =
      regexp_replace(regexp_replace(v_departure.company_cik, '[^0-9]', '', 'g'), '^0+', '')
    and position.title_normalized = v_departure.title_normalized
    and position.start_date > v_departure.end_date
    and position.start_date <= (v_departure.end_date + interval '18 months')::date
    and position.start_date <= p_as_of_date;

  if v_earliest_date is null or v_appointment.start_date <> v_earliest_date then
    raise exception 'appointment_not_earliest';
  end if;

  select count(*)::integer
  into v_earliest_count
  from public.executive_positions position
  where position.id <> v_departure.id
    and regexp_replace(regexp_replace(coalesce(position.company_cik, ''), '[^0-9]', '', 'g'), '^0+', '') =
      regexp_replace(regexp_replace(v_departure.company_cik, '[^0-9]', '', 'g'), '^0+', '')
    and position.title_normalized = v_departure.title_normalized
    and position.start_date = v_earliest_date;

  if v_earliest_count <> 1 then
    raise exception 'ambiguous_earliest_appointment';
  end if;
  if v_departure.successor_id is not null and v_departure.successor_id <> v_appointment.id then
    raise exception 'departure_successor_conflict';
  end if;
  if v_appointment.predecessor_id is not null and v_appointment.predecessor_id <> v_departure.id then
    raise exception 'appointment_predecessor_conflict';
  end if;

  insert into public.exec_search_lag (
    departure_id,
    appointment_id,
    company_name,
    company_cik,
    company_sector,
    company_sic_code,
    company_stage,
    company_revenue_band,
    title_normalized,
    lag_days,
    replacement_type,
    search_year,
    matching_policy_version,
    as_of_date,
    computed_at
  ) values (
    v_departure.id,
    v_appointment.id,
    v_departure.company_name,
    regexp_replace(regexp_replace(v_departure.company_cik, '[^0-9]', '', 'g'), '^0+', ''),
    v_departure.company_sector,
    v_departure.company_sic_code,
    v_departure.company_stage,
    v_departure.company_revenue_band,
    v_departure.title_normalized,
    v_appointment.start_date - v_departure.end_date,
    'unknown',
    extract(year from v_departure.end_date)::integer,
    p_matching_policy_version,
    p_as_of_date,
    now()
  )
  on conflict (departure_id) do update set
    company_name = excluded.company_name,
    company_cik = excluded.company_cik,
    company_sector = excluded.company_sector,
    company_sic_code = excluded.company_sic_code,
    company_stage = excluded.company_stage,
    company_revenue_band = excluded.company_revenue_band,
    title_normalized = excluded.title_normalized,
    lag_days = excluded.lag_days,
    replacement_type = excluded.replacement_type,
    search_year = excluded.search_year,
    matching_policy_version = excluded.matching_policy_version,
    as_of_date = excluded.as_of_date,
    computed_at = excluded.computed_at
  where public.exec_search_lag.appointment_id = excluded.appointment_id
  returning id into v_result_id;

  if v_result_id is null then
    raise exception 'departure_match_conflict';
  end if;

  update public.executive_positions
  set successor_id = v_appointment.id,
      days_to_successor = v_appointment.start_date - v_departure.end_date,
      updated_at = now()
  where id = v_departure.id;

  update public.executive_positions
  set predecessor_id = v_departure.id,
      updated_at = now()
  where id = v_appointment.id;

  return v_result_id;
end;
$$;

revoke all on function public.upsert_exec_search_lag_match(uuid, uuid, text, date) from public;
revoke all on function public.upsert_exec_search_lag_match(uuid, uuid, text, date) from anon;
revoke all on function public.upsert_exec_search_lag_match(uuid, uuid, text, date) from authenticated;
grant execute on function public.upsert_exec_search_lag_match(uuid, uuid, text, date) to service_role;