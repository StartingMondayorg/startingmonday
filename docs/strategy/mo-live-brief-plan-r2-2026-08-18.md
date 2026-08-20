# Mo Live Brief Plan — Revision 2

Date: 2026-08-18 (r2)
Products: Starting Monday (v1 scope) + Mandate Signal (reuse target)
Owner: Rich + Mo + Engineering
Status: Proposed implementation plan; no code changes authorized by this document
Supersedes: molivelinkedinbriefplan20260818.md (r1)

## What changed from r1

1. **Goals restated around business outcomes.** r1 framed the goal as workflow control. r2 frames it as: cut response time to inbound sample requests, and convert more of those requests into booked calls with Rich. Every design decision below is tested against those two outcomes.
2. **Volume assumption made explicit.** Mo fields 15+ requests/week (~800/year). This justifies the full build (r1's lean-pilot alternative is retired) and makes Mo-minutes-per-brief the controlling unit economic.
3. **The brief is now treated as a sales instrument, not just a deliverable.** Booking CTA, engagement telemetry on the private link, and follow-up triggers are in scope for v1 — they were absent from r1.
4. **Mandate Signal reuse is a first-class design constraint.** The pipeline core (intake → input review → bounded signal run → evidence-labeled brief → human review → tracked link) must be product-agnostic so the same machinery can produce sample mandate-lead briefs for Mandate Signal's recruiter prospects.
5. **The Step-3 shortlist gap is closed with an internal option.** r1 hand-waved company-shortlist generation. r2 proposes powering it with Mandate Signal's existing candidate→company matching engine ("which companies are likely to hire this person"), which is exactly this problem.
6. **Operating model decided.** This is a same-day async response tool with an optional live walkthrough — not a generate-during-the-call tool. Scans are too variable (blocked sites, retries) to run live reliably.
7. **Quality calibration added.** Rich spot-reviews early briefs on a declining schedule before Mo becomes the sole reviewer.
8. **Phases restructured for time-to-first-value.** r1's Phase 0 shipped nothing Mo could use. r2 merges it into Phase 1 so the first release produces a sendable brief.

All r1 safety rails are retained: consent, evidence labeling, no scraping of LinkedIn, no auto-send, robots/source controls, staff-only access, retention/deletion rules.

## Goals and targets

**G1 — Response time.** From prospect request to brief delivered:
- p50 ≤ 4 working hours, p90 ≤ 1 business day.
- Scan wall-clock ≤ 30 minutes for 10 companies.
- Mo active time ≤ 20 minutes per brief (intake + review + finalize).

Rationale: at 15+/week, the current bottleneck is Rich's availability. A same-day personalized brief while the prospect is still in an active search mindset is itself a differentiator — it demonstrates the product's core promise (speed to signal).

**G2 — Call conversion.** Every brief is engineered to produce one action: book a call with Rich.
- Primary metric: brief-delivered → call-booked rate. Establish baseline in the first month; set a target after 60 briefs.
- Secondary: link open rate, time-to-open, CTA click rate.

**G3 — Reusable core for Mandate Signal.** The same pipeline, with a different input type and brief template, must be able to produce a sample mandate-lead brief for a recruiter prospect (Mandate Signal's "two-week pilot" motion). v1 ships Starting Monday only, but schema and code boundaries must not assume a single product.

## User story (revised)

> As Mo, when an interested prospect shares a LinkedIn PDF or pasted profile text and consents to a live analysis, I can create a private request, review the evidence, run a bounded scan, and send a branded, tracked brief the same day — with a booking link to Rich's calendar — without waiting on Rich.

## Existing code and systems to reuse

### LinkedIn extraction

Reuse the PDF rules and parser in `src/app/api/(auth)/linkedin-import/extract/route.ts` (5 MB limit, magic-byte verification, `pdf-parse`, clear invalid/empty errors). Extract the parser into a shared server utility used by customer, staff, and — later — Mandate Signal workflows. Do not call the authenticated customer route from the staff workspace.

### Live company scan

Reuse `worker/scanner/scan-company.js` (robots enforcement, ATS adapters, Browserless fallback, role detection/scoring, persistence, blocked/error states, dedup and new-opening detection). Do not create a second scanner; invoke the existing one through an authorized, bounded job.

### Sample brief workflow

Extend the existing admin sample-brief request/approval/finalization patterns (`src/app/admin/sample-brief-requests/...`, `sample-brief-finalization-panel.tsx`). They already model staff review before generation, private prospect/run creation, human finalization, and no automatic send.

**Decided (2026-08-18):** extend the sample-brief tables with a `brief_type` discriminator, subject to the contract-compatibility check. The narrow new tables below are the documented fallback only if that check fails.

### Mandate Signal candidate→company matching (new in r2)

Mandate Signal already answers "which companies are likely to hire this specific person" from pre-search signals (funding rounds, executive departures, M&A, financial indicators). This is precisely the Step-3 shortlist problem.

Decided (2026-08-18): expose a bounded **internal API** endpoint that accepts a reviewed profile summary and returns ranked companies with signal evidence. Benefits:

- Closes r1's biggest gap (shortlist quality) with proven machinery instead of a new LLM pipeline.
- Makes the Starting Monday brief materially better: companies with *pre-search* mandate signals, not just current postings — "3–6 weeks before the posting" is a compelling line in a sales brief.
- Dogfoods Mandate Signal and creates the integration surface its own sales motion will reuse.

**Constraints:** cross-product data boundary must be explicit. Prospect profile data flows to the matching engine transiently for scoring only — it must not enter Mandate Signal's lead database, training data, or analytics. Signals returned into the brief carry their own source labels. If this boundary can't be implemented cleanly in Phase 1, fall back to an interim shortlist from approved company/public-source data and ship the integration in Phase 2.

## Proposed operator flow

Five-step wizard, one primary action per step: 1. Prospect → 2. Profile review → 3. Companies → 4. Live scan → 5. Final brief.

### Step 1: Create a live brief request — `/admin/live-briefs/new`

Required fields: prospect name; prospect email; LinkedIn profile URL; LinkedIn PDF upload or pasted profile text; prospect consent checkbox and attestation source; current location / remote preference; target level or role lane if known; request source (inbound email, call, referral); Mo's internal notes.

**Changed from r1:** "Meeting date/time" is replaced by "request received at" — the SLA clock starts here. A live walkthrough is a release option, not the default flow.

Consent statement (unchanged):

> The prospect provided this profile information or authorized Starting Monday to use it to prepare a private career brief. No outreach will be sent on the prospect's behalf.

Strengthen provenance cheaply: the consent-source field should capture *how* consent was given (forwarded email preferred over verbal attestation) and store the forwarded message reference where available.

### Step 2: Parse profile and show an editable summary

Extract: current/recent titles, leadership scope, industries, quantified achievements, technologies and operating domains, geography, target-role hypotheses, company-type hypotheses.

Two-column UI (extracted facts vs Mo's reviewed version). Mo can correct every field before a scan starts. Never silently overwrite the uploaded source text.

**Speed requirement (new):** extraction completes in under 60 seconds; Mo's review of a clean profile should take under 5 minutes. If extraction confidence is high, prefill the reviewed column and let Mo confirm rather than retype.

### Step 3: Generate a target-company shortlist

Produce 8–12 proposed companies via the Mandate Signal matching engine (preferred) or interim public-source pipeline (fallback). For each company: why it fits this person's background; target role lane; likely operating sponsor roles; mandate/pre-search signals if available, with source and date; career-page URL; scan readiness; evidence source; manual include/exclude.

Mo selects at most 10 for the live scan. Shortlist generation target: under 2 minutes.

### Step 4: Run a bounded live scan — `POST /api/admin/live-briefs/[id]/scan`

Unchanged from r1 in substance: staff authorization + recent authentication; consent and reviewed-profile verification; job/run record with idempotency key; one queued scan per selected company via the existing `scanCompany` path; per-company statuses (queued / scanning / complete / no public postings / blocked by site / failed); maximum company count, timeout, concurrency limit; never contacts anyone. Returns a run ID immediately; UI polls.

**New:** run-level SLA instrumentation — if the run exceeds 30 minutes, surface a "accept partial and compose" prompt rather than leaving Mo waiting.

### Step 5: Compose the brief

Brief contents (r1 structure retained, with conversion additions marked ★):

1. **Executive positioning** — one sentence, three proof points, role lanes.
2. **Best-fit opportunities today** — verified public openings; plain-language fit explanation; public source URL and observation date; `Observed` / `Inferred` / `Needs verification` labels.
3. **Companies likely to hire soon** ★ (upgraded from r1's "no current opening" section) — pre-search mandate signals where available (funding, exec departure, M&A), with source and date; likely target titles; clear language when no matching posting was found. This section is the differentiator: no other sample the prospect receives will contain it.
4. **People to know** — role titles, not unverified names; public LinkedIn company-people search link; mutual-connection prompt; no guessed email or phone.
5. **Next three actions** ★ — action 1 is always: *book a working session with Rich to go deeper on the top opportunities* (embedded scheduling link). Actions 2–3: one company to research; one person/role to identify.
6. **Evidence and limits** — sources checked, blocked sources, scan timestamp, no-guarantee statement, consent/provenance record.

**Depth-gating (deferred experiment):** v1 sends the full brief with a prominent CTA. A gated variant (top 3 opportunities in full, remainder summarized with "walk through the rest on a call") is a Phase 3 A/B test, not a v1 decision.

### Step 6: Mo review and release

Finalization checklist (r1 retained): profile facts match supplied information; no internal model/debug language; every current opening has a public source; no role presented as certain or imminent without evidence; no guessed personal contact data; blocked/failed scans visible; next actions realistic.

**Calibration schedule (new):** Rich reviews briefs 1–15 before release; then 1-in-5 sampling for the next month; then Mo is sole reviewer with Rich spot-auditing monthly. Corrections Rich makes are logged (see metrics) and folded into extraction/composition prompts.

Release options:

- **Send a time-limited, tracked private link (default).** The link page carries persistent Starting Monday branding and a "Book a call with Rich" button.
- Present during a live call (optional, for high-value prospects).
- PDF export — **deferred to Phase 3.** A PDF cannot be tracked, expired, or revoked, and it dilutes the CTA. Ship it only if prospects demand it.

No automatic email or LinkedIn send in v1. Mo sends the link from his own email.

### Step 7 (new): Engagement and follow-up

The private link records view events: first open, section views, CTA clicks. These feed Mo's queue:

- Not opened in 48h → Mo follow-up nudge task.
- Opened, no booking in 24h → Mo follow-up task with context ("they spent the most time on the Acme section").
- CTA clicked but no booking completed → same-day Mo task.

Telemetry is aggregate per-view and stays inside the staff workspace; no third-party analytics on the prospect page. The brief's footer discloses that link access is logged.

## Data model

Default: extend existing sample-brief records with a `brief_type` discriminator (`starting_monday_candidate` now; `mandate_signal_sample` reserved). If contract-incompatible, use narrow new tables:

### `live_brief_requests`

id; brief_type; prospect_name; prospect_email; linkedin_url; source_text_encrypted_ref or approved private storage reference; consent_attested_at; consent_source; request_received_at ★; requested_by; status; reviewed_profile jsonb; created_at / updated_at.

### `live_brief_scan_runs`

id; request_id; idempotency_key; status; selected_company_count; completed_company_count; blocked_company_count; failed_company_count; started_at / completed_at; created_by.

### `live_brief_scan_companies`

run_id; company_id or private snapshot; career_page_url; status; scan_result_id; signal_summary jsonb ★ (mandate signals with source + date); error_class; observed_at.

### `live_brief_deliveries` ★ (new)

id; request_id; link_token_ref; sent_at; expires_at; revoked_at; first_opened_at; last_opened_at; view_count; cta_clicked_at; call_booked_at (backfilled from Rich's personal calendar by prospect-email lookup, or entered manually by Mo — no booking webhook in v1).

Use RLS, staff-only access, append-only run events, bounded payloads. Retention/deletion rules explicit before production use; deletion cascades to delivery telemetry.

## Security, privacy, and source rules

All r1 rules retained verbatim: approved staff/operator role for Mo; same-origin mutation protection and recent authentication; audit log of create/scan/finalize/view/export/revoke; profile data treated as private prospect-supplied data; no profile text in general logs, analytics, Slack, or Sentry; no LinkedIn scraping; LinkedIn PDF or pasted text only, supplied/authorized by the prospect; no Apollo contact data inside Starting Monday absent a separate approved customer-owned integration; robots/source/blocked-state controls intact; observed-vs-inference distinction; retention period and operator deletion/revocation action.

Added in r2:

- **Cross-product boundary:** prospect profile data sent to the Mandate Signal matching engine is transient — scoring only; never persisted into Mandate Signal's lead database, analytics, or training data. This must be a tested contract, not a convention.
- **Link telemetry** is first-party only, disclosed in the brief footer, and deleted with the request under retention rules.

## Failure handling

r1 retained: invalid PDF → allow pasted text; missing profile facts → require Mo correction before scanning; blocked career site → `Blocked by source policy`, no indefinite retries; no openings → company/relationship guidance (now upgraded by mandate signals), never a false opportunity; scan timeout → preserve completed companies, retry failed only; duplicate submit → return existing run via idempotency key; partial completion → brief only after Mo explicitly accepts the partial result.

Added: Mandate Signal engine unavailable → fall back to interim shortlist pipeline and label the brief internally as "no pre-search signals run" so Mo knows section 3 is thinner; SLA breach (run > 30 min) → prompt Mo to accept partial.

## Phased implementation

### Phase 1: End-to-end usable workflow (merges r1 Phases 0–2 core)

- Confirm Mo's staff identity/role; extract shared LinkedIn PDF parsing utility.
- Request intake + profile review pages.
- Interim shortlist (public-source pipeline) with manual include/exclude.
- Idempotent bounded scan of up to 10 companies via existing `scanCompany`.
- Brief composition with evidence labels and booking CTA.
- Mo review checklist + tracked, expiring, revocable private link.
- Rich calibration review of briefs 1–15.

Acceptance: staff-only access tests; consent required; uploaded text never in logs; profile fields editable, source text immutable; no duplicate writes per company/run; robots/SSRF/source boundaries enforced; timeout and partial-run tests pass; cross-tenant/staff denial tests pass; every observed claim has a source and observation date; inference labeled; blocked/failed scans visible; private-link auth/expiry/revocation tests pass; **p50 request→brief ≤ 1 business day on the first 15 real requests.**

### Phase 2: Speed + Mandate Signal integration

- Wire the shortlist to the Mandate Signal matching engine behind the tested data boundary.
- Add "Companies likely to hire soon" signal section to the brief.
- Engagement telemetry + Mo follow-up task queue.
- Cut p50 to ≤ 4 working hours; Mo active time ≤ 20 minutes.

Acceptance: boundary test proves profile data is not persisted cross-product; signal claims carry source + date; telemetry events drive follow-up tasks; SLA dashboards live.

### Phase 3: Conversion optimization + Mandate Signal sales reuse

- A/B: full brief vs depth-gated brief on booking rate.
- PDF export if demand proves out.
- Second brief type: `mandate_signal_sample` — recruiter prospect supplies niche/candidate context; same pipeline produces a sample mandate-lead brief feeding Mandate Signal's two-week-pilot motion.
- Do not add enrichment or automated outreach until manual-workflow evidence supports it.

## Metrics

- Request → brief delivered: p50 / p90 (target: 4 working hours / 1 business day).
- Mo active minutes per brief (target ≤ 20).
- Brief → call-booked rate (baseline first 60 briefs, then target).
- Link open rate, time-to-first-open, CTA click rate.
- Scan completion / blocked / failure rates.
- Rich-correction rate during calibration (quality proxy; should trend to near-zero before Mo goes solo).
- Prospect usefulness feedback.
- Phase 3: gated-vs-full booking-rate delta; Mandate Signal sample-brief pilot-start rate.

## Test plan

r1 test plan retained in full (unit: parser limits, extraction fixtures, shortlist fixtures, labeling, log redaction; API/DB: staff auth, consent, idempotency, cross-tenant denial, bounded counts, retry rules, link expiry/revocation, retention; integration: full pipeline with mixed-status fixtures, partial-run accept/reject, production scanner adapters; E2E: synthetic PDF → corrected fields → three fixture companies → scan → finalize → prospect view → revoke).

Added in r2:

- Cross-product boundary test: profile payload sent to matching engine is absent from Mandate Signal persistence after scoring.
- Delivery telemetry: open/CTA events recorded, follow-up tasks created, telemetry deleted on request deletion.
- SLA instrumentation: request_received_at → sent_at computed correctly across timezones.
- CTA link resolves to Rich's personal calendar booking page in the prospect view.
- `call_booked_at` backfill path (calendar lookup or manual entry) produces correct conversion metrics.

## Go-live gate

r1 gates retained: explicit staff authorization for Mo; approved consent and deletion behavior; no profile-text leakage into logs/analytics; scanner security/source controls intact; private link expires and can be revoked; every brief human-reviewed; no automatic sending; rollback disables new scans while preserving audit history.

Added: calibration schedule agreed and Rich's review of briefs 1–15 scheduled; SLA dashboard exists before Mo relies on the tool for live prospects; cross-product boundary test passing before any Mandate Signal integration ships.

## Decisions (resolved by Rich, 2026-08-18)

1. **Storage:** Extend the existing sample-brief tables with a `brief_type` discriminator. Contingent on the contract-compatibility check passing; if it fails, fall back to the narrow new tables above — but that is now the exception path, not an open question.
2. **Mandate Signal integration topology: internal API.** The matching engine is exposed as a bounded internal endpoint with the transient-scoring data boundary as a tested contract. This also becomes the integration surface Mandate Signal's own sales motion reuses in Phase 3.
3. **Scheduling link: Rich's personal calendar.** The brief's CTA resolves to Rich's personal booking page. Implication: `call_booked_at` is backfilled from Rich's calendar (Google Calendar lookup by prospect email) or entered manually by Mo — no routed booking page means no automatic webhook in v1. Acceptable at current volume; revisit if bookings exceed what a personal calendar absorbs.
4. **Legal review:** The brief footer's access-logging disclosure does not require legal review. The retention/deletion policy itself still requires explicit approval before production use (unchanged go-live gate); only the footer-disclosure review is waived.
