---
doc_id: sm-rulings-packet-r3-r4-r6
version: 0.1
date: 2026-10-21
status: draft-for-rich-ruling
home: docs/strategy/
measured_at: origin/main 0241efa8 (2026-10-21)
parent: docs/strategy/sm-simplification-proposal-2026-10-20.md
---

# Ruling packet — R-3 route collapse, R-4 onboarding, R-6 B2B gating

Rich asked (2026-10-21) for suggested rulings on the three open items. Each section states the evidence, the default ruling, and the alternative. A one-word "yes" per section adopts the default.

Measurement: every `page.tsx` under `src/app/(dashboard)/` excluding `dashboard/admin/`, scored for inbound links (distinct `src/` files containing an `href` to the route), lines, gating, and tables read. 62 routes. The raw table is in section 5.

## 1. What the measurement says

- **19 of 62 routes have zero inbound links.** Nothing in the product points at them; they are reachable only by typing the URL or from an old email. `/dashboard/kanban` is already a 29-line tombstone ("Kanban moved to the main dashboard").
- **Only 7 routes have more than 6 inbound links:** `/dashboard` (59), `/dashboard/companies/[id]` and `/prep` (18 each), `/dashboard/profile` (12), `/settings/billing` (11), `/dashboard/contacts` (9), `/dashboard/contacts/[id]/outreach` (7). That is the product people actually navigate.
- **Six B2B surfaces gate on login only:** `/dashboard/coach`, `/dashboard/outplacement/*` (6 pages), `/dashboard/partner`, `/dashboard/concierge`, `/dashboard/board-track`, `/dashboard/chat` — about 3,000 lines between them. A trial user can open the outplacement operator, counselor, enterprise and sponsor-report shells. The admin-client reads on `firm-admin` and `partner` are scoped to the caller's own `partners` row, so this is empty-shell exposure rather than data exposure, but it is still someone else's product in a solo user's URL space.
- **Onboarding has 9 screens, not 7.** `onboarding-form.tsx` steps 0–8: name, import, role lane, companies, situation/posture, briefing time, relationship-enrichment panel, context (locations/sectors/comp/positioning), done + scan panel. The quick path (`!advancedSetup`) jumps 3 → 6, skipping **situation/posture and briefing time**. So the one onboarding question the 2026-08-19 brief made load-bearing (R-2: posture sets Zone 1 copy from day 1) is never asked of quick-path users; posture falls back to an inference.

## 2. R-3 — Route collapse

### Default ruling

Keep **8 primary destinations + their detail routes + settings**, and treat everything else as one of: redirect, fold, or role-gate. Nothing in this ruling deletes data; retired routes become `308` redirects to their absorbing page (same mechanism as the R-8 demo retirement) and are deleted after 30 days of zero hits in `route-inventory`.

