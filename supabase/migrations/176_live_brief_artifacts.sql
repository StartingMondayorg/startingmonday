-- Immutable, Starting Monday-local finalized brief content for private delivery.
create table if not exists public.live_brief_artifacts (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.live_brief_requests(id) on delete restrict,
  version integer not null check (version >= 1),
  brief_payload jsonb not null check (jsonb_typeof(brief_payload) = 'object'),
  content_hash text not null check (content_hash ~ '^[a-f0-9]{64}$'),
  finalized_by_user_id uuid not null references auth.users(id) on delete restrict,
  finalized_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (request_id, version)
);

create index if not exists live_brief_artifacts_request_version_idx
  on public.live_brief_artifacts(request_id, version desc);

alter table public.live_brief_deliveries
  add column if not exists artifact_id uuid references public.live_brief_artifacts(id) on delete restrict;

alter table public.live_brief_artifacts enable row level security;
revoke all on public.live_brief_artifacts from anon, authenticated;