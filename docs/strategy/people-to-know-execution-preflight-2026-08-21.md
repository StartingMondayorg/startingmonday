# People to Know Execution Preflight

Date: 2026-08-21  
Products: Starting Monday and MandateSignal, with separate product-local implementations  
Input: `docs/strategy/solpeopletoknowbrief20260821_1.md`  
Input commit: `bce17eef8b99ad400205c8348582ea49ccf3dd29`  
Scope expansion: Rich directed both-product execution on 2026-08-21; the verbatim input remains unchanged as the original Starting Monday brief  
Status: `REPLAN_REQUIRED`; product-local link-only hand-offs are preparation-ready after owner decisions; public-name resolution is blocked on source rights, D14/D15, and contract decisions

## 1. Preflight disposition

The People to Know brief introduces behavior not fully governed by an existing canonical story. Rich subsequently expanded the target to both products. Execution must use four independently reviewable product-local slices:

1. **Starting Monday link-only hand-off:** PTK-2, PTK-3, and applicable PTK-4 controls in private Live Briefs.
2. **Starting Monday cited public-name resolution:** PTK-1 plus source, storage, freshness, contradiction, and rendering controls.
3. **MandateSignal link-only hand-off:** product-local links on customer lead/detail and eligible digest/brief projections, distinct from contact reveal.
4. **MandateSignal cited public-name resolution:** product-local public-name evidence for customer leads, subject to D14/D15 reconciliation and MandateSignal GA controls.

The canonical signal-engine plan must register the four slices or explicitly map them to amended stories before code begins. The likely canonical neighborhoods are WS7 for Starting Monday projection and WS8 for MandateSignal projection:

- WS7-03 evidence rendering contract;
- WS7-06 outreach assist rung 1, with no send path;
- WS1-08 vendor-rights reconciliation;
- WS2-04 source-family taxonomy and WS2-06 fail-closed rights policy;
- WS3-03 entity and claim contract;
- WS5-02 snapshot collection and WS5-05 claim extraction where automated source collection is used.
- WS8-04 evidence-bounded feed, WS8-05 digest, WS8-06 operator QA, and WS8-08 Limited Availability gate for MandateSignal.

Applicable decisions are DG-03 (product-local schemas), DG-09 (Starting Monday customer exposure), DG-10 (MandateSignal concierge QA), and DG-11 (no shared-package extraction yet). Each repository requires its own schema, source decisions, runtime, tests, evidence, feature flags, deployment, and rollback. Neutral contract fixtures may be duplicated only after their contract is approved; no cross-product runtime or table access is allowed.

## 2. Current verified baseline

### Live Brief

- Live Brief is Starting Monday-local and service-role-only.
- `worker/scanner/live-brief-scan.js` scans an operator-selected career page for role postings. It does not resolve executives from leadership pages, filings, press releases, appearances, or discovery APIs.
- The reviewed brief is currently a manually edited JSON object finalized as an immutable artifact.
- The public delivery page renders generic artifact sections. It has no structured People to Know renderer.
- `live_brief_events` permits section views and one generic CTA click. It has no destination-specific LinkedIn/Apollo hand-off event.

### Source rights

`docs/evidence/ws1-08-source-rights-readiness-2026-08-13.md` is fail-closed:

- 0 of 16 priority sources were ready for accountable review;
- SEC EDGAR, company press releases, Google News/GNews, business journals, and other current sources lack complete use-specific decisions, including customer display and retention;
- Wikidata, IRS Form 990, and several proposed PTK sources have no catalog row;
- the source catalog's `public` or `licensed` labels are not approval for customer display; and
- WS1-08 remains `BLOCKED_EXTERNAL` pending actual terms/agreements and accountable decisions.

PTK-1 therefore cannot start collection, persistence, or customer display.

### Existing person data

The `people`, `person_sources`, `contact_people`, and `company_people_candidates` tables are part of the narrowed REM-01 known exception. They include person-profile and historical Apollo shapes and are not eligible PTK storage. PTK must not reactivate, expand, or write those tables.

### Claims and telemetry

- Starting Monday has the CLR-8 plain-language gate.
- It does not have the claims-manifest mechanism named in the brief. PTK must either add a narrowly scoped Live Brief claims contract or amend the requirement to use an existing approved substantiation control.
- Click reporting must define whether “aggregate counts only” permits request/delivery-linked raw events. The current Live Brief ledger is event-level, even though reports can aggregate it.

### MandateSignal baseline

