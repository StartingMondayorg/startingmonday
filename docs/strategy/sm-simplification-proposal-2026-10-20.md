---
doc_id: sm-simplification-proposal
version: 0.1
date: 2026-10-20
status: draft-for-rich-ruling
home: docs/strategy/
measured_at: origin/main 86974255 (2026-09-20)
builds_on:
  - docs/strategy/sol-dashboard-simplification-brief-2026-08-19.md
  - docs/evidence/dashboard-simplification-foundation-2026-08-20.md
---

# Starting Monday — "It tries to do too much" simplification proposal

Rich's prompt (2026-10-20): *"I think it tries to do too much. Consider removing the workflow that nudges users to stay on top of the job search, or at least minimize it. Where else can we make it simpler and easier to use?"*

This document is Sol's answer. It is a proposal, not a decision. Section 6 lists the rulings only Rich can make; everything else is drafted so Rich can approve rather than supply.

## 1. What the product is actually asking of a user today

Measured at `86974255` with the query below (run from the repo root):

```powershell
$all=Get-ChildItem -Recurse 'src\app' -Filter page.tsx -File
$dash=$all | ? { $_.FullName -match '\\\(dashboard\)\\' }
$admin=$dash | ? { $_.FullName -match '\\admin\\' }
$mkt=$all | ? { $_.FullName -match '\\\(marketing\)\\' }
$api=Get-ChildItem -Recurse 'src\app\api' -Filter route.ts -File
$jobs=Get-ChildItem worker\jobs -Filter *-job.js -File
```

| Surface | Count | Note |
| --- | ---: | --- |
| Authenticated, non-admin pages (`(dashboard)` minus `admin/`) | **62** | 35 top-level `/dashboard/*` sections + `prep/*` (5) + `coach/*` + `settings/*` (4) + `outplacement/*` (6) + `optionality/*` (3) |
| Admin pages | 42 | Internal; not a user-simplicity problem but a maintenance one |
| Marketing pages | 180 | 50 of them blog posts; separate concern |
| API route handlers | 322 | 31 under `api/(ops)/cron` |
| Worker cron jobs (`worker/jobs/*-job.js`) | 48 | 14 send email to end users (section 2) |
| Scheduled GitHub workflows | 62 | Ops, not user-facing |
| `src/app/(dashboard)/dashboard/page.tsx` | 2,035 lines | Legacy layout and flagged three-zone layout coexist |
| Onboarding steps | 7 | name → role lane → situation → profile import → target companies → briefing time → first-value preview |
| Mobile bottom nav | 5 tabs | Home, Companies, Signals, Contacts, Profile |
| Command palette destinations | 14 | |

The mobile nav already tells the truth about what the product is: **companies, signals, contacts, profile.** The other ~55 authenticated pages are the "too much."

## 2. The "stay on top of your search" workflow — full inventory

This is the system Rich asked about. It is not one feature; it is four layers that were added independently and now overlap.

### 2a. In-app pressure on `/dashboard` (legacy layout, the one users see today)

