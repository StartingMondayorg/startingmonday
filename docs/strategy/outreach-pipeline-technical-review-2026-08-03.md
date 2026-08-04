# MandateSignal Outreach-to-Revenue Pipeline: Technical Review Document

Date: 2026-08-03
Author: Founder (Richard Rothschild) with agent assistance
Purpose: External technical review (Claude). This document describes, in implementation-level detail, every program in the pipeline that runs from LinkedIn cold connection request to delivered sample brief to next-touch outreach. The reviewer is asked to critique the architecture against four goals: (1) automate what is practical, (2) reduce wall-clock time per prospect, (3) minimize LLM token spend, (4) maximize response quality — while respecting the governance constraints in Section 9, which are deliberate and non-negotiable.

Status of claims: everything in Sections 2-7 is read directly from the repository at `origin/main` (SHA 8f72b35) and from the production tracking workbook dated 2026-08-03. Section 8 is proposal, not implemented.

---

## 1. Business context (minimum necessary)

MandateSignal sells timing intelligence to recruiters: evidence that a company is likely to open a leadership search before the role is posted. The current go-to-market is founder-led: LinkedIn connection requests to recruiters, a short deterministic DM when a fresh trigger exists, a fictionalized example brief when they ask "show me," a one-question qualifier to pin function/geography, then a tailored three-company sample brief built from live public evidence, founder-reviewed, delivered manually. The close is a $750 L2 offer (ratified, MSPS-002). Roughly 16 informants/prospects are in play; 6 sample-brief prospects were nudged or delivered this week.

The pipeline is deliberately split into a deterministic, zero-LLM messaging layer and an expensive, evidence-bound research layer. The messaging layer is cheap and fast. The research layer is the bottleneck: it currently consumes hours of interactive agent time per pair of briefs.

---

## 2. Pipeline stages and where each one lives

```
Stage 0  Target acquisition        tmp/filter-recruiter-connections.mjs (repo script, manual run)
Stage 1  Prospect import           POST /api/dm-drafts/import              (production route)
Stage 2  Context scanning          POST /api/dm-drafts/scanner/run
                                   src/lib/dm-context-scan-dispatch.ts
                                   src/lib/dm-context-scan-runner.ts
                                   engine/run-feed-scan-supervised.mjs (child process)
Stage 3  DM draft generation       POST /api/dm-drafts/prospects/[id]/generate
                                   src/lib/dm-drafts.ts (templates + deterministic QA)
Stage 4  Review and manual send    /dashboard/dm-drafts, dm-draft-review-card.tsx
Stage 5  Reply handling            src/lib/dm-example-follow-up.ts (example ask)
                                   ad-hoc agent drafting (qualifying nudges)  <- manual
Stage 6  Sample brief intake       POST /api/sample-brief-request (public form)
                                   /admin/sample-briefs/new (admin intake)
                                   src/lib/sample-brief-outreach-inference.ts (LinkedIn bridge)
Stage 7  Candidate research        interactive agent session + tmp/populate-sample-briefs.mjs  <- manual, expensive
Stage 8  Review, finalize, render  /admin/sample-briefs/[id], sample-brief-finalization-panel,
                                   qaSampleBrief in src/lib/sample-brief.ts, finalize_sample_report RPC,
                                   /admin/sample-briefs/[id]/print and /csv
Stage 9  Delivery + follow-up      manual (email/LinkedIn thread)
Stage 10 Tracking                  evidence-corpus-and-commitments.xlsx     <- fully manual
```

Stack: Next.js App Router on Railway, Supabase Postgres (service-role clients for admin paths, RLS elsewhere), a Node "engine" directory of ~40 public-source signal fetchers, Anthropic SDK used in exactly two production paths (Section 7).

---

## 3. Data model (tables that matter to this pipeline)

