# Documentation Taxonomy and Lifecycle

Starting Monday keeps human-readable documentation under `docs/`. The repository root is reserved for `README.md`, `AGENTS.md`, package/tool configuration, and files required by tooling.

## Taxonomy

| Domain | Use for | Examples |
| --- | --- | --- |
| `docs/governance/` | Decisions, standards, policies, and lifecycle rules | ADRs, controls, operating standards |
| `docs/strategy/` | Product, market, roadmap, channel, and implementation plans | Landing plans, signal-engine plans, GTM plans |
| `docs/product/` | Product requirements and user-facing specifications | Features, personas, journeys, requirements |
| `docs/engineering/` | Architecture and development references | Migration notes, technical designs, diagrams |
| `docs/evidence/` | Validation and provenance artifacts | Readiness, rights, proof, and audit evidence |
| `docs/status/` | Generated or dated operational summaries | Latest reports, checkpoints, phase summaries |
| `docs/operations/` | Runbooks and recurring operating procedures | SRE, support, monitoring, incident procedures |
| `docs/content/` | Marketing and editorial content | Copy, council reviews, publishing assets |
| `docs/research/` | Research and analysis | Market research, source maps, behavioral studies |
| `docs/outreach/` | Outreach execution materials | Templates, exports, campaign artifacts |
| `docs/onboarding/` | Setup and first-use guidance | User guides, setup, onboarding flows |
| `docs/business/` | Commercial strategy and sales materials | Business plans, sales strategy, partner assets |
| `docs/archive/` | Historical documents retained for provenance | Superseded plans, legacy architecture |
| `docs/inbox/` | Newly received documents awaiting review | Verbatim handoffs from Rich |

`docs/index.md` is the generated human table of contents. The user and internal guide manifests remain separate machine-oriented retrieval indexes.

## Placement Rules

1. New documents received from Rich are copied verbatim into `docs/inbox/` or `docs/strategy/` before review.
2. Active guidance belongs in the narrowest maintained domain above.
3. Generated reports belong in `docs/status/`, `docs/evidence/`, or a dedicated generated subdirectory, not at the repository root.
4. Runtime configuration and policy JSON stays in `config/`; it is not documentation merely because it is readable.
5. Runtime data, company exports, contact exports, fixtures, and source catalogs stay with their owning code or data boundary unless they are explicitly an evidence artifact. Do not move data exports into `docs/outreach/` unless they satisfy the outreach file contract.
6. HTML previews, coverage output, CI logs, and scratch files stay ignored or in `tmp/`; do not archive them by default.
7. Binary documents are not bulk-moved. Put an incoming binary in `docs/inbox/` first, then classify it after ownership, sensitivity, retention, and reference needs are known.
8. Preserve public or tooling paths when they are externally linked. If a document moves, update code and Markdown references in the same change.
9. Do not duplicate cross-product plans or data. Link to the canonical source and keep product-local evidence separate.
10. Use lowercase, descriptive, hyphenated filenames for new documents; preserve original filenames for verbatim intake artifacts.

## Generated Indexes

Run:

```bash
npm run docs:index
npm run docs:index:check
```

The weekly guide-sync workflow regenerates `docs/index.md` alongside the user and internal guide artifacts. The pre-commit freshness check should be used before committing documentation moves.

## Retention Guidance

- `docs/inbox/`: retain until review and classification; move or archive after disposition.
- `docs/status/`: retain according to the generating report's evidence need; generated latest files may be replaced.
- `docs/evidence/`: retain for the applicable control or audit period; never delete without owner review.
- `docs/strategy/`, `docs/governance/`, `docs/operations/`, and `docs/product/`: retain while active; archive superseded versions rather than overwriting provenance.
- `docs/archive/`: retain historical source unless an owner-approved deletion decision exists.
