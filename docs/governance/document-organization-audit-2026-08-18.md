# Starting Monday Document Organization Audit

Date: 2026-08-18
Status: Phase 1 organization completed

## Decision

Starting Monday now treats `docs/` as the home for human-readable product, strategy, operations, evidence, business, and intake documents. The repository root remains reserved for the README, agent instructions, package/tool configuration, and files whose location is required by tooling.

## Completed moves

- Root `business/` tree moved intact to `docs/business/`.
- Root `ARCHITECTURE.md` moved to `docs/archive/architecture-legacy-2026-08-18.md`; `docs/architecture.md` remains the canonical architecture document.
- Root competitive analysis moved to `docs/strategy/competitive/`.
- Root landing-page analysis and plan moved to `docs/strategy/landing-page/`.
- Root `MARKETING.md` moved to `docs/strategy/marketing.md`.
- Root Jira and epic references moved to `docs/jira/` and `docs/development/`.
- Root phase and SES completion summaries moved to `docs/status/phase-summaries/`.
- Root prep-page evaluation moved to `docs/evidence/`.
- Root feedback moved to `docs/inbox/`.
- Root binary documents moved verbatim to `docs/inbox/legacy-root-intake/` for later sensitivity, ownership, and retention review.
- Root company data exports remain at the root because they are runtime/data artifacts, not outreach-schema documents; moving them would trigger the outreach linter and obscure their ownership.
- Root outreach audit snapshots moved to `docs/evidence/outreach-audits/`.
- Root calendar reminders moved to `docs/operations/reminders/` and runtime/documentation references were updated.

## Intentionally left outside docs

- `README.md`: repository entry point and standard GitHub location.
- `AGENTS.md`: repository instruction contract and generated Next.js agent block.
- `config/`: runtime policy, feature flags, thresholds, baselines, and CI control configuration.
- `src/`, `engine/`, `worker/`, `supabase/`, `scripts/`, and `tests/`: executable source and test ownership.
- `public/`: web assets.
- `tmp/`, `coverage/`, `test-results/`, `playwright-report/`, `.next/`, and similar directories: generated or ephemeral artifacts.
- Root HTML previews and scratch JSON: generated/development artifacts pending a separate retention decision.
- `package.json`, lockfiles, TypeScript, lint, Lighthouse, and Renovate configuration: toolchain-owned files.
- Root `onboarding-flow.json`: retained pending confirmation that it is runtime input rather than documentation.

## Taxonomy

The maintained taxonomy is defined in `docs/LIFECYCLE.md` and summarized in `docs/index.md`:

governance, strategy, product, engineering, evidence, status, operations, content, research, outreach, onboarding, business, archive, and inbox.

## Automatic index

`scripts/generate-docs-index.mjs` generates `docs/index.md` deterministically from the docs tree. It is available as:

```bash
npm run docs:index
npm run docs:index:check
```

The weekly guide-sync workflow regenerates the index, and pre-commit freshness validation checks that it is current.

## Remaining work

- Classify the binary intake set individually for sensitivity and retention.
- Split large flat domains such as `docs/content/` and `docs/outreach/` only when filenames and references support a stable subcategory.
- Decide retention for generated `docs/status/` snapshots.
- Add link-integrity validation for Markdown links as a separate low-risk follow-up.
- Keep MandateSignal-specific evidence and data product-local; use references rather than copies.
