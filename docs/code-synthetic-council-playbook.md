# Code Synthetic Council Playbook

Owner: Documentation Operations
Status: active
Last reviewed: 2026-06-07
Review cadence: monthly
Source of truth: yes


## What you asked for

You want a synthetic council that reviews code, identifies what to fix, and pinpoints where to fix it.

## Cursor Team Kit vs Claude

Cursor Team Kit style workflows usually provide:

- multiple reviewer personas
- shared memory/context around a task
- a structured output with priorities and owners

Claude can do the same functionally, even without a single built-in "team kit" toggle, by combining:

- role-specific prompts (Principal Engineer, Security, SRE, QA, Performance)
- a shared evidence payload (repo metrics and findings)
- a deterministic aggregation pass (score, severity, fix queue)

In this repo, that pattern is now implemented via:

- scripts/code-synthetic-council-audit.mjs
- docs/code-synthetic-council-rubric.md

## How to run

From repo root:

```bash
node scripts/code-synthetic-council-audit.mjs
```

Optional machine-readable output:

```bash
node scripts/code-synthetic-council-audit.mjs --json
```

Strict mode (non-zero exit if overall score < 84, and it prints which categories
dragged the score down):

```bash
node scripts/code-synthetic-council-audit.mjs --strict
```

## Where the council runs

The council is **advisory**. It does not block merges.

- **Pull requests** — `.github/workflows/code-council-pr.yml` audits the base
  branch and the merge result, then comments with the delta: what this branch
  introduced and resolved. This is the signal to act on, because it is the part
  the author is responsible for. The absolute score is repo-wide and inherited.
- **Weekly** — `weekly-code-council-audit.yml` and `weekly-unified-audit.yml`
  report the repo-wide score to Slack and email. Both are non-blocking.

A merge gate on the absolute score does not work here: a PR touching one file
inherits every finding in the codebase, so the check tests accumulated debt
rather than the diff. It sat red on `main` for a week in August 2026 for exactly
that reason.

## Scoring notes

Most categories subtract fixed points per finding. **Testability and
observability are scored as ratios instead** — covered source files over total,
logged mutating routes over total. Subtractive scoring floors both at 0 on a
codebase of this size, which turns their combined 22% weight into a constant and
hides regressions rather than reporting them.

Related: do not "remediate" findings by adding placeholder tests
(`expect(true).toBe(true)`) or unused logging helpers. The audit now ignores the
latter, and both make the score say something untrue. Findings are a to-do list,
not a number to move.

## Outputs

The run writes:

- docs/code-synthetic-council-audit.latest.md
- docs/code-synthetic-council-audit.latest.json

## What the council currently evaluates

- correctness signals
- security signals
- maintainability and complexity signals
- type-safety signals
- testability signals
- observability signals
- delivery risk signals

## How to use results in practice

1. Start from "Priority Fix Queue" in the markdown report.
2. Address critical and high-severity findings first.
3. Re-run the audit after each fix wave.
4. Track score deltas over time and tie them to release quality outcomes.

## Recommended next upgrade

Add a qualitative Claude synthesis pass that reads the JSON report and emits:

- root-cause themes
- remediation plan by sprint
- policy changes to prevent recurrence

This keeps the council deterministic for gating and adds Claude judgment where it is most useful: synthesis and planning.
