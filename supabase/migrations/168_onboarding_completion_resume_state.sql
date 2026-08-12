-- Explicit onboarding state: completion is never inferred from related data,
-- and incomplete users resume from their last persisted step.

alter table public.user_profiles
  add column if not exists onboarding_current_step smallint not null default 0,
  add column if not exists onboarding_draft jsonb not null default '{}'::jsonb;

alter table public.user_profiles
  drop constraint if exists user_profiles_onboarding_current_step_check;

alter table public.user_profiles
  add constraint user_profiles_onboarding_current_step_check
    check (onboarding_current_step between 0 and 8);

alter table public.user_profiles
  drop constraint if exists user_profiles_onboarding_draft_object_check;

alter table public.user_profiles
  add constraint user_profiles_onboarding_draft_object_check
    check (jsonb_typeof(onboarding_draft) = 'object');

update public.user_profiles
set onboarding_current_step = 8
where onboarding_completed_at is not null
  and onboarding_current_step <> 8;