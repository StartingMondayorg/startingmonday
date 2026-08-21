# Migration 179: Retire Placeholder Billing Offers

## Goal

Keep three unapproved offers unavailable in every environment while preserving their catalog rows for audit and later product decisions:

- `exec-interview-narrative-pack`
- `board-transition-brief-kit`
- `outplacement-accelerator-bundle`

The migration retires the two products, disables all associated price rows, and retires the bundle. It does not create, update, or delete Stripe objects.

## Risk triggers

- An approved commercial decision requires one of these offers to return.
- A verified Stripe product and price have been provisioned for the offer.
- Checkout, fulfillment, refund, tax, and support behavior have passed their required gates.

## Pre-rollback safety checks

1. Confirm the offer has approved price and fulfillment contracts.
2. Confirm its stored Stripe product and price IDs exist in the intended Stripe account and environment.
3. Confirm no placeholder ID remains.
4. Rehearse checkout and fulfillment outside production.

## Rollback

Do not blindly restore `active`. Reactivation is a forward commercial release and must explicitly update the intended product/bundle and price rows after all safety checks pass.

## Validation queries

```sql
select slug, product_status
from public.micro_products
where slug in ('exec-interview-narrative-pack', 'board-transition-brief-kit');

select mp.slug, mpp.is_active
from public.micro_product_prices mpp
join public.micro_products mp on mp.id = mpp.micro_product_id
where mp.slug in ('exec-interview-narrative-pack', 'board-transition-brief-kit');

select slug, bundle_status
from public.micro_product_bundles
where slug = 'outplacement-accelerator-bundle';
```

Expected: both products are `retired`, all matching prices are inactive, and the bundle is `retired`.

## Forward-fix plan

If a row fails to retire, apply an additive corrective migration using the same exact slug allowlist. Do not weaken strict billing readiness or classify placeholder identifiers as acceptable.