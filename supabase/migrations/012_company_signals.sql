-- Add signal constraints and indexes to the table created by 001_initial_schema.sql.
alter table public.company_signals
  drop constraint if exists company_signals_signal_type_check;

alter table public.company_signals
  add constraint company_signals_signal_type_check check (signal_type in (
    'funding', 'exec_departure', 'exec_hire', 'acquisition',
    'expansion', 'layoffs', 'ipo', 'new_product', 'award'
  ));

alter table public.company_signals enable row level security;

drop policy if exists "Users manage own signals" on public.company_signals;
create policy "Users manage own signals"
  on public.company_signals for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_company_signals_user_date
  on public.company_signals (user_id, signal_date desc);

create index if not exists idx_company_signals_company
  on public.company_signals (company_id, signal_date desc);

-- Partial index for un-notified signals (used by briefing job)
create index if not exists idx_company_signals_unnotified
  on public.company_signals (user_id, signal_date desc)
  where notified_at is null;
