# Mo Live LinkedIn Brief Plan

Date: 2026-08-18
Product: Starting Monday only
Owner: Rich + Mo + Engineering
Status: Proposed implementation plan; no code changes authorized by this document

## Goal

Give Mo a controlled internal workflow to create a live, personalized Starting Monday brief for an interested prospect using profile information the prospect has supplied or explicitly authorized Mo to use.

The controlling business outcome is speed: reduce request-to-delivery time while preserving human review and evidence quality.

Targets:

- p50 request to delivered brief: 4 working hours or less;
- p90 request to delivered brief: 1 business day or less;
- Mo active time: 20 minutes or less per brief;
- profile extraction: 60 seconds or less;
- shortlist draft: 2 minutes or less;
- bounded scan: 30 minutes or less for 10 companies; and
- every request acknowledged internally within 5 minutes.

The workflow should answer:

1. What is this person's strongest positioning?
2. Which roles fit them?
3. Which companies should they investigate now?
4. What public openings and timing signals exist today?
5. Who should they build relationships with at those companies?
6. What are the next three useful actions?

The output is a sales-assisted sample, not an account, not an automated outreach campaign, and not proof that a job will open.

## Two-product routing

Mo asks one routing question before entering prospect data:

> Are you trying to identify opportunities for your own next role, or identify likely hiring mandates for your recruiting business?

- Own next role or career relationships: Starting Monday Executive Opportunity Brief.
- Recruiting mandates or companies likely to open searches: MandateSignal Recruiter Mandate Brief.
- Both: create two separate requests with separate consent and product-local data.

The Mo launchpad may link to both products, but it stores no prospect data. Starting Monday never sends profile data to MandateSignal and does not depend synchronously on MandateSignal.

## Request queue, notifications, and prioritization

Every inbound form, email-created request, call request, or referral creates a product-local request with `request_received_at`, owner, priority, and SLA deadline.

Queue states:

- `new`
- `consent_needed`
- `profile_extracting`
- `profile_review`
- `shortlist_ready`
- `scanning`
- `partial_ready`
- `brief_review`
- `ready_to_send`
- `delivered`
- `opened`
- `call_booked`
- `expired`
- `revoked`

Priority rules:

- P0: scheduled conversation within 4 hours or an explicitly qualified/high-intent prospect.
- P1: prospect directly requested a brief; due in 4 working hours.
- P2: warm referral or qualified follow-up; due by the next business day.
- P3: missing consent or required profile data; paused until completed.

Queue order is deterministic and versioned. Rank by scheduled-conversation urgency, direct-request intent, reviewed product fit, intake completeness, then SLA age. The exact weights and thresholds require owner approval before implementation; a conversation within four hours always forces P0, and missing consent always forces P3. Do not use sensitive traits or an opaque model to determine priority.

Internal alerts:

- On request: notify Mo immediately and Rich for P0/P1 requests.
- At 30 minutes unassigned: remind Mo.
- At 2 working hours without a scan: escalate to Mo and Rich.
- At 3 working hours not in review: mark SLA risk and offer partial-brief composition.
- At delivery: create the follow-up timer.
- At 48 hours unopened: create a Mo follow-up task.
- Opened but no booking after 24 hours: create a contextual follow-up task.

Alerts contain only request ID, product, priority, SLA deadline, request source, and a protected internal URL. They do not contain profile text, resume text, prospect email, inferred facts, or company evidence. Notification writes are idempotent and auditable.

Mo and Rich receive:

- an immediate notification for new P0/P1 requests;
- a dashboard queue sorted by SLA risk;
- a morning open-request digest;
- an end-of-day overdue digest; and
- a weekly SLA/conversion report.

## Automation policy

Automate by default:

- request creation from approved inbound forms;
- internal acknowledgment and queue assignment;
- PDF validation and text extraction;
- structured profile draft;
- role-lane hypotheses;
- company shortlist draft;
- fresh-scan reuse when evidence is within policy;
- parallel bounded company scans;
- evidence labeling and source links;
- draft brief composition;
- automated quality checks;
- private-link generation after final approval;
- SLA reminders and follow-up tasks; and
- aggregate product-local performance metrics.

Require human action for:

- consent correction;
- profile fact confirmation;
- shortlist approval;
- unsupported-claim removal;
- acceptance of partial scan results;
- final brief approval; and
- sending the link or contacting the prospect.

