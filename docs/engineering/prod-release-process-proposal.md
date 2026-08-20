# Protecting the Funnel — Proposal (DRAFT for review)

**Status:** Proposal, not yet implemented. Nothing in this document has been applied to the repo or workflows.
**For:** Rich + Chris review, AM meeting.
**Author:** Chris (drafted with Claude)
**Goal:** Stop funnel-breaking incidents from reaching customers — without slowing down how we ship.

---

## Executive summary

- **The last four production incidents all broke the growth funnel** — signup, onboarding, login — and three of the four ran for **weeks** before anyone knew. Two were reported by the same Manager Tools trial user we're trying to convert. None were caught by our own systems.
- **The pattern is not "we ship too fast."** Each incident was a *silent* failure that nothing was verifying. Slowing releases would not have caught most of them; automated verification would have caught all of them.
- **So this proposal deliberately does not ask for a release cadence, code freeze, or mandatory staging soak.** It asks for three tiers, cheapest first:
  - **Tier 1 — machines watch the funnel** (zero change to how anyone works, mostly already built): real synthetics on login/signup/onboarding, schema drift check in CI, fix the staging environment config.
  - **Tier 2 — one settings change:** require a second set of eyes only on the handful of paths that can break the funnel (auth, onboarding, billing, migrations). Everything else ships exactly as today.
  - **Tier 3 — parked:** the scheduled release-train idea, held unless Tiers 1–2 prove insufficient.
- **The ask for this meeting:** approve Tier 1 (Chris ships it this week), decide on Tier 2 (one branch-protection toggle, Rich-only), agree Tier 3 stays parked with a defined revisit trigger.

---

## 1. The incident record (90 days)

| # | Incident | Window | How long invisible | Who found it | Root cause |
|---|---|---|---|---|---|
| 1 | All Google OAuth **signups** blocked (prod signup toggle off) | May – Aug 5 | ~3 months | Manual discovery during campaign prep | Prod auth config, silently divergent |
| 2 | Attribution + consent writes silently failing (`signup_source` never recorded) | Jun 18 – Aug 6 | ~7 weeks | Manual audit | Migration 165 never applied to prod |
| 3 | **Onboarding completion** silently failed for every new user; users bounced back to /onboarding forever (SMK-460) | ~Jul 3 – Aug 11 | ~6 weeks | **Trial user Judd emailed Rich** | Migration 130 never applied to prod; write error unchecked |
| 4 | All OAuth + magic-link **logins** dead-ended on a blank page (SMK-464) | Aug 13, evening | Hours — by luck | **Chris happened to log in** | PR #402's CSP change blocked the callback redirect script |

Incident 3 landed on the first week of real Manager Tools trial traffic — the first serious acquisition push, hitting a signup flow that couldn't complete. Incident 4 would have greeted the next morning's trial users with a blank login page if it hadn't been caught that evening.

**The uncomfortable common thread:** every one of these was invisible to us and visible to customers. The product's revenue path — signup → onboarding → login → first value — has no reliable tripwire.

---

## 2. What would actually have caught each one

Honest accounting, because it drives where the effort should go:

| # | Would a slower release cadence have caught it? | Would staging-first testing have caught it? | What catches it in minutes |
|---|---|---|---|
| 1 (signup toggle) | No — config, not code | No — staging config differs from prod | Signup synthetic against prod |
| 2 (migration 165) | No | Only if staging schema mirrored prod — it didn't | Schema drift check in CI |
| 3 (migration 130) | No | Same | Schema drift check in CI |
| 4 (CSP/login) | Maybe — only if someone happened to OAuth-login on staging during the soak | Same caveat | Post-deploy login synthetic exercising the **real** callback |

Release cadence scores roughly 0–1 out of 4. Verification scores 4 out of 4. That's why this proposal leads with verification.

**Why didn't the existing synthetics catch #4?** We *do* run production synthetics every 5 minutes (`production-synthetics.yml`). But the OAuth checks in `tests/e2e/synthetics.spec.ts` (Synthetic-01b) **mock the auth endpoints** — they verify the login button dispatches a request, then intercept it. The real `/auth/callback` page, the one that broke, is never exercised. Password login is tested for real; it uses a different code path and kept passing.

**Two supporting findings from this week's audit (SMK-465):**
- The staging Supabase instance has had **zero writes since Jun 29** — and nobody noticed for six weeks. Local dev and the Railway staging service both point at **production** Supabase, contrary to what CLAUDE.md documents.
- Consequence: "validate migrations on staging first" currently validates nothing, and local dev writes real customer data.

---

## 3. Tier 1 — machines watch the funnel (approve today, Chris ships this week)

**Velocity cost: zero.** Nothing about how features are built, merged, or deployed changes. These run after the fact and get loud.

| Item | What it does | Status | Incident class it kills |
|---|---|---|---|
| **1a. Real login round-trip synthetic** | Generate a magic link for the test account (admin `generateLink`), drive the browser through `/auth/callback?token_hash=...`, assert it lands on `/dashboard`. Exercises the exact code that broke in #4, CSP and redirect included. Runs in `production-synthetics.yml` (every 5 min) and `post-deploy.yml`. | New — ~half a day | #4 |
| **1b. Callback contract check** | One HTTP request: fetch `/auth/callback` with a dummy code, assert the redirect script carries a nonce matching the CSP header. Trivial, runs post-deploy. Would have caught #4 within one deploy cycle. | New — ~an hour | #4 |
| **1c. Schema drift check in CI** | `scripts/check-schema-drift.mjs` parses every migration and probes prod through PostgREST — validates what the app actually sees. Already built and passing (216 tables). Wire into CI on a schedule + Slack alert. | **Built** (branch `SMK-461/schema-drift-reconciliation`) — wiring is ~half a day | #2, #3 |
| **1d. Signup synthetic stays release-blocking** | Synthetic-10 (first-value signup) already exists. Confirm it is blocking and alerting where someone will see it. | Exists — verify only | #1 |
| **1e. Fix the environment split (SMK-465)** | Decide: revive `startingmonday-staging` (repoint Railway staging service + Doppler dev, reconcile 6 weeks of schema, reseed) or formally retire it and document that all envs share prod. Either answer is fine; the current undocumented state is not. | Decision needed from Rich | Prevents the *next* silent-divergence class |

