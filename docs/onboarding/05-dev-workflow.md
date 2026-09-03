# Development Workflow

How we work together without stepping on each other.

---

## The One Rule

**Production moves only through the guarded promotion script.** Railway deploys `main` to staging and deploys the customer-facing web service from `production`. After staging runs the exact `main` SHA, `node scripts/promote-to-production.mjs --apply` fast-forwards `production` to that commit.

The script is a dry run unless `--apply` is present. It refuses divergent histories, refuses a commit that is not on `main`, and refuses a SHA that staging has not actually run. Do not use `--skip-staging-check` outside an owner-directed production incident.

### Promoting to a specific commit

By default the target is `main`'s HEAD. Pass `--to <commit-ish>` to name a commit instead — for the two cases where HEAD is the wrong answer:

```bash
# main has moved on; ship only up to a commit you trust
node scripts/promote-to-production.mjs --to 370edcc4
node scripts/promote-to-production.mjs --to 370edcc4 --apply

# roll production back to where it was
node scripts/promote-to-production.mjs --to 63b5144c --rollback
node scripts/promote-to-production.mjs --to 63b5144c --rollback --apply
```

The target must be an ancestor of `origin/main`, so production can never run code that is not merged. Moving production **backwards** rewrites the branch, so it needs `--rollback` on top of `--apply`; the push uses `--force-with-lease` and aborts if someone else promoted while you were looking.

A rollback skips the staging gate, because its target already ran in production. It prints the migrations that landed after the target instead — those are **already applied** to the production database and rolling the code back does not undo them. Read that list before applying.

**How the staging gate works.** It reads Railway's staging deployment history for the exact commit. In Railway's model `SUCCESS` is only ever the currently-active deployment and `REMOVED` means "built, ran, later superseded", so both count as proof the commit ran; `FAILED` is durable and blocks the promotion. Checking for `SUCCESS` alone would pass only `main`'s HEAD. The gate needs the Railway CLI installed and logged in (`railway login`); use `--history-limit <n>` if the commit is older than the default 100-deployment search window.

---

## Branch Strategy

```
main          → staging web and worker services
production    → customer web (startingmonday.app)
feature/*     → your work in progress
fix/*         → bug fixes
```

**Day-to-day workflow:**

1. Pull latest main: `git pull origin main`
2. Create a feature branch: `git checkout -b feature/activation-progress-tracker`
3. Build, commit as you go
4. Open a PR to `main` and let protected checks complete
5. After merge, verify the exact `main` SHA on staging
6. Run `node scripts/promote-to-production.mjs` to review the release (add `--to <sha>` to stop short of `main` HEAD)
7. Run `node scripts/promote-to-production.mjs --apply` to fast-forward `production`
8. Verify the production deploy marker and post-deploy gates
9. Delete the merged feature branch

---

## Staging Environment

URL: **staging.startingmonday.app** (set up on Railway, separate service)

The staging environment is identical to production except:

- Connects to the staging Supabase project (separate DB, no real user data)
- Uses test Stripe keys (use Stripe test cards, no real charges)
- Uses a separate Anthropic API key (same API, separate budget tracking)

**Setup (one-time, to be done in week 1):**

1. In Railway: duplicate the web service → rename to "startingmonday-staging" → set "Watch Branch" to `staging`
2. In Supabase: create a new project called "startingmonday-staging" → run all migrations
3. In Railway staging service: set all env vars pointing to staging versions of each service
4. In Cloudflare DNS: add a CNAME for `staging.startingmonday.app` pointing to the Railway staging domain

Every protected merge to `main` auto-deploys to staging. The production service does not deploy until the guarded promotion advances `production`.

**Staging Stripe test cards:**

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires auth: `4000 0025 0000 3155`

---

## Commit Style

```
type: short description of the change

feat: add activation progress tracker to dashboard
fix: correct contrast on orange CTA buttons
chore: update PageSpeed baseline in check script
docs: add onboarding guide for Chris
refactor: extract email template into shared component
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.

Rich uses Claude Code to generate commit messages — they follow this format automatically.

---

## PR Process

For significant features (more than ~50 lines of logic), open a PR even if you could push directly. This creates a record and a chance to catch issues.

- PR title: same format as commit (`feat: description`)
- Description: what changed, why, any testing notes
- Reviewer: Rich (or self-merge for straightforward fixes)

For small fixes and chores: commit directly to main is fine.

---

## Who Owns What

**Chris owns:** Feature development, bug fixes, test infrastructure, staging environment, performance, accessibility, DevOps improvements, PR review of his own work.

**Rich owns:** Product direction (what to build next), user-facing copy and messaging, partnership and integration decisions, Stripe/billing logic (approve before changing), production incidents.

When in doubt, ask. A 2-minute Slack message saves a 2-hour rework.

---

## Communication

- **Async (default)**: Leave a comment, send a message. Assume a 4-hour response time.
- **Sync (for blockers)**: Tuesday 8am meeting covers the week's direction. If blocked mid-week, message Rich.
- **Production incident**: Message immediately. Rich has final say on rollbacks.

---

## Before You Merge to Main

Checklist:

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm test` passes
- [ ] Tested locally on localhost:3000
- [ ] Tested on staging.startingmonday.app (for significant features)
- [ ] No console errors in browser DevTools
- [ ] No em dash characters in source files (`grep -r "—" src/` should return nothing)
- [ ] If you added an API route: `npm run check:auth` passes

---

## Hotfixes

For production bugs that need immediate fixing:

1. Branch from main: `git checkout -b fix/description main`
2. Fix the bug
3. Open a protected PR to `main` and merge after required checks pass
4. Verify the exact merge SHA on staging and run the guarded production promotion
5. Delete the branch

The `--skip-staging-check` escape hatch requires explicit owner direction and is reserved for incidents where staging is unavailable for reasons unrelated to the release.

---

## Access You Need

Rich will set these up before your first day:

- [ ] GitHub: added as collaborator on `richrothschild/startingmonday` (write access)
- [ ] Railway: added to the project as a team member
- [ ] Supabase: added to both production and staging projects
- [ ] Resend: team member access (for email template review)
- [ ] Anthropic Console: team access (API key + usage dashboard)
- [ ] Sentry: team member (error monitoring)

You do not need Stripe admin access initially — billing logic changes require Rich's approval.
