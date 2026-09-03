# Alerting

How production problems reach a human. Set up 2026-09-03.

## Routing principle

**Channel is chosen by severity, not by source.** A Sentry error, a failed deploy and a
Lighthouse regression are three different sources but only two different urgencies, and
mixing urgencies in one channel is what makes people stop reading it.

| Channel | Means | Response | Target volume |
|---|---|---|---|
| `#alerts-prod` | Users are affected right now | Drop what you're doing | < 2/day |
| `#alerts-eng` | Pipeline broken, production still serving | Same day | < 5/day |
| `#alerts-digest` | Reports, digests, weekly audits | Read when you want | Unbounded |

Before adding an alert, ask: *if this fires at 3am and I can't act on it, which channel does
it belong in?* If the answer is "none", don't add it.

## The alerts

| # | Alert | Where it lives | Fires when | Channel |
|---|---|---|---|---|
| 1 | Production health | Sentry uptime monitor `9718173` | `/api/health` fails 2 consecutive 60s checks | `#alerts-prod` |
| 2 | Error rate spike | Sentry metric alert | error events exceed baseline | `#alerts-prod` |
| 3 | New production issue | Sentry issue alert `3379165` | issue **first seen**, `level:error`, `environment:production` | `#alerts-prod` |
| 4 | Cron job stopped | Sentry cron monitors, `worker/index.js` | check-in missed or over-runs | `#alerts-eng` |
| 5 | Deploy / main CI failed | GitHub Actions | failure on `main` | `#alerts-eng` |
| 6a | Pageviews flatlined | PostHog alert `01a0689f-7cf6-…` | 0 `$pageview` in a full day | `#alerts-eng` |
| 6b | Signups flatlined | PostHog alert `01a0689f-843f-…` | 0 `signup_completed` in a full week | `#alerts-eng` |

### Why 6a exists and 6b is weekly

The original plan was "alert when signups drop to zero in 24h". The data says that would be
noise: `signup_completed` fired on only 9 of the last 30 days (24 events), so a daily
zero-signup alert would fire most days and mean nothing.

So the two questions got split:

- *Is the funnel broken?* → `$pageview`, which fired on 29 of the last 30 days at ~31/day.
  Zero pageviews in a full day is unambiguous: the site is unreachable or analytics stopped.
- *Have signups stopped?* → evaluated **weekly**, where zero is a real business signal rather
  than a Tuesday.

Revisit both thresholds once signup volume supports a daily floor above zero.

## Cron monitors (alert 4)

`CRON_MONITORS` in `worker/index.js` lists the jobs whose *silence* is an incident. Every
other alert fires when a job runs and fails; this is the only one that catches a job that
stops running. Six jobs are monitored: `briefing-job`, `scan-job`, `signal-job`,
`usage-monitor-job`, `dlq-monitor-job`, `edgar-watchdog-job`.

Check-ins go through the single `runJob()` wrapper, so adding a job to the map is the whole
change. The monitor is upserted on first check-in — there is nothing to create in the Sentry
UI.

`worker/cron-monitors.test.js` fails the build if a monitor's `schedule` drifts from the
`cron.schedule()` expression for the same job. That guard matters: a stale schedule makes
Sentry report misses for a job running exactly as intended, and a monitor that cries wolf is
worse than no monitor.

## Severity routing in GitHub Actions

Alert steps read a tiered secret with a fallback:

```yaml
SLACK_WEBHOOK_URL: ${{ secrets.SLACK_ALERTS_PROD_WEBHOOK_URL || secrets.SLACK_WEBHOOK_URL }}
```

The env var name stays `SLACK_WEBHOOK_URL` so the `curl` below each step is untouched, and
the fallback means nothing breaks if a tiered secret is missing — it just lands in the digest
channel instead.

Everything *not* explicitly re-tiered still reads `secrets.SLACK_WEBHOOK_URL` directly. That
secret points at `#alerts-digest`, so ~103 report/digest references route there by default
and only deliberately-tiered alerts reach `#alerts-prod` / `#alerts-eng`.

To promote a workflow, change only its secret reference — not the payload, not the channel.

## Verifying delivery

Alert routing fails silently. A rotated or deleted webhook looks exactly like a quiet week,
so the only way to tell a healthy channel from a broken one is to send something through it.

```bash
gh workflow run slack-alert-test.yml -f tier=prod
gh workflow run slack-alert-test.yml -f tier=eng
gh workflow run slack-alert-test.yml -f tier=digest
```

Each posts a labelled routing test to the channel that tier resolves to. If the message lands
in the wrong channel, that tier's secret points at the wrong webhook. Run all three after
rotating secrets or changing routing.

`slack-simulated-failure.yml` sends a realistic deployment-failure payload on the eng tier,
and optionally fails the run afterwards to exercise the on-call path end to end.

The PostHog alerts (6a, 6b) deliver through PostHog's own Slack app rather than a webhook, so
these workflows don't cover them. Verify those by invoking their destinations directly
(`cdp-functions-invocations-create`), which exercises the real template-render-and-post path.
Note that `alert-simulate` does *not* test delivery -- it only previews how an anomaly detector
would score historical data, and sends nothing.

## Deliberately not alerted

- **Green builds.** `ci.yml`'s "Post Slack summary" step was guarded by the *negation* of the
  failure condition, so it posted on every passing run on every branch. It now fires only on a
  failure off main/staging; main/staging failures are handled by the step above it, so the two
  never double-post. A CI notification that arrives when nothing is wrong is the fastest way to
  make people stop reading the channel.
- **PR test failures.** They belong in the PR, where the author already sees them. Routing
  them to Slack trains everyone to ignore the channel. Only `main`-branch CI failure alerts,
  because that blocks everyone.
- **Known high-volume Sentry issues.** Alert 3 is scoped to **first seen** deliberately. The
  top unresolved issue had 9,874 events in 20 days; an alert on existing issues would have
  sent 9,874 notifications for one bug.

## Adding an alert

1. Decide the channel from the severity table above.
2. Check the threshold against real data before setting it — query the actual event or error
   volume first. Most bad alerts are correct logic with a threshold nobody measured.
3. Give it an owner and a runbook line here.
4. If it can't be acted on, it's a dashboard, not an alert.
