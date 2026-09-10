# Runbook: agentic incident loop

An alert lands in `#alerts-prod`, a Slack event reaches this app, and — once the
later stages are enabled — a Claude agent diagnoses the failure, files an SMK
bug, opens a draft PR, and replies in the alert's own thread.

**Current stage: 2 (diagnose only).** The responder runs Claude against an
incident and replies in the alert's own Slack thread. It files no Jira ticket and
opens no pull request. Automated dispatch stays off until `AGENT_RESPONDER_ENABLED`
is set to `1`; manual runs work regardless.

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

## The responder (`.github/workflows/agent-incident-responder.yml`)

Triggered by `repository_dispatch: prod-alert` from the receiver, or manually:

```bash
gh workflow run agent-incident-responder.yml -f fingerprint=<fingerprint>
```

Manual runs bypass the kill switch on purpose, so the loop stays testable while
automated dispatch is disabled. Automated runs do not.

**Two jobs, and the split is the security boundary.** Alert evidence comes from
outside this repository and can contain text shaped like instructions.

| Job | Holds | Runs the model |
|---|---|---|
| `investigate` | `ANTHROPIC_API_KEY`, Supabase read | yes |
| `publish` | `SLACK_BOT_TOKEN`, Supabase write | **no** |

So a prompt injection in an alert payload reaches a job with no credential that
can write anywhere, and the job that can write never sees a model.

The agent runs with `--allowedTools "Read,Glob,Grep"`. It cannot edit, commit or
push at this stage even if it decides it wants to.

### The output contract

The agent must return one JSON object: `verdict`, `summary`, `reasoning`,
`files`, optional `suggested_fix`. `src/lib/incident/diagnosis.ts` parses and
validates it, then `assertPublishable()` re-scans the *rendered* message with the
same patterns used at ingest and refuses to post on a hit. The prompt tells the
agent not to leak; that gate is what enforces it.

`reasoning` is required for **every** verdict, including `not-code-fixable`.
Without that, the negative verdict becomes a free pass for anything that looks
hard.

### When the agent fails

`publish` runs even when `investigate` fails, reads the incident from the
database rather than the artifact, and posts a failure notice in the thread.
There is no automatic retry: a failed run during a live incident is a signal for
a human, not a reason to spend again. An alert that receives no reply at all is
indistinguishable from the loop being switched off, which is why the failure path
still posts.

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

Every path that stops processing logs a distinct `stage`. They all look the same
from outside — the alert simply does not become an incident — so the stage is the
only thing that says why. Read it before changing anything.

| `stage` | Meaning | Action |
|---|---|---|
| `rejected` | Signature check failed. `reason` says `missing_signing_secret` (not configured) or `signature_mismatch` (wrong value). | Compare `SLACK_SIGNING_SECRET` in Railway against Slack → Basic Information. |
| `ignored` | Deliberate. `reason` gives the filter: `routing_test`, `thread_reply`, `other_channel`. | Nothing. This is the system working. |
| `duplicate_delivery` | Slack retried a delivery already handled (Postgres `23505`). | Nothing. Routine. |
| `event_claim_failed` | A **real** database error on the retry-dedup table. `code` and `message` carry the cause. | `42P01` means migration `1681` was never applied. |
| `unclassified` | An alert payload we do not recognise. | Add a fixture to `docs/fixtures/alerts/` and a rule to `classify.ts`. |
| `claim_failed` | Database error creating the incident. `code`/`message` carry the cause. | As above. |
| `claim_empty` | The RPC ran but returned no row. | Check `claim_agent_incident` is the current definition. |
| `no_dispatch` | Gated on purpose. `reason` names which gate. | `responder_disabled` means the kill switch is off — expected before Stage 2. |
| `budget_check_failed` | The budget RPC itself errored. **Not** a spent budget. | Check `consume_agent_dispatch_budget` exists. |
| `budget_exhausted` | Genuinely at the daily cap. | `alert-classes.json` → `global.max_daily_dispatches`. |
| `dispatch_failed` | GitHub rejected the `repository_dispatch`. | Check `AGENT_APP_ID` / `AGENT_APP_PRIVATE_KEY` and app install. |

`duplicate_delivery` and `event_claim_failed` were once a single label, and an
unapplied migration hid behind it for six days looking like ordinary retry
traffic. Keep failures and routine outcomes on separate stages.

All receiver logs are single-line JSON with `"scope":"slack-incident-webhook"`
and a `stage` field.

## Related

- `docs/alerting.md` — the three-tier routing this consumes
- `docs/sre/runbooks/deployment-stalled.md` — where `deploy-stalled` and
  `sha-not-live` alerts should actually send you