- `outreach_prospects` — one row per human prospect. Key columns: `org_id`, `identity_key` (sha256 over normalized LinkedIn URL or name+company, unique per org — the dedup mechanism), `playbook_lane` (n1..n6), `niche`, `context_status` (`needs_context` | `ready`), trigger fields (`trigger_company`, `trigger_role`, `trigger_summary`, `trigger_date`, `source_url`, `evidence_quality`, `context_source_id`), `context_signal_id` (FK to the engine signal used, uniquely assigned), `context_scan_run_id`, `source_policy_version`, `operator_attested_at`, `source_metadata` (jsonb: geography, persona, thread_state, last_touch_at, next_touch_at, status, notes, connected_on).
- `outreach_context_scan_runs` — scan run lifecycle: status, checkpoint fields, `last_activity_at`, worker lease columns (added in the 2026-08-03 reliability migrations after a deploy orphaned a run mid-flight).
- `outreach_drafts` — generated DM bodies: `variant` (`validated_signal` | `relationship_context`), `review_status`, `qa` (jsonb result of the deterministic reviewer), `trigger_fingerprint` (sha256 of variant+trigger fields, unique — regenerating the same context returns the existing draft instead of a duplicate), `playbook_version`, word/character counts.
- `recipes` / `tracked_companies` / `company_signals` — the engine's normal scanning model; the DM scanner creates a purpose-tagged recipe (`purpose: dm_context_scanner`) and reuses the whole signal infrastructure rather than duplicating it.
- `sample_brief_requests` — public-form submissions (idempotent by sha256 of email+firm+day; HMAC-hashed source IP; consent timestamps).
- `sample_prospects` / `sample_runs` / `sample_candidates` / `sample_reports` — the sample-brief workflow (migration 20260728190000 onward). `sample_candidates` has hard CHECK constraints: disposition `priority` requires assignment fields, `watch` requires null contact fields, `internal_niche_fit` 0-100, unique (run_id, company_key). Migration 20260803050000 adds the LinkedIn-origin bridge: a sample prospect may carry `outreach_prospect_id` instead of an email, with a database trigger enforcing same-org linkage.

---

## 4. Program-by-program narrative

### 4.1 Stage 0 — `tmp/filter-recruiter-connections.mjs`

What it does: reads the raw LinkedIn `Connections.csv` export (the official LinkedIn data export, so no scraping), parses CSV with a hand-rolled quoted-field parser, and applies two regexes — one over Position (`recruit|talent acquisition|head hunt|staffing|executive search|retained search|search consultant|search partner|sourc(er|ing)|talent partner|placement`) and one over Company (`recruit|staffing|talent|personnel|head hunt|placement|\bsearch\b|\bstaff\b`). Matches are sorted title-matches-first, then by connection recency, and written to a W1 target CSV with name, company, position, match basis, connect date, email, LinkedIn URL.

Why it exists: LinkedIn connection accepts are the only compliant identity source under the no-provider policy (MSPS-003: LinkedIn identity-only, operator context, firm-owned pages, primary public evidence; licensed CSV/API prohibited). This script turns a 30-second LinkedIn export into a ranked ICP list with zero external data purchases and zero tokens.

Characteristics: pure deterministic, runs in under a second, output feeds Stage 1's CSV import. Human steps around it: sending connection requests (done by Mauricio via Apollo/Sales Navigator targeting, and by Richard personally) and exporting the updated Connections.csv periodically.

### 4.2 Stage 1 — `POST /api/dm-drafts/import`

What it does: authenticated, same-origin-only route accepting either a CSV upload or a single manual form. Two CSV dialects are auto-detected by header shape:

1. Accepted-connection format (`name`, `title_summary`, `thread_state`, ...): rows become `needs_context` prospects in lane `n1_cold_lead`, with up to ten bounded metadata fields (geography, persona, thread_state, last_touch_at, next_touch_at, status, notes, connected_on, export_position) preserved in `source_metadata`. This is the low-friction path from the Stage 0 output.
2. Full-context format (first_name, last_name, ..., trigger_company, trigger_date, context_source, evidence_quality): rows are validated against `DmProspectSchema` and land `ready` — usable for drafting immediately.

Validation is strict and enumerable: lanes must be one of six playbook lanes; `context_source` must be one of four approved source IDs and `evidence_quality` must match a hard mapping to that source (e.g. `public_primary_business_evidence` -> `primary_source`); public evidence requires a source URL; trigger summaries may not contain URLs; trigger dates must be real calendar dates; referral lane requires a named mutual. Limits: 100 rows, 512,000 bytes. Every row is stamped with `PROSPECTING_POLICY_VERSION` (`prospecting-source-policy-2026-07-28-v1`) and `operator_attested_at` — the import form requires an explicit "approved for use" attestation checkbox, which is what makes the operator (not the system) the accountable source of the identity data.