| Keep (primary) | Absorbs (redirect →) | Evidence |
| --- | --- | --- |
| `/dashboard` | `kanban` (already a tombstone), `start` (becomes Zone 1 activation state; keep the route for 30 days because onboarding links to it), `plan`, `executive-brief` (0 inbound), `discover` → Zone 2 "Add company" suggestions, `discover/recommendation/[id]` (0 inbound) | Zone 1/2/3 already carry next move, companies, and the week strip |
| `/dashboard/briefing` | — (keep; 1,168 lines, 6 inbound, the product's daily artefact) | Zone 3 links here |
| `/dashboard/companies/[id]` + `/prep` | `prep/companies` (0 inbound), `prep/meetings` (1), `offers` (0 inbound — offer state is a company stage), `optionality/decision-cockpit` (0 inbound) | 18 inbound; the company record is where prep lives |
| `/dashboard/signals` | — | Zone 3 links here; parity contract with dashboard |
| `/dashboard/contacts` (+ `[id]`, `edit`, `outreach`) | `outreach` (already redirects here when ungated), `pilot-outreach` (0 inbound), `prep/relationships` (1), `prep/communications` (3) | 9 inbound; contact detail already owns outreach drafting |
| `/prep/interview` | `calendar` (interview-centric; 2 inbound) | — |
| `/dashboard/profile` (+ `tailor`) | `positioning` (1 inbound, tier-gated), `strategy` + `strategy/intake` (1–2 inbound; the strategy brief becomes a profile action), `optionality` + `optionality/branding` (0–1 inbound), `salary` (2, tier-gated → profile "Compensation" section) | 12 inbound; all of these edit or derive from profile data |
| `/dashboard/progress` | `results` (0 inbound), `wrap-up` (0; already redirects to `placed`), `placed` (0), `post-search` (0; already redirects to `/dashboard`), `post-landing` (0) | The 2026-08-19 brief already named `/dashboard/progress` as the home for retrospective views; it is 87 lines today and has 1 inbound link, so it will need the day-60 review the brief scheduled |
| `/settings` (+ `billing`, `security`) | `help` (4 inbound → the floating `?` already opens `/dashboard/help#how-this-works`; keep as a settings tab), `support` (0), `feedback` (2), `invite` (0), `settings/team` (admin-gated already) | `/settings` itself has 0 inbound `href`s — it is reached through the avatar/command palette only; give it a nav home |

Net for a solo user: **62 → about 20** pages (9 primaries incl. `briefing` and `signals`, 7 detail routes, 4 settings tabs). The 11 B2B pages are handled by R-6, not deleted here.

### What this ruling does *not* decide

- `/dashboard/briefing` stays as a page. Folding it into the dashboard is a separate design question; it is the product's one daily artefact and the Zone 3 link target.
- Column drops (`weekly_goal`, etc.) stay deferred.
- Order of execution: `executive-brief`, `kanban`, `pilot-outreach`, `discover/recommendation`, `results`, `wrap-up`, `post-search`, `post-landing`, `placed`, `invite`, `support` first (0 inbound each — redirects only, no UI work), then the folds that need a destination section built (`strategy` → profile, `salary` → profile, `offers` → company stage, `calendar` → interview prep).

### Alternative

Keep `/dashboard/strategy` and `/dashboard/plan` as standalone pages if you consider the strategy brief a sellable artefact on its own. Everything else in the table has either zero inbound links or an obvious home.

## 3. R-4 — Onboarding 9 → 3

### Default ruling

Three screens, in this order, with no advanced/quick fork:

1. **Who you are, where you're headed** — role lane (existing `StepLevel` chips) **and** posture (`active | exploring | not_looking`, the three buttons from `StepSituation`). Two taps. Name comes from the auth provider; employment status, timeline, and driver are dropped (posture subsumes them for Zone 1; nothing else reads them in the dashboard).
2. **Add 3 companies** — existing `StepCompanies` with persona suggestions. Minimum 1 to continue, prompt says 3. The first scan and relationship enrichment start on submit, exactly as step 3 does today.
3. **When do you want your briefing?** — `StepBriefingTime` defaulted to 07:00 local, one tap to change, the email opt-in switch underneath. Submit lands on `/dashboard`, where Zone 1 renders the activation state ("Finish: upload your resume") until the profile is complete.

Dropped from onboarding and moved to `/dashboard/profile` as post-onboarding upgrades: LinkedIn/PDF import and manual title/company (step 1), the relationship-enrichment panel with add-contact (step 6), context (locations, sectors, compensation, positioning; step 7), and the done/scan panel (step 8 — the dashboard *is* the first-value view). The `lowEnergyMode` and `advancedSetup` branches go away with the fork.

Why this order: posture first because it drives Zone 1 copy from the first render; companies second because they are the only input that makes the product do anything; briefing time last because it is the one commitment the user is making.

### What changes downstream

- `search_posture` becomes explicitly set for every new user (today: only advanced-path users). The `/dashboard/profile` editor already exposes it.
- `activation.a1_resume` will be false for every new user at first render; Zone 1 precedence rule 5 handles that ("Finish setup") — no new UI.
- `tests/e2e/onboarding-live.spec.ts` and the `onboarding-live` synthetic project assert step counts and the setup-link; both need the new count. `onboarding-flow.json` is regenerated.
- The `activation-reminder-job` day-2 email (P1) already targets users with no company, which the new flow makes rarer; keep it.

### Alternative

Keep import as an optional screen 1b ("Have a LinkedIn PDF? Drop it here — or skip"). It adds a screen back for everyone to serve the minority who have the file ready; the profile page serves them equally well a minute later.

## 4. R-6 — B2B gating

### Default ruling

Entitlement-gate at the route, redirect solo users to `/dashboard`, and keep the B2B surfaces intact for the accounts that own them. No deletions.

| Surface | Gate | Mechanism |
| --- | --- | --- |
| `/dashboard/coach`, `/dashboard/coach/[clientId]`, `/coach/*` | `canAccessFeature(sub, 'coach_dashboard')` | Already the condition `/dashboard` uses to send coach-tier users here; apply it on the destination too |
| `/dashboard/outplacement/*` (6 pages), `/dashboard/partner` | `resolveOrgScopeForUser(...).partnerId !== null` | The layout already resolves org scope for every request; expose `partnerId` and require it |
| `/dashboard/concierge` | subscription tier `executive`/`campaign`, or an existing `concierge_calls` row | Matches what the page sells |
| `/dashboard/board-track` | `search_persona === 'board'` | It reads only `user_profiles`; persona is the natural key |
| `/dashboard/chat` | `canAccessFeature(sub, 'ai_chat')` | The feature map already defines this; the page does not check it |

Plus: hide all of the above from the command palette and any nav for accounts that fail the gate, and add them to the sitemap exclusion list (the solo sitemap should not advertise outplacement operator views).

Implementation is one shared helper (`requireEntitlement(feature | scope)`) used at the top of each page, same shape as `requireAuth`. Estimated one PR, ~12 files.

### Why not delete

Coach, outplacement, and partner are the B2B revenue lines; `partner/page.tsx` computes MRR by tier. Hiding them from solo users is the simplification; their own IA is a separate brief, as the 2026-08-19 brief's R-1 already said.

### Alternative

Delete `concierge` and `board-track` outright (0 inbound links each, no B2B owner) rather than gating them. Defensible; I kept them gated because `concierge_calls` has rows and `board` is a persona the onboarding still offers.

## 5. Raw route table (measured 2026-10-21 at `0241efa8`)

| Route | Inbound | LOC | h1 / title | Gate beyond login |
| --- | ---: | ---: | --- | --- |
| `/coach/[clientId]/interview` | 2 | — | Interview | — |
| `/coach/clients` | 1 | 143 | Your Clients | — |
| `/dashboard` | 59 | 724 | What should I do today? | coach tier → `/dashboard/coach` |
| `/dashboard/board-track` | 0 | 174 | Board & Governance Track | — |
| `/dashboard/briefing` | 6 | 1168 | Daily Briefing | flag |
| `/dashboard/calendar` | 2 | 290 | Calendar | — |
| `/dashboard/chat` | 2 | 378 | Career advisor chat | — |
| `/dashboard/coach` | 2 | 482 | Portfolio Command Center | — |
| `/dashboard/coach/[clientId]` | 1 | — | Client Data and Behavior Scorecards | — |
| `/dashboard/companies/[id]` | 18 | — | Company | — |
| `/dashboard/companies/[id]/prep` | 18 | — | Interview Prep | — |
| `/dashboard/companies/new` | 6 | 211 | Add company | — |
| `/dashboard/concierge` | 0 | 187 | One-to-one strategy. Every month. | — |
| `/dashboard/contacts` | 9 | 398 | Relationship network | `recruiter_enhancements` for extras |
| `/dashboard/contacts/[id]` | 6 | — | — | — |
| `/dashboard/contacts/[id]/edit` | 6 | — | — | — |
| `/dashboard/contacts/[id]/outreach` | 7 | — | Draft Outreach | — |
| `/dashboard/discover` | 2 | 284 | Discover Companies | — |
| `/dashboard/discover/recommendation/[id]` | 0 | — | — | — |
| `/dashboard/executive-brief` | 0 | 157 | Starting Monday executive brief | — |
| `/dashboard/feedback` | 2 | 370 | Feedback & Ideas | — |
| `/dashboard/help` | 4 | 114 | Help & Getting Started | — |
| `/dashboard/invite` | 0 | 78 | Invite colleagues | — |
| `/dashboard/kanban` | 0 | 29 | Kanban moved to the main dashboard | — |
| `/dashboard/offers` | 0 | 209 | Offers in Flight | — |
| `/dashboard/optionality` | 1 | 139 | Good to see you, | — |
| `/dashboard/optionality/branding` | 0 | 48 | Your narrative thesis and audience variants | — |
| `/dashboard/optionality/decision-cockpit` | 0 | 45 | Target and offer evaluation | — |
| `/dashboard/outplacement` | 3 | 47 | Outplacement by Starting Monday | — |
| `/dashboard/outplacement/counselor` | 1 | 98 | What changed, what is stuck, what to do next | — |
| `/dashboard/outplacement/enterprise` | 2 | 65 | Sponsor-safe reporting and governance gates | — |
| `/dashboard/outplacement/firm-admin` | 1 | 474 | Compare by book and by cohort | own partner row |
| `/dashboard/outplacement/operator` | 4 | 418 | Program operations overview | — |
| `/dashboard/outplacement/sponsor-report` | 2 | 170 | Sponsor Monthly Report | — |
| `/dashboard/outreach` | 3 | 475 | Outreach Hub | redirects to contacts |
| `/dashboard/partner` | 1 | 572 | Welcome, | own partner row (`notFound` otherwise) |
| `/dashboard/pilot-outreach` | 0 | 54 | Pilot Outreach | — |
| `/dashboard/placed` | 0 | 121 | Congratulations, | — |
| `/dashboard/plan` | 1 | 352 | Editable three-action operating plan | — |
| `/dashboard/positioning` | 1 | 92 | Refine your executive story. | `positioning_coach` |
| `/dashboard/post-landing` | 0 | 287 | Post-Landing - 30/60/90 Plan | — |
| `/dashboard/post-search` | 0 | 262 | Career Intelligence Mode | redirects to `/dashboard` |
| `/dashboard/profile` | 12 | 245 | Profile | — |
| `/dashboard/profile/tailor` | 2 | 136 | — | `resume_tailor` |
| `/dashboard/progress` | 1 | 87 | Search activity and operating health. | — |
| `/dashboard/results` | 0 | 259 | Results | — |
| `/dashboard/salary` | 2 | 62 | Salary Intelligence | `salary_intelligence` |
| `/dashboard/signals` | 4 | 458 | Company Signals | — |
| `/dashboard/start` | 2 | 443 | You're set up, | — |
| `/dashboard/strategy` | 1 | 72 | Search Strategy Brief | — |
| `/dashboard/strategy/intake` | 2 | 360 | Search strategy intake | — |
| `/dashboard/support` | 0 | 197 | How can we help? | — |
| `/dashboard/wrap-up` | 0 | 91 | Search Complete | redirects to `placed` |
| `/prep/communications` | 3 | 270 | Communications Prep | — |
| `/prep/companies` | 0 | 295 | Target Companies | — |
| `/prep/interview` | 1 | 222 | Interview Prep | — |
| `/prep/meetings` | 1 | 259 | Meetings Strategy | — |
| `/prep/relationships` | 1 | 298 | Key Relationships | — |
| `/settings` | 0 | 81 | Your search, on your terms | — |
| `/settings/billing` | 11 | 46 | Billing Settings | — |
| `/settings/security` | 2 | 40 | Security | — |
| `/settings/team` | 2 | 175 | Team | admin |

LOC "—" means the page file is a thin wrapper and the count was not captured. Inbound counts exclude tests and the page itself. Usage telemetry: `FirstMileTelemetry` emits `dashboard_viewed` and onboarding events only; there is no per-route view count in the repo, so inbound links are the structural proxy. A 30-day hit window from `route-inventory` is the deletion trigger after redirects go in.
