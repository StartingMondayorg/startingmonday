# Local Development Environment Setup

This gets you to a running local environment in about 30 minutes.

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/richrothschild/startingmonday.git
cd startingmonday
```

You need write access to the repo. Rich will add you as a collaborator on GitHub before your first day.

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Environment Variables

Rich will share the `.env.local` file directly. Place it in the project root. Never commit this file — it's in `.gitignore`.

### Web App Variables (`.env.local`)

| Variable | What It Is | Where To Get It |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase dashboard |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Supabase dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (bypasses RLS) | Supabase dashboard > Settings > API |
| `ANTHROPIC_API_KEY` | Claude API key | Rich will share |
| `RESEND_API_KEY` | Resend email delivery key | Rich will share |
| `RESEND_FROM_ADDRESS` | Default "from" address for email | Rich will share |
| `STRIPE_SECRET_KEY` | Stripe secret key | Rich will share |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | Rich will share |
| `NEXT_PUBLIC_APP_URL` | Public URL of the app (localhost:3000 for local dev) | Set to `http://localhost:3000` |
| `CRON_SECRET` | Secret for cron endpoint authentication | Rich will share |
| `WORKER_SECRET` | Shared secret between web app and worker | Rich will share |
| `NEXT_PUBLIC_POSTHOG_KEY` | PostHog analytics key | Rich will share |
| `NEXT_PUBLIC_POSTHOG_HOST` | PostHog host URL | Rich will share |
| `PAGESPEED_API_KEY` | Google PageSpeed API | Optional for local dev |
| `SENTRY_DSN` | Sentry error reporting DSN | Rich will share |

### Worker Variables (`worker/.env`)

The worker is a separate Node.js process. Copy the Supabase, Anthropic, Resend, and Sentry vars from `.env.local`, plus these worker-specific ones:

| Variable | What It Is | Required? |
|---|---|---|
| `WORKER_SECRET` | Shared secret with the web app | Yes |
| `GNEWS_API_KEY` | GNews.io for company news queries | Yes (scanner) |
| `BROWSERLESS_API_KEY` | browserless.io for career page scraping | Yes (scanner) |
| `PDL_API_KEY` | People Data Labs for exec roster snapshots | Yes (scanner) |
| `CRUNCHBASE_API_KEY` | Crunchbase for funding round data | Optional (scanner skips if absent) |
| `PREDICTLEADS_API_KEY` | PredictLeads for exec change signals | Optional (scanner skips if absent) |
| `SENTRY_DSN` | Sentry DSN (same as web app) | Yes |

Rich will share values for all of these. Never commit either env file.

**Staging note:** When working on the staging environment, you'll use separate env files pointing to staging-specific services. These will be provided separately.

---

## Step 4: Run the Development Server

```bash
npm run dev
```

Open http://localhost:3000.

---

## Step 5: TypeScript Check

Run this before every commit or PR:

```bash
npm run typecheck
```

Zero errors is required. The pre-commit hook runs this automatically, but catching it earlier saves time.

---

## Step 6: Run Tests

```bash
npm test        # unit tests (Vitest)
npm run test:e2e   # E2E tests (Playwright) — needs staging env
```

---

## Running the Worker Locally (Optional)

The worker is a separate Node.js process that handles scheduled jobs. You typically don't need it running locally unless you're working on scanner, signals, or email jobs.

```bash
cd worker
npm install
node index.js
```

It communicates with the web app via HTTP on port 3001 (default). The web app will work fine without it — you just won't get scheduled job output.

---

## Database Access

The local dev server connects to the production Supabase database by default. This is intentional — it keeps the feedback loop fast for feature development.

**Important**: Be careful with any write operations on production data. For destructive testing (dropping tables, bulk edits), coordinate with Rich first.

Once staging is set up (see `05-dev-workflow.md`), you'll switch to the staging database for riskier work.

---

## Accessing the Supabase Dashboard

Go to https://supabase.com/dashboard — Rich will add you to the project.

The schema is described in `docs/architecture.md`. The migrations are in `supabase/migrations/`.

---

## Useful Commands

```bash
npm run dev              # start local server
npm run typecheck        # TypeScript check
npm test                 # run Vitest unit tests
npm run lint             # ESLint
git log --oneline -10    # recent commits
```

---

## VS Code Setup (Recommended)

Install these extensions:
- Claude Code (from marketplace)
- ESLint
- Tailwind CSS IntelliSense
- Prisma (for SQL syntax highlighting in migration files)

The project uses Tailwind CSS — IntelliSense will autocomplete class names.
