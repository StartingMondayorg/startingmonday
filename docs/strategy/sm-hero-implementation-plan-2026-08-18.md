# Starting Monday Hero Evidence Surface Implementation Plan

Date: 2026-08-18
Source brief: `docs/inbox/sm-hero-implementation-brief-2026-08-16.md`
Status: Plan only; no application implementation authorized by this document

## Executive Analysis

Implement Version A from the archived brief using one typed content source shared by the homepage and `/example`. Keep the new surface behind a default-off Starting Monday flag, preserve all below-hero content, and leave MandateSignal, Manager Tools, route-deprecation work, and Cody/Mo documents untouched.

The approved copy does not close G-SM-1 or G-SM-2. The proof instance and `/example` closing claim remain blocked on Rich. The phrase "unchanged destination" is ambiguous because the homepage currently has no hero CTA block; use `/signup`, matching current navigation and below-fold Get access links. The required `/example` route is the sole permitted extension to the hero-only scope.

An HTML card cannot have native `alt` text. Use a semantic `<figure>` with the exact screen-reader-only caption. Do not reproduce the shape example's dash as literal copy. Render title and descriptor as separate elements. Prefer real dates; shifted dates require explicit Rich approval and disclosure.

## Governance and Gates

- The substantive founder rules are evidence-only marketing language, no person-level expansion, no em/en dashes in rendered copy, and Starting Monday-only telemetry. The brief's D9, D15, and D19 labels are treated as founder-approved surface rules, not canonical decision IDs.
- Canonical authority remains the Starting Monday signal-engine plan. `DG-09` and `WS7-08` require Starting Monday customer exposure to remain feature-controlled after shadow, UX, accessibility, privacy, and telemetry gates.
- **G-SM-1:** Omit `Free during pilot.` by default. The current page says `Free for 30 days. No credit card.`, which is insufficient proof for the broader microcopy. Add it only after dated Rich confirmation that it is true for current new signups.
- **G-SM-2:** Blocks the public proof surface. Rich must approve a real anonymized SM-owned case or a mock with visible `Illustrative example`. Rich must separately approve or replace the generalized `usually appear weeks before` closing line.
- **Landing approval:** Preserve the landing-page guard. Apply the approved PR label or CI variable after the content case and copy are complete.
- No MandateSignal data, assets, runtime, or analytics may be reused.

## Local Hypothesis and Falsification Check

A centralized typed contract, one reusable server-rendered timeline card, and one minimal page-view telemetry component can replace only the Starting Monday root hero and power `/example` without changing shared-brand routes or below-fold output.

Falsification check:

- Flag off: current stock hero remains and `/example` returns 404.
- Flag on: exact approved copy renders; shared card appears on both routes; mobile order is copy, card, CTAs, privacy; below-fold `homepage_how_it_works` remains unchanged.
- MandateSignal hosts never render the Starting Monday proof surface.
- No request is sent to `/api/events/channel-funnel` for these new events.

## Architecture and Data Flow

- `STARTING_MONDAY_HERO_CONTENT` owns all hero/example strings, metadata, CTA labels, accessibility copy, proof fields, contexts, content version, and optional pilot microcopy.
- `SignalTimelineCard` accepts the typed case and `compact | expanded`, rendering semantic dates, factual list rows, source classes, status, disclosures, and caption.
- `src/app/(marketing)/page.tsx` resolves brand and flag, supplies the contract only to Starting Monday, and retains current MandateSignal data.
- `src/app/components/LandingPage.tsx` receives an optional Starting Monday evidence-hero prop. A localized grid keeps desktop copy/actions left and card right, with mobile order copy, card, CTAs, privacy.
- `/example` awaits `headers()`, resolves the host, and calls `notFound()` when disabled or served on a MandateSignal host.
- Preserve `FirstMileTelemetry.tsx` and existing `homepage_viewed`. Add the five brief events without replacing existing metrics.
- Use `TrackLink.tsx` without `logToUserEvents` for the new events. Add a view component that emits page-view events once per mount. Do not create or restore the missing `/api/events/channel-funnel` route or persist anonymous events to `user_events`.
- Conditionally include `/example` in `src/app/sitemap.ts`.

## Exact Change Matrix

| File | Planned change |
| --- | --- |
| `docs/evidence/sm-hero-proof-case-adjudication-2026-08-XX.md` | Record G-SM-1/G-SM-2 evidence, rendered instance, rights/privacy review, closing-line decision, and Rich approval. |
| `.env.example`, `src/lib/feature-flags.ts`, new flag test | Add default-off `NEXT_PUBLIC_SM_HERO_EVIDENCE_ENABLED`. |
| `src/lib/starting-monday-hero-content.ts` and test | Central content contract and narrowly scoped rendered-string lint. |
| `src/lib/channel-metrics-events.ts` and test | Add separate typed `HERO_EVENT_NAMES` vocabulary. |
| `src/app/components/SignalTimelineCard.tsx` | Shared compact/expanded accessible proof card. |
| `src/app/components/HeroPageViewTelemetry.tsx` | PostHog-only, once-per-mount view capture. |
| `src/app/(marketing)/page.tsx` | Starting Monday-only hero, metadata, JSON-LD, flag, and brand integration. |
| `src/app/components/LandingPage.tsx` | Localized hero layout, two CTAs, privacy strip, and reserved card space. |
| `src/app/(marketing)/example/page.tsx` | Flag/host-gated route, expanded card, approved closing line, and `/signup` CTA. |
| `src/app/sitemap.ts` | Conditional route plus homepage/example release dates. |
| `scripts/check-landing-page-change-approval.mjs` | Include the centralized source, card, example route, and existing landing files in guarded scope. |
| `scripts/check-key-funnel-copy-cta-drift.mjs` | Replace the obsolete `Reputation opens doors. Timing decides outcomes.` requirement with the approved contract and CTA rules. |
| `tests/e2e/accessibility-tier0.spec.ts` | Add `/example` to serious/critical WCAG checks. |
| `tests/e2e/landing-hero.spec.ts` and snapshots | Exact copy, navigation, host isolation, mobile order, focus, overflow, CLS, desktop/mobile visuals. |

