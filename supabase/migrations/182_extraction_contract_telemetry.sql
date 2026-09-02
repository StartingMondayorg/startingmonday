-- SMK-489 / WS2-15: extraction contract telemetry and the extraction-failure
-- outcome.
--
-- 1. Text-shape telemetry: chars, line count and max line length of the text a
--    scan extracted, persisted per scan so the collapsed-extraction failure
--    class (rendered or minified pages fusing into one unreadable line) stays
--    permanently measurable. Additive and nullable: existing rows keep NULL and
--    nothing gates on these columns.
--
-- 2. New scan_results.status value 'extraction_failed': the scan acquired page
--    content but extraction produced a degenerate shape that role detection
--    cannot read. Recording those scans as 'success' with zero hits is what
--    hid the failure class (138 of 142 successful render scans in the 14 days
--    before 2026-09-01 detected zero candidates).
--
-- Constraint drift, verified 2026-09-01 against both instances: production has
-- check constraint scan_results_status_check allowing
-- ('success','no_change','error','blocked') that appears in no migration file;
-- staging has no check constraint on scan_results.status at all. This
-- migration normalizes both instances to the same constraint, widened with
-- 'extraction_failed'. Staging scan_results.status values were verified to all
-- be 'success' before writing this, so validation will pass there.
--
-- 3. live_brief_scan_companies acquisition telemetry: the live-brief scan
--    writer recorded no acquisition_path (131 scans across 109 companies in
--    the 14 days before 2026-09-01 were invisible to path analysis).

alter table public.scan_results
  add column if not exists extracted_chars          integer,
  add column if not exists extracted_line_count     integer,
  add column if not exists extracted_max_line_chars integer;

comment on column public.scan_results.extracted_chars is
  'Total characters of extracted text handed to role detection. NULL for rows written before SMK-489 and for blocked/error rows that never acquired text.';
comment on column public.scan_results.extracted_line_count is
  'Line count of extracted text. Role detection reads per line, so 1 line with thousands of chars means the page collapsed (SMK-489).';
comment on column public.scan_results.extracted_max_line_chars is
  'Length of the longest extracted line. Detection skips lines over 120 chars; a dominant long line is the degenerate-extraction signature.';

alter table public.scan_results
  drop constraint if exists scan_results_status_check;
alter table public.scan_results
  add constraint scan_results_status_check
  check (status in ('success', 'no_change', 'error', 'blocked', 'extraction_failed'));

comment on column public.scan_results.status is
  'success | no_change | error | blocked | extraction_failed. extraction_failed (SMK-489): content was acquired but could not be parsed into readable lines, so the scan carries no verdict on open roles.';

alter table public.live_brief_scan_companies
  add column if not exists acquisition_path text,
  add column if not exists render_ms        integer;

comment on column public.live_brief_scan_companies.acquisition_path is
  'How job text was obtained: ats_feed | direct_fetch | render. NULL for rows written before SMK-489 and for outcomes that never acquired text.';
comment on column public.live_brief_scan_companies.render_ms is
  'Wall-clock duration of the browserless.io call in milliseconds. NULL unless acquisition_path is render.';

-- Supports zero-candidate-rate-by-path and shape-distribution reporting
-- without scanning the whole table.
create index if not exists scan_results_status_scanned_at_idx
  on public.scan_results (status, scanned_at desc);
