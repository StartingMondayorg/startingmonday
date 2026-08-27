-- WS11-04/05 follow-up: WARN-notice matching cache and watchlist exec
-- snapshots. Additive, service-role-only, matching 176's conventions.

-- WS11-05 Names layer infra: mirrors exec_snapshots' snapshot-diff model
-- (see worker/signals/diff-exec-snapshot.js) but keyed by watchlist entry
-- instead of (company_id, user_id), since watchlist entries are not rows in
-- the per-user companies table. Deliberately has no populating adapter yet:
-- fetch-pdl-execs.js (People Data Labs) is a commercial data broker and is
-- not one of the sources KEX-02 approved (EDGAR 8-K 5.02, company
-- newsroom/leadership pages, wire services, public regional press). This
-- table is ready to receive a roster from an approved source (e.g. a future
-- leadership-page monitor) once one exists; wiring PDL here requires its own
-- WS1-08 rights decision first.
create table if not exists public.watchlist_exec_snapshots (
  id uuid primary key default gen_random_uuid(),
  watchlist_entry_id uuid not null references public.watchlist_entries(id) on delete cascade,
  snapshot_date date not null,
  executives jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (watchlist_entry_id, snapshot_date)
);

alter table public.watchlist_exec_snapshots enable row level security;

drop policy if exists "watchlist_exec_snapshots_service_role_only" on public.watchlist_exec_snapshots;
create policy "watchlist_exec_snapshots_service_role_only" on public.watchlist_exec_snapshots
  for all using (false);

revoke all on public.watchlist_exec_snapshots from anon, authenticated;
