-- Executive research library and weekly refresh history.

create table public.executive_research_library (
  id               uuid primary key default gen_random_uuid(),
  source_key       text not null unique,
  source_title     text not null,
  source_url       text not null,
  source_tier      text not null,
  source_category  text not null,
  source_summary   text not null,
  key_signals      text[] not null default '{}',
  last_http_status integer,
  last_excerpt     text,
  fetch_error      text,
  last_checked_at  timestamptz not null default now(),
  last_changed_at  timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists idx_executive_research_library_tier
  on public.executive_research_library (source_tier, source_category);

create table public.executive_research_refresh_runs (
  id             uuid primary key default gen_random_uuid(),
  run_started_at timestamptz not null default now(),
  run_finished_at timestamptz,
  checked_count   integer not null default 0,
  changed_count   integer not null default 0,
  failed_count    integer not null default 0,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table public.executive_research_library enable row level security;
alter table public.executive_research_refresh_runs enable row level security;