- MandateSignal already has a product-local paid Apollo contact-reveal path that can store verified name, title, email, and LinkedIn URL for an organization-scoped lead. PTK must not call, merge with, meter, or change that path.
- The PTK block remains no-contact-data: no email/phone fetch, storage, payload, artifact, telemetry, or display. Existing contact reveal remains a separately labeled user action.
- `src/lib/source-rights.ts` fail-closes customer display of raw source data and permits only an explicit display-approved source set. A cited public name/title needs a new approved personal-data disposition; it cannot be silently classified as an existing derived company signal.
- `config/prospecting-source-policy.json` governs Rich's consenting sales prospects and explicitly prohibits licensed provider APIs. It is not authority for customer lead contacts.
- MandateSignal's rights register currently approves customer display for a narrow set of company-level sources; `people_moves_parser` is internal-only and Apollo org-change data is restricted. MandateSignal requires its own Apollo approval.
- D15 prohibits person-level tracking of signal subjects at watched companies. Existing `prospect_events` are a separate CRM exception for Rich's consenting sales prospects. PTK names require an explicit D14/D15 classification before persistence or display.
- Applicable GA controls remain controlling: ENG-03 freshness/retraction/contradiction, ENG-04 quality burn-in, AUTHZ-01/02 tenancy, AUTHZ-04 privileged corrections, LEG-03 data flow/lawful basis, LEG-04 retention, LEG-05 deletion, REL-04 kill behavior, and the WS8 Limited Availability gate.

## 3. Required owner and external decisions

| ID | Decision | Owner | Required before | Default if unresolved |
| --- | --- | --- | --- | --- |
| PTK-D1 | Approve the four-slice, two-product execution split and canonical story registration | Rich / AO | Any implementation | No code |
| PTK-D2 | Approve the verbatim trust line and a one-line `why_them` format | Rich / AO | Link-only renderer | Keep current titles-only brief |
| PTK-D3 | Define the exact LinkedIn search behavior when no LinkedIn company ID exists: encoded keyword search or a stricter company-filter contract | Rich + ENG-SM + ENG-MS | PTK-2 | No LinkedIn hand-off link |
| PTK-D4 | Approve plain Apollo destination and wording while referral/OEM questions are unresolved; decide how MandateSignal distinguishes it from paid contact reveal | Rich / AO | PTK-3 | LinkedIn only |
| PTK-D5 | Decide telemetry grain, allowed fields, retention, deletion, and reporting denominator for destination clicks | Rich + privacy/data owner | PTK-3 telemetry | Do not record destination clicks |
| PTK-D6 | Approve initial customer-display sources and all six WS1-08 use decisions | Rich + legal/privacy | PTK-1 | Title-only fallback |
| PTK-D7 | Select PTK claim identity and lifecycle: request-scoped company claim or reusable canonical-company claim; define retention and deletion | Rich + ENG-SM + privacy | PTK-1 schema | No persistence |
| PTK-D8 | Decide whether leadership-page removal detection is in the first resolver; it requires snapshots and absence-diff evidence, not a one-time fetch | Rich / AO | PTK-1 scope | Defer removal detection |
| PTK-D9 | Classify MandateSignal cited names under D14/D15: prohibited signal-subject tracking, bounded lead-contact evidence, or another explicit governed class | Rich + legal/privacy + ENG-MS | MandateSignal PTK-1 | No name persistence/display |
| PTK-D10 | Approve separate MandateSignal data shape and retention/deletion behavior; `contact_reveals` and `prospect_events` are not default PTK storage | Rich + legal/privacy + ENG-MS | MandateSignal PTK-1 | No schema |
| PTK-D11 | Approve per-product source rights; Starting Monday and MandateSignal decisions do not transfer between products | Rich + legal/privacy | Either resolver | Source blocked in that product |
| PTK-D12 | Approve whether aggregate click reports may derive from tenant/request-linked events in each product | Rich + privacy/data owners | Telemetry | No destination telemetry |

Founder action D-A remains external: send Apollo partnerships the referral-program, listed-integration, and OEM-pricing questions. A referral answer does not unblock or authorize an Apollo API path.

## 4. Link-only slice contract

The first implementation slice should contain only:

1. A pure LinkedIn URL builder using allowlisted `https://www.linkedin.com/search/results/people/` output and encoded search inputs.
2. A fixed allowlisted Apollo account link, with no referral parameter until D-A is resolved and approved.
3. A structured People to Know artifact section containing role title, optional verified name, optional citation/date, `why_them`, and outbound links. In the link-only slice, the name remains absent unless supplied through a separately approved evidence path.
4. A public renderer with the approved trust line and clear external-link behavior.
5. Destination-specific, minimized click telemetry only if PTK-D5 is approved.
6. Independent default-off flags in each product, such as `LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED` in Starting Monday and `PEOPLE_TO_KNOW_HANDOFF_ENABLED` in MandateSignal.

The slice must not:

- call LinkedIn, Apollo, or any contact-data provider from the server or browser;
- fetch, infer, display, store, or log email addresses or phone numbers;
- read the other product's APIs, tables, runtime, or customer/evidence rows;
- imply a name is verified without source URL and observed date; or
- send outreach automatically.

### Link-only acceptance evidence

