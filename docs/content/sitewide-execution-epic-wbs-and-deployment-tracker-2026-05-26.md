# Sitewide Conversion Execution Epic

Date: 2026-05-26
Status: Active
Owner: Founder Office + Product Marketing + Design + Engineering + Growth

## Objective
Apply the same conversion-focused, low-cognitive-load, council-driven approach across all high-impact pages, with strict deployment verification after each ship batch.

This execution epic includes:
1. All landing-page improvements shipped today, including Momentum Signal positioning and reduced-text clarity updates.
2. A sitewide WBS sequence with Mark pages as Ship Lane 1.
3. A deployment tracker with explicit proof-of-live for every batch.

## Included Work From Today's Commits
The following commits are in scope for this epic baseline and are treated as already-shipped execution inputs:

1. 9782125 - Launch Momentum Signal copy, outreach enforcement, and concierge beta UX
2. d2ad84c - Landing copy update and growth automation wiring
3. b512f71 - Strengthen final CTA prominence and rewrite support copy
4. 9e2e3a8 - Clarify final CTA copy and split into two lines
5. 2b0be51 - Split final CTA proof line to isolate live demo clause
6. 781abb8 - Remove duplicate Partners label from landing nav
7. 156ad49 - Make footer role-path section more prominent
8. f7752c8 - Balance footer role-path buttons for scanability

Supporting reliability/gate commits from today are also included as operational enablers:
1. 96a6b5c - Fix concierge suspense boundary for production build
2. 32d9eb8 - Sync lockfile for Railway npm ci deploy
3. 1a526fb - Refresh growth gate audit timestamps

## Scope
### In scope
1. Main marketing and conversion pages.
2. Mark review pages and Mark meeting prep assets.
3. Persona pages and partner pages linked from landing paths.
4. Strict council and metrics gate enforcement for production-bound changes.
5. Live deploy verification after each merged batch.

### Out of scope (this epic)
1. Core dashboard feature expansion not required for conversion clarity.
2. Non-conversion admin surfaces except where instrumentation or trust proof is required.

## WBS (Sitewide)
### Lane 0 - Baseline already shipped (completed today)
WBS-0.1 - Landing-page text compression and CTA clarity (completed)
WBS-0.2 - Momentum Signal narrative introduction (completed)
WBS-0.3 - Footer role-path prominence and scanability rebalance (completed)
WBS-0.4 - Growth gate and deploy hygiene updates (completed)

### Lane 1 - Mark pages first (next ship lane)
WBS-1.1 - Revamp src/app/mark-review/page.tsx for decision speed and hierarchy
WBS-1.2 - Revamp src/app/mark-review/summary/page.tsx for concise meeting narrative
WBS-1.3 - Align Mark pages to landing framing (Momentum Signal, cadence clarity, proof discipline)
WBS-1.4 - Add explicit loop-closure KPI block (signal -> outreach -> follow-up -> conversation)
WBS-1.5 - Add final pre-meeting QA checklist and publish readiness note

Acceptance for Lane 1:
1. Mark pages score Ship in synthetic council review.
2. Mobile and desktop readability pass.
3. Metrics instrumentation present for key CTA/engagement actions.
4. Railway deploy SUCCESS plus live page verification complete.

### Lane 2 - Main funnel and route continuity
WBS-2.1 - Align src/components/LandingPage.tsx and src/app/page.tsx hierarchy to final council-approved narrative
WBS-2.2 - Tighten route handoff copy for /signup, /concierge, /pricing
WBS-2.3 - Ensure role-path modules route clearly to persona pages
WBS-2.4 - Remove any duplicated or conflicting nomenclature across top sections

### Lane 3 - Persona and partner pages
WBS-3.1 - Refresh primary persona pages (for-vp, for-cio, for-ciso, for-pe-partners, for-search-firms)
WBS-3.2 - Standardize section architecture and proof order on partner pages
WBS-3.3 - Add consistent CTA and safety-language blocks where confidentiality objection appears
WBS-3.4 - Verify cross-link discoverability from landing and footer role-path grid

### Lane 4 - Trust, governance, and operating loop visibility
WBS-4.1 - Update security/trust copy paths to match current governance posture
WBS-4.2 - Ensure weekly growth council outputs remain fresh and linked to decision log
WBS-4.3 - Add release-note artifact for each batch: what changed, expected KPI impact, rollback trigger

## Deployment Tracker
Status legend: Planned, In Progress, Deployed, Verified Live, Blocked

