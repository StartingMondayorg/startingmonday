-- Briefing send claims (code review 2026-10-22, P1-3).
-- worker/jobs/briefing-job.js claims (user_id, local_date) before generating a
-- briefing and records the outcome after the Resend call, so a crash or DB
-- failure after the send no longer causes a duplicate email on the next run.
-- The worker tolerates this table being absent (it falls back to the previous
-- behavior), so the migration and the worker deploy can land in either order.
-- Worker-only: the service-role client reads and writes it; no browser access.

create table if not exists public.briefing_send_claims (
  user_id uuid not null references public.users(id) on delete cascade,
  local_date date not null,
  claimed_at timestamptz not null default now(),
  sent_at timestamptz,
  provider_message_id text,
  status text not null default 'claimed' check (status in ('claimed', 'sent', 'failed')),
  primary key (user_id, local_date)
);

comment on table public.briefing_send_claims is
  'One row per user per local briefing date. Written only by the worker briefing job (service role).';

alter table public.briefing_send_claims enable row level security;

revoke all on table public.briefing_send_claims from anon, authenticated;
grant select, insert, update, delete on table public.briefing_send_claims to service_role;
