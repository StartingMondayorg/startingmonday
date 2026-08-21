-- Mo Live Brief Phase 1 foundation.
-- Starting Monday-local, service-role-only staff workflow tables. No MandateSignal
-- table, runtime, or cross-product prospect data dependency is introduced here.

create table if not exists public.live_brief_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by_user_id uuid not null references auth.users(id) on delete restrict,
  hubspot_contact_id text,
  hubspot_deal_id text,
  prospect_name text not null check (length(trim(prospect_name)) between 2 and 160),
  prospect_email text not null check (position('@' in prospect_email) > 1 and length(prospect_email) <= 320),
  linkedin_url text,
  source_text_encrypted_ref text not null check (length(trim(source_text_encrypted_ref)) between 1 and 500),
  consent_attested_at timestamptz not null,
  consent_source text not null check (length(trim(consent_source)) between 2 and 500),
  request_received_at timestamptz not null default now(),
  request_source text not null check (request_source in ('inbound_email', 'call', 'referral', 'other')),
  location_preference text,
  target_role_lane text,
  operator_notes text,
  reviewed_profile jsonb not null default '{}'::jsonb check (jsonb_typeof(reviewed_profile) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'reviewing', 'shortlisted', 'scanning', 'ready_for_review', 'delivered', 'revoked', 'deleted')),
  hubspot_sync_status text not null default 'not_queued' check (hubspot_sync_status in ('not_queued', 'pending', 'synced', 'failed')),
  hubspot_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_brief_scan_runs (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.live_brief_requests(id) on delete restrict,
  idempotency_key uuid not null unique,
  created_by_user_id uuid not null references auth.users(id) on delete restrict,
  status text not null default 'queued' check (status in ('queued', 'scanning', 'partial_ready', 'completed', 'failed', 'canceled')),
  selected_company_count integer not null check (selected_company_count between 1 and 10),
  completed_company_count integer not null default 0 check (completed_company_count >= 0),
  blocked_company_count integer not null default 0 check (blocked_company_count >= 0),
  failed_company_count integer not null default 0 check (failed_company_count >= 0),
  accepted_partial_at timestamptz,
  accepted_partial_by_user_id uuid references auth.users(id) on delete restrict,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  check (completed_company_count + blocked_company_count + failed_company_count <= selected_company_count)
);

create table if not exists public.live_brief_scan_companies (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.live_brief_scan_runs(id) on delete cascade,
  company_key text not null check (length(trim(company_key)) between 1 and 240),
  company_name text not null check (length(trim(company_name)) between 1 and 240),
  career_page_url text,
  target_role_lane text,
  operator_selected boolean not null default true,
  status text not null default 'queued' check (status in ('queued', 'scanning', 'complete', 'no_public_postings', 'blocked_by_source_policy', 'failed')),
  evidence_summary jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence_summary) = 'array'),
  error_class text,
  observed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (run_id, company_key)
);

create table if not exists public.live_brief_deliveries (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.live_brief_requests(id) on delete restrict,
  token_digest text not null unique check (token_digest ~ '^[a-f0-9]{64}$'),
  released_by_user_id uuid not null references auth.users(id) on delete restrict,
  sent_at timestamptz,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  revoked_by_user_id uuid references auth.users(id) on delete restrict,
  first_opened_at timestamptz,
  last_opened_at timestamptz,
  view_count integer not null default 0 check (view_count >= 0),
  cta_clicked_at timestamptz,
  hubspot_meeting_id text,
  call_booked_at timestamptz,
  created_at timestamptz not null default now(),
  check (expires_at > created_at)
);

create table if not exists public.live_brief_events (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.live_brief_requests(id) on delete restrict,
  delivery_id uuid references public.live_brief_deliveries(id) on delete restrict,
  event_type text not null check (event_type in ('request_created', 'profile_reviewed', 'shortlist_selected', 'scan_started', 'scan_partial_accepted', 'scan_completed', 'brief_finalized', 'delivery_released', 'delivery_opened', 'delivery_section_viewed', 'delivery_cta_clicked', 'delivery_revoked', 'hubspot_sync_queued', 'hubspot_sync_failed', 'hubspot_sync_completed', 'request_deleted')),
  actor_user_id uuid references auth.users(id) on delete restrict,
  idempotency_key uuid not null unique,
  event_payload jsonb not null default '{}'::jsonb check (jsonb_typeof(event_payload) = 'object'),
  occurred_at timestamptz not null default now()
);

create index if not exists live_brief_requests_status_received_idx
  on public.live_brief_requests(status, request_received_at desc);
create index if not exists live_brief_scan_runs_request_created_idx
  on public.live_brief_scan_runs(request_id, created_at desc);
create index if not exists live_brief_scan_companies_run_status_idx
  on public.live_brief_scan_companies(run_id, status);
create index if not exists live_brief_deliveries_request_idx
  on public.live_brief_deliveries(request_id, created_at desc);
create index if not exists live_brief_events_request_occurred_idx
  on public.live_brief_events(request_id, occurred_at);

create or replace function public.touch_live_brief_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_live_brief_requests_updated_at on public.live_brief_requests;
create trigger trg_live_brief_requests_updated_at
before update on public.live_brief_requests
for each row execute function public.touch_live_brief_request_updated_at();

revoke all on function public.touch_live_brief_request_updated_at() from public, anon, authenticated;

create or replace function public.prevent_live_brief_event_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'live_brief_events is append-only';
end;
$$;

drop trigger if exists trg_live_brief_events_append_only on public.live_brief_events;
create trigger trg_live_brief_events_append_only
before update or delete on public.live_brief_events
for each row execute function public.prevent_live_brief_event_mutation();

revoke all on function public.prevent_live_brief_event_mutation() from public, anon, authenticated;

alter table public.live_brief_requests enable row level security;
alter table public.live_brief_scan_runs enable row level security;
alter table public.live_brief_scan_companies enable row level security;
alter table public.live_brief_deliveries enable row level security;
alter table public.live_brief_events enable row level security;

revoke all on public.live_brief_requests from anon, authenticated;
revoke all on public.live_brief_scan_runs from anon, authenticated;
revoke all on public.live_brief_scan_companies from anon, authenticated;
revoke all on public.live_brief_deliveries from anon, authenticated;
revoke all on public.live_brief_events from anon, authenticated;