Dedup: `identity_key` is a sha256 over the normalized LinkedIn URL (or name+company fallback) plus the trigger tuple; upsert with `ignoreDuplicates` returns imported vs duplicate counts. Re-importing the same export is a no-op.

Why this design: it makes the compliance boundary structural. Nothing can enter the outreach system without an attested source, an approved evidence-quality pairing, and a policy version stamp — so audits are a query, not an investigation.

### 4.3 Stage 2 — the DM context scanner

Entry: `POST /api/dm-drafts/scanner/run` creates an `outreach_context_scan_runs` row and dispatches (`dm-context-scan-dispatch.ts` fires the runner without blocking the request). The runner (`dm-context-scan-runner.ts`, 538 lines) then:

1. Selects up to 100 org prospects with `context_status = 'needs_context'` and no assigned signal, oldest first.
2. Groups them by normalized firm name (`groupProspectsByFirm`) so one company scan serves every prospect at that firm.
3. Ensures a dedicated recipe exists (`purpose: dm_context_scanner`), configured for recruiter-channel company scanning: 17 subscribed signal types (funding, exec_departure, exec_hire, acquisition, ipo, layoffs, expansion, new_product, job_posting, financial_report, breach_disclosure, regulatory_change, award, hiring_intent, headcount_proxy, activist_accumulation, infra_signal), 45-day scoring horizon, 0.6 minimum confidence.
4. Ensures a `tracked_companies` row per firm group (insert-if-missing by normalized name).
5. Determines which companies actually need scanning (`companyIdsNeedingScan` — recency-aware, so re-runs skip freshly scanned firms).
6. Executes the engine as a supervised child process: `engine/run-feed-scan-supervised.mjs --recipe-id ... --company-ids ...` in batches of 5 companies, 15-minute worker lease, 12-minute process timeout, 5 MB stdout buffer. Results come back over stdout on a sentinel-prefixed line (`__DM_CONTEXT_SCAN_RESULT__{json}`), parsed by `parseFeedScannerOutput`. The supervised wrapper plus the run-table lease/checkpoint columns are the SA-14C reliability fix: a Railway deploy mid-run previously orphaned the run silently; now runs checkpoint `last_activity_at`, record the release SHA, and a recovery path can resume or mark partial.
7. Loads all `company_signals` from the last 14 days for the scanned companies and the set of signal IDs already assigned to any prospect in the org.
8. `planContextAssignments` (pure function, unit-tested separately in `dm-context-scanner.ts`) picks the best fresh signal per prospect with global duplicate suppression — two prospects never get the same signal, enforced twice: in the planner and by a unique constraint (23505 collisions are counted as suppressed, not errors).
9. Winners are updated to `context_status='ready'` with the full trigger tuple (company, role, summary, date, source URL, evidence quality, lane). Losers stay `needs_context`; the run records ready/unmatched counts.

Why this design: it converts the expensive part of personalization — "what is actually happening at this prospect's firm right now" — into engine work against public primary sources instead of LLM speculation. The last production run covered 84/84 firms with zero worker errors. Token cost of this stage: zero in the scan path itself (see Section 7 for the one key-gated exception).

### 4.4 Stage 3 — deterministic DM generation (`src/lib/dm-drafts.ts` + generate route)

The generate route loads the prospect and branches on `context_status`:

- `ready` -> variant `validated_signal`. The prospect re-validates through `DmProspectSchema`, then `buildLinkedInDmDraft` selects one of six fixed lane templates. Example (n1_cold_lead): "{TriggerCompany} looks ready to open a {TriggerRole} search. {TriggerSummary} on {MonthDay}. Yours, no catch. I find these before they post. Want the next one in {niche}?" The other lanes adapt the same structure for transparency-framed cold, informant, coach, profile-visitor, and referral (named mutual required) audiences.
- `needs_context` but a completed/partial scan exists -> variant `relationship_context`. This is the honest fallback when the scanner found nothing fresh: templates reference the prospect's firm and focus area with no invented trigger ("I follow leadership situations before roles are public and only share one when the evidence is concrete. Worth staying in touch for the next relevant one?"). If no scan has completed, generation is refused with a 409 `PROSPECT_CONTEXT_HOLD` — the system will not draft from nothing.

