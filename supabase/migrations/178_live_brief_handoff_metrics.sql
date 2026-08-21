-- WS7-10: count-only People to Know handoff metrics.
-- No search query, outbound URL, name, email, phone, or free text is stored.

create table if not exists public.live_brief_handoff_metrics (
  delivery_id uuid not null references public.live_brief_deliveries(id) on delete cascade,
  destination text not null check (destination in ('linkedin', 'apollo')),
  click_count integer not null default 1 check (click_count > 0),
  first_clicked_at timestamptz not null default now(),
  last_clicked_at timestamptz not null default now(),
  primary key (delivery_id, destination)
);

alter table public.live_brief_handoff_metrics enable row level security;
revoke all on public.live_brief_handoff_metrics from anon, authenticated;

create or replace function public.record_live_brief_handoff_click(
  p_delivery_id uuid,
  p_destination text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_destination not in ('linkedin', 'apollo') then
    raise exception 'unsupported handoff destination';
  end if;

  insert into public.live_brief_handoff_metrics (
    delivery_id,
    destination,
    click_count,
    first_clicked_at,
    last_clicked_at
  ) values (
    p_delivery_id,
    p_destination,
    1,
    now(),
    now()
  )
  on conflict (delivery_id, destination) do update
  set click_count = public.live_brief_handoff_metrics.click_count + 1,
      last_clicked_at = excluded.last_clicked_at;
end;
$$;

revoke all on function public.record_live_brief_handoff_click(uuid, text) from public, anon, authenticated;
grant execute on function public.record_live_brief_handoff_click(uuid, text) to service_role;