No automated LinkedIn message, email outreach, or contact reveal is permitted in v1.

## SLA clock and speed levers

- Persist immutable `request_received_at`, `first_acknowledged_at`, `assigned_at`, `review_started_at`, `sent_at`, and status-event timestamps.
- Define the operating timezone, working-hours calendar, holidays, and after-hours promise before implementation.
- Pause the delivery clock only while required prospect consent or required source material is missing; persist the pause reason and duration.
- Do not pause the clock for internal extraction, scans, retries, review, notification failures, or owner handoffs.
- Show an immediate on-screen receipt for form requests. A short transactional receipt email may confirm the request and expected response window only after product-local delivery controls pass; it is not brief delivery or outreach.
- Assign Mo by default and Rich as backup. If Mo has not accepted a P0/P1 request within 30 minutes, route the handoff task to Rich without moving prospect data outside Starting Monday.
- Prefill from approved templates for common role families and reuse fresh product-local company scans when source policy and freshness permit.
- Provide one action to generate a partial reviewed brief from completed evidence at 30 minutes; preserve all failed, blocked, and incomplete denominators.
- Measure queue time, machine time, Mo active time, Rich review time, and prospect-wait time separately.
- Start with a two-week shadow measurement period so targets and staffing can be adjusted without weakening evidence or privacy controls.

## User story

> As Mo, when an interested prospect shares a LinkedIn PDF or pasted profile text and consents to a live analysis, I can create a private scan, review the evidence, and generate a branded brief that I can walk through live or send as a secure link.

## Existing code to reuse

### LinkedIn extraction

Reuse the PDF rules and parser in:

`src/app/api/(auth)/linkedin-import/extract/route.ts`

Current useful behavior:

- accepts LinkedIn profile PDF;
- 5 MB limit;
- verifies PDF magic bytes;
- extracts text with `pdf-parse`;
- returns clear invalid/empty PDF errors.

Do not call this authenticated customer route directly from the Mo workspace. Extract the parser into a shared server utility used by both the customer and staff workflows.

### Live company scan

Reuse:

`worker/scanner/scan-company.js`

Current useful behavior:

- robots.txt enforcement;
- structured ATS adapters before page scraping;
- Browserless fallback through the existing fetch path;
- role detection and scoring;
- scan-result persistence;
- blocked/error states;
- deduplication and new-opening detection.

Do not create a second scanner. The sales workflow should invoke the same scanner through an authorized, bounded job.

### Sample brief workflow

Reuse the existing admin sample-brief request, approval, and finalization patterns:

- `src/app/admin/sample-brief-requests/[id]/page.tsx`
- `src/app/admin/sample-brief-requests/actions.ts`
- `src/app/admin/sample-briefs/[id]/sample-brief-finalization-panel.tsx`

The existing workflow already models:

- staff review before generation;
- private prospect/run creation;
- human finalization;
- no automatic send.

Extend this workflow instead of creating a parallel live-brief product.

## Proposed operator flow

### Step 1: Create a live brief request

New internal page:

`/admin/live-briefs/new`

Required fields:

- Prospect name
- Prospect email
- LinkedIn profile URL
- LinkedIn PDF upload or pasted profile text
- Prospect consent checkbox and attestation source
- Current location / remote preference
- Target level or role lane, if known
- Request source and request-received timestamp
- Scheduled conversation date/time, when applicable
- Mo's internal notes

Consent statement:

> The prospect provided this profile information or authorized Starting Monday to use it to prepare a private career brief. No outreach will be sent on the prospect's behalf.

### Step 2: Parse profile and show an editable profile summary

Extract:

- current and recent titles;
- leadership scope;
- industries;
- quantified achievements;
- technologies and operating domains;
- geography;
- target-role hypotheses;
- company-type hypotheses.

Mo must be able to correct every field before a scan starts.

The UI should show two columns:

- Extracted facts
- Mo's reviewed/corrected version

Never silently overwrite the uploaded source text.

### Step 3: Generate a target-company shortlist

Create 8-12 proposed companies from approved company/public-source data.

For each company show:

- why it fits this person's background;
- target role lane;
- likely operating sponsor roles;
- career-page URL;
- scan readiness;
- evidence source;
- manual include/exclude control.

Mo should select no more than 10 companies for the live scan.

### Step 4: Run a bounded live scan

New staff-only action:

`POST /api/admin/live-briefs/[id]/scan`

