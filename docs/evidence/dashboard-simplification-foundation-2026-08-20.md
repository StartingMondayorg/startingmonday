# Dashboard Simplification Foundation Evidence

Date: 2026-08-20
Repository: Starting Monday
Baseline commit: `ae7926f5` (`origin/main`)
Implementation branch: `dashboard-simplification-foundation-20260820`

## Scope and governing controls

This evidence covers the pre-rollout foundation for the three-zone dashboard.

- Governing stories: `WS7-03` Evidence rendering contract, `WS7-04` Flagged lead surfaces, and `WS7-08` Product promotion gate.
- Governing decision: `DG-09` Starting Monday customer exposure. The feature remains a default-off cohort flag until shadow, UX, release, privacy, performance, and telemetry gates pass.
- Product boundary: Starting Monday only. No MandateSignal package, data, host, runtime, deployment, or release dependency was added.
- Rollback: `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED` remains off. When enabled for a later cohort, disabling it restores the legacy dashboard immediately.

## Measured baseline

Command:

```powershell
$file='src/app/(dashboard)/dashboard/page.tsx'
$source=Get-Content -Raw -LiteralPath $file
[pscustomobject]@{
  Lines=(Get-Content -LiteralPath $file).Count
  SectionTags=([regex]::Matches($source,'<section\b')).Count
  ButtonOrLinkTags=([regex]::Matches($source,'<Button\b|<Link\b')).Count
}
```

Result at `ae7926f5`:

| Measure | Value | Notes |
| --- | ---: | --- |
| Source lines | 2,037 | Includes both legacy and default-off flagged layout branches. |
| `<section>` tags | 7 | Source count, not a rendered-layout claim. |
| `<Button>` or `<Link>` tags | 22 | Source count, not a rendered primary-CTA count. |

The three-zone branch is assessed separately through rendered-layout/browser evidence before any flag change. These source measurements must not be presented as the original dashboard's rendered 17-section or CTA count.

## A-grade contract map

| Contract | Three-zone control | Evidence state |
| --- | --- | --- |
| Signal parity | Zone 2 derives the latest company signal from the same dashboard signal collection; cross-route parity remains a pre-flip browser/API gate. | Pending pre-flip verification |
| Relative-time trust | `formatDashboardSignalAge` provides deterministic `today`/`N day(s) ago` labels. | Unit-covered in dashboard page tests |
| Chrome and metadata | The flagged layout retains the dashboard shell, with `Progress`, sign-out, and one main landmark. | Build/typecheck evidence; browser verification pending |
| Single main landmark | Flagged and legacy branches each render one `<main>`. | Source inspection; browser verification pending |
| Cognitive fluency/load | Flagged layout is one next move, company/people/angle rows, and one weekly strip. | Flagged UI exists; user evaluation intentionally not run |
| Trust integrity | Prep confidence uses a user-safe formatter; internal scoring phrases are blocked by CLR-8. | Focused unit and lexicon gate pass |
| Hidden-tier consistency | Feature flag remains default-off and legacy remains authoritative. | Feature-flag unit coverage exists; rollout remains blocked |

## Authenticated flagged-layout parity

Verified locally against the final production build with `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED=true` set only in the local test process. The repository and hosted environments remain default-off.

```text
npm run test:e2e:dashboard-simplification
```

Result: 4/4 Playwright checks passed with a real authenticated session:

- Desktop: three zones, one main landmark, `Progress`/sign-out chrome, no serious or critical axe violations, no internal scoring or stale free-text relative-time leakage.
- Signal parity: the Zone 3 numeric signal count matched `/dashboard/signals` for the authenticated account.
- Mobile at 390x844: three-zone contracts and axe checks passed with no horizontal document overflow.
- Route states: dashboard and signals loading boundaries now provide one main landmark; error boundaries provide one main either directly or through the shared `RouteError` renderer. The static gate has a planted missing-main regression.

## Implemented foundation controls

1. User-facing prep confidence copy comes exclusively from `formatPrepConfidenceForUser`; its regression test proves internal score and `inferred penalty` language do not render.
2. CLR-8 now has a forbidden internal-scoring vocabulary blocklist for candidate dashboard/prep presentation files.
3. Dashboard telemetry records product-local `dashboard_viewed` and `dashboard_action_clicked` events with a stable action/section ID, layout/posture context, and elapsed time. It stores no company name, user-entered text, contact data, or score.
4. The existing onboarding situation step now lets a user explicitly choose `active`, `exploring`, or `not_looking`. The selected posture is persisted to `user_profiles.search_posture`; inferred employment/timeline state is only the preselected fallback. The existing `/dashboard/profile` editor exposes the same preference for later changes.
5. The dashboard-simplification gate enforces the three named flagged zones, the required marked primary actions, one main landmark, claim-template coverage, and the absence of MandateSignal/internal-scoring references. Its planted fixture proves that a fourth zone fails.

## Validation

Passed locally:

```text
npm run typecheck
npm run build
npx vitest run src/lib/prep/prep-confidence.test.ts src/app/(dashboard)/dashboard/page.test.ts src/app/api/(ops)/events/channel-funnel/route.test.ts
npx vitest run src/app/onboarding/actions.test.ts src/lib/dashboard-posture.test.ts
npm run guard:plain-language
npm run guard:dashboard-simplification
npm run test:dashboard-simplification-gate
```

Focused test results: 13 tests passed for prep/dashboard/event-route coverage; 11 tests passed for onboarding/posture coverage.

## Remaining gates and follow-up

- The user-requested baseline and flagged-layout observational sessions were deliberately not run in this work.
- Do not flip `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED`.
- Rich must confirm signal-recency/no-rendered-score semantics and ratify word/CTA budgets.
- G-1 claim-template coverage, G-3 flagged-zone/action budget, and G-4 static product-isolation proof are enforced by `guard:dashboard-simplification` and its planted regression. G-5 authenticated desktop/mobile browser parity is complete; the source-derived 7-day return readout was explicitly excluded from this work.
- `search_posture` is explicitly selected during onboarding, persisted, and editable in `/dashboard/profile`.
- No canonical signal-engine-plan update is needed: this record maps the existing `WS7-03`, `WS7-04`, `WS7-08`, and `DG-09` controls without changing their plan or acceptance criteria.
- The remaining gate is the accountable-owner `DG-09` decision. No agent may grant that approval or flip a hosted feature flag.

## DG-09 decision record

Status: `APPROVED_LIMITED_DEFAULT_OFF_COHORT`

Approved by: Rich Rothschild

Approval: A limited cohort rollout is approved after this branch is committed and protected CI passes. The source-derived 7-day return readout is explicitly deferred from this approval.

No hosted environment variable, deployment, or rollout state has changed. The default behavior remains the legacy dashboard until a separate authorized deployment changes the flag for the approved cohort.