Every draft passes a deterministic QA reviewer before insert, and a failing draft is a 422, not a warning. The rules encode the founder playbook as executable checks:

- Hard limits: <= 45 words, <= 350 characters (LinkedIn DM economics).
- Must contain the trigger company and the formatted trigger date (validated_signal) or the firm name (relationship_context).
- Trigger must be 0-14 days old — stale triggers cannot ship.
- No URLs (LinkedIn suppresses link DMs and they read as spam).
- No em dashes (voice rule).
- No numeric confidence (`\b\d{1,3}(\.\d+)?\s*%`) and no certainty claims (`guaranteed|definitely|confirmed opening|we know you are hiring|will open`) — this is decision D9 (no prediction language without calibration) enforced at the character level, after a real incident where "95% confidence" shipped in a lead report.
- Exactly one question, and it must end the message in a low-effort-answer form (regex on auxiliary-verb question stems).
- No meeting ask (`call|meeting|calendar|book time|minutes`) — the playbook sells the next artifact, not a calendar slot.
- Relationship-context drafts additionally may not mention scanning or absent evidence ("no validated", "nothing found") so the fallback never leaks internal mechanics.

Inserts carry a `trigger_fingerprint` unique key, so regenerate is idempotent. Drafts land `pending_review`; the review card UI (Stage 4) is where the operator edits, approves, copies, and manually sends. There is deliberately no send API (Section 9).

Why deterministic instead of LLM: six audiences x two evidence states = twelve fixed messages parameterized by validated data. An LLM adds variance, token cost, and QA failure modes to a message class whose entire value is the verified trigger, not the prose. The QA reviewer exists anyway; making the generator deterministic means QA failures are template bugs (fix once) rather than sampling noise (retry forever).

### 4.5 Stage 5 — reply handling

Two reply classes have structured handling today:

1. "Show me an example" -> `buildDmExampleFollowUp` (20 lines, deterministic): a personalized reply containing the public fictionalized brief URL (`/sample-brief/example`, a static page with three fictional examples and an explicit disclaimer), a one-sentence description of what the format shows, and exactly one tailoring question — if the prospect's niche is known, "which geography should I use for a tailored three-company sample?", otherwise "which function and geography...". The workflow contract (docs/readiness/dm-example-follow-up-contract.md) fixes the boundaries: fictionalized example only, no live-mandate claims, copy-to-thread manual send, copying does not mark anything sent, no mailbox ingestion, no auto-response.
2. Function+geography supplied -> Stage 6 intake.

Everything else — qualifying nudges (coach vs recruiter framing, sector/geography confirmation, purpose disambiguation), objection responses, re-engagement after silence — is currently drafted ad hoc in interactive agent sessions and hand-sent. This week that meant three bespoke nudges (Gina, Keith, Travis) and one qualifying note (new prospect), each requiring an agent conversation turn plus, in one case, transcript review and live web research on the prospect. This is the least systematized stage and a major token consumer relative to its output size (Section 7).

### 4.6 Stage 6 — sample brief intake (three doors)

