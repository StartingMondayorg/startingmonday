-- SMK-476 / WS2-15: record how each scan acquired its job text.
--
-- Today scan_results says whether a scan succeeded but not how, so the render
-- budget cannot be measured. Worse, the browserless counter in scan-job.js
-- increments for every scan that is not skipped or blocked -- including scans
-- served from an ATS JSON feed and scans served by a plain HTTP fetch, neither
-- of which opens a browser. Recorded usage is therefore not a render count.
--
-- Additive and nullable: existing rows keep NULL, and nothing reads these
-- columns until the reporting query is written. No backfill is possible, since
-- the path was never recorded.

alter table scan_results
  add column if not exists acquisition_path text,
  add column if not exists ats_provider     text,
  add column if not exists render_ms        integer;

comment on column scan_results.acquisition_path is
  'How job text was obtained: ats_feed | direct_fetch | render. NULL for rows written before SMK-476, and for blocked/error rows that never acquired text.';
comment on column scan_results.ats_provider is
  'ATS adapter that served the feed (greenhouse, lever, smartrecruiters, bamboohr, workday). NULL when acquisition_path is not ats_feed.';
comment on column scan_results.render_ms is
  'Wall-clock duration of the browserless.io call in milliseconds. NULL unless acquisition_path is render. A browserless.io unit is 30s of browser time, so this is what makes unit spend measurable.';

-- Supports "render volume per cycle" and "acquisition mix over time" without
-- scanning the whole table.
create index if not exists scan_results_acquisition_path_scanned_at_idx
  on scan_results (acquisition_path, scanned_at desc)
  where acquisition_path is not null;
