# Bot traffic monitoring while Turnstile is bypassed

Status: proposal
Author: Chris Goodwin (with Claude)
Date: 2026-08-13

## Why

Turnstile has been difficult to implement effectively and has caused production
issues. That work is **paused**, not scheduled. This proposal does not resume it,
extend it, or change any Turnstile code or configuration.

What it does instead: answer the question that makes the pause safe to hold.
Right now a scripted signup grind against `/api/auth/verify-and-signup` would be
completely invisible -- the rate limiter would return 429s and no record of it
would survive the request. We are not currently able to tell the difference
between "bots are not a problem" and "we cannot see them."

The output of this work is an evidence stream. If bot traffic stays negligible,
it stays quiet and the pause holds indefinitely on data rather than on
assumption. If it starts to matter, it says so early and with enough detail to
scope a correct captcha implementation as its own piece of work.

## Current state (verified against the repo)

| Fact | Evidence |
| --- | --- |
| One shared guard fronts every public endpoint | `enforcePublicEndpointGuard`, `src/lib/public-endpoint-guard.ts:41`, imported by ~20 routes including all five `auth/verify-*` routes |
| Turnstile enforcement is a single env flag | `isTurnstileEnforced()`, `src/lib/public-endpoint-guard.ts:25-30`. `TURNSTILE_ENFORCED=0` disables; unset defaults to on in production |
| Rate limiting is persistent and per-IP | `rate_limits` table + `check_and_increment_rate_limit` RPC, `supabase/migrations/018_rate_limits.sql`. Signup 3/min, login-submit 8/min |
| Rate-limit rejections are not recorded | `public-endpoint-guard.ts:53-58` returns 429 and writes nothing |
| Captcha guard already emits structured logs | `logTurnstileGuard`, `public-endpoint-guard.ts:16-23` -- but only inside the enforcement branch, so it is silent today |
| No request-level middleware exists | No `src/middleware.ts` or `middleware.ts`. Page requests are uninstrumented |
| An alert sink and an ops UI already exist | `automation_alerts` (migration 100); Operations Hub panel filters by `source_table`, `src/app/(dashboard)/dashboard/admin/operations/page.tsx:14-23` |
| An alert-cooldown pattern already exists | `monitoring_alert_state` (migration 132); `cron/scan-alert` demonstrates threshold + cooldown + owner email |

The Turnstile rows are recorded as context only. Nothing below modifies them.

## Approach

Four layers, all additive. No existing auth, guard, or captcha behavior changes.

### Layer 1 -- Record every public request outcome

Instrument inside `enforcePublicEndpointGuard`. It is the only chokepoint that
already sees every public request, so this is one edit rather than twenty. The
instrumentation observes and records; it never changes what the guard returns,
so no request that succeeds today can start failing because of it.

New table `bot_signal_events`:

| Column | Notes |
| --- | --- |
| `id`, `occurred_at` | |
| `route` | `request.nextUrl.pathname` |
| `rate_limit_key` | already computed by the guard (`signup`, `login_submit`, ...) |
| `ip_hash` | `sha256(ip + BOT_SIGNAL_SALT)` -- never store raw IP |
| `ip_prefix_hash` | same hash over the `/24` (v4) or `/48` (v6) so we can group an attacker across a subnet without retaining addresses |
| `outcome` | `allowed`, `rate_limited`, `captcha_missing`, `captcha_failed`, `captcha_unavailable`. The captcha values stay dormant while enforcement is off -- they are in the enum so the schema does not need changing if that ever flips |
| `user_agent` | truncated to 256 chars |
| `ua_class` | output of the Layer 2 classifier |
| `bot_score` | 0-100 |
| `country` | `cf-ipcountry` header when present |
| `details` | jsonb -- matched heuristic names |

Rules:

- Fire-and-forget, never throws, never awaited on the hot path. Follow the
  `logEvent` contract in `src/lib/events.ts:127-143` -- analytics must not
  interrupt product flows.
- **Ship with a retention cron from day one.** `rate_limits` is the cautionary
  tale: it has grown unbounded since migration 018 and is never read. Delete
  `bot_signal_events` rows older than 30 days.
