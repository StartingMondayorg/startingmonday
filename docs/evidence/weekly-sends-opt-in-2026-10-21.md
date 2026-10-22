# Weekly Sends Opt-In Evidence (P1b, R-1)

Date: 2026-10-21
Repository: Starting Monday
Base: `7ac271b9` (`main`)
Branch: `simplify/p1b-weekly-sends`
Ruling: R-1 default adopted (Rich, 2026-10-20) — "email cadence becomes daily briefing + weekly summary (opt-in) + billing/transactional". Proposal: `docs/strategy/sm-simplification-proposal-2026-10-20.md` §2b, §5 P1b.

## Before

Two Sunday-night emails on top of the daily briefing:

| Job | Schedule (UTC) | Audience at `7ac271b9` | Query |
| --- | --- | --- | --- |
| `weekly-report-job` | Sun 23:30 | every `trialing`/`active` user with `onboarding_completed_at` | `users.in('subscription_status', ['trialing','active'])` — no preference column consulted |
| `market-digest-job` | Sun 22:30 | `subscription_tier = 'monitor'` ∪ `briefing_frequency = 'weekly'` | one Claude Haiku call per recipient for "suggested companies" |

`briefing-job` already sends the Monday briefing to the same weekly-frequency and Monitor users (`worker/jobs/briefing-job.js` L134–137 skips weekly users on every day but Monday), so a weekly-frequency user received two emails within ~12 hours, both summarising the same seven days of scan results.

## After

- `weekly-report-job` selects recipients from `user_profiles.weekly_summary_opt_in = true`, then filters to `trialing`/`active`. Nobody is opted in at migration time (`default false`), so the Sunday send stops until a user turns it on. Schedule unchanged (Sunday 23:30 UTC, after `momentum-job` at 23:00, so the week-over-week delta still resolves).
- `market-digest-job` deleted (277 lines; its one unique element, Claude company suggestions, is already on the dashboard's Zone 2). `worker/index.js` import, schedule and `jobs` list entry removed.
- Settings > Email preferences gains a second row, "Weekly search summary", off by default, posting to the new `POST /api/settings/weekly-summary` route (mirrors `email-nudges`).
- Migration `186_weekly_summary_opt_in.sql`; `database.types.ts` row type updated.

Emails a solo user now receives: the daily briefing at their chosen time, up to two trial emails (day-2 setup, day-14 away; both governed by the existing switch), billing/transactional, and — only if they ask — the Sunday summary.

## Left alone

- `users.weekly_digest_sent_at` (migration 072) is read by `emi-slo-monitoring-alerts` but written by nothing since the dead `weekly-digest` cron route was deleted in P1. Pre-existing; not touched here.
- `momentum-job` still runs (coach/plan readers; retires with them).

## Tests

- `worker/jobs/weekly-report-job.test.js` (new): no opt-ins → no users query and no send; opted-in but churned users filtered; opt-in query failure → no recipients.
- `src/app/api/(account)/settings/weekly-summary/route.test.ts` (new): auth, payload validation, writes `weekly_summary_opt_in` on `user_profiles` for the authenticated user, 500 on DB error.

## Validation

Recorded in the commit message (typecheck, unit suite, staged coverage gate, lint baseline, guards, docs index).

## Rollback

Revert the PR. The column is additive and harmless if left in place.
