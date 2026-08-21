-- Role-aware onboarding profile fields for leadership, technical leadership, and delivery leadership.

alter table public.user_profiles
  add column if not exists role_family text,
  add column if not exists role_title text,
  add column if not exists role_seniority text,
  add column if not exists workflow_variant text;

alter table public.user_profiles
  drop constraint if exists user_profiles_role_family_check;

alter table public.user_profiles
  add constraint user_profiles_role_family_check
    check (role_family is null or role_family in ('leadership', 'technical_leadership', 'delivery_leadership'));

alter table public.user_profiles
  drop constraint if exists user_profiles_role_seniority_check;

alter table public.user_profiles
  add constraint user_profiles_role_seniority_check
    check (role_seniority is null or role_seniority in ('core', 'senior', 'executive'));

alter table public.user_profiles
  drop constraint if exists user_profiles_workflow_variant_check;

alter table public.user_profiles
  add constraint user_profiles_workflow_variant_check
    check (
      workflow_variant is null
      or workflow_variant in ('leadership_transition', 'technical_leadership_transition', 'delivery_leadership_transition')
    );

create index if not exists user_profiles_role_family_idx on public.user_profiles(role_family);
create index if not exists user_profiles_role_title_idx on public.user_profiles(role_title);
create index if not exists user_profiles_workflow_variant_idx on public.user_profiles(workflow_variant);
