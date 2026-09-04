# Runbook: agentic incident loop

An alert lands in `#alerts-prod`, a Slack event reaches this app, and — once the
later stages are enabled — a Claude agent diagnoses the failure, files an SMK
bug, opens a draft PR, and replies in the alert's own thread.

**Current stage: 0 (receiver only).** Nothing dispatches. `AGENT_RESPONDER_ENABLED`
is `0` and the GitHub App does not exist yet.

## Kill switch

Set the Railway web-service variable `AGENT_RESPONDER_ENABLED` to anything other
than `1` and redeploy. The receiver keeps classifying and recording incidents —
useful for observing volume — but never dispatches. It is a variable, not a
secret, so you can see its current value without knowing anything.

There is no second switch to find. If the loop is misbehaving, this is the one.

## How an alert becomes an incident

1. `POST /api/webhooks/slack` verifies Slack's `v0` HMAC over the raw body with
   `SLACK_SIGNING_SECRET`, inside a 5-minute replay window.
   **This check is the only thing authenticating the endpoint** —
   `scripts/check-api-guards.mjs` excludes every route under a `webhooks/` path
   segment from its audit, so nothing else will notice if it is weakened.
2. It acknowledges within 3 seconds (Slack retries otherwise) and does the rest
   in `after()`.
3. `agent_slack_events` claims the `event_id`, making Slack retries idempotent.
4. `src/lib/incident/classify.ts` maps the message to an `alert_class` and a
   `signal_key`. Unrecognised messages are dropped.
5. `src/lib/incident/redact.ts` strips secrets and customer data **before**
   anything is stored. The repo is public; the agent must never read raw
   production data it could echo into a PR.
6. `claim_agent_incident()` upserts one row per fingerprint, atomically.
7. `decideDispatch()` applies the manifest, then `consume_agent_dispatch_budget()`
   applies the global daily cap.

## Fingerprints, and why storms are cheap

`fingerprint = sha256(alert_class + '|' + signal_key)[:32]`

`signal_key` deliberately excludes run ids, URLs, timestamps, latency
percentiles and failure counts. Those change between two alerts about the *same*
outage. `production-synthetics.yml` fires every 5 minutes with no cooldown, so
folding any of them in would produce 12 "distinct" incidents an hour and 12
agent runs for one problem.

Failing test names are sorted before hashing because Playwright does not order
failed specs stably.

Consequence: **alerts 2 through N of one incident cost one database round-trip
and nothing else.** They bump `occurrence_count` and stop.

## Changing what the agent is allowed to touch

`src/lib/incident/alert-classes.json`. An unknown class is `notify-only`, so a
new alert shape can never auto-dispatch — promoting one is a reviewed one-line
data change.

Modes: `notify-only` (record it, never wake the agent) · `diagnose-only`
(investigate and report, never patch) · `diagnose-and-patch`.

Most `#alerts-prod` traffic is deploy stalls and synthetic failures, which no
code change fixes. Those are `notify-only` on purpose. **A high
`not-code-fixable` rate is the system working**, not a defect.

## Suppressing a known-broken thing

Add an entry to `suppressions[]`. Both `until` and `jira` are **required** — an
entry missing either is ignored, and an entry past its `until` date stops
applying. That is what keeps the list from becoming a graveyard.

```json
{ "alert_class": "smoke-failure", "signal_key": "monitoring:main",
  "until": "2026-10-15", "jira": "SMK-123", "why": "tracked, fix pending deploy" }
```

## Verifying it without waiting for an outage

```bash
export SLACK_SIGNING_SECRET=...            # must match the receiver
node scripts/agent-response/replay-alert-fixture.mjs synthetics-p0 --count 12
```

Expected: **one** `agent_incidents` row with `occurrence_count = 12`, and the
`slack_thread_ts` of the *first* delivery. That is the storm test — run it before
trusting anything else.

Then confirm the routing test is ignored, so `slack-alert-test.yml` can never
wake the agent:

```bash
node scripts/agent-response/replay-alert-fixture.mjs routing-test
gh workflow run slack-alert-test.yml -f tier=prod
```

Fixtures live in `docs/fixtures/alerts/` and are the same inputs the unit tests
use, so a classification bug fails CI before it reaches production.

## When something looks wrong

| Symptom | Where to look |
|---|---|
| Alerts in Slack, no incident rows | Slack app Event Subscriptions — is the Request URL still verified? Check `stage: rejected` logs for `signature_mismatch`. |
| `stage: unclassified` in logs | An alert payload changed. Add a fixture and a rule to `classify.ts`. |
| Same problem filed twice | Fingerprint too narrow — a volatile field crept into `signal_key`. |
| Nothing dispatches | `AGENT_RESPONDER_ENABLED`, then `no_dispatch` log lines, which name the exact reason. |
| Dispatches stopped mid-day | `budget_exhausted`. Daily cap in `alert-classes.json` → `global.max_daily_dispatches`. |

All receiver logs are single-line JSON with `"scope":"slack-incident-webhook"`
and a `stage` field.

## Related

- `docs/alerting.md` — the three-tier routing this consumes
- `docs/sre/runbooks/deployment-stalled.md` — where `deploy-stalled` and
  `sha-not-live` alerts should actually send you
