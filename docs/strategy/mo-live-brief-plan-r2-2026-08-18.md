# Mo Live Brief Plan — Revision 2.1

Date: 2026-08-18 (r2); amended 2026-08-20 (r2.1)
Products and systems: Starting Monday (v1 product), HubSpot (CRM/workflow), LinkedIn Sales Navigator (manual research), MandateSignal (future reuse subject to separate approval)
Owner: Rich + Mo + Engineering
Status: Approved execution baseline for Starting Monday Phase 1; Phase 2/3 and all MandateSignal work remain separately gated
Supersedes: molivelinkedinbriefplan20260818.md (r1)

## Authorization record

Approved by Rich Rothschild on 2026-08-20 for Starting Monday Phase 1 implementation.

Authorization includes product-local contract verification, shared PDF parser extraction, HubSpot-linked staff intake, consent and profile review, product-local shortlist, bounded scan orchestration, evidence-labeled brief composition, human finalization, expiring private delivery, and minimized HubSpot milestone synchronization.

Authorization does not waive the integration prerequisites, retention/deletion approval, source-rights controls, staff/recent-auth controls, tests, calibration review, or go-live gates in this plan. It does not authorize a synchronous MandateSignal dependency, cross-product prospect data transfer, shared tables, automated email/LinkedIn sending, Phase 2 promotion, or Phase 3 experimentation.

## Revision 2.1 amendment record

1. **HubSpot is the sales system of record.** It owns the prospect/contact, request source, SLA timestamps, Mo ownership, workflow status, manually sent message record, follow-up tasks, meeting attribution, and conversion reporting.
2. **Starting Monday is the private brief system of record.** It owns consent evidence, private source material, reviewed profile facts, shortlist decisions, scans, evidence, generated brief content, delivery tokens, revocation, deletion, and first-party engagement telemetry.
3. **LinkedIn Sales Navigator is a compliant manual research layer.** Mo uses it to verify companies, role titles, and relationship paths. No scraping, automated profile extraction, or unapproved contact-data transfer is introduced.
4. **HubSpot Meetings replaces custom booking reconciliation where practical.** The CTA points to Rich's HubSpot Meetings page synchronized with his Google Calendar. HubSpot associates the meeting with the prospect; manual correction remains the fallback.
5. **Phase 1 is product-local.** Starting Monday uses its own approved public-source data and optional HubSpot account context for shortlist generation. It has no synchronous MandateSignal runtime, database, or API dependency.
6. **MandateSignal reuse is deferred to a separate governed re-plan.** Reuse means compatible logical contracts and product-local implementations, not shared tables, shared prospect records, or synchronous cross-product execution.
7. **Data minimization is explicit.** HubSpot receives workflow metadata, identifiers, timestamps, and outcome summaries. Raw LinkedIn PDFs, pasted profile text, reviewed private notes, and complete private brief content remain in Starting Monday.

## What changed from r1