Behavior:

1. Require staff authorization and recent authentication.
2. Verify consent and reviewed profile fields.
3. Create a job/run record with an idempotency key.
4. Queue one scan per selected company.
5. Call the existing `scanCompany` path.
6. Persist per-company statuses:
   - queued
   - scanning
   - complete
   - no public postings
   - blocked by site
   - failed
7. Enforce a maximum company count, timeout, and concurrency limit.
8. Never contact anyone or send a message.

The action should return immediately with a run ID; the UI polls the run state.

The scanner runs selected companies in bounded parallel batches. A fresh reusable scan may satisfy a company immediately when policy permits. At 30 minutes, Mo can accept a partial run and compose from completed companies; failed or blocked companies remain visible in the brief editor.

### Step 5: Compose the brief

The brief should contain:

1. **Executive positioning**
   - one sentence;
   - three proof points;
   - role lanes.

2. **Best-fit opportunities today**
   - verified public openings;
   - score/fit explanation in plain language;
   - public source URL and observation date;
   - `Observed`, `Inferred`, and `Needs verification` labels.

3. **Target companies without a current matching opening**
   - why the company remains worth researching;
   - likely target titles;
   - clear language that no matching posting was found.

4. **People to know**
   - role titles, not unverified names;
   - public LinkedIn company-people search link;
   - mutual-connection search prompt;
   - no guessed email or phone.

5. **Next three actions**
   - one company to research;
   - one person/role to identify;
   - one human-reviewed outreach or introduction action.

6. **Evidence and limits**
   - sources checked;
   - blocked sources;
   - scan timestamp;
   - no-guarantee statement;
   - consent/provenance record.

### Step 6: Mo review and release

Mo reviews all claims before release.

Required finalization checks:

- Profile facts match the supplied LinkedIn information.
- No internal model/debug language appears.
- Every current opening has a public source.
- No role is presented as certain or imminent without evidence.
- No personal contact data is guessed.
- Blocked and failed scans are visible, not hidden.
- The next actions are realistic for the prospect.

Release options:

- Present during a live call.
- Generate a time-limited private link.
- Export a PDF after finalization.

No automatic email or LinkedIn send in v1.

The private brief includes a persistent `Book a working session with Rich` CTA. Delivery and engagement telemetry remain first-party and product-local.

## Data model

Prefer extending existing sample-brief records where practical. If a separate table is required, keep it narrow:

### `live_brief_requests`

- id
- prospect_name
- prospect_email
- linkedin_url
- source_text_encrypted_ref or approved private storage reference
- consent_attested_at
- consent_source
- request_source
- request_received_at
- priority
- assigned_to
- sla_due_at
- sla_risk_at
- requested_by
- status
- reviewed_profile jsonb
- created_at / updated_at

### `live_brief_scan_runs`

- id
- request_id
- idempotency_key
- status
- selected_company_count
- completed_company_count
- blocked_company_count
- failed_company_count
- started_at / completed_at
- created_by

### `live_brief_scan_companies`

- run_id
- company_id or private snapshot
- career_page_url
- status
- scan_result_id
- error_class
- observed_at

### `live_brief_deliveries`

- id
- request_id
- token reference
- sent_at
- expires_at
- revoked_at
- first_opened_at
- last_opened_at
- view_count
- cta_clicked_at
- call_booked_at

### `live_brief_notifications`

- id
- request_id
- notification_type
- recipient_role
- idempotency_key
- status
- scheduled_at
- sent_at
- failure_class

Use RLS, staff-only access, append-only run events, and bounded payloads. Retention/deletion rules must be explicit before production use.

## Security, privacy, and source rules

- Mo must be an approved staff/operator role.
- Require same-origin mutation protection and recent authentication.
- Log create, scan, finalize, view, export, and revoke actions.
- Profile data is private prospect-supplied data, not public training data.
- Do not put prospect profile text into general logs, analytics, Slack, or Sentry.
- Do not scrape LinkedIn.
- Accept LinkedIn PDF or pasted text supplied/authorized by the prospect.
- Do not use Apollo contact data inside Starting Monday unless a separate approved customer-owned integration is implemented.
- Career-page scans must retain robots, source, and blocked-state controls.
- The brief must distinguish observed facts from inference.
- Add a retention period and an operator-accessible deletion/revocation action.

## UX requirements

Mo's workspace should be a five-step wizard:

