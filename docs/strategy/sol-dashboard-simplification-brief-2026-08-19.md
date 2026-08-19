---
doc_id: sm-dashboard-simplification-brief
version: 1.1
date: 2026-08-19
status: ready-to-commit
home: docs/strategy/
supersedes:
  - docs/archive/dashboard-simplification-proposal-initial-2026-08-18.md
  - docs/archive/dashboard-simplification-proposal-with-help-2026-08-18.md
fulfills: Dashboard IA rebuild split from sm-clarity-brief v2.1 (CLR-4, Sol P4)
---

# Build Brief for Sol — Dashboard Simplification (Three Zones)

*Kit-side handoff from Claude (strategy layer), amended after Rich and Copilot review. Source material: the initial and help-amended dashboard simplification proposals preserved in `docs/archive/`, Cody McDaniels walkthrough 2026-08-18, `sm-call-evidence-log` 2026-08-19 (10 channel/advisor calls), and the structural audit of `src/app/(dashboard)/dashboard/page.tsx`. Where this conflicts with observed code, flag it; do not silently resolve it. A copy of this document not committed at its canonical home is a draft.*

## Amendment record — version 1.1

Rich adopted this brief with the following amendments:

1. G-4 no longer creates a MandateSignal host variant or cross-product snapshot obligation. Starting Monday and MandateSignal remain separate products, repositories, databases, deployments, tenant boundaries, and release processes.
2. Zone 1 uses explicit event precedence; posture modifies copy and CTA language rather than competing with operational state.
3. The flagged rollout retains the legacy dashboard until parity passes; legacy deletion happens promptly after the flag flip in a separate cleanup change.
4. Setup work is expressed through Zone 1 rather than becoming a fourth dashboard zone.
5. The day-60 `/dashboard/progress` review is evidence-based rather than an automatic deletion threshold.
6. The company list has no user-visible pagination in v1 but uses bounded incremental rendering above the agreed threshold.
7. The prep-brief leak is blocked at the user-facing rendering boundary, with the lexicon grep gate retained as defense in depth.
8. First-visit help is non-obstructive; it never auto-opens over Zone 1.

**Founder rulings already made (Rich, 2026-08-19):**

- **R-1 (coached mode):** v1 is solo-first. The coach dashboard and existing client task surfaces are untouched by this brief. The coached-user variant of the three zones is a separate fast-follow brief.
- **R-2 (posture):** no global default bet. One onboarding question sets posture ("actively searching / exploring, building relationships / not looking yet"); Zone 1 copy adapts from day 1. Posture is stored, changeable in settings, and reported on. This is how the watcher-versus-active mix question gets answered with data.
- **R-3 (contact data):** the candidate dashboard shows target role titles only. No Apollo-derived names, email addresses, or phone numbers render on any candidate-facing surface. Recruiter-tier contact provisioning is out of scope and requires a separate compliance-checked brief before any further sales promises.

## 0. The two rules of this pass

1. **Subtract before you add.** Seventeen sections become three zones; roughly 24–32 CTAs become no more than six. Net element count on the dashboard route goes down, and a CI gate keeps it down.
2. **Show before you tell.** Empty states teach; purpose copy explains; there is no tour and no "how to use this page" link.

## 1. DSH-0 — Decisions, verifications, and the baseline

