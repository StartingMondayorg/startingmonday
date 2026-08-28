# Signal Brief Renderer Story

**Status:** Adapter implementation complete; caller integration pending
**Source:** Adam Weiss sales review, sections 1-4
**Scope:** Signal-brief presentation contract for VAR and recruiter brief pipelines

## Story

As a relationship-driven seller, I need a brief to lead with the commercial problem, show the parameterized economic implication, explain what the brief does, and present account tactics as an investigate-first call plan.

## Delivered in this slice

- A typed `SignalBriefInput` contract with value-cover fields.
- Deterministic HTML rendering for the value cover and account profiles.
- `Tactics` as the display label while preserving `suggested_move` as the input field.
- Discovery questions rendered in Situation, Problem, Implication, and Need-payoff order.
- Positioning copy retained as a hypothesis to confirm before proposing a solution.
- HTML escaping for reader, account, positioning, tactic, question, and method-note strings.
- A fail-closed adapter for the selected client-facing prospect-collateral caller boundary.
- Runtime validation for client economics, exactly-three-item cover sections, grouped SPIN questions, dated evidence, and HTTPS sources.
- A disabled-by-default internal preview route at `/api/internal/signal-brief/preview` with internal secret/IP authorization, bounded payload size, and no-store responses.
- A signal-brief quality gate enforcing SPIN question cardinality and investigate-first positioning before rendering.
- An explicit request-scoped `sample_mode` policy that renders one selected profile at full depth and all other profiles as account-only teasers.
- A separate `SIGNAL_BRIEF_SAMPLE_MODE_ENABLED` kill switch so sample rendering cannot be enabled accidentally by request payload alone.

## Acceptance evidence

- Renderer unit tests cover value-cover ordering and expected-value math.
- Renderer unit tests cover Tactics labeling and SPIN ordering.
- Renderer unit tests cover escaping of reader-controlled strings.
- Renderer unit tests cover dated public evidence and escaped source URLs.
- Adapter tests cover payload mapping and invalid economics, dates, sources, and cover cardinality.
- Route tests cover authorization precedence, disabled-by-default behavior, malformed JSON, invalid payloads, and successful rendering.
- Route validation rejects prescriptive positioning and malformed SPIN question structures.
- Sample-mode tests prove one full-depth profile and teaser-only output for the remaining profiles.
- Route tests prove sample mode remains disabled unless its explicit feature flag is enabled.
- Disable and re-enable procedure is documented in `docs/development/signal-brief-preview-rollback.md`.
- Representative public-record fixture `tests/fixtures/signal-brief/dataendure-prospect.json` renders through the adapter, quality gate, and preview route in an integration test.
- Agecroft Partners fixture `tests/fixtures/signal-brief/agecroft-partners.json` renders through the same pipeline using dated public media/company sources; it is explicitly a hypothesis because no current trigger was verified.
- ADI Global Distribution fixture `tests/fixtures/signal-brief/adi-global-distribution.json` renders through the same pipeline using dated official company activity; the report's separation/TSA thesis remains a discovery hypothesis until canonical filings are verified.
- TypeScript compilation passes for the new contract.

## Deliberate boundary

This slice implements only the pure rendering policy and kill switch for sample mode. It does not implement pricing menus, billing, subscription terms, pilot-roster focus, or any other recommendation in Adam sections 5-7. Those remain explicit commercial decisions. The first caller is selected as client-facing prospect collateral. The preview endpoint is an internal, feature-disabled integration seam; it is not yet a production prospect workflow.

## Next integration decision

Connect an approved client-facing prospect-collateral producer and map its source payload through `adaptSignalBriefPayload`. The integration must preserve public-record provenance, dated facts, and client configuration boundaries before rendering an artifact. Keep `SIGNAL_BRIEF_PREVIEW_ENABLED=0` until the integration test, rollback/disable drill, and commercial approval are complete. The disable procedure is documented in `docs/development/signal-brief-preview-rollback.md`. Enable `sample_mode` only from an explicitly approved caller configuration, and add a priced menu only after Rich approves the commercial offer.
