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

## Manual setup (no API available)

Two pieces of this system cannot be configured programmatically. The Sentry MCP exposes only
`find_alert_rules` and `get_alert_rule` -- no create/update for issue or metric rules -- and
Sentry's metric-alert REST endpoint now returns `410 This API no longer exists`. Railway has no
webhook API at all. Both are UI-only, so they are written out here rather than scripted.

### 3. Sentry issue alert -> #alerts-prod

Rule `3379165`, "Send a notification for high priority issues"
(<https://starting-monday.sentry.io/monitors/alerts/3379165/>). It was auto-created at
onboarding on 2026-05-05 and never edited.

**Current:** fires on *new* **and existing** high-priority issues; action is Email to issue
owners. Firing on existing issues is the dangerous half -- the top unresolved issue has ~9,900
events, so an alert on existing issues is an alert that can fire thousands of times for one bug.

**Target:** first-seen only, error level, production, posting to `#alerts-prod`.

1. Install the Slack integration first, or there will be no Slack action to pick:
   Settings -> Integrations -> Slack -> Add to Slack, authorize the workspace. For a private
   channel, also `/invite` the Sentry app into it.
2. Open the rule and Edit.
3. **Environment**: `production`. (Verified safe: 9,908 of 9,908 events carry
   `environment: production`, so this filter excludes nothing that matters.)
4. **WHEN** -- remove `Existing high priority issue`. Keep a first-seen trigger only
   (`A new issue is created`, or `New high priority issue` to preserve the priority filter).
5. **IF** -- add `The event's level is equal to error`.
6. **THEN** -- remove the Email action, add `Send a Slack notification` to `#alerts-prod`.
7. **Action interval**: 1 hour, so one noisy issue cannot flood the channel.
8. Save, then use **Send Test Notification** to confirm it lands in `#alerts-prod`.

**Then check the uptime monitor still routes.** Uptime monitor `9718173` reports downtime by
opening a Sentry issue, which is delivered by issue alert rules -- so narrowing this rule can
narrow uptime alerting as a side effect. After saving, confirm an uptime issue would still
match (it must be `level: error` and count as newly created). If it does not, give uptime its
own rule rather than loosening this one; the two have different noise profiles and should not
share a filter.

### 4. Railway deploy webhook -> #alerts-prod

Railway transforms webhook payloads for known destinations ("Muxers"), and Slack is supported,
so a `hooks.slack.com` URL can be pasted in directly -- no middleware or reformatting.

1. Open the **`ample-blessing`** project -- see the warning below.
2. Settings -> Webhooks -> paste the `#alerts-prod` incoming webhook URL.
3. Optionally narrow which events to send. The available classes are deployment status changes,
   volume usage alerts, and CPU/RAM monitor alerts. Deployment failures are the ones that belong
   in `#alerts-prod`; successes do not -- a notification that arrives when nothing is wrong is
   what taught everyone to ignore the old channel.
4. Save.

**Do not trust a failed `Test Webhook`.** Railway sends test payloads from the browser, so CORS
routinely makes a working webhook report a delivery failure. Verify with a real deploy instead.

Delivery is best-effort: 30-second timeout, 3 retries with backoff, and a URL that fails ~100
times in 6 hours is muted for 24 hours. Treat a deploy webhook as a prompt to look, never as the
system of record.

**Warning -- pick the right project.** Four Railway projects contain a service named some
variant of "startingmonday", and only one is live:

| Project | Service | State |
|---|---|---|
| `ample-blessing` | `startingmonday`, `Starting-Monday-worker-sub`, 4 cron services | **live** |
| `startingmonday-worker` | `startingmonday-worker` | dead -- last 5 deploys all FAILED, 2026-05-25 |
| `steadfast-reprieve` | `startingmonday` | stale -- last deploy 2026-07-26, empty secrets |
| `blissful-upliftment` | `startingmonday` | unverified |

Production was identified by matching the live `/api/health` commit and uptime against
deployment `bca937d9` in `ample-blessing`. Configuring a webhook on any of the other three
produces a project that looks monitored and never sends anything, which is worse than no webhook
at all. Deleting the dead projects is the durable fix.

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