- **V-A (audit verification).** The "17 sections / 24–32 CTAs / roughly 1,610 lines / 45+ components" counts come from a Copilot-assisted audit. Sol recounts from `page.tsx` and records the measured numbers in the PR description. Before-and-after claims use measured counts only.
- **V-B (A-grade contract reconciliation).** Sol enumerates the Dashboard A-grade contracts in `AGENTS.md` — signal parity, relative-time trust, chrome and metadata consistency, the single-main-landmark rule, cognitive fluency/load, trust integrity, and hidden-tier consistency — and maps each to the three-zone layout. Any contract the layout cannot satisfy is flagged to Rich before build. The onboarding rebuild plan's pending dashboard restructure receives the same reconciliation in the PR description.
- **V-C (leak confirmation).** Fix the prep-brief internal-text leak ("inferred penalty") and add a rendering-boundary regression test proving that internal scoring fields and vocabulary cannot reach any user-facing brief surface. Add the internal scoring blocklist to the existing CLR-8 lexicon gate as defense in depth, not as the only test.
- **V-D (signal-engine governance).** This brief is governed by the canonical signal-engine plan's WS7 Starting Monday product projection, particularly WS7-03 (evidence rendering), WS7-04 (flagged lead surfaces), WS7-08 (product promotion), and DG-09 (feature-flagged customer exposure). Product-local IA simplification and baseline instrumentation may proceed against existing supported data. New chain, role-state, assignment-belief, or other engine-derived projection remains blocked until its named WS7 prerequisites pass. The rollback behavior is the current Starting Monday dashboard; no MandateSignal runtime, data, host, or release control participates.
- **D-A (Rich, before flag flip — cannot be reconstructed later).** Run an Andy-method observational baseline with 3–5 actual executives in transition using the current dashboard cold, screen-shared, and without narration. Log verbatim what they think it wants them to do, where they stall, and their posture. This runs in parallel with coding but blocks the flag flip until entered in the evidence corpus. Instrument the current dashboard at the same time for time-to-first-action, per-section interaction, and 7-day return.
- **D-B (sort semantics — Rich confirms in one line).** Zone 2 defaults to signal recency, most recent first. This is factual ordering, not a score. No match percentage or ranking number renders anywhere on the candidate dashboard; scores remain internal. Follow-up due date is the secondary sort.
- **D-C (warm-path badge — cut from v1).** The proposal's inferred warm-path badge has no lawful data source: no LinkedIn connections import exists and scraping is prohibited. Zone 2 ships titles-only per R-3. A user-entered "I know someone here" flag on the company record is the honest v1 substitute. Any badge derived from connection data waits for a separately governed connections feature.

## 2. The three zones

The dashboard answers one question — **"What should I do today?"** — at the grain of the **company → people-to-know → angle** row.

### Zone 1 — Your next move

- Render one card at the top of the page with exactly one primary action.
- Select the operational state deterministically in this precedence order:
  1. Interview or offer event with a due action.
  2. Stale or unhealthy system data requiring transparent status copy.
  3. Due follow-up or fresh supported signal.
  4. User stalled for at least 14 days with no action.
  5. Week One activation need.
  6. Evidenced quiet state.
- Posture (`active | exploring | not-looking`) modifies the chosen state's language and CTA intensity; it does not override a higher-priority operational event. Subscription and lifecycle attributes (`trial | paid`) provide status context rather than acting as mutually exclusive recommendation states.
- Rich approves the state × posture copy table cell-by-cell. Copy templates live in a config file, and every resolved state has exactly one CTA.
- During days 1–7, the CLR-4-lite Week One banner is Zone 1. It occupies the same slot and includes next briefing time, next scan day, and today's single action in no more than 40 words. At no point do two surfaces claim "do this now."
- The trial status line renders under Zone 1: day N of 30 plus what happens on day 30. It is visible from day 1 and unchanged by this brief.
- When nothing is hot, render: "Nothing new across your N companies — last checked {relative time}. Next scan {day}." Company count and scan timestamp come from the product-local scan ledger and are never hardcoded.
- If the last successful scan is older than cadence plus grace, stale-data status replaces the quiet state. Silence never masks a dead scanner.
- If the picker cannot resolve a supported state because of missing data or an unknown edge case, it degrades to the evidenced quiet state unless the stale-data rule applies. It never invents a recommendation.
- Setup and activation work is not a separate checklist or fourth zone. Until activation completes, the highest-priority incomplete setup action becomes Zone 1's next move. Once complete, setup content is absent from the DOM.
- Low-confidence language never overclaims; all Zone 1 claim templates pass the claims-manifest gate in section 4.

### Zone 2 — Your companies

One row renders per tracked company.

| Column | Content |
| --- | --- |
| Company | Name and sector |
| Latest signal | What happened plus age, for example "Hiring VP Engineering — 3 days ago." Factual, dated, and sourced. |
| Who to know | Approximately three target role titles per R-3. Optional user-set "I know someone here" flag per D-C. |
| Action | One `Get brief` link |

