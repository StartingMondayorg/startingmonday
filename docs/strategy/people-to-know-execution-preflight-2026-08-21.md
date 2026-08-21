# People to Know Execution Preflight

Date: 2026-08-21  
Products: Starting Monday and MandateSignal, with separate product-local implementations  
Input: `docs/strategy/solpeopletoknowbrief20260821_1.md`  
Input commit: `bce17eef8b99ad400205c8348582ea49ccf3dd29`  
Scope expansion: Rich directed both-product execution on 2026-08-21; the verbatim input remains unchanged as the original Starting Monday brief  
Status: link-only stories `READY`; cited-name stories `BLOCKED_EXTERNAL` on per-product source/legal approval

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

## 3. Approved decisions and external gates

Rich directed execution of preparation items 1-5 on 2026-08-21. That direction approves the owner-controlled dispositions below. It does not substitute for the named legal/privacy review of source display, lawful basis, retention, deletion, or vendor terms.

| ID | Approved disposition | Remaining external gate |
| --- | --- | --- |
| PTK-D1 | Four separately released slices are registered as WS7-10, WS7-11, WS8-09, and WS8-10. | None for link-only implementation |
| PTK-D2 | Use the brief's trust line verbatim. `why_them` is one evidence-bounded sentence, at most 240 characters, describing the role's likely decision influence; it may not infer a relationship, availability, intent, or contactability. | CLR-8 and product copy review |
| PTK-D3 | Use LinkedIn people-search `keywords`: verified name + company when a name exists, otherwise role title + company. Do not claim a `currentCompany` filter unless a verified LinkedIn company ID is available. | Link contract test against current public URL behavior |
| PTK-D4 | Plain Apollo destination is `https://app.apollo.io/#/people` with copy “Open in your Apollo account.” MandateSignal renders it separately from “Reveal verified contact (uses credits).” | Referral tag waits for Apollo's response and separate approval |
| PTK-D5 / PTK-D12 | Persist count-only product-local metrics keyed to the owning delivery or tenant lead plus destination. Store `click_count`, `first_clicked_at`, and `last_clicked_at`; no raw click rows, query/search text, name, contact field, outbound URL, or free text. Delete with the parent; reports expose aggregate counts/rates only. | Privacy/data review before production enablement |
| PTK-D6 / PTK-D11 | Initial candidate sources are official company leadership/about/team pages, official company newsroom/IR announcements, and official SEC filings. Rights are decided independently per product and do not transfer. All collection/display remains fail-closed until each product's legal matrix approves the use. | Named legal/source-rights approval in each product |
| PTK-D7 | Starting Monday claims are request + selected-company + role-family scoped, service-role-only, and deleted/redacted with the Live Brief request lifecycle. No reusable person entity or cross-request person key. | Retention/deletion legal review before migration |
| PTK-D8 | Leadership-page removal/absence-diff detection is deferred from the first resolver. The initial slice may process only positive, current evidence. | Separate snapshot/absence story before later use |
| PTK-D9 | MandateSignal names are claim-grain lead evidence, not person-grain tracking: no person entity, profile, enrichment, relationship graph, movement history, or cross-lead identifier. D15 continues to prohibit those person-level forms. | Legal/privacy confirmation before persistence/display |
| PTK-D10 | MandateSignal claims are tenant + lead + company + role-family scoped, RLS-protected, and separate from `contact_reveals` and `prospect_events`. They re-verify at 90 days and delete with the governed lead lifecycle. | LEG-03/04/05 approval and tests before migration |

Apollo D-A uses the official partner program and `partners@apollo.io`. A referral answer does not authorize an Apollo API path or transfer vendor rights between products.

## 4. Link-only slice contract

The first implementation slice should contain only:

1. A pure LinkedIn URL builder using allowlisted `https://www.linkedin.com/search/results/people/` output and encoded search inputs.
2. A fixed allowlisted Apollo account link, with no referral parameter until D-A is resolved and approved.
3. A structured People to Know artifact section containing role title, optional verified name, optional citation/date, `why_them`, and outbound links. In the link-only slice, the name remains absent unless supplied through a separately approved evidence path.
4. A public renderer with the approved trust line and clear external-link behavior.
5. Destination-specific count rows using the approved PTK-D5/PTK-D12 contract.
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
- Metrics tests for allowlisted destination values, atomic count increments, payload minimization, invalid destination rejection, parent deletion, and aggregate reporting.
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
| Starting Monday PTK-2/PTK-3 | `READY` | Registered as WS7-10; production enablement still needs privacy review and normal release evidence |
| Starting Monday PTK-1/PTK-4 names | `BLOCKED_EXTERNAL` | WS1-08 customer-display rights, story registration, claim/lifecycle contract |
| MandateSignal PTK-2/PTK-3 | `READY` | Registered as WS8-09; production enablement still needs privacy review and normal GA/release evidence |
| MandateSignal PTK-1/PTK-4 names | `BLOCKED_EXTERNAL` | Registered as WS8-10; source rights; ENG-03/04; LEG-03/04/05; WS8 gate |
| Cross-product runtime/data sharing | `PROHIBITED` | DG-03 and DG-11; separate products remain authoritative |

## 8. WS7-10 implementation evidence

Local implementation on branch `docs/people-to-know-brief-intake` is `IMPLEMENTED` and `TESTED`, default off:

- Pure allowlisted LinkedIn keyword URL and fixed Apollo account destination.
- Structured title/why-them Live Brief renderer capped at three entries.
- Runtime capability exposed by the token API only when `LIVE_BRIEF_PEOPLE_HANDOFF_ENABLED` is explicitly enabled.
- Count-only delivery/destination metrics with atomic RPC; no raw click rows or contact/search payload.
- No-contact/no-provider/cross-product deliberate-red tests.
- Migration 178 with service-role-only ACLs and rollback/forward-fix playbook.

Evidence:

- Focused Vitest: 5 files / 20 assertions pass.
- TypeScript: pass.
- Focused lint: pass, with only two pre-existing `any` warnings in Live Brief routes.
- Production build: pass after replacing the temporary cross-worktree dependency junction with a normal `npm ci` install.
- Rollback-contained database validation: migration 178 applied cleanly; 6/6 focused table/RLS/ACL/no-contact assertions pass; transaction rolled back.
- Full existing Live Brief pgTAP did not run because the Starting Monday local Supabase stack was not running and the Windows CLI resolved host `db` incorrectly. The prior 20-assertion file is updated but remains pending in a migrated Starting Monday stack/Preview.
- Strict rollback readiness remains red on the pre-existing filename mismatch for migration `1671`; migration 178 has its required playbook.

State: WS7-10 is `TESTED_LOCAL`. It is not `DEPLOYED` or enabled. Preview/staging migration, full Live Brief pgTAP, browser evidence, privacy review, protected PR, and release evidence remain.