1. Public form (`/api/sample-brief-request` + `sample-brief-request.ts`): full Zod-validated spec — firm type enum, target sectors, role functions, seniority, geography, ownership preference, employee band (min < max, cap 50,000), example companies, exclusions, timing, consent literals. Idempotent per email+firm+day via sha256; source IP stored only as an HMAC keyed by the service-role secret; a notification email flag tracks operator alerting. This is the inbound door.
2. Admin intake (`/admin/sample-briefs/new`): the operator creates a review workspace directly with the same parameter shape. This is the door used after a call where the prospect specified their spec verbally.
3. LinkedIn-origin bridge (new, PR #129, story WS10-02): when the conversation lives on LinkedIn and no email exists, the operator opens a sample workspace from an `outreach_prospects` row. `inferSampleBriefInitialValues` (82 lines, pure) maps the attested profile context to intake defaults via keyword rules — e.g. title containing "executive search" -> firm_type `retained`; "data center" context -> sector/function/size-band defaults; "healthcare technology ... South Africa" -> an executive/informant market-brief framing instead of a recruiter lead list. Every inferred value is labeled inferred, editable, and gated behind an explicit operator confirmation before run creation. Four fields are never inferred and stay blank until the prospect confirms them: companies to avoid, known relationships, current clients, engaged search firms. Reopening the same prospect+cycle returns the existing workspace (DB uniqueness + application recovery); a trigger enforces prospect/sample same-org consistency.

Why three doors: the funnel is multi-channel by nature (inbound form, calls, LinkedIn threads) but everything converges on one run/candidate/report data model and one QA gate, so downstream stages are channel-agnostic.

### 4.7 Stage 7 — candidate research and population (the bottleneck)

Current mechanics, exactly as executed for the two delivered briefs on 2026-08-03:

1. An interactive agent session reads the prospect's intake parameters (sector, geography, functions, size band).
2. The agent performs live web research: search-engine queries, fetching publisher pages (PR wires, trade press, firm-owned newsrooms), verifying each candidate trigger's date, source URL, and content. Every evidence item must be independently fetchable and dated — fabrication is structurally excluded because Stage 8's QA re-checks dates and display rights, and the founder reviews every company.
3. The agent writes/updates `tmp/populate-sample-briefs.mjs`: a service-role script that builds snake_case company bundles (company_key, evidence_status, company_summary, why_now, likely_role_families, relationship_angle, timing_band, open_checks, contact fields, internal_niche_fit, evidence array with status/source_label/source_url/event_valid_from/display_rights) and calls the `import_sample_candidate_bundle` RPC (1-25 companies, 1-20 evidence items each, run must be in `review` status, unique per run+company_key; idempotence handled client-side by skipping runs that already have candidates).
4. The script then sets dispositions directly: `priority` rows get `assignment_checked_at` (noon UTC of the check date) and an `assignment_read` string that must byte-match `buildAssignmentRead(companyName, date)` from `src/lib/sample-brief.ts` — the finalize QA does an exact string comparison, em dashes and curly apostrophes included. `watch` rows must carry null contact fields (DB CHECK + QA).
5. Run via `railway run --service mandatesignal-web --environment production -- node tmp/populate-sample-briefs.mjs`.

Wall-clock for two briefs (nine companies, nine verified evidence items): a multi-hour interactive session, dominated by web research and verification. Token cost: the entire session's context — far and away the largest LLM spend in the pipeline (Section 7).

### 4.8 Stage 8 — review, QA, finalize, render

The admin workspace (`/admin/sample-briefs/[id]`) lists candidates with dispositions and evidence. The finalization panel collects what only the operator knows: funnel counts (evaluated = matched + outside_filters; matched = shown + withheld — cross-checked arithmetic), source families, unavailable sources, and operator minutes (scan review / selection / writing / render — all >= 0). `qaSampleBrief` then enforces, before the `finalize_sample_report` RPC will produce the immutable report:

- Exactly 3 priority companies; at most 2 watch.
- No percentage anywhere in the serialized report (regex over the whole camelCase JSON) — D9 again.
- No retired temporal vocabulary (`clock_start`, `public_knowable_date`, `event_valid_at`, `observed_at`) — enforcing the temporal-honesty rename.
- Every company >= 1 evidence item; all evidence `display_rights='approved'`; anything dated before the 90-day window (`SAMPLE_EVIDENCE_WINDOW_DAYS`) must be status `background`, not a live trigger.
- Priority `assignment_read` byte-equality with the canonical template; watch rows contact-free; the watch appendix carries a fixed hedge sentence.

Finalize produces an immutable `sample_reports` row; `/print` renders the deliverable artifact (`sample-brief-render.ts`, 335 lines) and `/csv` exports the machine-readable version (a direct response to a prospect request logged in the tracking sheet: "CSV/spreadsheet export alongside brief").

Why the QA is this strict: the product's only moat at sample stage is trust. A single unverifiable date, over-claimed probability, or stale trigger in a founder-signed brief is unrecoverable with a retained-search buyer. The QA gate makes the trust rules cheaper to follow than to break.

### 4.9 Stage 10 — the tracking workbook (fully manual)

`evidence-corpus-and-commitments.xlsx`, six tabs, maintained by hand after every call:

- README: maintenance protocol ("after every call: add/update the Informant row, add any new Commitments...").
- Informants (16 rows): per-informant coded fields — type, segment/firm, relationship (CLOSE/WARM/ARMS-LENGTH), recency, channel signal, key evidence, pricing datapoint, protocol fields captured, register rows touched, next step/owner.
- Commitments (30 rows): every open promise, with stated timeframe, effort estimate, status, register-conflict flag, recommended action. Current state includes one DELIVERED, several OVERDUE/WAITING, and a flagged systemic conflict ("Product #3" person-tracking promised on 4+ calls vs the D14/D15 prohibition).
- Pipeline (6 deals): stage per DEAL_WORKFLOW, economic fit, next action, owner, target date, risk.
- Register Impacts (18+ rows): which kit assumptions each piece of call evidence moves, with direction and status suggestion.
- Transcript Index: informant -> transcript file mapping, including known gaps.

This workbook is the de facto CRM, evidence ledger, and commitment tracker. Nothing in the production system writes to it or reads from it. Every row is manual transcription from calls and threads. It is simultaneously the most valuable dataset in the company (verbatim market evidence keyed to a governed assumption register) and the least automated component of the pipeline.

---

## 5. What is automated today vs manual

Automated (deterministic, zero tokens): connection filtering, prospect import + dedup + policy stamping, firm scanning against 17 public signal sources, signal-to-prospect assignment, DM drafting for 12 template classes, DM QA, example-request replies, intake validation across three doors, LinkedIn-bridge parameter inference, brief QA, immutable finalize, print/CSV render.

Manual today: sending connection requests; exporting Connections.csv; pressing "run scanner"; reviewing/approving/sending each DM; recognizing and classifying replies; drafting every non-example reply (nudges, qualifiers, objections, re-engagement); candidate research and evidence verification; writing/running the population script; finalize inputs; sending the brief; every row of the tracking workbook; every follow-up decision about who needs what touch when.

---

## 6. Observed performance characteristics

- Scanner: 84 firms per run, batches of 5, 12-minute cap per child process; run-level checkpointing survived a production deploy after the SA-14C fix. Cost: engine compute only.
- DM generation: instantaneous, idempotent, zero failure modes in production since QA is pre-insert.
- Sample brief cycle: intake to populated run is hours of interactive agent research per 1-2 briefs; finalize/render is minutes. The published example follow-up sets a "tailored three-company sample" expectation, so the research stage sits directly on the critical path of every warm reply.
- Reply latency: entirely dependent on the founder noticing the thread and either using the example follow-up panel or convening an agent session. There is no queue, no SLA surface, no state visible outside LinkedIn/inbox plus manual workbook rows (where `source_metadata.thread_state` exists but is neither promoted nor maintained systematically).

---

## 7. Where LLM tokens are actually spent

1. Interactive agent research/population sessions (Stage 7) — dominant cost by an order of magnitude. Full conversational context, live web fetches with large page extractions, multi-turn verification, code writing. Also used for Stage 5 bespoke replies, which individually are small outputs riding on large session contexts.
2. `engine/signals/generate-outreach-draft.js` — Haiku, `max_tokens: 300`, JSON subject+body, prompt-injection-hardened via `serializeUntrustedData` + explicit untrusted-data instruction. This serves the candidate-side product (executive outreach drafts on leads), not the recruiter DM pipeline. Cost per call: a few hundred tokens.
3. `engine/signals/llm-adjudicate.js` — key-gated signal adjudication in the engine; disabled without an API key; bounded per-signal.

The recruiter DM pipeline itself (Stages 1-4, 5-example, 6, 8) spends zero tokens. This asymmetry is the central fact for optimization: the token problem is not the messaging layer, it is the research layer and the ad-hoc reply layer.

---

## 8. Improvement proposals (prioritized)

### P1. Replace the manual tracking workbook with a generated one (highest leverage, no new risk)

Mechanism: a `prospect_events` append-only table (prospect_id, event_type enum: connection_accepted, dm_sent, reply_received, example_sent, qualifier_sent, spec_received, brief_populated, brief_finalized, brief_delivered, commitment_made, commitment_resolved; payload jsonb; occurred_at; actor) plus a `commitments` table mirroring the workbook's Commitments columns (promised_to, promise, timeframe, effort, status, register_conflict, recommended_action). Write points already exist in code for half of these events (import, draft insert, follow-up copy, run create, finalize) — they just don't emit anywhere. A nightly script (or on-demand admin route) renders the xlsx tabs from these tables in the exact current column layout, so the workbook becomes an export artifact instead of a hand-maintained source of truth. The Informants and Register Impacts tabs stay human-authored (they encode judgment), but gain generated columns (last event, next_touch_at) instead of hand-copied ones.

Why first: the workbook is the pipeline's memory, it is already drifting (thread_state unmaintained, commitments overdue), and Section 4.9 shows commitment sprawl is an active business risk (D14/D15 conflict promised on four calls). Structured events also unlock P2 and P6. Token cost: zero.

### P2. A "today queue" — promote thread state to first-class workflow

Mechanism: promote `thread_state`, `last_touch_at`, `next_touch_at` from `source_metadata` jsonb to columns on `outreach_prospects`, add a state enum matched to the actual funnel (invited, connected, dm_sent, replied_positive, example_sent, awaiting_spec, spec_received, brief_in_production, brief_delivered, follow_up_due, closed_won, closed_lost, parked), and render a single dashboard page ordered by next_touch_at with the one applicable action per row (generate draft / copy example follow-up / open intake / open workspace / log reply). Every action button already exists somewhere; this consolidates them behind a queue so executing the whole book across all prospects is a top-to-bottom pass instead of memory-driven thread archaeology.

Why: the founder's stated goal is "easy to execute this process in a timely manner across all potential customers." The current failure mode is not capability, it is dispersion. Token cost: zero.

### P3. Template-ize the qualifying replies (Stage 5) the same way DMs were

Mechanism: the intake schema already defines exactly which parameters a tailored brief needs (function, geography, sector, firm type, purpose). A reply that doesn't pin them down needs a qualifier asking for precisely the missing fields. Build `buildQualifierFollowUp(prospect, missingFields, personaLane)` as deterministic templates in the style of `dm-example-follow-up.ts`: coach lane asks market-brief-vs-lead-list; recruiter lane asks sector/geography; ambiguous-purpose lane asks the use-case question; each ends with exactly one low-effort question and passes the existing common QA rules. The three bespoke nudges written this week are the template seeds — they were all instances of "name the missing intake fields, ask one question, keep the honest caveat."

Why: converts the highest-frequency agent-drafting task to zero tokens with QA-guaranteed voice consistency. Keep the agent path for genuinely novel situations (objections, relationship repair), which is where its judgment is actually worth the spend.

### P4. Cut the research bottleneck with a scanner-first evidence path

Mechanism: Stage 7 currently ignores the engine and does bespoke web research. Invert it: on sample-run creation, automatically enqueue the intake's sector/geography/size band as a context-scan over candidate companies (the engine already has funding, exec moves, expansion, SAM.gov, WARN, state-registry, people-moves, CT-log, ad-activity, 13F sources with per-signal source URLs and dates). The operator then reviews engine-surfaced candidates in the workspace, discards weak ones, and the LLM is used only for the bounded writing task: company_summary, why_now, relationship_angle, open_checks per kept company, generated from the already-verified signal rows via a strict JSON-schema prompt, validated by the existing QA (no %, no certainty vocabulary, length caps). Where the engine lacks coverage for a niche (as with this week's wealth-management M&A brief, where evidence came from trade press), fall back to agent research but log the coverage gap as a source-atlas candidate — that is exactly what the source-expansion program (SRC-*) exists to absorb.