- At current volume the write cost is negligible. If volume grows enough for
  that to stop being true, we will have the data to prove it.

### Layer 2 -- Classify, in a pure testable function

`src/lib/bot-signals.ts`, exporting `classifyRequest({ headers, route, body })`.
Pure, no I/O, unit-tested -- this is the piece we will tune most, and tuning is
only safe if it is cheap to test.

Signals, roughly in order of reliability:

1. **Missing or empty `user-agent`** -- near-certain automation.
2. **Self-identifying agents** -- `curl`, `python-requests`, `axios`,
   `go-http-client`, `headless`, `phantom`, `bot`, `crawler`, `spider`.
3. **Missing `sec-fetch-site` / `sec-fetch-mode` on a POST.** Every real browser
   sends these on a form submit. Their absence on a route only ever reached
   through our own UI is a strong scripted-client tell and is much harder to
   spoof accidentally than the UA string.
4. **Missing `accept-language`.**
5. **Velocity** -- more than N distinct emails from one `ip_prefix_hash` inside
   10 minutes.
6. **Fan-out** -- one UA string across many distinct IP prefixes.
7. **Signup email shape** -- disposable domains, plus-addressing bursts,
   sequential local parts (`user1@`, `user2@`).

Signals 1-4 are computable per-request. Signals 5-7 are computed by the Layer 4
job over the stored rows, not inline.

**Observe-only for the first two weeks.** Nothing in this layer blocks anything.
Thresholds set before we have a baseline are guesses, and a false-positive block
on the auth path is exactly the failure we are already recovering from.

### Layer 3 -- Dashboard

New staff-gated route `/dashboard/admin/operations/bot-traffic`, gated with
`getStaffMember` exactly as `operations/page.tsx:36` does, linked from the
Operations Hub quick actions. Add one stat card to the hub itself -- "Suspected
bot requests (24h)" -- so it is visible without navigating.

Panel contents:

- **Stat cards:** total public requests (24h), suspected-bot share, rate-limit
  rejections, distinct IP prefixes on auth routes.
- **Hourly volume chart**, 7 days, human vs suspected-bot split.
- **Top offending IP prefixes:** request count, routes touched, UA, first/last
  seen, verdict.
- **Recent rejections table:** rate-limited requests.
- **Baseline banner:** "trailing 7-day baseline: X requests/day, Y% suspected
  bot." Every threshold below is relative to this, so the number that drives the
  alerts should be on screen next to the alerts.
- **Outcome column -- the one that actually decides anything.** For suspected-bot
  requests on `verify-and-signup`, how many *completed*? A million bot requests
  that the rate limiter absorbs and that never create an account is a
  non-problem. A dozen that create accounts is a problem. Captcha is worth
  revisiting for the second case and not the first, so this number, not raw
  volume, is the decision input.

Follow the existing `ADMIN_DARK_*` theme tokens from `admin-dark-theme`. Load the
`dataviz` skill before writing the chart.

### Layer 4 -- Alerting

New `/api/cron/bot-traffic-alert`, hourly, authenticated with
`validateCronRequest` like the other 28 cron routes.

Thresholds are **baseline-relative with an absolute floor**. A pure multiplier
alerts when traffic goes from 3 to 15; a pure absolute number goes stale the
moment SM grows.

Severity here means "how much of your attention does this deserve", not "how
fast must someone mitigate" -- there is no mitigation to trigger.

| Condition | Severity | What it means |
| --- | --- | --- |
| A suspected-bot signup **succeeded** (score >= 80, account created) | high | The rate limiter did not hold. This is the condition that puts captcha back on the roadmap |
| Suspected-bot requests in last hour > `max(50, 5x trailing-7-day hourly median)` | high | Active grind in progress |
| A single IP prefix exceeds 100 auth-route requests in an hour | medium | Usually one broken integration or scanner, not a campaign |
| 24h suspected-bot share > 25% **and** absolute count > 200 | medium | Trend worth watching, not an incident |
| Signup rate-limit rejections > 20 in an hour | low | The limiter is doing its job; logged for the record |