1. **Goals restated around business outcomes.** r1 framed the goal as workflow control. r2 frames it as: cut response time to inbound sample requests, and convert more of those requests into booked calls with Rich. Every design decision below is tested against those two outcomes.
2. **Volume assumption made explicit.** Mo fields 15+ requests/week (~800/year). This justifies the full build (r1's lean-pilot alternative is retired) and makes Mo-minutes-per-brief the controlling unit economic.
3. **The brief is now treated as a sales instrument, not just a deliverable.** Booking CTA, engagement telemetry on the private link, and follow-up triggers are in scope for v1 — they were absent from r1.
4. **Future MandateSignal reuse is a contract constraint, not a runtime dependency.** The logical stages (intake → input review → bounded signal run → evidence-labeled brief → human review → tracked link) should remain portable, while each product retains its own records, runtime, database, and release controls.
5. **The Step-3 shortlist gap is closed product-locally.** Starting Monday uses approved public-source data, existing candidate/company context, and optional HubSpot account context. Mo verifies the shortlist and role paths in Sales Navigator.
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

**G3 — Reusable logical contract without cross-product coupling.** v1 ships only in Starting Monday. A future MandateSignal implementation may reuse versioned schemas and acceptance fixtures only after a separate approved plan; it does not read Starting Monday records or synchronously process Starting Monday prospect data.

**G4 — Low-friction sales operations.** HubSpot automates status, task, booking, and conversion administration so Mo spends no more than 20 active minutes per brief and does not maintain a parallel spreadsheet or custom CRM queue.

## User story (revised)

> As Mo, when an interested prospect shares a LinkedIn PDF or pasted profile text and consents to a live analysis, I can create a private request, review the evidence, run a bounded scan, and send a branded, tracked brief the same day — with a booking link to Rich's calendar — without waiting on Rich.

## Automation and human-control model

### Automated by HubSpot

- Create or associate the prospect/contact and record the request source.
- Start the request SLA clock and assign Mo as owner.
- Maintain bounded workflow statuses: requested, reviewing, scanning, ready, delivered, opened, and booked.
- Create follow-up tasks from bounded milestones received from Starting Monday.
- Associate a HubSpot Meetings booking with the prospect and report brief-to-call conversion.
- Provide approved manual-send templates; v1 does not auto-send email or LinkedIn messages.

### Automated by Starting Monday

- Validate and extract prospect-supplied LinkedIn PDFs or pasted text.
- Prefill an editable profile summary while preserving the immutable source.
- Generate a product-local 8–12 company shortlist.
- Run bounded scans for no more than 10 selected companies.
- Preserve partial results and classify blocked, failed, no-posting, and completed states.
- Compose the evidence-labeled brief and generate an expiring, revocable private link.
- Record first-party open, section-view, and CTA-click events.
- Send only minimized workflow milestones to HubSpot through an idempotent server-side sync.

### Manual work retained by Mo

- Confirm the prospect identity, request source, consent, and consent provenance.
- Correct the extracted profile summary.
- Review the proposed companies; use Sales Navigator to verify companies, role titles, and relationship paths; select up to 10.
- Start the scan and decide whether to accept a partial result after an SLA breach.
- Review every brief against the finalization checklist and correct unsupported claims.
- Approve/release the private link and send it manually from HubSpot or the approved LinkedIn workflow.
- Handle follow-up tasks and correct booking attribution when automatic association fails.
- Revoke or delete the brief when required.

Expected active time: 2–3 minutes intake/consent, 3–5 minutes profile review, 3–5 minutes shortlist/Sales Navigator review, 3–5 minutes final review, and about 1 minute to release/send; target total 12–19 minutes.

## Existing code and systems to reuse

### LinkedIn extraction

Reuse the PDF rules and parser in `src/app/api/(auth)/linkedin-import/extract/route.ts` (5 MB limit, magic-byte verification, `pdf-parse`, clear invalid/empty errors). Extract the parser into a shared server utility used by customer, staff, and — later — Mandate Signal workflows. Do not call the authenticated customer route from the staff workspace.

### Live company scan

Reuse `worker/scanner/scan-company.js` (robots enforcement, ATS adapters, Browserless fallback, role detection/scoring, persistence, blocked/error states, dedup and new-opening detection). Do not create a second scanner; invoke the existing one through an authorized, bounded job.

### Sample brief workflow

Starting Monday does not contain the MandateSignal admin sample-brief request/approval/finalization workflow. Do not import or call MandateSignal code, tables, or routes. Reuse only product-local Starting Monday patterns for staff authorization, append-only events, evidence rendering, brief QA, and no automatic send.

**Compatibility decision (verified 2026-08-20):** Starting Monday's existing `public.briefs` table is a user-owned generated-output log. Its `type` constraint is limited to `strategy`, `prep`, `prep_section`, and `outreach`; its RLS is user-self-scoped; and it has no staff prospect intake, consent provenance, scan-run, immutable artifact, private-delivery, expiry, or revocation model. Extending it with `brief_type` would mix incompatible ownership and lifecycle contracts. The narrow Starting Monday-local tables below are therefore the required Phase 1 path.

Starting Monday has a `staff_members` role model and fail-closed admin route patterns. It does not yet have a reusable recent-auth mutation guard equivalent to this plan's requirement. Phase 1 must add and test that guard before scan, release, revoke, or delete mutations are enabled.

### HubSpot CRM and Meetings

Use a HubSpot private-app integration for minimized server-to-server workflow updates. HubSpot owns the contact/deal association, Mo owner, request source, SLA milestones, delivery state, follow-up tasks, and booking outcome. Starting Monday stores only stable HubSpot record references needed for idempotent synchronization.

The booking CTA uses Rich's HubSpot Meetings page connected to his Google Calendar. This provides automatic prospect/meeting association without adding a custom booking webhook in v1. Manual booking correction remains available for unmatched meetings.

HubSpot must not receive raw profile documents, pasted profile text, reviewed private notes, complete private brief content, evidence payloads, or section-level browsing details. It receives only identifiers, status/timestamps, coarse engagement milestones, task triggers, and outcomes.

### LinkedIn Sales Navigator

Sales Navigator supports Mo's human review of the shortlist and "people to know" section. The UI may provide public company/people search links and store Mo's reviewed role-title or relationship-path notes in Starting Monday or minimized CRM fields. Native HubSpot/Sales Navigator synchronization may be used only within the entitlements and terms of the purchased plans.

No Sales Navigator scraping, automated connection export, guessed email/phone enrichment, or background transfer of LinkedIn profile data is permitted.

### Starting Monday product-local shortlist

Phase 1 generates 8–12 proposed companies from Starting Monday's approved public-source data, existing target-company context, candidate-role fit, and optional HubSpot account metadata that the operator is authorized to use. Every proposal states why it fits and which evidence source supports it. Mo remains the final selector.

MandateSignal matching is not part of Phase 1 or Phase 2 runtime. Any future cross-product learning or matching requires a separately approved canonical-plan story and must preserve product-local storage, asynchronous failure isolation, aggregate-only approved exchange boundaries, independent rollout, and flag-off operation.

### Integration prerequisites

Before implementation begins:

- Verify the purchased HubSpot tier supports the required private-app scopes, workflow/task automation, Meetings association, and custom properties. Record exact scopes; do not request broad CRM access by default.
- Select the HubSpot object model (contact plus deal or ticket) and approve the field allowlist, idempotency key, retry policy, dead-letter handling, and operator reconciliation view.
- Confirm Rich's HubSpot Meetings URL, Google Calendar synchronization, and the authoritative rule for matching a meeting to a prospect.
- Verify the purchased Sales Navigator and HubSpot plans support any intended native CRM synchronization. If not, retain deep links and manual review without blocking Phase 1.
- Approve Starting Monday retention/deletion behavior for private source material and confirm deletion propagates to local delivery telemetry and minimized HubSpot references.
- Add independent kill controls for outbound HubSpot synchronization and engagement-triggered task creation. Flag-off must leave brief generation/review available and queue bounded reconciliation work.

### Signal-engine governance

Phase 1 and Phase 2 use only existing Starting Monday product-local signals and scans. This plan does not authorize new engine-derived projections, shared tables, cross-product table access, synchronous MandateSignal calls, customer-row exports, or event-level cross-product exchange. Any future MandateSignal-compatible implementation requires a named canonical-plan story or explicit re-plan before design or code begins.

## Proposed operator flow

Five-step wizard, one primary action per step: 1. Prospect → 2. Profile review → 3. Companies → 4. Live scan → 5. Final brief.

### Step 1: Create a live brief request — `/admin/live-briefs/new`

Required fields: HubSpot contact ID and optional deal ID; prospect name; prospect email; LinkedIn profile URL; LinkedIn PDF upload or pasted profile text; prospect consent checkbox and attestation source; current location / remote preference; target level or role lane if known; request source (inbound email, call, referral); Mo's internal notes.

**Changed from r1:** "Meeting date/time" is replaced by "request received at" — the SLA clock starts here. A live walkthrough is a release option, not the default flow.

Consent statement (unchanged):

> The prospect provided this profile information or authorized Starting Monday to use it to prepare a private career brief. No outreach will be sent on the prospect's behalf.

Strengthen provenance cheaply: the consent-source field should capture *how* consent was given (forwarded email preferred over verbal attestation) and store the forwarded message reference where available.

### Step 2: Parse profile and show an editable summary

Extract: current/recent titles, leadership scope, industries, quantified achievements, technologies and operating domains, geography, target-role hypotheses, company-type hypotheses.

Two-column UI (extracted facts vs Mo's reviewed version). Mo can correct every field before a scan starts. Never silently overwrite the uploaded source text.

**Speed requirement (new):** extraction completes in under 60 seconds; Mo's review of a clean profile should take under 5 minutes. If extraction confidence is high, prefill the reviewed column and let Mo confirm rather than retype.

### Step 3: Generate a target-company shortlist

Produce 8–12 proposed companies through Starting Monday's product-local shortlist pipeline. For each company: why it fits this person's background; target role lane; likely operating sponsor roles; supported early signals if available, with source and date; career-page URL; scan readiness; evidence source; manual include/exclude.

Mo reviews the shortlist in Starting Monday, may open Sales Navigator searches to verify company and role paths, and selects at most 10 for the live scan. Shortlist generation target: under 2 minutes; Mo review target: under 5 minutes.

### Step 4: Run a bounded live scan — `POST /api/admin/live-briefs/[id]/scan`

Unchanged from r1 in substance: staff authorization + recent authentication; consent and reviewed-profile verification; job/run record with idempotency key; one queued scan per selected company via the existing `scanCompany` path; per-company statuses (queued / scanning / complete / no public postings / blocked by site / failed); maximum company count, timeout, concurrency limit; never contacts anyone. Returns a run ID immediately; UI polls.

**New:** run-level SLA instrumentation — if the run exceeds 30 minutes, surface a "accept partial and compose" prompt rather than leaving Mo waiting.

### Step 5: Compose the brief

Brief contents (r1 structure retained, with conversion additions marked ★):

1. **Executive positioning** — one sentence, three proof points, role lanes.
2. **Best-fit opportunities today** — verified public openings; plain-language fit explanation; public source URL and observation date; `Observed` / `Inferred` / `Needs verification` labels.
3. **Companies likely to hire soon** ★ (upgraded from r1's "no current opening" section) — pre-search mandate signals where available (funding, exec departure, M&A), with source and date; likely target titles; clear language when no matching posting was found. This section is the differentiator: no other sample the prospect receives will contain it.
4. **People to know** — role title and one evidence-bounded why-them sentence; allowlisted LinkedIn people-search and optional plain Apollo account hand-off; a public name may render only with a product-approved source URL and observed date, otherwise title-only; no guessed or provider-fetched name, email, or phone.
5. **Next three actions** ★ — action 1 is always: *book a working session with Rich to go deeper on the top opportunities* (embedded HubSpot Meetings link synchronized with Rich's Google Calendar). Actions 2–3: one company to research; one person/role to identify.
6. **Evidence and limits** — sources checked, blocked sources, scan timestamp, no-guarantee statement, consent/provenance record.

**Depth-gating (deferred experiment):** v1 sends the full brief with a prominent CTA. A gated variant (top 3 opportunities in full, remainder summarized with "walk through the rest on a call") is a Phase 3 A/B test, not a v1 decision.

### Step 6: Mo review and release

Finalization checklist (r1 retained): profile facts match supplied information; no internal model/debug language; every current opening has a public source; no role presented as certain or imminent without evidence; no guessed personal contact data; blocked/failed scans visible; next actions realistic.

**Calibration schedule (new):** Rich reviews briefs 1–15 before release; then 1-in-5 sampling for the next month; then Mo is sole reviewer with Rich spot-auditing monthly. Corrections Rich makes are logged (see metrics) and folded into extraction/composition prompts.

Release options:

- **Send a time-limited, tracked private link (default).** The link page carries persistent Starting Monday branding and a "Book a call with Rich" button.
- Present during a live call (optional, for high-value prospects).
- PDF export — **deferred to Phase 3.** A PDF cannot be tracked, expired, or revoked, and it dilutes the CTA. Ship it only if prospects demand it.

No automatic email or LinkedIn send in v1. Mo sends the link manually through HubSpot or an approved LinkedIn workflow.

### Step 7 (new): Engagement and follow-up

The private link records first-party view events: first open, section views, and CTA clicks. Starting Monday retains detailed private-link telemetry and sends only bounded milestones to HubSpot. These feed Mo's HubSpot queue:

- Not opened in 48h → Mo follow-up nudge task.
- Opened, no booking in 24h → Mo follow-up task with context ("they spent the most time on the Acme section").
- CTA clicked but no booking completed → same-day Mo task.

No HubSpot or other third-party tracking script runs on the prospect page. The brief's footer discloses that link access is logged. Server-side synchronization to HubSpot is idempotent, retryable, and contains no section content or raw profile data.

## Data model

Required: create narrow Starting Monday-local tables for the staff prospect workflow. Do not alter the ownership or lifecycle semantics of `public.briefs`, and do not reserve or render a MandateSignal type in Starting Monday. A future MandateSignal-local implementation defines its own product-local discriminator and migration.

### `live_brief_requests`

id; brief_type; hubspot_contact_id; hubspot_deal_id nullable; prospect_name; prospect_email; linkedin_url; source_text_encrypted_ref or approved private storage reference; consent_attested_at; consent_source; request_received_at ★; requested_by; status; reviewed_profile jsonb; created_at / updated_at.

### `live_brief_scan_runs`

id; request_id; idempotency_key; status; selected_company_count; completed_company_count; blocked_company_count; failed_company_count; started_at / completed_at; created_by.

### `live_brief_scan_companies`

run_id; company_id or private snapshot; career_page_url; status; scan_result_id; signal_summary jsonb ★ (mandate signals with source + date); error_class; observed_at.

### `live_brief_deliveries` ★ (new)

id; request_id; link_token_ref; sent_at; expires_at; revoked_at; first_opened_at; last_opened_at; view_count; cta_clicked_at; hubspot_meeting_id nullable; call_booked_at (normally synchronized from HubSpot Meetings, with manual correction by Mo as fallback).

Use RLS, staff-only access, append-only run events, bounded payloads. Retention/deletion rules explicit before production use; deletion cascades to delivery telemetry.

## Security, privacy, and source rules

All r1 rules retained verbatim: approved staff/operator role for Mo; same-origin mutation protection and recent authentication; audit log of create/scan/finalize/view/export/revoke; profile data treated as private prospect-supplied data; no profile text in general logs, analytics, Slack, or Sentry; no LinkedIn scraping; LinkedIn PDF or pasted text only, supplied/authorized by the prospect; no Apollo contact data inside Starting Monday absent a separate approved customer-owned integration; robots/source/blocked-state controls intact; observed-vs-inference distinction; retention period and operator deletion/revocation action.

Added in r2:

- **Link telemetry** is first-party only, disclosed in the brief footer, and deleted with the request under retention rules.

Added in r2.1:

- **HubSpot minimization:** no raw profile source, reviewed private notes, complete brief, evidence payload, or section content enters HubSpot. HubSpot stores workflow metadata and outcomes only.
- **Sales Navigator boundary:** operator-driven searches only; no scraping, bulk export, or unapproved contact enrichment.
- **Cross-product boundary:** Starting Monday does not synchronously call MandateSignal, read its tables, or send it prospect-level data. Future reuse requires a separate approved plan.

## Failure handling

r1 retained: invalid PDF → allow pasted text; missing profile facts → require Mo correction before scanning; blocked career site → `Blocked by source policy`, no indefinite retries; no openings → company/relationship guidance (now upgraded by mandate signals), never a false opportunity; scan timeout → preserve completed companies, retry failed only; duplicate submit → return existing run via idempotency key; partial completion → brief only after Mo explicitly accepts the partial result.

Added: HubSpot unavailable → preserve the Starting Monday request and queue a bounded idempotent CRM sync retry; never block brief review or lose status history. Sales Navigator unavailable → continue with the product-local shortlist and mark role-path verification pending. SLA breach (run > 30 min) → prompt Mo to accept partial.

## Phased implementation

### Phase 1: End-to-end usable workflow (merges r1 Phases 0–2 core)

- Confirm Mo's staff identity/role; extract shared LinkedIn PDF parsing utility.
- HubSpot-linked request intake + profile review pages; HubSpot remains the sales system of record.
- Product-local shortlist (approved public sources + authorized HubSpot account context) with manual include/exclude and Sales Navigator verification links.
- Idempotent bounded scan of up to 10 companies via existing `scanCompany`.
- Brief composition with evidence labels and Rich's HubSpot Meetings CTA.
- Mo review checklist + tracked, expiring, revocable private link.
- Manual HubSpot send workflow and minimized delivered/opened/clicked/booked status synchronization.
- Rich calibration review of briefs 1–15.

Acceptance: staff-only access tests; consent required; uploaded text never in logs or HubSpot; profile fields editable, source text immutable; no duplicate writes per company/run; robots/SSRF/source boundaries enforced; timeout and partial-run tests pass; cross-tenant/staff denial tests pass; every observed claim has a source and observation date; inference labeled; blocked/failed scans visible; private-link auth/expiry/revocation tests pass; HubSpot sync is idempotent and contains only allowlisted fields; no LinkedIn automation exists; **p50 request→brief ≤ 1 business day on the first 15 real requests.**

### Phase 2: Speed + CRM engagement automation

- Improve the Starting Monday product-local shortlist and early-signal section using measured Phase 1 misses.
- Send bounded delivery engagement milestones to HubSpot and create Mo follow-up tasks.
- Add Sales Navigator-assisted review affordances without automated LinkedIn collection.
- Automate HubSpot Meetings attribution with manual exception handling.
- Cut p50 to ≤ 4 working hours; Mo active time ≤ 20 minutes.

Acceptance: HubSpot allowlist test proves raw profile/brief/evidence data is never synchronized; signal claims carry source + date; telemetry milestones drive follow-up tasks; meeting association reconciles; SLA dashboards live; no synchronous MandateSignal dependency exists.

### Phase 3: Conversion optimization + Mandate Signal sales reuse

- A/B: full brief vs depth-gated brief on booking rate.
- PDF export if demand proves out.
- Evaluate a separate MandateSignal-local `mandate_signal_sample` implementation only after a canonical cross-product re-plan approves compatible contracts and product-local storage/runtime boundaries.
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

- Delivery telemetry: open/CTA events recorded, follow-up tasks created, telemetry deleted on request deletion.
- SLA instrumentation: request_received_at → sent_at computed correctly across timezones.
- CTA link resolves to Rich's HubSpot Meetings page and the meeting is associated with the correct prospect.
- `call_booked_at` HubSpot synchronization and manual correction paths produce correct conversion metrics.
- HubSpot field-allowlist test rejects raw profile text, private notes, complete brief text, evidence payloads, and section content.
- HubSpot synchronization is idempotent, retryable, and cannot block Starting Monday brief release.
- Sales Navigator inventory proves there is no automated scraping, bulk export, or guessed-contact path.
- Product-isolation test proves there is no Starting Monday runtime import, table access, or synchronous request to MandateSignal.

## Go-live gate

r1 gates retained: explicit staff authorization for Mo; approved consent and deletion behavior; no profile-text leakage into logs/analytics; scanner security/source controls intact; private link expires and can be revoked; every brief human-reviewed; no automatic sending; rollback disables new scans while preserving audit history.

Added: calibration schedule agreed and Rich's review of briefs 1–15 scheduled; SLA dashboard exists before Mo relies on the tool for live prospects; HubSpot data-minimization and retry controls pass; Sales Navigator remains manual; any MandateSignal reuse remains blocked pending a separate approved plan.

## Decisions (resolved by Rich, 2026-08-18)

1. **Storage amended 2026-08-20:** the compatibility check failed because Starting Monday's `public.briefs` table has incompatible user ownership, RLS, type, and lifecycle semantics. Phase 1 uses the narrow Starting Monday-local live-brief tables above; `public.briefs` remains unchanged.
2. **Product topology amended 2026-08-20:** no synchronous Starting Monday-to-MandateSignal internal API. Phase 1 and Phase 2 are Starting Monday-local. Future MandateSignal reuse requires a separately approved canonical-plan story and independent product-local implementation.
3. **Scheduling link amended 2026-08-20:** the CTA resolves to Rich's HubSpot Meetings page synchronized with his Google Calendar. HubSpot supplies normal booking association; Mo manually corrects unmatched bookings.
4. **Legal review:** The brief footer's access-logging disclosure does not require legal review. The retention/deletion policy itself still requires explicit approval before production use (unchanged go-live gate); only the footer-disclosure review is waived.
5. **Sales operations amended 2026-08-20:** HubSpot is the sales system of record; Starting Monday is the private brief system of record; Sales Navigator is a manual research layer. No automatic send is authorized in v1.
