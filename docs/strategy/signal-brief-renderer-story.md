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

## Acceptance evidence

- Renderer unit tests cover value-cover ordering and expected-value math.
- Renderer unit tests cover Tactics labeling and SPIN ordering.
- Renderer unit tests cover escaping of reader-controlled strings.
- Adapter tests cover payload mapping and invalid economics, dates, sources, and cover cardinality.
- TypeScript compilation passes for the new contract.

## Deliberate boundary

This slice does not implement sample-mode gating, pricing, subscription terms, pilot-roster focus, or any other recommendation in Adam sections 5-7. Those remain explicit commercial decisions. The first caller is selected as client-facing prospect collateral, but the endpoint/generation caller does not yet exist in this repository; integration remains disabled until that caller and its source JSON are provided.

## Next integration decision

Implement the client-facing prospect-collateral caller and map its source payload through `adaptSignalBriefPayload`. The integration must preserve public-record provenance, dated facts, and client configuration boundaries before rendering an artifact. Add an integration test and a rollback/disable control before enabling it for prospects.