Only `high` sends email. `medium` and `low` land on the dashboard and in
`automation_alerts` for the weekly read. That split is what keeps this from
becoming noise that gets muted, which is the usual way monitoring like this dies.

Each firing:

- writes to `automation_alerts` with `source_table = 'bot_traffic_runs'`;
- dedupes through `monitoring_alert_state` on a 6-hour cooldown per alert code,
  mirroring the `RE_ALERT_DAYS` pattern in `cron/scan-alert`;
- emails `getNotifyEmails()` -- Rich and Chris -- with the offending prefixes and
  a direct link to the dashboard.

Add `'bot_traffic_runs'` to `OPS_ALERT_SOURCES` in `operations/page.tsx:14` so
these surface on the Operations Hub alert panel with no additional UI work.

## What happens when an alert fires

Nothing automatic, and deliberately so. A `high` alert is a prompt to look, not
a trigger to change auth behavior.

1. Open the bot-traffic dashboard. Check the completed-signup number first.
2. Rule out the boring explanations -- a misconfigured integration retrying, an
   uptime checker, a security scanner someone pointed at the site, our own E2E
   suite.
3. If it is real, the cheap responses come first and none of them are Turnstile:
   tighten the existing per-route `maxPerMinute` values (they are plain arguments
   at each call site of `enforcePublicEndpointGuard`), or block the offending
   prefixes at the edge.
4. Only if the pattern is sustained, distributed, and producing real accounts
   does the Turnstile question come back -- and then it comes back as its own
   scoped piece of work, with this dashboard's data as the brief. "Bots created
   N accounts over M weeks from K networks" is a far better starting point for
   getting captcha right than the standing-start we had last time.

The honest framing: this proposal buys information, not protection. That is the
correct trade at current volume, and the dashboard is what will tell us when it
stops being the correct trade.

## Deliberate non-goals

- **No Turnstile work of any kind.** No changes to `isTurnstileEnforced()`, to
  `TURNSTILE_ENFORCED`, to the widget, or to any auth route's captcha behavior.
  That implementation stays paused. If a future decision resumes it, it is a
  separate ticket informed by this data.
- **No vendor.** No Cloudflare Bot Management, no Arkose, no fingerprinting SDK.
  At this volume the heuristics above are sufficient and cost nothing.
- **No blocking, ever, in this scope.** Detection and reporting only. The
  existing rate limiter remains the only thing that turns traffic away, and this
  work does not change its thresholds.
- **No page-level coverage in v1.** Without a `middleware.ts` we see API POSTs
  only. A scraper crawling marketing pages will not appear. If that becomes a
  question, Railway/Cloudflare access logs answer it more cheaply than adding
  middleware to every request in the app.

## Known gaps

- **IP fidelity.** `getClientIp` prefers `cf-connecting-ip`
  (`public-endpoint-guard.ts:32-39`). Confirm Cloudflare actually fronts
  production; if it does not, we fall back to `x-forwarded-for`, which is
  weaker. Either way the IP is an input to a score, never a sole verdict.
- **PostHog is not a substitute.** It captures client-side pageviews. A
  JavaScript-less bot never fires a PostHog event, so PostHog will show bot
  traffic as an absence rather than a presence.
- **Privacy.** IPs are hashed with a server-side salt and retained 30 days. No
  raw address is ever stored.

## Sizing

Roughly two days, splittable into four tickets:

1. `bot_signal_events` migration + guard instrumentation + retention cron (~4h)
2. `src/lib/bot-signals.ts` classifier + unit tests (~4h)
3. Admin dashboard route + Operations Hub stat card (~5h)
4. `cron/bot-traffic-alert` + `automation_alerts` wiring + email (~4h)

Sequencing: ship 1 and 2 first and let them collect for two weeks. Then set the
Layer 4 thresholds from the observed baseline instead of the placeholder numbers
in this document, which are educated guesses and should be treated as such.

Tickets 1 and 2 are the ones that matter. If tickets 3 and 4 slip, the data is
still accumulating and can be queried directly in Supabase in the meantime -- the
dashboard is convenience, the recording is the asset.
