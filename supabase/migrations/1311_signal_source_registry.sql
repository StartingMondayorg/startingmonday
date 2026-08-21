-- Signal source registry for monthly discovery and governance reviews.

create table if not exists public.signal_sources (
  id uuid primary key default gen_random_uuid(),
  source_key text not null unique,
  source_name text not null,
  category text not null,
  access_method text not null,
  rights_status text not null,
  source_status text not null default 'pilot' check (source_status in ('active', 'pilot', 'deprecated')),
  role_families text[] not null default '{}'::text[],
  last_reviewed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.signal_source_monthly_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.signal_sources(id) on delete cascade,
  review_month date not null,
  precision_score numeric,
  recall_score numeric,
  recommendation text not null default 'keep' check (recommendation in ('keep', 'promote', 'deprecate')),
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (source_id, review_month)
);

create index if not exists signal_sources_status_idx on public.signal_sources(source_status);
create index if not exists signal_sources_last_reviewed_idx on public.signal_sources(last_reviewed_at);
create index if not exists signal_source_monthly_reviews_month_idx on public.signal_source_monthly_reviews(review_month);

alter table public.signal_sources enable row level security;
alter table public.signal_source_monthly_reviews enable row level security;

drop policy if exists "Authenticated users can read signal sources" on public.signal_sources;
create policy "Authenticated users can read signal sources"
  on public.signal_sources
  for select
  to authenticated
  using (true);

drop policy if exists "Service role manages signal sources" on public.signal_sources;
create policy "Service role manages signal sources"
  on public.signal_sources
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Authenticated users can read monthly signal source reviews" on public.signal_source_monthly_reviews;
create policy "Authenticated users can read monthly signal source reviews"
  on public.signal_source_monthly_reviews
  for select
  to authenticated
  using (true);

drop policy if exists "Service role manages monthly signal source reviews" on public.signal_source_monthly_reviews;
create policy "Service role manages monthly signal source reviews"
  on public.signal_source_monthly_reviews
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