- This zone replaces the companies panel, pipeline table, signals section, and warm-path section. Those standing sections are deleted after flagged parity passes; they are not retained as dormant modules.
- Default ordering follows D-B. No numeric score renders.
- At 390px, render cards rather than a table: company, latest signal, and one action per card, with role titles behind one tap. Apply the SMK-164 tap-target and zoom fixes and test at 390×844.
- The empty state is the tutorial. It explains what will appear and gives the one action that fills it: "Add a company you'd want to be shortlisted at — we start watching it today."
- Above 15 rows, show a quiet posture-appropriate filter for active companies versus watching.
- V1 has no user-visible pagination of the primary list. The implementation must still bound initial DOM and data work: render the first 50 rows, incrementally load additional rows on explicit user request or viewport approach, preserve sort/filter state, and verify keyboard and screen-reader continuity. Do not interpret "unbounded" as rendering every record at once.

### Zone 3 — This week

Render one quiet strip with three values and three links: follow-ups due · new signals this week · next briefing time. Each value links to its detail view. Nothing else renders in this zone. During days 1–7, suppress duplicated briefing content when Zone 1 already carries it.

### Everything else moves off the page

| Today | Home |
| --- | --- |
| Campaign health, momentum score, velocity, activity charts, weekly performance, offer cockpit | `/dashboard/progress` |
| Setup steps | Expressed as Zone 1 activation states until complete, then absent from the DOM |
| Executive decision brief | Resolved within Zone 1 |
| Plan, briefs, and signal detail | Reached from Zone 2 rows and Zone 3 links; standing sections deleted after parity |
| End-of-day reflection and notes | `/dashboard/progress`; no dead-end inputs remain on the primary page |

Instrument `/dashboard/progress` and review it 60 days after the flag flip. Usage below 10% of weekly-active users triggers review, not automatic deletion. Decide whether to keep, simplify, or delete using posture/lifecycle cohort usage, user outcomes, qualitative evidence, maintenance cost, and accessibility/performance burden. Record the decision and review date in the tracker.

Offer-stage users remain represented through Zone 1. The cockpit leaves the primary page, but an interviewing or offer event can win the Zone 1 precedence and link into the appropriate detail surface.

## 3. Word budgets — measured, then locked

First, produce a measured render report of the current dashboard, including words per section and CTA count. Then ratify budgets with Rich in one round at ±20% and lock them into CI using the existing landing-page budget mechanism rather than forking it.

Seed targets, subject to ratification:

| Surface | Target |
| --- | ---: |
| Zone 1 card in any state | ≤40 words |
| Zone 2 heading and purpose line | ≤20 words |
| Per-row rendered text excluding company name | ≤25 words |
| Zone 3 strip | ≤15 words |
| Purpose line under each zone heading | ≤12 words |
| Route total above the fold excluding row data | ≤120 words |
| Primary CTAs on route | ≤6 |

## 4. Gates

- **G-1 Claims manifest (CLR-6).** Every Zone 1 and Zone 2 claim template maps to a manifest entry. Predictive phrasing such as "three roles likely circling it" either carries supporting signal and date evidence inline or does not render. Include a planted-violation test.
- **G-2 Lexicon (CLR-8).** All new dashboard copy passes the plain-language lexicon. "Signals mean a role may be forming before it's posted" is the approved gloss pattern. Jargon receives an inline gloss on first use or is replaced. Internal mode, tier, and scoring vocabulary never renders. V-C's rendering test is primary; the merged blocklist is defense in depth.
- **G-3 Element budget — the accretion firewall.** CI counts dashboard zones/sections and primary CTAs. Exceeding the ratified budget fails the build. Any proposal for the dashboard route must identify what it displaces inside the budget. This standing gate prevents the dashboard from returning to 17 sections through individually reasonable additions.
- **G-4 Product and release isolation.** This work introduces no MandateSignal code, data, runtime, table, host, snapshot, deployment, tenant, or release dependency. Starting Monday uses only product-local adapters and evidence. No cross-product table access, synchronous dependency, event-level export, or launch-control bypass is permitted. A repository guard or targeted test proves the new dashboard imports no MandateSignal package or host-specific variant.
- **G-5 A-grade contracts.** CI verifies signal-count parity across dashboard, briefing, and signals for the same session and filters; deterministic relative-time labels; consistent chrome and metadata; exactly one main landmark; desktop/mobile hidden/loading/error states; cognitive fluency/load; trust integrity; and hidden-tier consistency.

