-- Interview prep worksheet persistence (R-3 ruling 2026-10-21: wire persistence for /prep/interview).
-- Until now the worksheet was a <form> with no action; nothing typed was saved.

create table if not exists public.interview_preps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_name text,
  role_title text,
  interview_at timestamptz,
  answers jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'saved')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists interview_preps_user_updated_idx
  on public.interview_preps(user_id, updated_at desc);

alter table public.interview_preps enable row level security;

drop policy if exists "interview_preps_select_own" on public.interview_preps;
create policy "interview_preps_select_own"
  on public.interview_preps for select using (auth.uid() = user_id);

drop policy if exists "interview_preps_insert_own" on public.interview_preps;
create policy "interview_preps_insert_own"
  on public.interview_preps for insert with check (auth.uid() = user_id);

drop policy if exists "interview_preps_update_own" on public.interview_preps;
create policy "interview_preps_update_own"
  on public.interview_preps for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "interview_preps_delete_own" on public.interview_preps;
create policy "interview_preps_delete_own"
  on public.interview_preps for delete using (auth.uid() = user_id);

create or replace function public.set_interview_preps_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists interview_preps_set_updated_at on public.interview_preps;
create trigger interview_preps_set_updated_at
before update on public.interview_preps
for each row execute function public.set_interview_preps_updated_at();
