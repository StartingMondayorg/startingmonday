# Multi-Session Orchestration Framework

Version 2, adopted 2026-09-04 after the wave 2026-09-01 retro. Owner: Chris. Evolved from the
Aug 16 2026 orchestrator/wave workflow; version 1 added isolated worktrees, live agent messaging,
and committed kickoff briefs. Version 2 adds the watching rule, the emergency lane, and the
promote step (see the wave 2026-09-01 Outcomes section for the evidence behind each change).

The active wave manifest lives in `docs/orchestration/waves/` (one file per wave, dated).
Kickoff briefs for each ticket live inside the wave manifest.

## Roles

**Orchestrator** - one interactive Claude Code session started in `c:\Dev\StartingMonday`.

- Never writes feature code and never switches branches in the main checkout.
- Stateless by design: all state lives in Jira, GitHub, and these files, never in the transcript.
  On every check-in it re-derives current state fresh (`gh pr list`, Jira queries, worker reports).
- Owns: spawning workers, WIP limits, Jira transitions, answering worker questions,
  escalating to Chris, and the consolidated status report.

**Workers** - background agents the orchestrator spawns via the Agent tool, one per ticket,
with `isolation: "worktree"` and `run_in_background: true`. Each worker gets its own git worktree,
so parallel workers never move the tree under each other. The orchestrator relays questions
and answers with SendMessage; a completed worker can be continued the same way rather than respawned.

**Tracked sessions** - for judgment-heavy tickets, Chris opens a normal interactive session instead.
The orchestrator still tracks it via Jira/GitHub and can message it (sessions are visible to each other
via ListAgents). The orchestrator treats it as one of the WIP slots.

## WIP limits (check before every kickoff)

- At most 3 tickets in flight (workers + tracked sessions combined).
- At most 2 PRs waiting on Rich: `gh pr list --search "review-requested:richrothschild state:open"`.
- One ticket = one branch = one small PR.
- Emergency lane (added v2): a defect that blocks CI or deploys for every branch may exceed the
  PR limit by exactly one; mark it as the emergency lane in the manifest and tell Rich which PR
  jumps the queue.

## Worker lifecycle

1. Receive the kickoff brief for the ticket (from the wave manifest) as the spawn prompt.
2. Create branch `SMK-XX/short-description` off latest `main` inside the worktree.
   Run `npm install` in the worktree if the task needs to build or test.
3. Transition the Jira ticket to In Progress at first code.
4. Implement, then verify: `npx tsc --noEmit`, `npm run lint`, targeted tests for touched code.
5. Commit and push the feature branch. Open a PR to `main`, reviewer `richrothschild`,
   title `type(SMK-XX): description`, body includes `Closes SMK-XX`. Transition ticket to In Review.
6. Report back: what changed, evidence lines from checks run, PR URL, anything Unverified,
   any remaining gate state. The orchestrator never accepts a completion claim without evidence.
7. Watching rule (added v2): workers must NOT hold background watchers across turn boundaries;
   a worker's background children die when its turn ends, and every wave-1 worker stalled on
   this. When waiting on CI or a dispatched run, either wait synchronously (short waits) or end
   the turn with findings plus the run IDs; the orchestrator owns all watching and re-dispatches
   the worker when runs settle.

## Orchestrator loop

- On boot: read this file and the active wave manifest, run the WIP checks, verify each
  ready ticket's status in Jira, then spawn workers for the ready tickets up to the WIP limit.
- On a worker notification: verify the evidence (PR exists, checks green), update Jira if the
  worker could not, then start the next queued ticket if a slot opened.
- On a worker question: answer it if the wave manifest or repo answers it; otherwise escalate
  to Chris with a one-line question and hold that worker (other workers continue).
- On request ("status"): one table - ticket, state, branch, PR, blockers, questions waiting on whom.
- Wave close: all wave tickets In Review or Done, wave manifest updated with outcomes and a
  short retro (what to change in this file), then a final report to Chris.

## Escalation to Chris (always, no exceptions)

- Any database migration or write to production data (apply staging-first only after approval).
- Anything that deploys: merges are Rich's; pushes to `staging` need Chris's explicit go.
- Product decisions, scope changes, or a conflict with a locked plan boundary (stop first, per AGENTS.md).
- A worker stalled more than one working day or burning budget without progress.

## Guardrails (inherited by every worker via its kickoff brief)

- Feature branches only. Never push `main` or `staging`.
- Signal-engine scope (see AGENTS.md): the kickoff brief must name the governing WS story and
  carry the preflight conclusions; stop on conflict with a locked boundary.
- Truthfulness contract applies to reports: label claims Verified or Unverified; no deployment
  claims without command evidence.
- No em dashes in code, Jira, PRs, commits, or prose.
- Never edit another team member's application data; report and hand off.
- Slack: draft only, never send.

## Known constraints

- Each worktree needs its own `npm install`; only one local dev server on port 3000 at a time.
- Workers die if the orchestrator terminal closes; long-lived or babysat work belongs in a tracked session.
- Background workers stall on permission prompts; keep the project allowlist current
  (`/fewer-permission-prompts`) before launching a wave.
- Railway MCP writes fail; use the Railway CLI for config changes.
- Promote step (added v2): merged to main is NOT shipped. Production Railway deploys the
  `production` branch; advancing it is a deploy (Chris/Rich approval, see Escalation) via the
  promote workflow added by SMK-465 (PR 507). CLAUDE.md's older main-auto-deploys mapping is
  stale. After any promote, verify /api/health serves the promoted commit; Railway can mark a
  deploy SKIPPED and leave prod on the old build.
- Windows worktree hook friction (wave-1 evidence, tracked in SMK-494): the docs:index freshness
  check false-fails on CRLF, the Docker-only pre-push visual smoke cannot run without Docker
  (run the other pre-push guards manually and disclose the single-check bypass in the PR), and
  a coverage-gate test can time out under instrumentation. Do not let these push workers toward
  blanket --no-verify.
