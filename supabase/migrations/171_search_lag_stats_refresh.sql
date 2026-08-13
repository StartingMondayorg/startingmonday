-- 171: Atomic, service-only refresh for descriptive E6 search-lag statistics.

alter table public.company_tenure_stats
  add column if not exists stats_version text,
  add column if not exists source_policy text;

alter table public.company_tenure_stats
  drop constraint if exists company_tenure_stats_search_lag_support_check,
  add constraint company_tenure_stats_search_lag_support_check check (
    stats_version is null
    or (
      source_policy is not null
      and sample_size >= 3
      and median_search_lag_days is not null
      and avg_search_lag_days is not null
    )
  );

alter table public.industry_tenure_stats
  add column if not exists stats_version text,
  add column if not exists source_policy text;

alter table public.industry_tenure_stats
  drop constraint if exists industry_tenure_stats_search_lag_support_check,
  add constraint industry_tenure_stats_search_lag_support_check check (
    stats_version is null
    or (
      source_policy is not null
      and sample_size >= 10
      and median_search_lag_days is not null
      and avg_search_lag_days is not null
      and company_stage is not null
    )
  );

create table if not exists public.search_lag_role_stats (
  id uuid primary key default gen_random_uuid(),
  title_normalized text not null,
  avg_search_lag_days integer not null,
  p25_search_lag_days integer not null,
  median_search_lag_days integer not null,
  p75_search_lag_days integer not null,
  sample_size integer not null check (sample_size >= 20),
  time_period_start date,
  time_period_end date,
  stats_version text not null,
  source_policy text not null,
  updated_at timestamptz not null default now(),
  unique (title_normalized, stats_version)
);

alter table public.search_lag_role_stats enable row level security;

create or replace function public.replace_search_lag_stats(
  p_company_rows jsonb,
  p_industry_rows jsonb,
  p_role_rows jsonb,
  p_stats_version text,
  p_source_policy text
)
returns table (company_rows integer, industry_rows integer, role_rows integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if (select auth.role()) <> 'service_role' then
    raise exception 'service_role_required' using errcode = '42501';
  end if;
  if p_stats_version <> 'search-lag-stats-v1' or p_source_policy <> 'cik-role-earliest-v1' then
    raise exception 'unsupported_stats_contract';
  end if;
    if jsonb_typeof(p_company_rows) <> 'array' or jsonb_typeof(p_industry_rows) <> 'array'
      or jsonb_typeof(p_role_rows) <> 'array' then
    raise exception 'stats_rows_must_be_arrays';
  end if;

  delete from public.company_tenure_stats where source_policy = p_source_policy;
  insert into public.company_tenure_stats (
    company_name, company_cik, title_normalized, avg_search_lag_days,
    median_search_lag_days, sample_size, time_period_start, time_period_end,
    stats_version, source_policy, updated_at
  )
  select
    row.company_name, row.company_cik, row.title_normalized,
    row.avg_search_lag_days, row.median_search_lag_days, row.sample_size,
    row.time_period_start, row.time_period_end, row.stats_version,
    row.source_policy, now()
  from jsonb_to_recordset(p_company_rows) as row(
    company_name text, company_cik text, title_normalized text,
    avg_search_lag_days integer, median_search_lag_days integer,
    sample_size integer, time_period_start date, time_period_end date,
    stats_version text, source_policy text
  );

  delete from public.industry_tenure_stats where source_policy = p_source_policy;
  insert into public.industry_tenure_stats (
    sic_code, sector_name, company_stage, title_normalized,
    avg_search_lag_days, median_search_lag_days, sample_size,
    time_period_start, time_period_end, stats_version, source_policy, updated_at
  )
  select
    row.sic_code, row.sector_name, row.company_stage, row.title_normalized,
    row.avg_search_lag_days, row.median_search_lag_days, row.sample_size,
    row.time_period_start, row.time_period_end, row.stats_version,
    row.source_policy, now()
  from jsonb_to_recordset(p_industry_rows) as row(
    sic_code text, sector_name text, company_stage text, title_normalized text,
    avg_search_lag_days integer, median_search_lag_days integer,
    sample_size integer, time_period_start date, time_period_end date,
    stats_version text, source_policy text
  );

  delete from public.search_lag_role_stats where source_policy = p_source_policy;
  insert into public.search_lag_role_stats (
    title_normalized, avg_search_lag_days, p25_search_lag_days,
    median_search_lag_days, p75_search_lag_days, sample_size,
    time_period_start, time_period_end, stats_version, source_policy, updated_at
  )
  select
    row.title_normalized, row.avg_search_lag_days, row.p25_search_lag_days,
    row.median_search_lag_days, row.p75_search_lag_days, row.sample_size,
    row.time_period_start, row.time_period_end, row.stats_version,
    row.source_policy, now()
  from jsonb_to_recordset(p_role_rows) as row(
    title_normalized text, avg_search_lag_days integer,
    p25_search_lag_days integer, median_search_lag_days integer,
    p75_search_lag_days integer, sample_size integer,
    time_period_start date, time_period_end date,
    stats_version text, source_policy text
  );

  return query select jsonb_array_length(p_company_rows), jsonb_array_length(p_industry_rows), jsonb_array_length(p_role_rows);
end;
$$;

revoke all on function public.replace_search_lag_stats(jsonb, jsonb, jsonb, text, text) from public;
revoke all on function public.replace_search_lag_stats(jsonb, jsonb, jsonb, text, text) from anon;
revoke all on function public.replace_search_lag_stats(jsonb, jsonb, jsonb, text, text) from authenticated;
grant execute on function public.replace_search_lag_stats(jsonb, jsonb, jsonb, text, text) to service_role;