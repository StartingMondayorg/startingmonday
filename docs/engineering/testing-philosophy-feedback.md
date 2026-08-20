# Testing Philosophy — Feedback & Recommendations

*Starting Monday engineering · August 19, 2026*

## Summary

- **Directionally agree.** Prioritizing API and end-to-end coverage over component tests is sound. The recently removed tests were almost all empty placeholder stubs, and our real bugs have historically been caught at the integration level.
- **Sequence the transition.** Replacement coverage should land before further pruning: the full Playwright E2E suite currently runs only as a smoke subset on PRs. Recommend enabling the full suite for high-risk PRs and growing API coverage first, then removing what it supersedes.
- **One test to restore.** `layout.test.tsx` (brand-metadata separation between Starting Monday and MandateSignal) was real coverage removed alongside the placeholders. It fits the API-level philosophy and should return as a lib-level test.
- **Context from incident history.** Our costliest outages — attribution loss, onboarding loop, signup toggle — were silent data/config failures, not UI bugs. The protection there comes from gates, not tests. Proposal: changes to a small protected-gates list require team sign-off.

## Recommended protected gates

| Gate | Why it stays |
|------|--------------|
| **Predeploy gates** (lint, typecheck, build, smoke) | Last stop before anything ships; catches broken builds and baseline regressions |
| **Playwright E2E** | The functional safety net the new testing philosophy itself depends on |
| **Semgrep security scan** | Automated security review on every PR; zero maintenance cost |
| **Auth guard checks** (`requireAuth` enforcement + Auth UX guard) | Prevents unauthenticated API routes and unreviewed changes to the front door |
| **Migration drift check** | Directly traceable to three past production outages |
| **Tier-0 accessibility gate** | Just caught a real WCAG contrast regression invisible to visual review; our audience skews toward the demographic it protects |

## Supporting evidence

On the current component-library PR-426, these gates caught a genuine color-contrast regression and an unreviewed auth-page visual change — both on pages that looked fine to the eye. That is the gates working as designed, not process overhead.