Do not modify `TrackLink.tsx`, `FirstMileTelemetry.tsx`, below-fold components, the stock asset bytes, or unrelated route-deprecation/Cody/Mo files unless a concrete implementation blocker is demonstrated.

## Phased Implementation

1. Capture scoped git status/diff and complete G-SM-2 adjudication. Stop on unresolved evidence, rights, anonymization, privacy, or closing-copy questions.
2. Add the default-off flag, centralized contract, event taxonomy, content lint, and both updated guards.
3. Build the reusable card and page-view emitter. Run focused unit tests and guard validation.
4. Integrate only the Starting Monday homepage branch. Verify MandateSignal, Manager Tools, and below-fold output remain unchanged.
5. Add host/flag-gated `/example`, route metadata, canonical URL, and conditional sitemap entry.
6. Add functional, accessibility, CLS, and visual tests. Capture controlled staging PostHog evidence.
7. Deploy flag off, validate rollback, enable in staging, obtain `WS7-08` promotion approval, then enable production.

## Copy Lint

The lint must recursively inspect only exported renderable content values from the centralized content contract used by both pages. It must reject:

- U+2013 and U+2014;
- `likely`, `predict`, `prediction`, `probability`, `chance`, `odds`, `score`, `scored`, `guarantee`, and `guaranteed` case-insensitively;
- `%` adjacent to signal, role, or outcome nouns;
- `AI-powered`;
- `decision-makers`; and
- `map of the people`.

Regex literals and test descriptions remain outside the scanned object. Unrelated site copy is out of scope. The test must assert that required approved strings are present and that optional pilot microcopy is absent until G-SM-1 is recorded.

## Acceptance Evidence

| Criterion | Evidence |
| --- | --- |
| AC1 | Exact centralized-copy assertions, content lint, drift guard, and rendered Playwright assertions. |
| AC2 | Stock image absent from the SM hero, selectable semantic text, exact caption, AA contrast, and axe pass. |
| AC3 | Logged-out `/example`, shared component/content version, `/signup` navigation, and MandateSignal 404. |
| AC4 | Microcopy absent without approval; mock label visible when selected; adjudication record names the chosen branch. |
| AC5 | Mobile locator bounding boxes prove order; CLS at or below 0.1; no overlap or overflow. |
| AC6 | Typed event tests, once-per-render/action checks, staging PostHog readback, and no channel-funnel request. |

## Focused Validation

Run, in order:

1. The three focused Vitest files for content, event taxonomy, and flag behavior.
2. `npm run guard:copy-cta-drift`.
3. Explicitly approved `npm run guard:landing-page-approval`.
4. Scoped ESLint and `npm run typecheck`.
5. `npm run build`.
6. Local production build with flag enabled: new landing test under `--project=smoke` and the tier-zero accessibility project.
7. `npm run check:pr`, applicable staging standards, and final scoped status/diff.

Before implementation, read the installed Next.js guides under `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `14-metadata-and-og-images.md`, and `15-route-handlers.md`.

## Rollout and Rollback

Deploy production with the flag off. Flag-on staging must prove desktop/mobile presentation, keyboard and screen-reader behavior, metadata/canonical/sitemap correctness, host isolation, and all five PostHog events.

Rollback is flag disable plus redeploy: the current homepage returns and `/example` disappears from serving and sitemap. Preserve evidence and telemetry. Use code rollback only if flag-off behavior is defective.

Completion evidence consists of the approved adjudication record, implementation SHA/scoped diff, test outputs, screenshots, axe/zoom/keyboard/CLS report, host/flag route matrix, PostHog readback, sitemap/metadata inspection, `WS7-08` promotion decision, and production rollback proof. Update the canonical evidence index only if Rich accepts this as formal `WS7-08` promotion evidence.

## Risks

- G-SM-1 can be incorrectly inferred from the existing 30-day trial copy. Default omission avoids that claim.
- A single anonymized case cannot substantiate `usually appear weeks before`; require held examples or replacement copy.
- The current `TrackLink` caller references a missing `/api/events/channel-funnel`; adding that route would expand scope and anonymous persistence. Use PostHog-only for this surface unless a separate approved telemetry decision changes it.
- The existing landing and copy-drift guards will fail or block until their approved contract is updated.
- Existing uncommitted route-deprecation, Cody, and Mo work must remain separate and unbundled.
