# Dashboard Simplification Baseline

Date: 2026-08-19
Scope: Starting Monday `/dashboard`
Source file: `src/app/(dashboard)/dashboard/page.tsx`
Governing brief: `docs/strategy/sol-dashboard-simplification-brief-2026-08-19.md`
Status: source baseline recorded; observational baseline still required before flag flip

## Measured Source Baseline

Measured from the current route source on `e1a2eff52d7d424476025488c7412615d503d49a`.

| Metric | Count |
| --- | ---: |
| Source lines | 1,717 |
| Section-like JSX surfaces | 24 |
| `<Button>` instances | 3 |
| `<Link>` instances | 9 |
| On-demand action button instances | 2 |
| Form action candidates | 0 |
| CTA/action candidates | 14 |
| Literal string word count | 1,113 |

Method: deterministic source scan of the dashboard route for JSX surfaces, action components, and literal strings. This is a code baseline, not a user-observed rendered DOM count.

## Current A-Grade Contract Map

| Contract | Current baseline | Three-zone implication |
| --- | --- | --- |
| Signal parity | Existing dashboard, briefing, and signals route parity remains governed by `tests/e2e/dashboard-contract-consistency.spec.ts`. | Three-zone layout must keep counts consistent with briefing/signals for the same session and filters. |
| Relative-time trust | Existing route uses shared recency helpers plus stale-copy guards. | Zone 1 quiet/stale states must use deterministic scan timestamps and shared relative labels. |
| Chrome and metadata | Existing route keeps dashboard shell conventions and `Dashboard - Starting Monday` metadata pattern through current tests. | Three-zone route must preserve chrome and metadata; `/dashboard/progress` must follow the same pattern. |
| Landmark | Existing tests enforce one main landmark across dashboard routes. | New layout must keep exactly one `main` in loading, hidden, empty, and error states. |
| Cognitive fluency/load | Current source baseline shows 24 section-like surfaces and 14 action candidates. | G-3 budget must reduce the route to three zones and no more than the ratified CTA budget. |
| Trust integrity | Existing route includes many advisory/status panels and internal intelligence surfaces. | Internal scoring, mode, tier, and provenance implementation labels must not render to users. |
| Hidden-tier consistency | Existing feature access remains subscription/role gated. | Three-zone UI must not reveal unavailable tier surfaces or MandateSignal variants. |

## Human Evidence Still Required

D-A from the Sol brief is not complete. Before any dashboard simplification flag flip, run 3-5 actual executive walkthroughs on the current dashboard cold, screen-shared, and without narration. Record verbatim:

- what each user thinks the page wants them to do;
- where each user stalls;
- whether the user posture is active, exploring, or not-looking;
- time to first action, if any; and
- whether the user can explain the company -> people-to-know -> angle loop.

This baseline cannot be reconstructed from code and cannot be replaced by automated tests.

## Gate State

- Prep-brief internal-text leak: fixed in `src/lib/prep/prep-confidence.ts` and guarded by `src/lib/prep/prep-confidence.test.ts`.
- Word budgets: pending Rich ratification from this measured baseline.
- Claims/lexicon/element/product-isolation/A-grade gates: pending implementation after budget ratification.
- Three-zone flagged layout: not implemented.
- Dashboard flag flip: blocked until D-A baseline, new-layout walkthrough evidence, and all product-local gates pass.