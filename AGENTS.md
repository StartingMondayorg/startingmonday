<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Document Intake Contract

- Any document Rich hands over is committed verbatim to docs/strategy/ (or docs/inbox/) before review; feedback references the committed version.

## Sitewide Design Standard

- Canonical design and editorial standard: docs/landing-page-standard.md
- All sitewide UX/style gates and migration work should use that file as source of truth.
- Route compliance claims must be backed by inventory-driven audit output (no partial-scan claims).

## Signal Engine Program Governance

- Canonical plan: `docs/signal-engine-cross-product-master-plan-2026-07-26.md`.
- This plan governs work that touches the intelligence scanner, canonical events, outcome labels, backtests, claims, snapshots, coverage, role state, assignment beliefs, opportunity ledgers, origin-seat transitions, hazard/calibration models, signal recipes, or cross-product learning with MandateSignal.
- Historical scanner plans and completion summaries are evidence inputs only where the canonical plan says so. They must not silently override its boundaries, gates, story dependencies, or definitions of done.

### Signal-engine preflight

Before changing code, schema, configuration, prompts, jobs, tests, product surfaces, or documentation in that scope:

1. Read the canonical plan sections relevant to the task.
2. Name the governing `WS#-##` story or explicitly record that a new story/re-plan is required.
3. Identify the applicable decision (`DG-*`), control, prerequisite, acceptance evidence, rollback/kill behavior, and product-local repository.
4. Re-check repository and runtime evidence required by the story; do not promote provisional audit claims to deployed or measured facts.
5. Stop on a conflict with a locked architecture boundary, failed gate, held artifact, product launch control, or source-rights decision.

Do not begin implementation until the preflight is complete. At handoff, report the story ID, evidence produced, checks run, remaining gate state, and whether the canonical plan or evidence index requires an update.

- Run `npm run guard:signal-engine-plan` when changing the plan, these instructions, or signal-engine governance tooling.
- Do not copy the canonical plan into MandateSignal. MandateSignal must reference this source and retain separate data, deployment, and release controls.

## Truthfulness And Verification Contract

1. Verification-first
- Never claim route availability, deployment state, auth/provider state, or URL correctness without checking tools/commands in the same turn.
- If not checked, mark it explicitly as Unverified.

2. Claim labeling
- Prefix factual statements with one of:
  - Verified: backed by command/tool output.
  - Unverified: hypothesis pending checks.

3. No placeholder hosts as real targets
- Never present placeholder domains as actionable URLs.
- If base URL is unknown, ask for it or infer from repo config and mark confidence.

4. Evidence for environment claims
- For branch, deploy, or runtime claims, run commands first and include key result lines.

5. No assumption-based deployment claims
- Do not assume changes are pushed or deployed.
- Check branch, worktree status, commit SHA, and remote head before answering.

6. Conflict-stop behavior
- If evidence conflicts, stop and report the conflict explicitly, then ask one focused clarification question.

7. If blocked, say blocked
- State exactly what is blocked (permissions, missing env vars, provider config, network), with one concrete next action.

## Page Experience Auditor Addendum (Dashboard A-grade)

- Apply this addendum when auditing:
  - /dashboard
  - /dashboard/briefing
  - /dashboard/signals
  - /dashboard/calendar
  - /dashboard/contacts

- Required A-grade contracts:
  1. Signal parity contract:
  - Dashboard summary count, briefing header count, and signals index count must agree for the same session and same filters.
  - Any cross-route mismatch is a P0 trust failure.
  2. Relative-time trust contract:
  - Do not allow stale free-text duration phrases (for example, "has been X days") in follow-up or alert copy.
  - Prefer deterministic date anchors and single-source recency labels.
  3. Chrome and metadata contract:
  - Top chrome must remain structurally consistent across all five routes, with one deliberate exception: the current page never links to itself. /dashboard omits the Dashboard link (or renders it as a non-link current-page indicator); sub-routes keep the Dashboard link as the way back.
  - Browser titles must follow route label + " - Starting Monday" pattern.
  4. Landmark contract:
  - Exactly one main landmark per route in desktop and mobile hidden/loading states.
  - Duplicate main landmarks are at least P1.

- World-class UX scoring gates for A:
  - Cognitive fluency: A-
  - Cognitive load: A-
  - Trust integrity: A
  - Hidden-tier consistency: A-

- Audit evidence requirements:
  - Include explicit route-by-route evidence lines with selector/text snippets.
  - Include severity-ranked blockers (P0/P1/P2).
  - Do not return an A overall grade if any P0 is open.
