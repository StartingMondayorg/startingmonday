# Migration 168 rollback

Goal: remove resumable onboarding fields if they cause write or routing failures without changing the existing explicit `onboarding_completed_at` state.

## Risk triggers

- Progress writes fail after deployment.
- Stored drafts cannot be decoded by the onboarding form.
- The new step constraint blocks valid onboarding transitions.

## Before rollback

1. Export non-empty `onboarding_draft` values and `onboarding_current_step` for incomplete users.
2. Revert application code that selects or writes the two columns.
3. Keep `onboarding_completed_at` unchanged; it remains the completion authority.

## Rollback SQL

```sql
alter table public.user_profiles
  drop constraint if exists user_profiles_onboarding_draft_object_check,
  drop constraint if exists user_profiles_onboarding_current_step_check,
  drop column if exists onboarding_draft,
  drop column if exists onboarding_current_step;
```

## Verification

```sql
select column_name
from information_schema.columns
where table_schema = 'public'
  and table_name = 'user_profiles'
  and column_name in ('onboarding_current_step', 'onboarding_draft');
```

The verification query must return zero rows. Confirm completed users still have `onboarding_completed_at` and can reach `/dashboard` before closing the rollback.