Token economics: per company, a summary-writing call is low hundreds of tokens with a cached rubric prefix (prompt caching on the fixed instructions), versus the current multi-thousand-token interactive fetch-verify-summarize loop. Use the Batch API for non-urgent population (50% discount) and Haiku for extraction/drafting with one Sonnet-class pass only as a review step if QA failures show Haiku isn't holding the register. Expected effect: brief production drops from hours-interactive to minutes-review, and the marginal cost of "all potential customers" stops scaling with founder attention.

Risk control: nothing in this changes the trust gates — evidence still needs a fetchable dated source URL and approved display rights, the founder still reviews every company, ENG-04 keeps samples one-off and founder-reviewed. The LLM writes prose about verified rows; it never asserts facts the rows don't contain, and the deterministic QA + founder review sit behind it.

### P5. Deterministic reply router with LLM fallback

Mechanism: replies arrive in exactly a handful of classes (positive/example request, spec provided, qualifier answer, objection, not-now, referral). A keyword/pattern router handles the first three (which are also the three with structured next actions already built); only ambiguous replies go to a small classification call (Haiku, ~100 tokens) or to the founder. The router's output is a suggested next action in the P2 queue, never an auto-send — reply ingestion stays manual paste (a textarea on the prospect card: "log their reply"), which respects the no-mailbox-ingestion boundary while still capturing thread history as structured events for P1.

