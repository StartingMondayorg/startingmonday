-- State for the agentic incident loop (docs/sre/runbooks/agent-incident-loop.md).
--
-- Three concerns, three tables:
--   agent_incidents        one row per distinct problem, keyed by fingerprint
--   agent_slack_events     Slack retries the same event_id; makes ingest idempotent
--   agent_dispatch_budget  the global daily spend cap
--
-- Service-role only, matching monitoring_alert_state: RLS on, no policies.

create table if not exists public.agent_incidents (
  fingerprint text primary key,
  alert_class text not null,
  signal_key text not null,
  status text not null default 'open'
    check (status in ('open', 'dispatched', 'diagnosed', 'agent_failed', 'resolved', 'suppressed')),
  verdict text
    check (verdict is null or verdict in ('code-fix', 'not-code-fixable', 'insufficient-evidence')),
  slack_channel_id text,
  slack_thread_ts text,
  occurrence_count int not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  dispatched_at timestamptz,
  resolved_at timestamptz,
  responder_run_id text,
  jira_key text,
  pr_number int,
  -- Redacted at ingest by src/lib/incident/redact.ts. Raw production data must
  -- never land here: this row is what the agent reads, and the repo is public.
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists agent_incidents_status_idx
  on public.agent_incidents(status, last_seen_at desc);
create index if not exists agent_incidents_class_idx
  on public.agent_incidents(alert_class, last_seen_at desc);

-- Append-only audit log. Every status transition, with who caused it.
create table if not exists public.agent_incident_events (
  id bigserial primary key,
  fingerprint text not null references public.agent_incidents(fingerprint) on delete cascade,
  at timestamptz not null default now(),
  from_status text,
  to_status text,
  actor text not null,
  run_id text,
  detail jsonb not null default '{}'::jsonb
);

create index if not exists agent_incident_events_fingerprint_idx
  on public.agent_incident_events(fingerprint, at desc);

create table if not exists public.agent_slack_events (
  event_id text primary key,
  seen_at timestamptz not null default now()
);

create index if not exists agent_slack_events_seen_idx
  on public.agent_slack_events(seen_at desc);

create table if not exists public.agent_dispatch_budget (
  day date primary key,
  dispatches int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.agent_incidents enable row level security;
alter table public.agent_incident_events enable row level security;
alter table public.agent_slack_events enable row level security;
alter table public.agent_dispatch_budget enable row level security;

-- Atomic claim. Concurrent Slack deliveries for the same fingerprint collapse
-- into one row, so a storm produces one incident and one dispatch rather than
-- one per delivery. Local variable names are deliberately distinct from the
-- returned column names: PL/pgSQL substitutes OUT parameters into the query
-- text, and a bare `status` would be ambiguous against the column.
create or replace function public.claim_agent_incident(
  p_fingerprint text,
  p_alert_class text,
  p_signal_key text,
  p_channel text,
  p_thread_ts text,
  p_evidence jsonb
)
returns table (is_new boolean, occurrences int, current_status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
  v_status text;
begin
  insert into public.agent_incidents as ai (
    fingerprint, alert_class, signal_key, slack_channel_id, slack_thread_ts, evidence
  )
  values (p_fingerprint, p_alert_class, p_signal_key, p_channel, p_thread_ts, p_evidence)
  on conflict (fingerprint) do update
    set occurrence_count = ai.occurrence_count + 1,
        last_seen_at = now(),
        updated_at = now(),
        -- Keep the original thread_ts and evidence: replies belong under the
        -- first alert, and the agent should be judged on what it was given.
        -- A resolved incident that recurs reopens rather than forking.
        status = case when ai.status = 'resolved' then 'open' else ai.status end
  returning ai.occurrence_count, ai.status
  into v_count, v_status;

  return query select (v_count = 1), v_count, v_status;
end;
$$;

-- Increments only when the day is still under budget, in a single predicated
-- UPDATE. Two dispatches racing at the cap cannot both observe "under" and
-- both proceed, and rejected attempts do not inflate the counter -- so
-- `dispatches` always means "agent runs actually started today".
create or replace function public.consume_agent_dispatch_budget(p_limit int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_used int;
begin
  insert into public.agent_dispatch_budget (day, dispatches)
  values (current_date, 0)
  on conflict (day) do nothing;

  update public.agent_dispatch_budget
     set dispatches = dispatches + 1,
         updated_at = now()
   where day = current_date
     and dispatches < p_limit
  returning dispatches into v_used;

  return v_used is not null;
end;
$$;
