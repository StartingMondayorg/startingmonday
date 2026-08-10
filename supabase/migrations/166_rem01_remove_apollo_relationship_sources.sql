-- REM-01: remove Apollo as an allowed runtime source in relationship-layer tables.
-- This keeps source policy aligned to MSPS-003 and fail-closed runtime behavior.

-- Normalize any legacy Apollo-tagged rows before tightening constraints.
update public.people set source_primary = 'other' where source_primary = 'apollo';
update public.person_sources set source_type = 'other' where source_type = 'apollo';
update public.contact_people set source = 'other' where source = 'apollo';
update public.company_people_candidates set source = 'other' where source = 'apollo';

-- Tighten allowed source values and defaults.
alter table public.people
  alter column source_primary set default 'manual';

alter table public.people
  drop constraint if exists people_source_primary_check;

alter table public.people
  add constraint people_source_primary_check
  check (source_primary in ('manual', 'public_web', 'other'));

alter table public.person_sources
  drop constraint if exists person_sources_source_type_check;

alter table public.person_sources
  add constraint person_sources_source_type_check
  check (source_type in ('public_web', 'manual', 'other'));

alter table public.contact_people
  drop constraint if exists contact_people_source_check;

alter table public.contact_people
  add constraint contact_people_source_check
  check (source in ('manual', 'public_web', 'other'));

alter table public.company_people_candidates
  alter column source set default 'manual';

alter table public.company_people_candidates
  drop constraint if exists company_people_candidates_source_check;

alter table public.company_people_candidates
  add constraint company_people_candidates_source_check
  check (source in ('public_web', 'manual', 'other'));