| Lane | Batch focus | Key WBS | Commit(s) | Railway deployment | Status | Live verification | Owner |
|---|---|---|---|---|---|---|---|
| Lane 0 | Landing baseline and Momentum Signal updates | WBS-0.1 to WBS-0.4 | 9782125, d2ad84c, b512f71, 9e2e3a8, 2b0be51, 781abb8, 156ad49, f7752c8 | dba6eb5d-d47a-48be-82cd-f0b15844b447 | Verified Live | Main landing confirms reduced text, CTA clarity, and balanced role-path block | Product + Eng |
| Lane 1 | Mark pages revamp (first ship lane) | WBS-1.1 to WBS-1.5 | e268a32, e5e8887, a6f5d36 | 50745548-c9cc-40b8-abac-3972b7ab059c | Verified Live | Mark brief and summary deployed; tracker and lane status synced | Product Marketing + Design + Eng |
| Lane 2 | Main funnel continuity | WBS-2.1 to WBS-2.4 | fe242ff, 0e403b0 | c8e884cd-e126-4353-85e4-ed90b68cede2, 74479d1d-ed22-4cce-a926-4f7f139eeda8 | Verified Live | Source-aware handoff continuity live across landing, pricing, concierge, signup, and demo | Product Marketing + Eng |
| Lane 3 | Persona and partner standardization | WBS-3.1 to WBS-3.4 | 8f26468 (+ WBS-3.4 enforceability follow-ups) | a43f8907-9376-492f-ab8a-e193c20bc63b, 403a1065-a084-4246-969b-9d648e2ecd46 | Verified Live | Live-route verification recorded for /for-vp, /for-cio, /for-ciso, /for-pe-partners, and /search-firms with footer-path discoverability checks in production | Design + Eng |
| Lane 4 | Trust/governance visibility | WBS-4.1 to WBS-4.3 | 8f26468 + release note artifact + gate-enforcement follow-ups | a43f8907-9376-492f-ab8a-e193c20bc63b, 403a1065-a084-4246-969b-9d648e2ecd46 | Verified Live | Governance/trust copy paths and strict release-note linkage verified live in production across security/trust surfaces and enforced in strict gate bundle | Growth + Eng |

## Required Batch Gate (No Exceptions)
Before any production-bound push in this epic:
1. Growth synthetic council strict audit passes.
2. Growth strict metrics gate passes.
3. Typecheck and build pass.
4. Instrumentation smoke checks pass for touched conversion events.
5. Deployment reaches Railway SUCCESS.
6. Live-page verification is recorded in this tracker.

## Latest verification note (2026-06-18)

1. WBS-3.4 is now enforced in code, not just visually reviewed.
2. Homepage footer role-path grid now exposes direct discoverability links for /for-cio, /for-vp-technology, /for-ciso, /for-pe-partners, and /search-firms.
3. Regression coverage added to `npm run ux:rubric:pages` so landing/footer discoverability failures block the homepage contract check.
4. WBS-4.1 now enforces governance-path consistency across public trust surfaces.
5. `npm run marketing:trust-proof:gate` now checks the shared security page plus coach and outplacement trust packs for required governance and security markers.
6. WBS-4.2 now enforces weekly growth artifact freshness and decision-log linkage.
7. `npm run growth:weekly-outputs:strict` verifies the latest metrics export is fresh, the weekly readout matches the current reporting week, and the readout and decision log explicitly link to each other.
8. WBS-4.3 now enforces a current release-note artifact with required sections for what changed, expected KPI impact, and rollback triggers.
9. `npm run release:sitewide-note:strict` now blocks when the sitewide release note is missing, stale, structurally incomplete, or not referenced in the tracker.

### Gate verification snapshot (2026-06-18)

Latest consolidated run status:
1. PASS - `npm run growth:council:strict`
2. PASS - `npm run growth:metrics:strict`
3. PASS - `npm run growth:weekly-outputs:strict`
4. PASS - `npm run release:sitewide-note:strict` (after restoring explicit tracker reference to `docs/content/release-note-2026-07-03-sitewide-execution-epic.md`; current note: `docs/content/release-note-2026-07-17-sitewide-execution-epic.md`)
5. PASS - `npm run marketing:trust-proof:gate`
6. PASS - `npm run ux:rubric:pages`
7. PASS - `npm run ux:quality:all-pages`
8. PASS - `npm run typecheck`

Notes:
1. `ux:quality:all-pages` passed end-to-end.
2. Cognitive findings remain reported in monitor mode within that bundle and are tracked as backlog, not current-blocking failures.
3. Lane 3 and Lane 4 are now closed as Verified Live after explicit route checks on production and latest deployment success recording.
4. Live-route verification evidence captured for Lane 3 routes (`/for-vp`, `/for-cio`, `/for-ciso`, `/for-pe-partners`, `/search-firms`) and Lane 4 trust/governance surfaces (`/security`, `/for-coaches/trust-pack`, `/for-outplacement/trust-pack`).
5. Weekly operating-cadence guardrail cycle rerun on 2026-06-18 passed for `growth:council:strict`, `growth:metrics:strict`, `growth:weekly-outputs:strict`, `release:sitewide-note:strict`, and `marketing:trust-proof:gate`.
6. Current sitewide release note artifact: `docs/content/release-note-2026-08-27-sitewide-execution-epic.md`.

## Weekly Operating Rhythm For This Epic
1. Monday: pick top two WBS items by impact and meeting urgency.
2. Wednesday: launch readiness review and instrumentation check.
3. Friday: readout with Ship, Iterate, or Kill decision per batch.

## Risks and Mitigations
1. Risk: Scope sprawl across too many pages at once.
   Mitigation: Ship lane batching with hard WIP limits (one lane active, one queued).
2. Risk: Copy drift between landing and downstream persona pages.
   Mitigation: Lane 2 narrative lock before Lane 3 edits begin.
3. Risk: Deploy lag mistaken for missing code.
   Mitigation: Railway SUCCESS and live verification both required before marking complete.

## Definition of Done (Epic)
1. Lane 1 (Mark pages) deployed and verified live first.
2. All planned lanes deployed with tracker rows updated to Verified Live.
3. Weekly council/metrics artifacts stay current throughout execution.
4. No production-bound conversion change ships without strict gate pass.