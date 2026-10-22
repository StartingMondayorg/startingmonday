# Onboarding 9 → 3 Evidence (R-4)

Date: 2026-10-21
Repository: Starting Monday
Base: `93b8e53e` (branch `simplify/r3-phase2-folds`, PR #537 — stacked because #537 already touched `onboarding/actions.ts`)
Implementation branch: `simplify/r4-onboarding-three-steps`
Ruling: R-4 default (Rich, 2026-10-21). Packet: `docs/strategy/sm-rulings-packet-r3-r4-r6-2026-10-21.md`.

## Before

`onboarding-form.tsx` was 1,842 lines with nine screens (0–8): name, LinkedIn/PDF import, role lane, companies, situation/posture, briefing time, relationship-enrichment panel, context (locations/sectors/comp/positioning), done + scan panel. A quick/advanced fork jumped 3 → 6 for most users, skipping situation/posture and briefing time — so the posture question the 2026-08-19 brief made load-bearing (R-2) was never asked of quick-path users, and the dashboard inferred posture from `search_path`.

## After

Three screens, one path, no fork (`onboarding-form.tsx`, 309 lines + four step files):

| Screen | Collects | Required to continue |
| --- | --- | --- |
| 1 | Role lane(s) (`StepLevel`) **and** posture (`StepPosture`: actively searching / building relationships / not looking yet) | at least one lane and a posture |
| 2 | Target companies (`StepCompanies`, unchanged: typed names, persona suggestions, AI discovery). The first career-page scan starts on Continue. | at least one company |
| 3 | Briefing time (`StepBriefingTime`, default 07:00 local, one tap to change) with the setup/check-in email switch | — ; submit → `/dashboard` |

Dropped from onboarding: name (derived from the auth identity — `user_metadata.full_name`/`name`, else the email local part), import, situation details (employment status, timeline, driver), relationship-enrichment panel with inline add-contact, context screen, first-value preview, `lowEnergyMode`, `advancedSetup`. Import and context live on `/dashboard/profile`; Zone 1 carries "Finish setup" until activation completes.

## Data and dashboard changes

- `search_posture` is set explicitly for every new user. `completeOnboarding` maps it to `search_path` (`active → campaign`, otherwise `watcher`); the legacy employment/timeline inference remains only for drafts that still carry those fields.
- The dashboard now resolves Zone 1 posture from `user_profiles.search_posture` first and falls back to `search_path` for accounts onboarded before the question was asked.
- `normalizeOnboardingDraft` no longer infers a posture into the form draft; the form requires a choice.
- `ONBOARDING_FINAL_STEP` is 2. A step saved by the retired flow (e.g. 6) is clamped to the last screen on resume.

## Files

- Deleted: `onboarding-context-step.tsx`, `onboarding-done-step.tsx`, `relationship-progress-panel.tsx`, `scan-progress-panel.tsx` (716 lines).
- Added: `steps/step-level.tsx`, `steps/step-posture.tsx`, `steps/step-companies.tsx`, `steps/step-briefing-time.tsx` (extracted verbatim from the old form where kept).
- `onboarding-flow.json` (recorded flow document) updated to the three screens.
- Helpers left in place but now unreferenced outside their tests: `estimateManualFieldReduction`, `seededCompaniesFor`, `resolveDashboardSearchPosture`, `decisionRoleTargetsForCompany`, `firstNoteDraftForCompany`, `followUpSequenceForWeekOne`. Candidates for a later dead-code pass.

## Tests

- `onboarding-state.test.ts`: resume clamps to screen 3; no inferred posture in drafts.
- `actions.test.ts`: name derived from identity metadata and from the email local part; posture → search path; final step 2.
- `page.test.ts` (dashboard): stored posture wins over search path; garbage values fall through.
- `tests/e2e/onboarding-live.spec.ts` (production synthetic): drives screen one (lane + posture), reaches screen two, skips, and asserts the three-zone dashboard. **This probe will fail against production until production is promoted**; it is correct for the code on `main`.

## Validation (local)

```text
npm run typecheck                                   # clean
npx vitest run src/lib/onboarding src/app/onboarding "src/app/(dashboard)/dashboard/page.test.ts"   # 13 files, 52 tests
node scripts/check-lint-baseline.mjs                # passed
npx tsx scripts/eval-guide-retrieval.ts --strict    # recall@3 84%
guards: guide freshness, prebuild, untracked-tests, plain-language, first-week-spine,
        template drift, outreach lint, route guards, mobile-ui gate, luxury static,
        ux:rubric:pages, dashboard-simplification                   # all pass
```

Full unit suite and staged coverage are in the commit message; hosted build and the onboarding-live synthetic come from CI.

## Rollback

Revert the PR. Drafts saved by the new flow carry the same `OnboardingDraft` shape, so the old form would resume them.
