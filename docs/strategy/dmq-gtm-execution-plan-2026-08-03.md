---
doc_id: dmq-gtm-execution-plan
version: 1.0
date: 2026-08-03
status: founder execution plan (derived from sales-marketing-plan v1.1 + DM playbook v2.1)
home: docs/strategy/ (Rich's sales workspace)
inputs: sales-marketing-plan-v1.1-2026-08-03.md · linkedin-dm-playbook-v2.1-2026-08-03.md · outreach-pipeline-technical-review-2026-08-03 (mandatesignal/docs) · MSPS-DEC-004 · prospecting-source-policy-2026-07-28-v1
owners: Rich (close/send/review) · Sol (automation build) · Mo (SM tracks A/C/D + infra) · Claude (drafting/analysis)
---

# DMQ + GTM Execution Plan — Epics, Sprints, Tickets

## 0. Scope and non-negotiable boundaries

This plan operationalizes the sales-marketing plan v1.1 and DM playbook v2.1.
Every ticket below inherits these boundaries; no ticket may relax them:

- B1. No send automation: no LinkedIn API, no auto-send, no mailbox ingestion.
  Operator copies and sends manually. Copying never marks anything sent.
- B2. MSPS-003 source policy: only accepted-connection LinkedIn identities,
  operator context, firm-owned pages, primary public evidence enter the
  prospect registry. Apollo/licensed data may inform WHO TO INVITE, never
  who to import.
- B3. D9: no numeric confidence or certainty language in any outbound copy or
  report. Enforced by deterministic QA; new generation paths must route
  through the same QA.
- B4. D14/D15: no person-level behavioral tracking. Company signals only.
- B5. ENG-04 open: every sample brief stays founder-reviewed and one-off.
- B6. Truthfulness: no outcome claims (proof posts) without a labeled,
  verifiable outcome. No purged stats, ever.
- B7. Pricing single source: $250 pilot / one-time $250 credit / $1,000 per
  mandate per month (MSPS-DEC-004). Never quote another number.
- B8. Signal-engine preflight: epics E1 and E7 touch outreach ledgers and
  cross-product learning; ticket E1-T0 registers the stories in the canonical
  plan before build starts. Ticket IDs here are product-local until then.

## 1. Epic map

| Epic | Name | Repo/surface | Outcome |
|---|---|---|---|
| E1 | DMQ core: event ledger + today queue | mandatesignal | One screen that runs the whole book top-to-bottom |
| E2 | Playbook v2.1 port | mandatesignal | N1–N6 live as deterministic templates behind existing QA |
| E3 | Track B handover + collision hygiene | mandatesignal + Mo | Compliant recruiter registry; zero double-touches |
| E4 | Offer/pricing operations | mandatesignal | $250 offer fully consistent in product, docs, registers |
| E5 | Sample-brief throughput (scanner-first research) | mandatesignal | Brief production drops from hours-interactive to minutes-review |
| E6 | Marketing engine (proof posts, GEO free layer, referrals) | mandatesignal.com + LinkedIn | Inbound compounding without founder drag |
| E7 | Measurement: attribution, 10v10, kill rules | mandatesignal + tracking | Pre-registered metrics computable from system data, not memory |

## 2. Sprint sequence (2-week sprints; S1 starts 2026-08-04)

- S1 (days 1–14): E1-T0..T3, E2 complete, E3-T1/T2, E4 complete, E6-T1, E7-T1
- S2 (days 15–28): E1-T4/T5 (queue live), E3-T3, E5-T1/T2, E6-T2, E7-T2 (10v10 starts)
- S3 (days 29–42): E5-T3/T4, E6-T3, E7-T3; Mo gate data mid-point check
- S4 (days 43–56): E5 hardening, E6-T4, 10v10 verdict, first conversions
- S5–S6 (days 57–90): scale/kill decisions per §6; part-time-closer/paid-awareness revisit only if ≥10 paying

Founder time budget check per sprint: Rich ≤12 hrs/wk selling; every ticket
lists its recurring founder minutes; the sum must stay under budget or a
ticket gets cut, not the budget raised.

## 3. Tickets

### E1 — DMQ core (Sol)

- E1-T0 Governance registration. Register DMQ stories in the signal-engine
  canonical plan (outreach/opportunity-ledger scope); record decision refs
  and rollback behavior. AC: story IDs exist; preflight passes for E1/E5.
- E1-T1 Prospect state promotion. Promote thread_state, last_touch_at,
  next_touch_at from source_metadata jsonb to columns on outreach_prospects;
  add funnel-state enum (invited, connected, dm_sent, replied_positive,
  example_sent, awaiting_spec, spec_received, brief_in_production,
  brief_delivered, follow_up_due, closed_won, closed_lost, parked); backfill
  from existing metadata. AC: migration applied; existing rows preserve data;
  RLS unchanged.
- E1-T2 Event ledger. Append-only prospect_events table (event enum, payload
  jsonb, occurred_at, actor) + commitments table mirroring the workbook's
  Commitments columns. Emit events from existing write points (import, draft
  insert, follow-up copy, run create, finalize). AC: each existing action
  produces exactly one event; no send-state inference from copy events (B1).
- E1-T3 Reply logging. "Log their reply" textarea on the prospect card writes
  a reply_received event with pasted text; deterministic keyword router
  suggests next action (example follow-up / open intake / qualifier) — never
  auto-sends. AC: three structured reply classes route correctly; ambiguous
  replies route to "founder decides."
- E1-T4 Today queue page. /dashboard/dm-queue ordered by next_touch_at:
  one row per prospect, one applicable action button, "waiting on trigger"
  state visible when the day-5 follow-up rule is blocked by scanner yield.
  AC: full book executable top-to-bottom in ≤10 founder minutes/day; every
  action already exists elsewhere (consolidation only).
- E1-T5 Workbook export. Nightly render of the tracking workbook tabs
  (Commitments, Pipeline, event-derived columns) from tables, exact current
  column layout; Informants/Register-Impacts stay human-authored. AC:
  export byte-stable given same data; hand-maintenance of exported tabs stops.

### E2 — Playbook v2.1 port (Sol; small, do first)

- E2-T1 Fix N2/N5 copy for QA compliance ("will open" is banned vocabulary;
  rewrite to "before anything posts" framing), then port N1–N6 v2.1 texts
  into dm-drafts.ts lane templates; bump playbook_version to
  founder-dm-playbook-v2.1. AC: all six lanes render; every template passes
  reviewLinkedInDmDraft/reviewCommonDraftRules in unit tests; word counts ≤45.
- E2-T2 Follow-up templates. buildFollowUpDraft implementing the v2.1 rule
  (every follow-up carries a NEW dated trigger; banned: "bumping this");
  day-5 wait state + day-7 close + 3-touch cap enforced in queue logic.
  AC: follow-up with no fresh trigger is impossible to generate.
- E2-T3 Qualifier templates. buildQualifierFollowUp(prospect, missingFields,
  lane): deterministic one-question nudges derived from the intake schema's
  missing fields (this week's Gina/Keith/Travis nudges are the seeds).
  AC: passes common QA; exactly one question; zero LLM tokens.

### E3 — Track B handover (Rich + Mo + Sol)

- E3-T1 List freeze protocol. Mo delivers the recruiter list frozen (no more
  sequence sends); document that Apollo rows are invite-targeting input only
  (B2). AC: written handover note; Mo attests no further recruiter sends.
- E3-T2 Compliant ingestion. Only recruiters present in Rich's LinkedIn
  Connections.csv export (accepted connections) are imported via the existing
  attested CSV path; the rest go to an invite-first worklist. AC: every
  imported row carries the policy stamp legitimately; import dedup report
  archived.
- E3-T3 Collision check. One-time dedupe of frozen list vs outreach_prospects
  identity keys + Mo's sent history; anyone touched by a Mo sequence in the
  last 30 days gets a cooling-off hold. AC: zero double-touch in first 50
  DMQ sends (measured via E7).

### E4 — Offer/pricing operations (Sol; mostly complete)

- E4-T1 DONE via PR #134: $250 in billing constants, checkout metadata,
  display surfaces, legal page, renderer footer, order-form template,
  MSPS-DEC-004 + validator. Residual AC: verify live /pricing, /dashboard/
  billing, and a Stripe test checkout show $250 post-deploy.
- E4-T2 Register sweep. Update ga-control-register evidence line and any
  remaining $750 references (docs/master-plan.md, product-plan.md are
  historical — annotate, don't rewrite); confirm Michael Huling grandfathering
  note is recorded. AC: grep for 750 in live-surface paths returns only
  historical/grandfathered documents.
- E4-T3 Offer registry (deferred unless quoted-price drift recurs). The
  MSPS-DEC-001 artifact rule (versioned offer registry, not renderer
  literals) remains unimplemented; implement only if a second price change
  lands. AC: explicit deferral recorded.

### E5 — Sample-brief throughput (Sol build, Rich review; the big one)

- E5-T1 Scanner-first evidence path. On sample-run creation, enqueue intake
  sector/geography/size as a context scan over candidate companies using the
  existing engine (17 signal types, source URLs, dates). AC: workspace shows
  engine-surfaced candidates with evidence rows; behind a flag; agent-research
  path retained as fallback.
- E5-T2 Bounded LLM writing pass. For operator-kept candidates only, generate
  company_summary/why_now/relationship_angle/open_checks from verified signal
  rows: Haiku, strict JSON schema, cached rubric prefix, Batch API for
  non-urgent runs; output validated by existing brief QA (no %, no certainty,
  length caps) then founder-reviewed (B5). AC: per-company generation cost is
  bounded and logged; QA failure rate <10% or model/prompt revisited.
- E5-T3 Coverage-gap logging. When the engine lacks niche coverage and agent
  research is used, log the gap as a source-atlas candidate (feeds SRC-*
  wave-2 prioritization). AC: every fallback run produces a gap record.
- E5-T4 Finalize friction cut. Pre-compute suggested funnel counts from run
  data (operator confirms, never auto-submits). AC: finalize takes <5
  founder minutes.

### E6 — Marketing engine (Rich + Claude)

- E6-T1 Proof-post ladder. Until a labeled outcome exists (B6): weekly
  pattern-education posts ("what a forming CFO search looks like from
  outside"), drafted by Claude from real brief structures, no outcome claims,
  anonymization tested against the niche-insider question ("could an insider
  name the firm?"). First verified flag-to-posting hit unlocks the hit-claim
  format. AC: 4 posts in 30 days; zero claims without evidence.
- E6-T2 Referral formalization. 20% first-year commission standard written as
  a one-page partner-terms artifact (kills improvised per-call terms —
  commitments-ledger conflict #22 class); referral ask added to pilot
  onboarding and R10 moments. AC: artifact exists; 2 named asks/week logged
  as events.
- E6-T3 GEO free layer. One "how executive searches really start" evidence
  page per active niche on mandatesignal.com + schema markup + weekly posts
  republished as indexed articles. AC: pages live; branded-search/AI-referral
  baseline recorded before any paid spend.
- E6-T4 Approved-offer card. One-page card (price ladder, pilot terms,
  referral terms, prohibited-feature phrasing per B4) rendered from config,
  kept open during calls. AC: exists before the next discovery call block.

### E7 — Measurement (Sol + Claude)

- E7-T1 Yield-derived DMQ quota. Pull actual assignment yield (ready vs
  unmatched) from outreach_context_scan_runs; recompute the pre-registered
  "≥40 sends/30 days" gate from measured trigger yield BEFORE the window
  opens. AC: quota is derived, documented, and physically achievable.
- E7-T2 10v10 pre-registration. N1 vs old-A opener on matched prospects;
  arms, exclusions, and positive-reply taxonomy frozen per the MSPS-DEC-002/
  003 patterns before first send. AC: pre-registration doc committed before
  send #1; verdict recorded at completion.
- E7-T3 Attribution + funnel dashboard. Events from E1-T2 power the §5
  metrics table (paying customers, conversion rate, DMQ sends, referral
  conversations, proof posts); Mo's tracks report with true-cold/warm/referral
  tags. AC: the 30-day review reads from the dashboard, not from memory;
  kill rules evaluated on complete denominators only.

## 4. Anticipated obstacles and mitigations

| # | Risk | Likelihood | Mitigation (built into tickets) |
|---|---|---|---|
| R1 | Scanner trigger yield too low for 40 sends/30d | High | E7-T1 derives quota from measured yield first; E2-T2 "waiting on trigger" state makes scarcity visible instead of tempting generic sends (standing rule: volume is never the response) |
| R2 | Apollo list imported in violation of MSPS-003 | Medium | E3-T2 hard rule: accepted-connections only; import route's attestation + policy stamp makes violations auditable; invite-first worklist absorbs the rest |
| R3 | v2.1 templates fail deterministic QA (N2 "will open" already does) | Certain (caught) | E2-T1 fixes copy before port; template unit tests run every QA rule against every lane |
| R4 | Proof post deanonymized in a small niche | Medium | E6-T1 insider test + pattern-education format until labeled outcomes exist |
| R5 | 14-day trigger freshness expires during slow review | Medium | E1-T4 queue ordered by next_touch_at surfaces expiring triggers first; optional re-scan-on-approve refresh is a fast follow if expiry rate >10% |
| R6 | Double-touch: Mo sequence + Rich DM same prospect | Medium | E3-T3 one-time dedupe + 30-day cooling-off; identity-key check on every import |
| R7 | Founder time overruns 12 hrs/wk and queue rots | High | Per-ticket founder-minute budgets; E5 cuts the largest sink (brief research); queue SLA measured in E7-T3; if breached, cut scope not budget |
| R8 | Mo month-3 gate dispute ("qualified conversation" definitional) | Medium | Definition written with Mo in E3-T1 handover note, before data arrives |
| R9 | LLM writing pass drifts into invented facts | Low | E5-T2 generates only from verified signal rows; deterministic QA + founder review behind it (B3/B5); QA failure telemetry |
| R10 | Stripe checkout shows $250 but stale session/bookmark charges $750 | Low | Env var + code flipped in one deploy (done); E4-T1 post-deploy verification includes a live test checkout; old price left active in Stripe only for the grandfathered agreement |
| R11 | DMQ build sprawls into a CRM project | Medium | E1 tickets are consolidation-only (every action pre-exists); external CRM decision explicitly deferred to 100+ prospects |
| R12 | Single-account LinkedIn concentration (Rich's profile) | Accepted | Plan §8 accepts it; mitigation is E6 inbound + referral channels, never automation tooling (B1) |

## 5. Token and compute minimization (before execution)

Ranked by expected savings:

1. Deterministic-first everywhere (E2): openers, follow-ups, qualifiers, and
   example replies are zero-token templates behind QA. LLM drafting is
   reserved for genuinely novel situations (objections, relationship repair).
2. Scanner-first evidence (E5-T1): replaces multi-thousand-token interactive
   research loops with engine compute; the LLM only writes prose about
   pre-verified rows.
3. Bounded generation (E5-T2): Haiku + strict JSON schema + prompt-cached
   rubric prefix; Batch API (50% discount) for non-urgent population; one
   Sonnet-class review pass only if Haiku QA failure telemetry demands it.
4. Agent session hygiene (all epics): scoped worktrees off origin/main;
   read code via git show instead of full checkouts; reuse the committed
   technical-review doc as canned context instead of re-deriving pipeline
   facts each session; keep per-prospect work in the queue UI, not in
   long-lived agent conversations.
5. Reply routing (E1-T3): deterministic keyword router first; a small
   classification call only for ambiguous replies; founder judgment for the
   rest. No LLM in the happy path.
6. Content reuse (E6): every brief is delivery AND marketing input; Claude
   drafts posts from existing artifacts rather than fresh research.

## 6. Performance maximization once operational

- Queue SLA: every prospect with a due next_touch_at is actioned same-day;
  measured from event timestamps (E7-T3), reviewed in the weekly 30-minute
  pipeline review.
- Trigger freshness telemetry: % of drafts expiring un-sent; >10% triggers
  the re-scan-on-approve fast follow (R5).
- Template performance ledger: reply rate per lane per variant from logged
  events; 10v10 discipline before any template claims victory; losing
  variants retired, never "improved" mid-experiment.
- QA failure telemetry (E5-T2): generation QA failures per model/prompt
  version; drives model choice with data instead of preference.
- Coverage-gap flywheel (E5-T3): every agent-research fallback prioritizes
  the next SRC-* source build, so engine coverage compounds toward zero-
  fallback brief production.
- Kill-rule automation: §5 metrics computed from events with complete-
  denominator guards (MSPS-DEC-003 pattern); channels below half target at
  80% budget surface automatically in the weekly review.
- Quarterly plan revision (Claude) uses the event ledger as input, closing
  the loop between measured funnel behavior and the next plan version.

## 7. Success criteria (roll-up)

Engineering (per epic): all ACs above green; zero boundary (B1–B8) breaches;
npm check green on every merge; no new required-review surface bypassed.

Business (pre-registered, from plan §5): 3 paying by day 30, 10 by day 90;
first sample-to-mandate conversion by day 60; DMQ send quota met at the
E7-T1 derived number; 4 proof posts in 30 days; every free-lead firm has an
explicit convert-or-close decision by day 30 ("still checking" = no).

Process: Rich's selling time ≤12 hrs/wk sustained; brief production
<30 founder-minutes each by end of S4; tracking workbook fully generated
(zero hand-maintained event rows) by end of S2.