1. Prospect
2. Profile review
3. Companies
4. Live scan
5. Final brief

Each step has one primary action. The scan screen shows progress by company and never leaves Mo wondering whether the job is still running.

The final brief editor should allow:

- remove a company;
- edit positioning;
- reorder opportunities;
- replace internal wording;
- mark a claim as needs verification;
- preview prospect view;
- revoke the link.

## Failure handling

- Invalid LinkedIn PDF: allow pasted text.
- Missing profile facts: require Mo correction before scanning.
- Career site blocked: show `Blocked by source policy`; do not retry indefinitely.
- No openings: produce company/relationship guidance, not a false opportunity.
- Scan timeout: preserve completed companies and allow retry of failed companies only.
- Duplicate submit: return the existing run via idempotency key.
- Partial completion: allow a brief only after Mo explicitly accepts the partial result.

## Phased implementation

### Phase 1: Sendable brief and SLA queue

- Confirm Mo's staff identity/role.
- Extract shared LinkedIn PDF parsing utility.
- Add private request/profile review page.
- Reuse sample-brief storage if contract-compatible.
- Add request queue, assignment, SLA clock, and internal alerts.
- Add bounded scan for up to 10 companies.
- Compose a sendable brief with a booking CTA.
- Require Mo review before delivery.

Acceptance:

- Staff-only access tests.
- Consent required.
- Uploaded text never appears in logs.
- Profile fields are editable and source text remains immutable.
- New P0/P1 requests alert Mo and Rich within 5 minutes.
- p90 request-to-delivery is measured from the first real request.

### Phase 2: Speed and follow-up automation

- Add fresh-scan reuse and bounded parallelism.
- Add automatic partial-ready prompt at 30 minutes.
- Add private-link open and CTA telemetry.
- Add Mo follow-up task creation.
- Add SLA dashboard and digests.

Acceptance:

- Same company/run cannot duplicate writes.
- Robots/SSRF/source boundaries remain enforced.
- Timeout and partial-run tests pass.
- Cross-tenant/staff denial tests pass.
- Mo active time is measured and trends toward 20 minutes or less.

### Phase 3: Quality and conversion optimization

- Calibrate Rich review for briefs 1-15, then sample 1 in 5.
- Add full-brief versus depth-gated CTA experiment only after baseline volume.
- Add PDF export only if prospects request it.
- Keep all external sending manual.

Acceptance:

- Every observed claim has a source and observation date.
- Inference is labeled.
- Blocked/failed scans remain visible.
- Private-link auth/expiry/revocation tests pass.
- Booking conversion and usefulness feedback are measured.

Do not add enrichment or automated outreach until the reviewed workflow has enough usage evidence.

## Test plan

### Unit

- LinkedIn PDF parser limits and invalid-file handling
- Profile fact extraction fixtures
- Target-role and company shortlist fixtures
- Brief observed/inferred labeling
- Redaction of profile text from logs

### API/database

- Staff authorization and recent-auth enforcement
- Consent requirement
- Idempotent request and scan creation
- Cross-user/cross-tenant denial
- Bounded company count
- Retry only failed/blocked-eligible companies
- Private-link expiry and revocation
- Retention/deletion behavior

### Integration

- Profile PDF -> reviewed profile -> selected companies -> live scan -> final brief
- Mixed complete/no-opening/blocked/failed company fixture
- Partial run accepted/rejected by Mo
- Scanner uses existing production adapters and policies

### E2E

- Mo creates a brief from a synthetic LinkedIn PDF
- Corrects extracted fields
- Selects three fixture companies
- Runs scan and watches progress
- Finalizes the evidence-bounded brief
- Opens the prospect view through a private link
- Revokes the link and verifies access fails

## Go-live gate

V1 may go live only when:

- Mo's staff authorization is explicit.
- Consent and deletion behavior are approved.
- No profile text leaks into logs or analytics.
- Existing scanner security/source controls remain intact.
- The private link expires and can be revoked.
- Every brief is human-reviewed.
- No automatic sending exists.
- A rollback disables new scans while preserving audit history.
- New request notifications and escalation timers are tested.
- SLA dashboards use `request_received_at` and `sent_at` consistently.
- P0/P1 alert payloads contain no profile text or prospect contact details.
- Mo can accept a partial scan without hiding failures.
- Rich's calibration schedule for the first 15 briefs is staffed.
