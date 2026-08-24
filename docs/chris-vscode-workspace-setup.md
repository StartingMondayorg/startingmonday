# Chris Setup Guide: Match Rich's VS Code Workspace

This document shows how to set up VS Code so Chris has the same coding-agent workflow and project behavior as Rich.

## 1. What Tooling This Workspace Uses

### Coding assistant in VS Code
- Primary assistant: GitHub Copilot Chat (agent mode in VS Code).
- Model used in this workflow: GPT-5.3-Codex.

### "Claude" in this repo (important distinction)
- `CLAUDE.md` exists in the repo and contains project operating rules/instructions for coding agents.
- `.claude/commands/check-demo.md` is a Claude-style command doc for demo audits.
- Anthropic Claude API is also used by the application itself at runtime (`ANTHROPIC_API_KEY`).
- This does **not** mean Rich is using the Claude desktop app as the coding assistant in VS Code; the working assistant here is Copilot Chat.

## 2. Required Accounts and Access

Chris should have access to:
- GitHub repo: `StartingMondayorg/startingmonday` (transferred from `richrothschild` on 2026-08-22)
- Doppler project/config: `startingmonday` (`dev` at minimum)
- Supabase project access (for manual migration apply)
- Railway visibility (if needed for deploy checks)
- Stripe/Resend/Jira as needed by role

## 3. Machine Prerequisites

Install:
- Node.js `>= 20.9.0`
- Git
- VS Code (latest)
- Doppler CLI

Optional but useful:
- Playwright browsers (`npx playwright install`)

## 4. VS Code Extensions to Match

Install at least:
- `GitHub.copilot`
- `GitHub.copilot-chat`
- `GitHub.vscode-pull-request-github`
- `ms-playwright.playwright`

Then sign in to GitHub inside VS Code for Copilot + PR integration.

## 5. Clone and Bootstrap

```bash
git clone https://github.com/StartingMondayorg/startingmonday.git
cd startingmonday
npm install
```

Notes:
- `npm install` runs `prepare`, which sets `.githooks` as the active git hooks path.
- Do not skip this; hooks enforce typecheck/guardrails.

## 6. Environment Setup (Doppler)

Authenticate Doppler and select project/config:

```bash
doppler login
doppler setup
```

Use project `startingmonday`, config `dev`.

Verify:

```bash
doppler secrets download --no-file --format env
```

## 7. Run Locally (same as Rich)

```bash
doppler run -- npm run dev
```

Standard checks:

```bash
npx tsc --noEmit
npm run lint
npm test
```

Outreach/template guard check:

```bash
npm run test:outreach-templates
```

## 8. Agent Instruction Files That Must Exist

These files are part of why the agent behaves the same way:
- `AGENTS.md`
- `CLAUDE.md`
- `.claude/commands/check-demo.md`

Do not remove or rename them.

## 9. Daily Working Conventions

- Always run env-dependent scripts with Doppler:
  - `doppler run -- <command>`
- Migrations are manual via Supabase SQL Editor (not `supabase db push`).
- Branch naming standard: `SMK-XX/short-description`.
- PRs request reviewer `richrothschild`.

## 10. Commit/Deploy Behavior in This Repo

- This repo is configured with a strict rule: pushes to `main` deploy via Railway.
- Pre-commit hooks run typecheck + guard scripts + outreach checks.
- If hooks fail, resolve before commit unless explicitly doing an approved bypass workflow.

## 11. Quick Verification Checklist (Chris)

After setup, Chris should confirm:
1. `npm install` completed and hooks are active.
2. `doppler run -- npm run dev` starts app on localhost.
3. `npx tsc --noEmit` passes.
4. `npm run test:outreach-templates` passes.
5. Copilot Chat works in agent mode in VS Code.

## 12. Troubleshooting

- If env errors occur: re-run `doppler setup` and verify `dev` config selected.
- If hooks do not run: check `git config core.hooksPath` returns `.githooks`.
- If routes look broken in dev: visit route once (Turbopack lazy compilation behavior).
- If Windows branch case issues appear: push with explicit ref
  - `git push origin HEAD:refs/heads/SMK-XX/description`
