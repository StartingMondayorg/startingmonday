# Starting Monday Documentation Organization

Brief for Teddy

## What changed

Starting Monday now treats `docs/` as the home for human-readable product and operating documentation. The repository root stays focused on the README, agent instructions, application configuration, and generated or tool-owned files.

The first organization pass moved 55 document and export groups into the docs structure, including:

- Business strategy and sales materials into `docs/business/`
- Product and landing-page plans into `docs/strategy/`
- Historical architecture into `docs/archive/`
- Phase completion and dated summaries into `docs/status/`
- Validation and audit material into `docs/evidence/`
- Intake material into `docs/inbox/`
- Outreach exports into `docs/outreach/`
- Calendar and operating reminders into `docs/operations/`

The original content was preserved. Where a file moved, application and documentation references were updated.

## The taxonomy

| Area | What belongs there |
| --- | --- |
| `governance` | Decisions, standards, controls, and lifecycle rules |
| `strategy` | Product, market, roadmap, channel, and implementation plans |
| `product` | Requirements, personas, features, and user journeys |
| `engineering` | Architecture and technical development references |
| `evidence` | Validation, readiness, rights, proof, and audit records |
| `status` | Generated reports, checkpoints, and phase summaries |
| `operations` | Runbooks, monitoring, support, and recurring procedures |
| `content` | Marketing, editorial, and council review material |
| `research` | Market and behavioral research |
| `outreach` | Outreach templates, exports, and campaign artifacts |
| `onboarding` | Setup and first-use guidance |
| `business` | Commercial strategy, sales, and partner materials |
| `archive` | Superseded documents retained for provenance |
| `inbox` | New documents awaiting review and classification |

The detailed rules are in `docs/LIFECYCLE.md`.

## Automatic table of contents

`docs/index.md` is generated from the docs tree. It includes:

- every indexed document;
- the taxonomy domain;
- a short purpose description;
- a link to the file; and
- the document count for each domain.

It is generated with:

```bash
npm run docs:index
```

Freshness can be checked with:

```bash
npm run docs:index:check
```

The weekly guide-sync workflow regenerates it automatically, and pre-commit checks ensure it is current.

## What deliberately stayed outside docs

- `README.md` and `AGENTS.md`
- `config/` runtime policy and deployment configuration
- `src/`, `engine/`, `worker/`, `scripts/`, `tests/`, and `supabase/`
- `public/` assets
- `tmp/`, `.next/`, coverage, test results, and preview artifacts
- package, TypeScript, lint, Lighthouse, and Renovate configuration
- a small number of root scratch JSON/HTML/text artifacts pending separate retention decisions

Binary files were moved into `docs/inbox/legacy-root-intake/` for later individual review rather than being silently classified as active strategy or evidence.

## Validation

The organization passes:

- documentation index freshness;
- TypeScript validation;
- full pre-PR checks;
- dependency policy;
- lint;
- unit tests;
- auth enforcement; and
- required UX standards gates.

The next useful improvement would be a link-integrity checker for Markdown references and a retention review of generated status reports. Those are separate follow-up changes, not part of this organization pass.
