# 171_search_lag_stats_refresh rollback

Goal:

- Remove the E6 descriptive search-lag refresh contract without changing E3
  source pairs or customer-facing signal content.

Rollback SQL:

```sql
begin;

delete from public.company_tenure_stats
where source_policy = 'cik-role-earliest-v1';

delete from public.industry_tenure_stats
where source_policy = 'cik-role-earliest-v1';

drop function if exists public.replace_search_lag_stats(jsonb, jsonb, text, text);

drop function if exists public.replace_search_lag_stats(jsonb, jsonb, jsonb, text, text);

drop table if exists public.search_lag_role_stats;

alter table public.company_tenure_stats
  drop constraint if exists company_tenure_stats_search_lag_support_check,
  drop column if exists stats_version,
  drop column if exists source_policy;

alter table public.industry_tenure_stats
  drop constraint if exists industry_tenure_stats_search_lag_support_check,
  drop column if exists stats_version,
  drop column if exists source_policy;

commit;
```

Kill behavior:

- Remove or disable the weekly cron registration.
- Keep the staff-only panel in a no-data state.
- Preserve all `exec_search_lag` rows and migration 170 evidence.