- Pure URL tests for known-name and title-only cases, encoding, allowed host/path, and malformed-input fallback.
- Renderer tests for title-only fallback, approved trust copy, external-link attributes, and absent contact fields.
- API/event tests for allowlisted destination values, payload minimization, invalid destination rejection, expiry/revocation behavior, and idempotency policy.
- A planted violation proving the PTK no-contact-data gate fails on email/phone-shaped user-facing schema fields.
- A repository inventory proving no PTK path fetches LinkedIn/Apollo and no autonomous send path exists.
- Desktop/mobile Playwright checks for the private brief.
- CLR-8 and applicable claims/substantiation checks.
- Flag-off characterization proving the current brief is unchanged.

### Link-only rollback

Disable the hand-off flag. Existing immutable artifacts and delivery events remain readable. The current generic brief renderer and booking CTA remain authoritative. No provider or schema rollback is required unless destination telemetry adds a migration; any additive event-contract migration needs a forward-fix playbook.

MandateSignal rollback is separate: disable its PTK flag while retaining current lead/detail, digest, and contact-reveal behavior. PTK failure must not spend reveal credits, call Apollo, or alter existing reveal rows.

## 5. Public-name resolver prerequisites

PTK-1 starts only after all of the following pass:

1. Canonical story registration and dependency mapping.
2. A narrowed initial source set with current rights-register rows and explicit customer-display, retention, attribution, model, aggregate, and export decisions.
3. A source-family contract that distinguishes discovery provider from cited underlying page.
4. Product-local claim schema and RLS/service-role design that does not create a person profile.
5. Company identity mapping, role-family version, source tier, source ID, source URL, observed timestamp, extraction method, and retraction/conflict state.
6. A 90-day re-verification rule with title-only fallback on stale, blocked, missing, or conflicting evidence.
7. Explicit deletion behavior for source evidence, claims, artifacts, telemetry, and backups.
8. Robots, SSRF, redirect, timeout, size, content-type, prompt-injection, and source-policy controls for every fetch path.
9. Bounded run/cost budgets, checkpoint/error states, and independent collection kill behavior.
10. A manual adjudicated fixture set covering current appointments, stale leadership pages, announced changes, conflicts, removals, blocked pages, uncited names, and title-only fallback.

### Recommended first PTK-1 experiment

Use a manual-source concierge fixture before automated discovery:

- operator supplies the underlying public source URL;
- the system applies the same rights, fetch, extraction, citation, freshness, and title-only rules;
- no discovery API is required;
- every output receives human review before finalization; and
- measured resolution yield and correction rate decide whether automated discovery is worth adding.

This is smaller and more falsifiable than enabling the full Appendix A source universe at once.

### PTK-1 rollback and kill

- Keep public-name resolution behind a separate default-off flag from link hand-off.
- Flag-off renders title and why-them only.
- A source rights reversal quarantines that source immediately and prevents new display.
- A stale or retracted claim is never deleted to make history look clean; it becomes ineligible for new artifacts and records the superseding/retraction reason.
- Disable collection independently from rendering already finalized, still-valid artifacts.

## 6. Preparation sequence

1. Rich approves PTK-D1 through PTK-D5 and sends D-A.
2. Amend the canonical plan with four product-local slices, dependencies, checks, and rollback behavior.
3. Amend the Mo Live Brief plan section 5.4 so the active product plan no longer says names are always titles-only.
4. Add a MandateSignal-local product preflight that references this canonical record without copying the master plan.
5. Implement and validate the Starting Monday and MandateSignal link-only slices as separate PRs behind separate default-off flags.
6. Complete per-product rights decisions for deliberately narrow initial resolver source sets.
7. Approve PTK-D6 through PTK-D12 and both product-local claim contracts.
8. Run separate manual-source resolver experiments in each product.
9. Consider automated discovery only after product-specific measured yield, correction, rights, cost, and operator-effort evidence support it.

## 7. Current gate state

| Slice | State | Blocking gate |
| --- | --- | --- |
| Verbatim intake | `VERIFIED` | None; committed at `bce17eef` |
| Starting Monday PTK-2/PTK-3 | `BLOCKED_OWNER` | PTK-D1 through PTK-D5; canonical story registration |
| Starting Monday PTK-1/PTK-4 names | `BLOCKED_EXTERNAL` | WS1-08 customer-display rights, story registration, claim/lifecycle contract |
| MandateSignal PTK-2/PTK-3 | `BLOCKED_OWNER` | PTK-D1 through PTK-D5 and PTK-D12; canonical WS8 story; coexistence with reveal |
| MandateSignal PTK-1/PTK-4 names | `BLOCKED_EXTERNAL` | PTK-D9 through PTK-D11; source rights; ENG-03/04; LEG-03/04/05; WS8 gate |
| Cross-product runtime/data sharing | `PROHIBITED` | DG-03 and DG-11; separate products remain authoritative |