## 5. Help and guidance

- Do not add a "how to use this page" link.
- Keep the existing floating `?`. Behind it, provide a "How this works" panel explaining the three-step loop in approximately five sentences with one link per step:
  1. We watch your companies for signals.
  2. A signal means a role may be forming.
  3. You reach the approximately three people who could say your name.
- The panel is always retrievable and dismissible. On first visit, use a small inline callout or a restrained highlight on the `?`; do not auto-open a modal, drawer, or overlay over Zone 1.
- Add one purpose line of no more than 12 words below each zone heading.
- Concierge remains human for the first cohort. The D-A observational sessions double as walkthroughs.

## 6. Intake rule — the accretion firewall

Feature requests from channel calls — including culture fit, integrations, white-label, recruiter business development, accountability coaching, stale-posting detection, and relationship-pipeline views — do not automatically land in the three zones. They enter the backlog with an explicit destination: `/dashboard/progress`, a partner surface, a separate product, or declined.

Anything proposed for `/dashboard` must displace an existing element inside G-3's budget. Rich enforces the product rule; CI enforces the implementation rule. This firewall is the durable value of the redesign.

## 7. How we'll know it worked

- Repeat the D-A observational session with 2–3 users on the new dashboard. Require zero narration and ask:
  1. "What is this page telling you to do?"
  2. "Why is this company worth acting on now?"
- Users must be able to state the company → people-to-know → angle loop in their own words.
- Report Zone 1 recommendation acceptance by posture.
- Compare 7-day return rate with the D-A baseline.
- Measure time-to-first-action for active-posture users only. A watcher correctly told "nothing needs you today" does not count against the metric.
- Report `/dashboard/progress` use by posture and lifecycle for the day-60 review.
- Interpret help-panel open rate only alongside observational evidence; a low rate alone proves nothing.

## 8. Sequencing

1. **Foundation PR:** complete V-A measured counts, V-B contract map, V-C leak fix/test, V-D governance mapping, baseline instrumentation, and the posture field/question. Start D-A recruitment the same day.
2. Ratify word budgets and add G-1, G-2, G-3, G-4, and G-5 before new dashboard copy lands.
3. **Flagged-layout PR:** build the three-zone dashboard behind a default-off Starting Monday feature flag. Keep the legacy dashboard as the fallback while parity and observational checks run. Do not create any MandateSignal variant.
4. **Flag-flip gate:** require D-A baseline evidence, a zero-narration walkthrough on the new layout, the WS7/DG-09 applicable evidence, and all product-local gates green on desktop and mobile. If any gate fails, leave the existing dashboard authoritative.
5. **Cleanup PR:** after the successful flip, promptly delete the legacy sections, their dead imports/data-loading paths, and the temporary flag branch. G-3 prevents re-accretion.
6. At day 60, complete the evidence-based `/dashboard/progress` review and posture-mix readout.

## 9. Out of scope

- Coach dashboard and coached-user three-zone variant (R-1; separate brief)
- Recruiter-tier contact provisioning (R-3; separate compliance-checked brief)
- Connections import or warm-path-from-data (D-C)
- Culture-fit feature
- Any MandateSignal surface, host, repository, data, runtime, or release action
- Pricing and tier changes
- Landing page (CLR-1 owns it)
- Redesigning the relocated analytics themselves
- New engine-derived outputs whose WS7 prerequisites have not passed

## 10. Founder items

1. Confirm D-B in one line: signal-recency ordering and no rendered scores.
2. Recruit and run D-A with 3–5 executives in transition, screen-shared and without narration.
3. Approve the Zone 1 state-precedence × posture copy matrix cell-by-cell.
4. Ratify the section 3 word budgets against the measured render in one round.
5. Approve the onboarding posture question wording in plain language.
6. Hold the section 6 intake rule on sales calls: no new dashboard-feature promises without a destination and displacement decision.
7. Approve the product-local WS7/DG-09 gate mapping before the flag flip.
