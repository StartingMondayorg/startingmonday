# B2B Entitlement Gates Evidence (R-6)

Date: 2026-10-21
Repository: Starting Monday
Base: `59e71c40` (`origin/main`)
Implementation branch: `simplify/r6-entitlement-gates`
Ruling: R-6 default for `coach`, `outplacement/*`, `partner`, `chat` (Rich, 2026-10-21). The `concierge` and `board-track` deletions from the same ruling ship in the R-3 phase-1 PR.

## Before

Six B2B/tier-bound surfaces gated on login only. A trial account could open `/dashboard/outplacement/operator`, `/counselor`, `/enterprise`, `/sponsor-report`, `/dashboard/coach`, and `/dashboard/partner` and see empty shells (data reads were already scoped to the caller's own partner row, so this was surface exposure, not data exposure).

## After

| Surface | Gate | Mechanism |
| --- | --- | --- |
| `/dashboard/coach`, `/dashboard/coach/[clientId]` | `canAccessFeature(sub, 'coach_dashboard')` | `dashboard/coach/layout.tsx` |
| `/coach/clients`, `/coach/[clientId]/interview` | same | `coach/layout.tsx` |
| `/dashboard/outplacement/*` (6 pages) | account resolves to a partner (`resolveOrgScopeForUser(...).partnerId`) | `dashboard/outplacement/layout.tsx` |
| `/dashboard/partner` | same | `dashboard/partner/layout.tsx` |
| `/dashboard/chat` | `canAccessFeature(sub, 'ai_chat')` (trial counts as `active`) | `dashboard/chat/layout.tsx` |

- One helper, `src/lib/entitlements.ts`: `isEntitled(kind, inputs)` is pure and unit-tested; `requireEntitlement(kind)` is the server-layout wrapper (no session → `/login`; no entitlement → `/dashboard`). Staff with `owner`/`admin` roles pass every gate; `viewer` does not.
- Command palette: the "Chat with AI" action is hidden when the account lacks `ai_chat`; `(dashboard)/layout.tsx` computes the flag server-side. No other palette/nav entry pointed at a gated surface. The sitemap lists marketing routes only.
- The dashboard's existing `coach_dashboard → /dashboard/coach` redirect is unchanged; the destination now enforces the same condition.

## Tests

- `src/lib/entitlements.test.ts`: coach tier, partner scope, `ai_chat` incl. trial access, staff pass-through (4 cases).
- `tests/e2e/coach-flows.spec.ts` and `tests/e2e/persona-flows.spec.ts`: the authenticated coach/outplacement checks now accept the gate's redirect for a non-entitled account instead of asserting B2B content for whatever account CI has.

## Validation (local)

```text
npm run typecheck             # clean
npx vitest run src/lib/entitlements.test.ts   # 4 pass
npx eslint (touched files)    # clean
```

Full unit suite, staged coverage, and the hook guards are in the commit message; hosted redirect behaviour comes from CI on the pull request.

## Rollback

Revert the PR (five layouts, one helper, one palette prop).
