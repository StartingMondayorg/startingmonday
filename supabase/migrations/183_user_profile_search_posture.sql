-- SMK-491: profile and onboarding code already read and write this field.
-- Keep it nullable for existing profiles and reject values outside the UI contract.

alter table public.user_profiles
  add column if not exists search_posture text
  check (search_posture in ('active', 'exploring', 'not_looking'));

comment on column public.user_profiles.search_posture is
  'User-selected search posture: active, exploring, or not_looking.';