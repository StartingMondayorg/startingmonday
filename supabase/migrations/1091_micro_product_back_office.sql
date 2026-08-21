-- Sprint 4: micro-product back office foundation
-- Adds catalog, pricing, bundle templates, and entitlement mapping.

create table if not exists public.micro_products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  summary text not null,
  channel text not null check (channel in ('executives', 'coaches', 'outplacement', 'search_firms')),
  persona text,
  product_status text not null default 'draft' check (product_status in ('draft', 'active', 'retired')),
  billing_type text not null default 'one_time' check (billing_type in ('one_time', 'subscription')),
  default_interval text not null default 'one_time' check (default_interval in ('one_time', 'month', 'year')),
  display_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_micro_products_channel_status
  on public.micro_products(channel, product_status);

create table if not exists public.micro_product_prices (
  id uuid primary key default gen_random_uuid(),
  micro_product_id uuid not null references public.micro_products(id) on delete cascade,
  stripe_product_id text not null,
  stripe_price_id text not null unique,
  stripe_coupon_id text,
  currency text not null default 'usd',
  interval text not null default 'one_time' check (interval in ('one_time', 'month', 'year')),
  unit_amount_cents integer not null check (unit_amount_cents > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_micro_product_prices_product_active
  on public.micro_product_prices(micro_product_id, is_active);

create table if not exists public.micro_product_bundles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  audience text not null default 'b2b' check (audience in ('b2b', 'b2c')),
  bundle_status text not null default 'draft' check (bundle_status in ('draft', 'active', 'retired')),
  seat_min integer not null default 1,
  stripe_product_id text,
  stripe_price_id text,
  stripe_coupon_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_micro_product_bundles_status
  on public.micro_product_bundles(bundle_status);

create table if not exists public.micro_product_bundle_items (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid not null references public.micro_product_bundles(id) on delete cascade,
  micro_product_id uuid not null references public.micro_products(id) on delete cascade,
  entitlement_key text not null,
  included boolean not null default true,
  created_at timestamptz not null default now(),
  unique(bundle_id, micro_product_id)
);

create table if not exists public.account_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  partner_id uuid references public.partners(id) on delete cascade,
  micro_product_id uuid not null references public.micro_products(id) on delete cascade,
  source_bundle_id uuid references public.micro_product_bundles(id) on delete set null,
  entitlement_key text not null,
  seat_limit integer not null default 1,
  status text not null default 'active' check (status in ('active', 'revoked', 'expired')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (user_id is not null or partner_id is not null)
);

create index if not exists idx_account_entitlements_user
  on public.account_entitlements(user_id, status);

create index if not exists idx_account_entitlements_partner
  on public.account_entitlements(partner_id, status);

alter table public.micro_products enable row level security;
alter table public.micro_product_prices enable row level security;
alter table public.micro_product_bundles enable row level security;
alter table public.micro_product_bundle_items enable row level security;
alter table public.account_entitlements enable row level security;

insert into public.micro_products (slug, name, summary, channel, persona, product_status, billing_type, default_interval, display_order)
values
  ('exec-interview-narrative-pack', 'Executive Interview Narrative Pack', 'Role-specific story architecture and interview narrative drills for C-suite loops.', 'executives', 'active_mode', 'active', 'one_time', 'one_time', 10),
  ('board-transition-brief-kit', 'Board Transition Brief Kit', 'Board-facing transition brief templates for optionality and discreet positioning.', 'executives', 'passive_mode', 'active', 'subscription', 'month', 20)
on conflict (slug) do update
set
  name = excluded.name,
  summary = excluded.summary,
  channel = excluded.channel,
  persona = excluded.persona,
  product_status = excluded.product_status,
  billing_type = excluded.billing_type,
  default_interval = excluded.default_interval,
  display_order = excluded.display_order,
  updated_at = now();

insert into public.micro_product_prices (micro_product_id, stripe_product_id, stripe_price_id, stripe_coupon_id, interval, unit_amount_cents, is_active)
select p.id, 'prod_exec_interview_narrative_pack', 'price_exec_interview_narrative_pack', 'coupon_exec_launch_2026', 'one_time', 14900, true
from public.micro_products p
where p.slug = 'exec-interview-narrative-pack'
on conflict (stripe_price_id) do update
set
  stripe_product_id = excluded.stripe_product_id,
  stripe_coupon_id = excluded.stripe_coupon_id,
  interval = excluded.interval,
  unit_amount_cents = excluded.unit_amount_cents,
  is_active = excluded.is_active;

insert into public.micro_product_prices (micro_product_id, stripe_product_id, stripe_price_id, stripe_coupon_id, interval, unit_amount_cents, is_active)
select p.id, 'prod_board_transition_brief_kit', 'price_board_transition_brief_kit_monthly', 'coupon_board_launch_2026', 'month', 7900, true
from public.micro_products p
where p.slug = 'board-transition-brief-kit'
on conflict (stripe_price_id) do update
set
  stripe_product_id = excluded.stripe_product_id,
  stripe_coupon_id = excluded.stripe_coupon_id,
  interval = excluded.interval,
  unit_amount_cents = excluded.unit_amount_cents,
  is_active = excluded.is_active;

insert into public.micro_product_bundles (slug, name, audience, bundle_status, seat_min, stripe_product_id, stripe_price_id, stripe_coupon_id)
values
  ('outplacement-accelerator-bundle', 'Outplacement Accelerator Bundle', 'b2b', 'active', 5, 'prod_outplacement_accelerator_bundle', 'price_outplacement_accelerator_bundle_monthly', 'coupon_outplacement_pilot_2026')
on conflict (slug) do update
set
  name = excluded.name,
  audience = excluded.audience,
  bundle_status = excluded.bundle_status,
  seat_min = excluded.seat_min,
  stripe_product_id = excluded.stripe_product_id,
  stripe_price_id = excluded.stripe_price_id,
  stripe_coupon_id = excluded.stripe_coupon_id,
  updated_at = now();

insert into public.micro_product_bundle_items (bundle_id, micro_product_id, entitlement_key, included)
select b.id, p.id, 'exec_narrative_pack_access', true
from public.micro_product_bundles b
join public.micro_products p on p.slug = 'exec-interview-narrative-pack'
where b.slug = 'outplacement-accelerator-bundle'
on conflict (bundle_id, micro_product_id) do update
set entitlement_key = excluded.entitlement_key,
    included = excluded.included;

insert into public.micro_product_bundle_items (bundle_id, micro_product_id, entitlement_key, included)
select b.id, p.id, 'board_transition_brief_access', true
from public.micro_product_bundles b
join public.micro_products p on p.slug = 'board-transition-brief-kit'
where b.slug = 'outplacement-accelerator-bundle'
on conflict (bundle_id, micro_product_id) do update
set entitlement_key = excluded.entitlement_key,
    included = excluded.included;
