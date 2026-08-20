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

## Founder Approval Record

Approved by Rich Rothschild in Copilot chat on 2026-08-19:

- Word budgets in this document are ratified for the flagged dashboard build.
- Zone 1 state x posture copy below is approved for implementation, subject to the claims manifest and live data guards.

## Ratified Word Budgets

| Surface | Budget |
| --- | ---: |
| Zone 1 card in any state | <=40 words |
| Zone 2 heading and purpose line | <=20 words |
| Per-row rendered text excluding company name | <=25 words |
| Zone 3 strip | <=15 words |
| Purpose line under each zone heading | <=12 words |
| Route total above the fold excluding row data | <=120 words |
| Primary CTAs on route | <=6 |

## Approved Zone 1 State x Posture Copy

Copy rules:

- Operational state wins first; posture only changes verb intensity.
- Every state has exactly one primary CTA.
- Variables such as `{company}`, `{signal}`, `{scanAge}`, `{nextScanDay}`, and `{setupStep}` must come from product-local data.
- If required evidence is missing, render the evidenced quiet state unless stale-data rules apply.

| State | Active search | Exploring / relationship building | Not looking yet | CTA |
| --- | --- | --- | --- | --- |
| Interview or offer due action | `{company} needs attention today. Review the brief and prepare the next conversation.` | `{company} needs a light touch. Review the context before you respond.` | `{company} needs a decision. Review the context before taking any step.` | `Review brief` |
| Stale or unhealthy data | `We have not scanned your companies since {scanAge}. Do not act on stale signals yet.` | `Your watchlist is stale. Wait for the next clean scan before reaching out.` | `Your watchlist is stale. Nothing needs you until scanning is healthy.` | `View scan status` |
| Due follow-up or fresh supported signal | `{company} has a fresh signal: {signal}. Check the brief and decide who to contact.` | `{company} has a fresh signal: {signal}. Consider one relationship touch this week.` | `{company} changed: {signal}. Save the context for later.` | `Get brief` |
| Stalled for 14 days | `Your search has been quiet for 14 days. Pick one company and restart with a brief.` | `Your relationship pipeline has been quiet. Pick one company for a low-pressure touch.` | `Nothing is urgent. If you want to stay warm, pick one company to watch closer.` | `Pick a company` |
| Week One activation need | `Finish {setupStep} so Monday can brief you on the right companies.` | `Finish {setupStep} so your watchlist matches the relationships you want to build.` | `Finish {setupStep} so we only alert you when something matters.` | `Finish setup` |
| Evidenced quiet state | `Nothing new across your {companyCount} companies - last checked {scanAge}. Next scan {nextScanDay}.` | `Nothing needs you today across {companyCount} companies. Next scan {nextScanDay}.` | `Nothing needs you today. Your {companyCount} companies are still being watched.` | `View companies` |

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
- Word budgets: ratified by Rich on 2026-08-19 and recorded above.
- Zone 1 state x posture copy: approved by Rich on 2026-08-19 and recorded above.
- Claims/lexicon/element/product-isolation/A-grade gates: pending implementation after budget ratification.
- Three-zone flagged layout: not implemented.
- Dashboard flag flip: blocked until D-A baseline, new-layout walkthrough evidence, and all product-local gates pass.