**Deliverable:** one PR (synthetics + drift-check wiring), one decision (1e).

---

## 4. Tier 2 — a second set of eyes on the funnel paths only (one settings change)

The one incident machines can't fully pre-empt is #4's class: a correct-looking code change with a side effect on auth. Tests passed; the break was only visible by walking the real path — or by a reviewer who knows that path.

**Proposal:** require code-owner review **only** on the paths that can break the funnel:

```
src/app/auth/            # login/callback (not covered by CODEOWNERS today)
src/app/(auth)/          # already in CODEOWNERS
src/app/onboarding/
src/app/api/webhooks/    # stripe
supabase/migrations/
src/proxy.ts             # CSP / middleware — the #4 vector
```

- `.github/CODEOWNERS` **already exists**. It needs trimming: today it has a `* @richrothschild @68Commando-stack` catch-all, which — if code-owner review were switched on as-is — would put review on *every* PR. Cut the catch-all, keep only the funnel paths above. (Chris, small PR.)
- Rich then enables **"require review from code owners"** on `main` branch protection. One toggle, one time. (Admin-only.)
- **Everything outside those paths ships exactly as fast as today.** No review, no waiting.
- It's symmetric: Chris's auth changes need Rich's eyes, Rich's need Chris's. #4 was a reviewed-in-principle change that touched proxy CSP; this is the class it targets, from either of us.

**Velocity cost: minutes-to-hours of review latency, only on funnel-critical diffs.** For everything else, zero.

---

## 5. Tier 3 — scheduled release train (parked)

The earlier draft of this proposal designed a full Tue/Thu release train: features integrate on `staging` all week, a validated batch promotes to `main` twice weekly, `emergency-hotfix` label for the off-schedule path. The design is done and most of the machinery (promote workflow, post-deploy canary, rollback alert) already exists.

**Parked, deliberately, because:**
1. The incident record (§2) shows cadence would have caught at most one of four incidents. It's the most expensive intervention with the weakest coverage.
2. It depends on a functioning staging environment, which SMK-465 shows we don't currently have.
3. Batching enlarges diffs, which cuts against the review benefit Tier 2 buys.

**Revisit trigger (proposed):** another P0 funnel incident reaches customers *after* Tiers 1–2 are live, or the first paying-customer cohort lands — whichever comes first. If triggered, the release-train design gets dusted off as drafted, not redesigned.

---

## 6. What this proposal explicitly does NOT ask for

- No release schedule, windows, or freezes — ship whenever, as often as today
- No mandatory staging soak time
- No review requirement on the vast majority of PRs
- No new ceremonies, standups, or sign-off rituals
- No Railway or deploy-pipeline changes

The bet: the funnel is guarded by machines plus a narrow review rule, and velocity everywhere else is untouched. If that bet fails, §5 has the escalation path pre-agreed.

---

## 7. Decisions for the meeting

1. **Tier 1: approve?** Chris ships the synthetics + drift-check PR this week.
2. **Tier 1e: staging environment** — revive or retire? (Either is workable; pick one so docs match reality.)
3. **Tier 2: approve the path list?** Add/remove paths, then Chris trims CODEOWNERS and Rich flips the branch-protection toggle.
4. **Tier 3 revisit trigger:** agree the condition now so it's a pre-made decision, not a future debate.
5. **Alert destination:** where do synthetic failures page — `#all-starting-monday`, or a dedicated alerts channel?

---

## Appendix: verified current state (checked Aug 13–14, not assumed)

| Fact | Evidence |
|---|---|
| Production synthetics run every 5 min | `production-synthetics.yml` cron `*/5 * * * *` |
| OAuth synthetic mocks the real endpoints | `tests/e2e/synthetics.spec.ts` Synthetic-01b `page.route` intercepts `/api/auth/verify-and-oauth` + `oauth-start` |
| Drift checker built and passing against prod | `scripts/check-schema-drift.mjs` on branch `SMK-461/schema-drift-reconciliation`; PASS, 216 tables |
| CODEOWNERS exists with `*` catch-all + partial auth coverage | `.github/CODEOWNERS`; `src/app/auth/` (the callback) not listed |
| Local dev + Railway staging both point at prod Supabase; staging instance idle since Jun 29 | SMK-465: Doppler `dev`/`dev_personal` and both Railway services resolve to `mytnhoxcgvnzxhgcumkf` (prod); staging instance last event 2026-06-29 |
| `staging` branch is 4 commits ahead of `main`, 0 behind | `git rev-list --left-right --count origin/main...origin/staging` = `0 4` |
| Post-deploy canary + rollback alert already exist | `.github/workflows/post-deploy.yml` |
| Incident details | SMK-460 (onboarding), SMK-464 (login/CSP), SMK-465 (environments); attribution + signup-toggle incidents per project records |