### P6. Commitment guardrail at the point of speech

Mechanism: the Commitments tab shows the recurring failure is improvised promises on calls (four variants of a prohibited feature, per-call referral terms). Two cheap mitigations: (a) a one-page approved-offer card (price card, pilot terms, referral terms, prohibited-feature phrasing) rendered from config and kept open during calls; (b) the P1 commitments table gets a "promised on call, pending register check" status so post-call transcription forces each promise through the same conflict check the workbook does today, but with an explicit queue instead of a hand-scanned column.

### P7. Performance hygiene on the scanner (minor)

The 100-prospect select and per-assignment row updates are fine at current scale; at 1,000+ prospects, batch the assignment updates (single upsert with values) and add an index on (org_id, context_status, created_at). Not worth doing before the scale exists.

Sequencing recommendation: P1+P2 together (they share the schema work and eliminate the workbook toil immediately), then P3 (one afternoon, immediate token savings), then P4 (the big one — schedule it as a proper story with the scanner-first path behind a flag and the agent path retained as fallback), P5 and P6 opportunistically, P7 deferred.

---

## 9. Constraints the reviewer must treat as fixed

These are governance decisions with history behind them, not oversights:

1. No send automation. No LinkedIn API, no email send API in the DM workflow, no auto-response, no mailbox ingestion. The operator copies and sends manually; copying does not mark anything sent. (Contract: dm-example-follow-up-contract.md; keeps the human accountable for every outbound message and keeps the system outside LinkedIn ToS exposure.)
2. No person-level behavioral tracking (decisions D14/D15). Company signals only. The "Product #3" concept repeatedly promised on calls is prohibited absent an amended, licensed-data design; the pipeline must not quietly implement it.
3. No-provider source policy (MSPS-003): LinkedIn identity-only from the prospect's own accepted connection, operator context, firm-owned pages, primary public evidence, referrals. No licensed CSV/API enrichment.
4. No uncalibrated prediction language (D9): no percentages, no certainty claims, anywhere in outbound copy or reports. Enforced by regex in DM QA and brief QA; keep it enforced in any new generation path.
5. Founder review on every sample brief (ENG-04 open): samples are one-off and founder-reviewed until the control closes. Automation proposals may compress research and writing, not review.
6. Fictionalized example only for the public page; tailored briefs require dated public evidence with approved display rights.
7. Purged statistics stay purged: no reintroduction of retired pilot stats (n=27/81%/9-day) in any copy, and no new unsourced marketing numbers.

---

## 10. Questions for the reviewer

1. P4 is the highest-value, highest-risk change. Critique the scanner-first evidence path: what failure modes appear when engine coverage is thin for a niche, and is the agent-fallback-plus-coverage-log loop the right containment?
2. The deterministic template layer trades personalization ceiling for consistency and zero cost. At what funnel volume (replies/week) does per-prospect LLM personalization of the *first* DM plausibly beat the template on reply rate enough to justify its QA variance? What experiment design would answer this within ~50 sends per arm, given the D9/QA constraints?
3. Is the P1 event model sufficient as a CRM substitute at 100-500 prospects, or is that the point to adopt an external CRM and treat these tables as its source feed?
4. The 14-day trigger freshness rule kills otherwise-good drafts when review is slow. Better to shorten the review loop (P2 queue) or to add a re-scan-on-approve step that refreshes the trigger at send time?
5. Anything in Section 4 that looks like accumulating tech debt the sequencing in Section 8 fails to address?
