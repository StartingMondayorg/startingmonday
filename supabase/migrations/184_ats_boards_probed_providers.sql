-- 184: SMK-486 - record which provider set an ats_boards decision was made
-- against. The prober's provider list widened from three providers
-- (greenhouse, lever, ashby) to the scanner adapter set of six (adding
-- smartrecruiters, bamboohr, workday). A not_found decided against a
-- narrower set than the prober currently searches gets exactly one re-probe;
-- recording the set makes future widenings re-probe only the rows that need it.

alter table public.ats_boards
  add column if not exists probed_providers text[];

comment on column public.ats_boards.probed_providers is
  'Provider set the last probe searched. For status=not_found this is the set the decision was decided against; null means the row predates recording. The poller re-probes a not_found row exactly once when this set is narrower than the current probe list (SMK-486).';

-- Existing not_found rows were decided against the original three-provider
-- prober. Recording that set is both historically accurate and what marks
-- them for their one re-probe under the widened list.
update public.ats_boards
  set probed_providers = array['greenhouse', 'lever', 'ashby']
  where status = 'not_found'
    and probed_providers is null;
