# Instrumentation Standard

Status: Standard
Owner: Product Analytics + Engineering
Last Updated: 2026-08-09
Primary Reference: [dashboard-modernization-plan.md](dashboard-modernization-plan.md)

## Purpose

Ensure every interaction can be measured without degrading reliability or user trust.

## Scope And Transport Selection

This standard covers two surfaces with different constraints. Pick the transport
by who you need to measure, not by habit.

| Surface | Audience | Source of truth | Notes |
|---------|----------|-----------------|-------|
| Dashboard and other authenticated routes | Signed-in users | `logEvent` -> `user_events` | PostHog optional in parallel |
| Public routes (marketing, landing, persona, signup) | Mostly anonymous | PostHog | `user_events` cannot record these visitors at all |

`user_events.user_id` is `NOT NULL`, and `/api/events/channel-funnel` returns
early when there is no session. Anonymous activity therefore cannot be persisted
to `user_events` by any means. On public routes PostHog is not an optional
parallel capture: it is the only channel that exists.

## Event Principles

- Analytics must never block product interactions.
- Every tracked action must include section context.
- Event names should be stable and reusable across pages.

## Required Event Baseline

For every dashboard page, capture at minimum:

1. Page view event
2. Primary CTA click event
3. Support interaction events (for example, explainer open, email-plan click, save-note click)

## Required Properties

For action events, include:
- section
- action
- target
- page_route

Include optional state markers when relevant, for example pulse_state.

## Public Route Baseline

For every public route, capture at minimum:

1. Page view (automatic once `PHProvider` is mounted)
2. Primary CTA click, via `TrackLink`
3. `source_page` on both, so a route can be told apart from its siblings

`PHProvider` is mounted once in `src/app/layout.tsx` and inherited by every
route. Do not add a second provider in a nested layout or page; a route that
opts out of the root provider silently loses all anonymous measurement.

Set `logToUserEvents` on `TrackLink` only when the action is meaningful for a
signed-in user. It is a no-op for anonymous visitors by design, so it
supplements PostHog on public routes and never replaces it.

## Event Transport Rules

- Server-side logging should use `logEvent` for source-of-truth persistence of
  authenticated actions.
- PostHog is the source of truth for anonymous activity on public routes, and an
  optional parallel capture on authenticated routes.
- Client-side interaction tracking should use keepalive where appropriate.

## Silent Failure Modes

Both transports fail quietly by design, so neither reports its own absence.
Treat unexplained zeros as a possible instrumentation fault, not as an absence
of traffic.

- `usePostHog()` returns `undefined` when no provider is above the component.
  `posthog?.capture(...)` then does nothing, with no error. This hid the fact
  that the homepage and every persona route recorded no anonymous CTA clicks
  (SMK-458).
- `logEvent` swallows all exceptions, and the channel-funnel route returns
  `{ ok: true, anonymous: true }` without writing anything when logged out.
- A metric reading zero for a full day deserves a check that the write path
  works before concluding the number is real.

## Naming Conventions

Prefer existing event families before introducing new top-level event names.

Example:
- Use `briefing_action_clicked` with `action` and `section` properties.
- Avoid creating fragmented one-off events unless they represent materially different behavior.

## Data Quality Rules

- Validate incoming event payloads at route boundary.
- Whitelist known sections/actions where feasible.
- Return explicit 400 errors for invalid telemetry payloads.

## Definition Of Done

Instrumentation is complete when:
- Baseline events are present.
- Required properties are included consistently.
- Invalid payloads are rejected safely.
- Tracking path does not alter user navigation success.
