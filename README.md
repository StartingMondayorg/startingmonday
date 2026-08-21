# Starting Monday

AI-powered career search platform for VP and C-suite executives. [startingmonday.app](https://startingmonday.app)

## What It Does

Starting Monday helps senior executives run a structured, intelligent job search:

- **Pipeline tracking** — 5-stage pipeline (Watching, Researching, Applied, Interviewing, Offer) with company notes, fit scoring, and full audit log
- **Career page scanning** — automated monitoring of target company career pages for relevant roles, 3x/week via browserless.io
- **Company intelligence** — signals on funding rounds, exec hires/departures, acquisitions, and expansions
- **AI prep briefs** — tailored interview preparation for each company, streaming in ~60 seconds
- **Search Strategy Brief** — one-time AI synthesis of full positioning, gaps, and recommended outreach sequence
- **AI chat advisor** — persistent conversation with full pipeline context and tool use (stage updates, follow-ups, notes)
- **Resume tailoring** — paste a job description, get a tailored resume with ATS quality check, DOCX export
- **Outreach drafts** — context-aware email drafts written at the executive level
- **Daily briefings** — morning email + in-app briefing at the user's configured time and timezone

## Architecture

Two Railway services: Next.js 16 web application + Node.js worker for background jobs.

- **Database**: Supabase / PostgreSQL (25 migrations, RLS-enforced on all user tables)
- **Auth**: Supabase Auth with email/password and Google OAuth
- **AI**: Anthropic Claude (Opus for strategy briefs, Sonnet for prep/chat/tailoring, Haiku for classification)
- **Billing**: Stripe (checkout, portal, pause/resume, idempotent webhooks)
- **Email**: Resend (`briefing@startingmonday.app`)
- **Scanning**: browserless.io (headless Chrome for career page parsing)
- **Monitoring**: Sentry, UptimeRobot, PostHog, Railway logs

Full system architecture: [docs/architecture.md](docs/architecture.md)

## Development

**Prerequisites**: Node.js >= 20.9.0

```bash
# Install dependencies
npm install

# Run dev server
npm run dev       # http://localhost:3000

# Run dev server with Doppler-managed secrets
npm run dev:doppler

# Type check
npm run typecheck

# Run tests
npm test
```

**Worker** (separate process, separate Railway service in production):

```bash
cd worker
npm install
node index.js
```

Environment variables: see the Environment Variables section in [docs/architecture.md](docs/architecture.md).

### Local Secrets via Doppler

On Windows, install Doppler CLI and connect this repository to the `startingmonday` project and `dev` config:

```bash
winget install Doppler.doppler
doppler login
doppler setup --project startingmonday --config dev
doppler secrets download --no-file --format env
```

If `doppler` is not recognized right after install, restart the terminal.

## Deployment

Both services deploy to Railway automatically on push to `main`.

- **Web**: nixpacks detects Next.js; `npm run build && npm run start`
- **Worker**: `node worker/index.js`

Health check: `GET /api/health` (returns uptime, timestamp, version)

### Staging-First Release Flow

Use branch flow:

- `feature/*` -> merge to `staging` for preview and validation
- `staging` -> promote to `main` only after staging passes

Promotion options:

- Manual git flow: merge `feature/*` into `staging`, push `staging`, validate staging environment, then merge `staging` to `main`.
- GitHub Actions flow: run workflow `.github/workflows/promote-staging-to-main.yml` and enter `PROMOTE`.

The promotion workflow enforces:

- `npm run typecheck`
- `npm run ux:rubric:pages`
- `npm run test`

In addition, the required standards gate can be run per environment:

- `npm run gate:standards:dev`
- `npm run gate:standards:staging`
- `npm run gate:standards:production`

before fast-forwarding `main` from `staging`.

### PR Autofix Workflow

Use workflow `.github/workflows/pr-autofix.yml` to auto-remediate deterministic PR check failures.

Summary:

- What it does: runs safe, scoped autofixes for recurring CI failures (mobile visual baseline drift and guide artifact freshness drift) and pushes bot commits to the PR branch.
- How it helps: reduces manual PR triage time, improves merge throughput, and keeps every remediation auditable through explicit bot commits and PR comments.

How to trigger:

- Add label `autofix:mobile-visual` to run mobile visual snapshot autofix.
- Add label `autofix:guide-sync` to run guide artifact sync autofix.
- Or comment on a PR:
  - `/autofix mobile-visual`
  - `/autofix guide-sync`

Who can trigger via comment:

- Repository `OWNER`, `MEMBER`, or `COLLABORATOR`.

What the bot is allowed to change:

- Mobile visual mode:
  - `tests/e2e/__screenshots__/*.png`
- Guide sync mode:
  - `docs/user-guide.*`
  - `docs/internal-guide.*`
  - `docs/internal-system-summary.md`

What the bot will not auto-fix:

- Failing type checks, lint, or functional test logic.
- Security findings or dependency policy violations.
- Any PR from a fork (it refuses branch writes for fork heads).

Operational notes:

- The workflow comments on the PR with `Autofix complete` or `Autofix skipped` and reason.
- For `mobile-visual`, it verifies a failing `Mobile visual regression` check exists on the PR head SHA before running.

## Monitoring

Production monitoring is implemented via a scheduled GitHub Actions workflow:

- Workflow: `.github/workflows/monitoring.yml`
- Frequency: every 30 minutes
- Checks:
  - `GET /api/health`
  - `GET /login`
  - `GET /pricing`
  - Cron endpoints (when cron secret is available)

Manual run:

```bash
npm run monitor:smoke
```

Required GitHub configuration:

- Secret: `CRON_SECRET` (for cron endpoint smoke checks)
- Secret: `SLACK_WEBHOOK_URL` (for failure alerts)
- Optional repo variable: `MONITOR_BASE_URL` (defaults to `https://startingmonday.app`)

Monitoring of monitoring is implemented via:

- Workflow: `.github/workflows/monitoring-watchdog.yml`
- Frequency: hourly (`:15`)
- Verifies:
  - `ci.yml` latest completed run is successful
  - `monitoring.yml` latest completed run is successful and not stale
  - `security-weekly.yml` latest completed run is successful and not stale
  - `watermark-audit.yml` latest completed run is successful and not stale
  - required secrets (`CRON_SECRET`, `SLACK_WEBHOOK_URL`) are still present
- On failure: sends Slack alert with watchdog run link

## Docs

- [Documentation index](docs/index.md) — generated taxonomy and table of contents
- [Documentation lifecycle](docs/LIFECYCLE.md) — placement, retention, and intake rules
- [Architecture](docs/architecture.md) — infrastructure, schema, API patterns, environment variables
- [Product Roadmap](docs/product-roadmap.md) — what is built and what is planned
- [Backlog](docs/backlog.md) — validated ideas deferred from the active roadmap

## Sprint 3 Evals Commands

Prep brief labeling and golden-set workflow commands:

```bash
# Label progress
npm run evals:label-progress
npm run evals:label-progress:json
npm run evals:label-progress:strict
npm run evals:label-progress:strict:json

# Golden set export and verification
npm run evals:export-golden-set
npm run evals:export-golden-set:dry-run
npm run evals:export-golden-set:json
npm run evals:export-golden-set:dry-run:json
npm run evals:verify-golden-set
npm run evals:verify-golden-set:json
npm run evals:verify-golden-set:strict
npm run evals:verify-golden-set:strict:json

# Combined readiness gate
npm run evals:readiness
npm run evals:readiness:json
npm run evals:readiness:strict
npm run evals:readiness:strict:json
npm run evals:readiness:md
npm run evals:readiness:summary
npm run evals:readiness:summary:strict
npm run evals:readiness:snapshot
npm run evals:readiness:snapshot:json

# One-command closeout flow
npm run evals:closeout       # doctor -> readiness -> export -> strict verify
npm run evals:closeout:dry-run
npm run evals:closeout:force
npm run evals:closeout:json

# Command index
npm run evals:help
npm run evals:help:status
npm run evals:help:json
npm run evals:help:status:json

# Prerequisite check
npm run evals:doctor
npm run evals:doctor:json
npm run evals:doctor:strict
npm run evals:doctor:strict:json

# CI gate
npm run evals:ci:check
npm run evals:ci:check:json

# Sprint 3 completion helpers
npm run evals:seed:traces
npm run evals:seed:traces:dry-run
npm run evals:sprint3:dod
npm run evals:sprint3:dod:json
npm run evals:sprint3:dod:strict
```

Primary labeling UI:

- `/dashboard/admin/traces?feature=prep_brief&unrated=1`
- `/dashboard/admin/traces/rubric`
