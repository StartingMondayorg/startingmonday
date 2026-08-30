# Starting Monday People to Know Source Rights Decision

Date: 2026-08-21  
Product: Starting Monday  
Owner disposition: `APPROVED_FAIL_CLOSED_SCOPE`  
Legal/source-rights state: `BLOCKED_EXTERNAL` pending named review  
Governing story: WS7-11

## Data classification

A cited name and role are public-source personal data. They remain claim-grain evidence tied to one Live Brief request, selected company, role family, source, and observation time. Starting Monday does not create a person entity, profile, enrichment record, relationship graph, movement history, or cross-request identity.

No PTK path collects, stores, displays, or logs email addresses or phone numbers. A LinkedIn or Apollo URL is an outbound hand-off destination, not evidence and not a fetched source.

## Initial source matrix

`conditional_legal` is fail-closed: no application collection, persistence, or customer display until a named legal/source-rights reviewer approves the exact source family and records terms/policy date, attribution, retention, and re-entry date.

| Source family | Collection | Internal analysis | Customer display | Model training | Aggregate statistics | Export/publication | Current disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Official company leadership/about/team page | `conditional_legal` | `conditional_legal` | `conditional_legal` | `blocked` | `blocked` | `blocked` | Candidate for manual-source trial only after review |
| Official company newsroom/IR appointment or departure announcement | `conditional_legal` | `conditional_legal` | `conditional_legal` | `blocked` | `blocked` | `blocked` | Candidate for manual-source trial only after review |
| Official SEC filing hosted by SEC.gov | `conditional_legal` | `conditional_legal` | `conditional_legal` | `blocked` | `blocked` | `blocked` | Candidate for manual-source trial only after review |
| LinkedIn | `blocked` | `blocked` | `link_out_only` | `blocked` | `blocked` | `blocked` | People-search URL only; never fetch or scrape |
| Apollo | `blocked` | `blocked` | `link_out_only` | `blocked` | `blocked` | `blocked` | Plain account link only; no API/provider data |
| Search/discovery APIs | `blocked` | `blocked` | `blocked` | `blocked` | `blocked` | `blocked` | Separate vendor terms, cost, and data-flow review required |
| Every other Appendix A source | `blocked` | `blocked` | `blocked` | `blocked` | `blocked` | `blocked` | Requires a new product-local rights row and review |

The existing source catalog labels `public` and `licensed` are not approval for these uses. Starting Monday's 2026-08-13 WS1-08 fail-closed evidence remains truthful and is not rewritten by this owner scope decision.

## Claim and lifecycle contract

- Identity: `request_id + live_brief_scan_company_id + role_family + source_key + source_url`.
- Required evidence fields: nullable `display_name`, role title, role-family version, why-them, source key, source URL, source tier, observed time, extraction method, and supersession/retraction state.
- Storage: service-role-only product-local table; no authenticated browser table access.
- Freshness: re-verify at 90 days before inclusion in a newly finalized artifact.
- Failure behavior: stale, blocked, missing, conflicting, or uncited evidence renders role title only.
- Correction: append a superseding/retraction record; do not silently overwrite history.
- Retention: claim rows follow the approved Live Brief request lifecycle and are redacted/deleted with request evidence. A final legal decision must address backups and retained audit metadata before migration.
- Removal detection: deferred. The first resolver accepts positive current evidence only and does not infer removal from a one-time missing page.

## Approval needed to unblock WS7-11

A named legal/source-rights reviewer must approve or reject each `conditional_legal` row and record:

1. exact source policy/terms URL and version/date;
2. commercial collection and customer-display position;
3. attribution and excerpt limits;
4. retention, deletion, backup, and legal-hold behavior;
5. permitted model/aggregate/export uses, even when the decision is `blocked`;
6. review date, next review date, owner, and reversal trigger.

Until then, WS7-10 may render title-only hand-off; WS7-11 remains disabled.

## Rollback and kill

- `LIVE_BRIEF_PUBLIC_NAMES_ENABLED` defaults off and independently disables name resolution/rendering.
- Source-rights denial or review expiry blocks new claims immediately.
- Flag-off renders title and why-them only; link hand-off may remain independently enabled.
- No rollback may reactivate REM-01 person tables or restore Apollo-derived person data.