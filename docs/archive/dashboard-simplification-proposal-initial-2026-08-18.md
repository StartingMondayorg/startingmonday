# Dashboard Simplification Proposal

**Date:** 2026-08-18
**Author:** Rich Rothschild (drafted with Copilot)
**Status:** Proposal — not yet scheduled
**Trigger:** First-user walkthrough with Cody McDaniels (2026-08-18) plus a structural audit of the current dashboard

---

## 1. The problem

On today's call, our first real user could not tell what the dashboard wanted him to do. Rich had to narrate the product's core loop out loud:

> "You want to find companies where you think there might be a role, and then you want to figure out how to get a hold of the right people."

That sentence **is** the product. The dashboard doesn't say it anywhere.

What the walkthrough surfaced:

1. **Too much, organized by feature.** The dashboard presents the features we built (signals, briefs, health, momentum, plans) instead of the user's loop (company → people → angle → outreach).
2. **The user has to assemble the loop themselves.** Companies, people-to-know, and the "angle" live in separate sections. Reassembling them is exactly the work Cody couldn't do.
3. **Wrong default posture.** Cody is employed and exploring — a "watcher" building relationships before he needs them. The dashboard is tuned for someone running a full-time search campaign (weekly goals, momentum scores, pipeline velocity). For a watcher, that's noise.
4. **A trust bug.** A prep brief leaked internal scoring language ("inferred penalty") into user-facing text. Small, but it's the kind of thing that makes a senior user stop trusting the AI output.

## 2. What the audit shows

The dashboard page renders **17 sections and roughly 24–32 calls to action**:

- **The same data appears three or more times.** Companies show up in a summary panel, a pipeline table, and a nav anchor. Signals appear in the progress feed, a signals section, and the briefs section. Follow-ups appear twice. Repetition reads as clutter, not reinforcement.
- **Five different sections all claim to answer "what should I do now?"** — Daily Momentum, Progress Feed, To Do Now, Welcome Nudges, and the Plan section. A user can't tell which one is authoritative.
- **Analytics outweigh action.** Campaign health, momentum scoring, activity charts, and pipeline velocity occupy prime space that should be spent on the next move.

## 3. The proposal: one question, three zones

The dashboard should answer a single question — **"What should I do today?"** — and its atomic unit should be the **company → people → angle** triple, not feature panels.

### Zone 1 — Your next move (one card, top of page)

One primary action, chosen by user state. Example:

> "Palo Alto Networks showed a fresh signal this week. Here are the 3 roles likely circling it — see who you know."

One CTA. Everything currently spread across Daily Momentum, Progress Feed, To Do Now, and stall nudges collapses into this single decision.

When nothing is hot: **"Nothing needs you today. Next scan Monday."** Permission to leave is a feature for employed users — it builds trust that the product will tell them when something matters.

### Zone 2 — Your companies (the only list)

One table, one row per tracked company:

| Column | Content |
| --- | --- |
| Company | Name + sector |
| Latest signal | What happened, with age ("hiring VP Eng — 3 days ago") |
| Who to know | The ~3 target roles at that company; a warm-path badge if the user already knows someone |
| Action | One `Get brief` link |

This merges the companies panel, the pipeline table, the signals section, and warm paths into the loop itself. **The row is the product thesis**: a company worth watching, the people who matter there, and the angle for reaching them.

### Zone 3 — This week (one quiet strip)

Three numbers, three links: follow-ups due · new signals this week · next briefing time. Done.

### Everything else moves off the page

| Today | Proposed home |
| --- | --- |
| Campaign health, momentum score, velocity, activity charts, weekly performance, offer cockpit | New `/dashboard/progress` subpage, for users who want it |
| Setup steps (6-step activation) | Shown only until activation completes, then removed entirely |
| Executive decision brief | Stays — it already fits the Zone 1 "next move" pattern |
| Plan, Briefs, Signals detail | Reached from Zone 2 rows and Zone 3 links, not standing sections |

**Net effect: 17 sections → 3. ~30 CTAs → ~6.**

## 4. Two decisions beyond layout

1. **Make "building relationships" the default posture, not another mode.** Cody's job-to-be-done is pipeline-before-need. Zone 1's copy should adapt to search intensity: active searchers get "reach out today"; watchers get "one relationship touch this week." Same layout, different verb.
2. **The "who to know" column must respect the Apollo terms constraint.** We cannot hand users contact data directly. Zone 2 shows the target *role titles* (which the user searches on LinkedIn themselves), with per-user Apollo provisioning as a possible membership feature later.

## 5. How we'll know it worked

- **Time to first action** after the dashboard loads (target: under 30 seconds for a returning user).
- **Zone 1 CTA click-through** — the share of sessions that act on the single recommended move.
- Qualitative: the next user walkthrough should require zero narration.

## 6. Suggested sequence

1. **Fix the prep-brief internal-text leak** ("inferred penalty"). Small, trust-critical, independent of the redesign.
2. **Build the three-zone dashboard behind a feature flag** — default off, verify with a live walkthrough, then flip (same pattern as the hero rollout).
3. **Move analytics sections to `/dashboard/progress`.**
4. **Retire the five overlapping "what now" sections** once Zone 1 is verified.

---

*Source material: Cody McDaniels call transcript (2026-08-18) and structural audit of `src/app/(dashboard)/dashboard/page.tsx` (17 sections, ~1,610 lines, 45+ components).*
