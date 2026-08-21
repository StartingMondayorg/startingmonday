-- Retire catalog offers that were seeded with placeholder Stripe identifiers.
-- These offers are not approved for sale. Preserve rows for audit/history while
-- making every checkout path fail closed.

update public.micro_product_prices
set is_active = false
where micro_product_id in (
  select id
  from public.micro_products
  where slug in (
    'exec-interview-narrative-pack',
    'board-transition-brief-kit'
  )
);

update public.micro_products
set
  product_status = 'retired',
  updated_at = now()
where slug in (
  'exec-interview-narrative-pack',
  'board-transition-brief-kit'
);

update public.micro_product_bundles
set
  bundle_status = 'retired',
  updated_at = now()
where slug = 'outplacement-accelerator-bundle';