# Interview Prep Persistence Evidence (R-3 follow-up ruling)

Date: 2026-10-21
Repository: Starting Monday
Base: `a12bf6ce` (`simplify/r3-phase2b-folds`, PR #540 — stacked because #540 moved the debrief panel onto this page)
Branch: `simplify/prep-interview-persistence`
Ruling: Rich, 2026-10-21 — "`/prep/interview` is itself an unsaved worksheet… R-3 wire persistence." (Flagged in `docs/evidence/route-collapse-phase2b-2026-10-21.md` §Deferred.)

## Before

`src/app/(dashboard)/prep/interview/page.tsx` at `a12bf6ce`: a `<form className="space-y-8">` with no `action`, nine inputs with `id` but no `name`, a `type="button"` "Save as draft" with no handler, and a `type="submit"` "Save interview prep" that submitted a GET to the same URL. Nothing the user typed was stored anywhere. (`Select-String -Path page.tsx -Pattern 'action=|name="'` → 0 hits.)

## After

- **Table** `public.interview_preps` (migration `187_interview_preps.sql`): `company_name`, `role_title`, `interview_at`, `answers jsonb` (the six worksheet prompts keyed `positioning`, `why_now`, `company_context`, `role_fit`, `objection`, `objection_response`), `status in ('draft','saved')`, owner-scoped RLS on all four verbs, `updated_at` trigger. Same shape and policy style as `meeting_debriefs` (161).
- **Server actions** `saveInterviewPrep` / `deleteInterviewPrep` (`actions.ts`). Both buttons are now submits carrying `name="status"` (`draft` | `saved`). Parsing lives in `interview-prep-form.ts` (pure, unit-tested): trims, caps (200 / 4,000 chars), drops unknown keys and unparseable dates, accepts only UUID ids. An empty worksheet is refused (`?error=empty`). A stale `id` (deleted, or another user's) falls through to an insert rather than losing the work; a DB error returns `?error=save` with the id preserved.
- **Page** loads the user's 20 most recent preps and opens the newest by default (`?id=` selects, `?new=1` starts blank). `InterviewPrepList` shows them with Draft/Saved badges, "New prep" and "Delete this prep". Fields render `defaultValue`s; `datetime-local` values round-trip as UTC-naive regardless of server timezone.
- `database.types.ts` gains the table so the typed client accepts the writes.

## Tests

- `interview-prep-form.test.ts` (5): field parsing, defaults/drops, id validation, caps, date round-trip.
- `actions.test.ts` (7): login redirect, empty refusal, insert path, update scoped without `user_id` in the payload, stale-id fallthrough, save-error redirect, delete.

## Validation (local)

typecheck clean · 463 unit files / 1,789 tests · staged coverage gate (src/app changed files 100% lines, 91% branches) · eslint 0 errors · lint baseline (no file regressed) · docs index · all hook guards (guide freshness, prebuild, untracked-tests, plain-language, first-week-spine, template drift, outreach lint, route guards, mobile-ui gate, luxury static, ux rubric 10/10, dashboard-simplification, public-assets).

## Deploy note

The migration must be applied to the Supabase project before or with the deploy; until then the page renders with an empty list and saves return `?error=save`. Rollback: revert the PR; the table can stay.