| Element | File | What it does | Recommendation |
| --- | --- | --- | --- |
| Stall nudge (14/21-day) | `dashboard/page.tsx` L587–651, `_components/welcome-nudge-section.tsx` | "No activity in two weeks." / "Nothing has moved in three weeks." with dismiss stored in `user_profiles.stall_nudge_dismissed_at` | **Remove.** Absorbed by three-zone Zone 1 precedence rule 4 ("stalled ≥14 days") which renders a single calm next move, not an alert |
| Daily Momentum Plan | `src/app/components/DailyMomentumPlan.tsx` (355 lines), `_utils/momentum-actions.ts` | Three-item daily checklist with "Momentum building / Strong momentum" chips, localStorage checkboxes | **Remove.** Zone 1 already carries exactly one action |
| Momentum score | `worker/jobs/momentum-job.js` (weekly), `momentum_score` on profile, rendered in `weekly-performance-section.tsx` | Numeric 0–100 "momentum" with low/medium/strong banding | **Remove from UI; stop the job.** Rendered scores violate D-B (no numeric score on candidate dashboard) |
| Weekly goal + commitment | `saveWeeklyGoal` action, `user_profiles.weekly_goal`, `advanced-modules-section.tsx` → `weekly-performance-section.tsx` (294 lines) | User sets N actions/week; dashboard shows attainment | **Remove.** Accountability-coaching request already declined by the intake rule in the 2026-08-19 brief §6 |
| Stalled alerts list | `dashboard/page.tsx` L708–735, L1796–1815 | Up to 5 companies "stalled" ≥14 days | **Remove.** Zone 2 sorts by signal recency; staleness is visible without an alert |
| Pipeline velocity | `src/app/components/PipelineVelocity.tsx`, velocity rows L654–770 | Per-company days-since-update table | **Remove from `/dashboard`.** If kept anywhere, `/dashboard/progress` |
| Weekly activity chart (10 weeks) | `dashboard/page.tsx` L547–586 | Activity bars | **Move to `/dashboard/progress`** (already the brief's destination) |
| Decision timeline | `_components/decision-timeline-section.tsx` | Days-in-search framing | **Move to `/dashboard/progress`** |
| Default "Start with your daily briefing" prompt | `welcome-nudge-section.tsx` else-branch | Always-on CTA when no stall nudge | **Remove.** Zone 3 links to the briefing; Zone 1 should never be a generic prompt |
| Three path-welcome cards | `path-welcome-card.tsx` | Nurture/campaign/watcher welcome copy | **Keep one, as Zone 1 activation state**, per brief §2 ("setup is Zone 1, not a fourth zone") |
| `PersonalEmailNudge` (layout-level) | `(dashboard)/_components/PersonalEmailNudge.tsx` | Asks work-email users to add a personal address | **Keep but move to `/settings`.** It is a real data-loss risk, not an engagement nudge; it does not belong on every page |
| `ProfileInactivityNudge` | `_components/ProfileInactivityNudge.tsx` | 90s idle → fixed bottom bar "Still with you. Save your progress." | **Remove.** Autosave the draft instead (onboarding already has `use-onboarding-draft-state.ts`) |

### 2b. Email cadence — worker (Railway, `worker/index.js` L461–515)

Every job below sends to end users. Schedules are UTC.

| Job | Schedule | Subject (from source) | Recommendation |
| --- | --- | --- | --- |
| `briefing-job` | every 5 min, fires at user-chosen time | daily briefing | **Keep. This is the product.** |
| `followup-job` | daily 06:00 | "N actions due — Starting Monday" | **Fold into the briefing.** Due follow-ups are already a briefing section; a second daily email is the problem |
| `momentum-nudge-job` | daily 10:00 | "Your search momentum dropped this week" | **Remove.** Guilt email tied to a score we are removing |
| `momentum-job` | Sun 23:00 | computes score (no email) | **Remove with the above** |
| `weekly-report-job` | Sun 23:30 | "Your weekly search snapshot" | **Minimize:** keep as an opt-in Monday summary, off by default |
| `market-digest-job` | Sun 22:30 | "Your weekly market intelligence" | **Merge into the Monday briefing** rather than a separate Sunday-night email |
| `pulse-job` | daily 07:00 | industry pulse | **Remove or merge into briefing.** A third daily send |
| `industry-pulse-job` | Sun 06:00 | weekly pulse | **Merge or remove** |
| `opportunity-radar-job` | Sun 06:30 | radar | **Merge into Monday briefing** |
| `activation-reminder-job` | daily 10:30 | day-2 / "account is ready" / "A note" / "Two weeks in" / "One thing to do today" (5 templates) | **Minimize to one:** day-2 "here is what we found at your companies." The rest duplicate `drip` |
| `trial-reminder-job` | daily 10:00 | trial expiring | **Keep** (billing-honesty, not engagement) |
| `offer-email-job` | daily 11:00 | "You did it." | **Keep** (one-time, celebratory) |
| `reactivation-job` | daily 11:30 | "One year later." | **Keep** (one-time, honours `marketing_unsubscribed_at`) |
| `outreach-digest-job` | daily 15:00 | bounced/stuck outreach | **Keep, operational** — only sends when there is a delivery problem |

**Today a new active user can receive up to four product emails on a weekday** (briefing, follow-ups, pulse, activation reminder) **and three more on Sunday night** (market digest, weekly report, momentum nudge Monday morning). The proposal collapses this to **one daily briefing + billing/transactional**.

### 2c. Email cadence — app-side cron routes (`src/app/api/(ops)/cron/*`)

| Route | In-repo scheduler? | What it sends | Recommendation |
| --- | --- | --- | --- |
| `reengagement` | `reengagement-daily.yml` 13:00 UTC | day-10 / day-20 "You have not been back in ten days. That matters in a market where timing is everything." | **Rewrite to one calm message at day 14:** "Here is what changed at your companies while you were away." No guilt copy |
| `trial-expiry-notice` | `trial-expiry-notice-daily.yml` 14:00 UTC | 10-days-left notice | **Keep** |
| `stall-check` | **none found** (not in workflows, `railway.toml`, `worker/index.js`, or `supabase/`) | email twin of the in-app stall nudge | **Delete the route.** Dead or externally scheduled; either way it goes with the stall nudge |
| `commitment-friday` | **none found** | "N of goal this week" | **Delete** with weekly goal |
| `commitment-sunday` | **none found** | "This week, aim for N" | **Delete** with weekly goal |
| `weekly-digest` | **none found** | weekly digest | **Delete**; `weekly-report-job` already covers it |
| `drip` | **none found** | 7-step trial drip (days 0,3,5,7,10,14,28) | **Keep the content, cut to days 0, 3, 14.** Confirm the hosted scheduler before deleting anything here |

Hosted scheduling for the "none found" rows cannot be verified from the repo; Railway/Vercel cron UI state is OWNER INPUT (section 6, R-5).

### 2d. Preference surface

`api/(account)/settings/email-nudges` is a single boolean mapped to `users.drip_unsubscribed_at`. Marketing uses `marketing_unsubscribed_at`. The briefing has its own `briefing_frequency`. Three different columns, no single place a user can see what they will receive.

**Recommendation:** one settings card — *Daily briefing (time) · Weekly summary (on/off, default off) · Trial & account emails (always on)*. Everything in 2b/2c maps onto those three.

## 3. Where else it is too much

### 3a. Finish the dashboard you already built

The three-zone dashboard (Zone 1 next move · Zone 2 companies · Zone 3 this week) was built, passed its gates, and was approved for a limited default-off cohort on 2026-08-20 (`DG-09`: `APPROVED_LIMITED_DEFAULT_OFF_COHORT`). As of `86974255` the flag `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED` is still code-only; the latest commit on main (#524, 2026-09-20) teaches synthetics to "accept both dashboard variants," which means both layouts are being maintained in production.

**Recommendation:** make the three-zone layout the only layout. Flip for everyone, then delete the legacy branch (the legacy render tree is `page.tsx` L1433–1960 plus its data preparation — well over half the file — along with roughly a dozen `_components/*` files, `DailyMomentumPlan`, and `PipelineVelocity`). The brief's own amendment 3 said legacy deletion happens "promptly after the flag flip in a separate cleanup change." Two months is not promptly.

### 3b. Collapse 35 dashboard sections to 8

Proposed user-facing IA. Everything not listed is deleted, folded into a listed page, or moved behind a role gate that ordinary users never see.

| Keep | Absorbs |
| --- | --- |
| `/dashboard` (three zones) | `start`, `briefing` (becomes the Zone 1/3 detail), `plan`, `kanban`, `pipeline`, `discover`, `executive-brief`, `optionality/decision-cockpit` |
| `/dashboard/companies/[id]` (+ `/prep`) | `prep/companies`, `prep/meetings`, `signals` detail per company |
| `/dashboard/signals` | `discover/recommendation/[id]` |
| `/dashboard/contacts` (+ `[id]`, `outreach`) | `outreach`, `pilot-outreach`, `prep/relationships`, `prep/communications` |
| `/dashboard/progress` | `results`, `wrap-up`, `post-search`, `post-landing`, `placed`, weekly chart, decision timeline, velocity |
| `/dashboard/profile` (+ `tailor`) | `positioning`, `strategy`, `strategy/intake`, `optionality/branding`, `salary` |
| `/prep/interview` | `calendar` (interview-centric), `offers` |
| `/settings` (+ billing, security) | `help`, `support`, `feedback`, `invite`, `team`, email preferences (2d) |

Role-gated and hidden from solo users: `coach/*`, `outplacement/*`, `partner`, `board-track`, `concierge`, `chat`. These are B2B surfaces; they are not the problem for the individual executive, but they must not appear in nav, command palette, or sitemap for solo accounts.

Net: **62 → ~20 authenticated non-admin pages** (8 primary + detail routes + settings sub-pages). The brief's G-3 element budget already exists as a CI gate for `/dashboard`; extend it to count routes under `(dashboard)` so this does not re-accrete.

### 3c. Onboarding: 7 steps → 3

Current order collects name, role lane, situation/posture, LinkedIn/PDF import, target companies, briefing time, then shows a first-value preview. Proposed:

1. **Posture + role lane** (one screen, two questions). Posture is the one question the brief said matters (R-2).
2. **Add 3 companies** — the empty-state-as-tutorial pattern from Zone 2. Suggestions from role lane.
3. **Briefing time** — defaulted to 07:00 local, one tap to change, then straight to `/dashboard`.

Name comes from the auth provider. Resume/LinkedIn import moves to `/dashboard/profile` as an upgrade path ("add your background to sharpen briefs") rather than a gate. The first-value preview *is* the dashboard; do not preview it.

### 3d. One nav, not three

Desktop has no persistent nav (top shell section + command palette); mobile has a 5-tab bar. Give desktop the same 5 items as a left rail: **Home · Companies · Signals · Contacts · Profile**, with Settings under the avatar. Delete `DashboardPrimaryNavSections` ("Operating focus" card — it is a nav disguised as a section) and the `Pipeline`/`Signals` pills. Keep the command palette but shrink it to the same 5 + settings.

### 3e. Stop building the parts no one has asked for

`docs/strategy/sol-dashboard-simplification-brief-2026-08-19.md` §6 names the accretion firewall for `/dashboard`. It has held there — since the 2026-08-20 baseline (`ae7926f5`) no new solo-user dashboard page was added (`git diff --name-only --diff-filter=A ae7926f5 86974255 -- src/app`: 17 new route dirs, all `live-brief`/admin/ops/cron). But the firewall has no equivalent for the rest of the authenticated tree, and the 62 non-admin pages that pre-date it were never pruned. The problem is accumulated surface, not recent accretion.

**Recommendation:** adopt a route-count ratchet in CI identical in spirit to `debt-ratchet.yml`: authenticated non-admin page count may not increase without a doc in `docs/strategy/` naming what it displaces. This is the firewall the brief intended, applied to the whole authenticated tree instead of one route.

## 4. What this does **not** touch

- Signal ingestion, scanners, EDGAR/ATS/WARN pipelines, scoring internals — untouched. Governed by the canonical signal-engine plan (WS7); this proposal is product-local IA and cadence only.
- Billing, auth, security, tenant isolation — untouched.
- Coach / outplacement / partner B2B surfaces — hidden from solo users, not removed. Their own simplification is a separate brief (brief R-1).
- Marketing site — out of scope here; 180 pages is its own conversation.
- MandateSignal — no shared code, data, or dependency. Separate product, repo, database, deployment.

## 5. Execution plan (if approved)

| Phase | Scope | Risk | Rollback |
| --- | --- | --- | --- |
| **P1 — Quiet the inbox** (1 PR) | Stop `momentum-nudge-job`, `momentum-job`, `pulse-job`, `industry-pulse-job`; fold `followup-job` into briefing; cut `activation-reminder-job` to day-2 only; rewrite `reengagement` copy; delete 4 unscheduled cron routes after R-5 confirmation | Low — removing sends | Re-enable `cron.schedule` lines |
| **P2 — One dashboard** (2 PRs) | Flip three-zone for all users; delete legacy branch, momentum/velocity/weekly-goal components, `stall_nudge` logic; drop `weekly_goal`, `momentum_score`, `stall_nudge_dismissed_at` columns in a follow-up migration after 14 days | Medium — UI change for every user | Flag flip back (first PR); second PR waits 14 days |
| **P3 — Nav + settings** (1 PR) | Desktop rail, single email-preferences card, move `PersonalEmailNudge` | Low | Revert |
| **P4 — Route collapse** (3–4 PRs by group in 3b) | Redirects from retired routes to their absorbing page; delete after 30 days of zero hits (`route-inventory-agent.yml` already measures this) | Medium | Redirects stay until deletion PR |
| **P5 — Onboarding 7→3** (1 PR) | New flow behind existing onboarding flag mechanism; synthetics updated | Medium | Flag |
| **Guardrail** | Route-count ratchet + extend G-3 | — | — |

Every phase is validated by the existing gates: `guard:dashboard-simplification`, `guard:plain-language`, `test:e2e:dashboard-simplification`, `onboarding-live.spec.ts`, and production synthetics.

## 6. Rulings needed from Rich (OWNER INPUT)

Each has a drafted default; a one-word "yes" adopts it.

- **R-1 Nudge system.** Default: remove 2a entirely except the Zone 1 stalled state; email cadence becomes daily briefing + weekly summary (opt-in) + billing/transactional. *Alternative:* keep `weekly-report-job` on by default.
- **R-2 Dashboard flag.** Default: flip `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED` for all users and delete legacy. This exceeds the 2026-08-20 `DG-09` limited-cohort approval and needs an explicit widening. The D-A observational baseline (`docs/evidence/dashboard-observational-baseline-2026-08-20.md`) exists; the post-flip repeat session (brief §7) has not been run and would be scheduled in P2.
- **R-3 Route collapse list (3b).** Default: as tabled. Flag any row Rich wants kept as a standalone page.
- **R-4 Onboarding 7→3.** Default: as in 3c. The resume/LinkedIn import becomes post-onboarding.
- **R-5 Hosted cron state.** Are `stall-check`, `commitment-friday`, `commitment-sunday`, `weekly-digest`, or `drip` scheduled anywhere outside this repo (Railway cron, Vercel cron, Supabase dashboard)? Repo search found no scheduler; I cannot see the hosted console. If none, they are deleted in P1.
- **R-6 B2B gating.** Default: coach/outplacement/partner/board-track/concierge/chat hidden for solo accounts via `resolveOrgScopeForUser`, not deleted.

## 7. Evidence trail

- Measured counts: section 1 query, run at `86974255` on 2026-10-20 in worktree `C:\Users\roths\startingmonday-simplify`.
- Nudge inventory: `src/app/(dashboard)/dashboard/page.tsx` L13–45 (imports), L587–651 (stall nudge), L654–770 (velocity), L1026–1078 (momentum), L1433–1960 (legacy render tree); `worker/index.js` L461–515 (schedules); `src/app/api/(ops)/cron/*/route.ts` subject lines; `.github/workflows/reengagement-daily.yml`, `trial-expiry-notice-daily.yml` (only two app-cron schedulers found).
- Prior decisions: `docs/strategy/sol-dashboard-simplification-brief-2026-08-19.md` (R-1..R-3, D-A..D-C, §6 intake rule); `docs/evidence/dashboard-simplification-foundation-2026-08-20.md` (DG-09 record).
