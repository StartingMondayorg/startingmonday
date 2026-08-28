# Brief Template & GTM Changes — from the Adam Weiss Sales Review

**Date:** 2026-08-28 · **Source:** Rich's Aug 27 call with Adam Weiss (seasoned enterprise software seller; SPIN-selling school) reviewing the John Dunn New Prospect Brief · **Audience:** Sol (implement §1–§4), Rich (decide §5–§7) · **Status:** Proposed; template changes are low-risk and can ship before edition 02 (Sept 1)

**Context for Sol:** Adam reviewed the 89-page New Prospect Brief and the DataEndure overview. His verdict: the research value is real ("instead of going to 24 places... one report"; "the timing is the value"), but the documents are built like research papers — value at the bottom, prescription before diagnosis, and everything given away at once. The changes below turn the same content into a selling document. Items §1–§4 are renderer/template changes; §5–§7 are business decisions with my recommendation attached.

---

## 1. Value cover page — new first page on every brief (build)

**The problem.** Adam: "It was way down at the bottom where you started talking about your value and implications... the first thing you want to do is articulate what your value is to that organization." Today every brief opens with a masthead and a method note. The dollar case never appears anywhere.

**The change.** Every rendered brief (weekly delta, prospect brief, deep dive) gets a one-page cover, generated from the same JSON, in this exact order — which is Rich's own buyer framework from twenty years on the other side of the desk:

1. **Above the line** — the three problems this reader already has, stated as facts about their week, not about our product: (a) you hear about the triggering event after your competitor does; (b) you don't know who to build the relationship with before the deal forms; (c) you don't systematically watch the accounts you already own.
2. **Implications, in dollars** — parameterized per client config: average deal size × baseline win rate × the lift from being first. For a VAR rep: "one $2M engagement at a 20% close rate is $400K of expected value; being the first call on one Aquarion-class event pays for years of this brief." Numbers come from config (`avg_deal_value`, `win_rate`, editable per client), never invented per-account.
3. **What this document does about it** — three lines, mapped to the three problems: dated triggers ranked by decision imminence; named decision-makers with the public event that names them; delta tracking so watched accounts cost zero attention until something moves.
4. **What it costs the reader** — Rich's fourth and fifth buyer questions, answered preemptively: ~10 minutes a week; no new system, lands in email; contact enrichment happens in your own tools.

**Renderer spec:** new `value_cover` block; template fields `{problems[3], implication_math{deal_value, win_rate, lift_statement}, what_it_does[3], cost_to_reader}`; per-client overrides in the config pack YAML. The existing "how this was built" method text moves to the back page — it is a trust footnote, not a lede.

## 2. Rename "Sales strategy" → "Tactics" (build, trivial)

Adam, looking at the Phase 1/2/3 section: "I would call that tactics, not strategy." He's right — the section prescribes moves, it doesn't state a strategy. Rename the section header in all three templates (`sales_strategy` key can stay; display label changes). The document's actual strategy is the positioning block; leave that named "Positioning."

## 3. Discovery questions restructured in SPIN order (build)

Adam's framework (Rackham, *SPIN Selling*): Situation → Problem → Implication → Need-payoff; "investigate before you prescribe." Today each profile carries a flat list of 8–10 questions. Restructure the template and the generation prompt to emit exactly this shape:

- **Situation (2):** verifiable facts to confirm, not research the rep should have done — e.g. "Is the Yordas scope-merge decided or still open?"
- **Problem (3):** surface the pain the signal implies — "Who carries the SOC 2 evidence load until the manager you posted in July starts?"
- **Implication (2–3):** attach cost — "If the restore test hasn't run since the acquisition, what does a failed recovery cost against your 99.9% SLA?"
- **Need-payoff (2):** let the buyer state the value — "If the evidence work came off your team's plate for two quarters, what would they ship instead?"

**Spec:** `discovery_questions` becomes `{situation[], problem[], implication[], need_payoff[]}`; renderer prints them under those four sub-labels so the rep sees the progression, not just questions. This is the single highest-leverage template change: it converts research into a call plan.

## 4. Positioning blocks rewritten as investigate-first (build, prompt change)

Adam: "You can't go in and start saying what a guy needs before you know... let him tell you." Several current positioning lines prescribe ("offer an IT/OT separation assessment"). The generation prompt gets one added rule: positioning statements must be framed as hypotheses to test in discovery, not diagnoses to announce — "the public record suggests X is the pressure; confirm before proposing anything." The suggested-move field stays directive (it tells the rep what to do), but the first move is always the investigating conversation, never the offer.

## 5. Sampling rule: one free deep dive, never twelve (decide — recommended YES)

Adam's evaluation model from software sales: let the prospect run one real chip through the tool free, then "here's one — now multiply that by 20." That is exactly the 3E play with Kirk: one account, full depth, done. The John prospect brief broke the rule — twelve full plans plus a 54-row list, free. That removed John's reason to pay for a first report and set the expectation that a subscription means twelve deep dives a week.

**The rule going forward:** a prospect gets ONE free artifact at full depth — one deep dive on an account of their choosing, or one weekly edition on their book. Everything else renders as the one-page summary table (which the prospect can see) with the detail pages withheld and priced. **Renderer spec:** `sample_mode: true` produces the cover + at-a-glance table + one full profile + a priced menu page; the other profiles render as single-paragraph teasers. John is grandfathered — don't retroactively paywall what he has — but edition 03+ new-prospect content follows the rule.

## 6. Pricing test: Adam's shape, with a reconciliation Rich must make (decide)

**Adam's advice:** price the first report high ("a couple thousand"), the subscription low ("in the hundreds"), and raise the subscription once ~90% renew. His logic: the first report is where the labor and the leap of faith are; the subscription is cheap to deliver and its value compounds — and a subscriber who's paying anything is a customer you can re-price.

**Proposed test (for the VAR-rep config only):** first report — new-prospect brief in sample mode or one deep dive — **$2,500**; weekly delta subscription **$395/month**, first month credited on annual conversion. This replaces the $750–1,500-per-lead framing entirely; per-lead pricing died with John's "not sure I would pay."

**The reconciliation Rich owes the plan:** this is now the third pricing model in a week — the July workbook's ~$12K ACV, the execution plan's ≥$6K/month organizational pricing floor (Sol's acceptance test #4), and now hundreds/month to an individual. They test different buyers and cannot all run at once. Recommendation: treat the individual-rep price as the **wedge**, not the business — the rep at $395/month is lead generation for the sales-leader sale (a team of 10 reps at team pricing is where the ≥$6K floor gets its real test). Write that into the plan so test #4 isn't quietly abandoned. **Economics note for Sol:** at $395/month the unit economics only close when the engine (Phase B adapters, source-coverage plan) produces the edition — a hand-run edition costs more than a month's revenue. The price test and the Phase B build are coupled; don't let one ship without the other.

## 7. Focus: the pilot roster is 3× the plan's limit (decide — Rich only)

The call surfaced that the engine's output has gone to six or seven recipients across unrelated markets: Louisiana police departments (InService), a property-title firm, a hedge-fund/family-office connector, a landscaping company, two VARs, and recruiters. The Aug 25 execution plan capped design partners at three because founder capacity is the binding constraint; the amendment log squeezed John in as a config (A-02). Adam's "maybe all of them are good paths" is a friend's answer, not a plan.

**Recommendation:** active work = the two VARs (one config pack, same brief type, same buyer) + the recruiter product (where the MandateSignal pricing-floor test lives). The police/title/family-office/landscaping outputs are archived as generality evidence — revisit only if one of them comes back asking to pay. If adopted, log it as the next amendment so it's a decision, not drift.

## Build order for Sol

| # | Item | Type | When |
|---|---|---|---|
| 2 | Tactics rename | Template label | Before edition 02 (Sept 1) |
| 3 | SPIN question structure | Prompt + template | Before edition 02 |
| 4 | Investigate-first positioning rule | Prompt | Before edition 02 |
| 1 | Value cover page | New template block + config fields | Edition 03 (Sept 8) |
| 5 | Sample mode | Renderer flag | Before the next NEW prospect gets anything (immediately if a new prospect appears) |
| 6, 7 | Pricing test, focus | Rich's decisions | This week; §6 ships with the first sample-mode artifact |

## What was deliberately NOT adopted from the call

- Selling the *methodology* (making reps "consciously competent"). Adam himself said hard-headed reps reject coaching; Rich's counter on the call was right — "this is intel, run it how you want." The product sells intelligence; the tactics sections are a courtesy, not the pitch. Keep them, but never lead with them.
- Generalizing Adam's pricing beyond the VAR config. His experience is long-cycle enterprise software; it maps to VAR reps, not to recruiters (who have their own tested $750 pilot / $1,000-month structure) and not to the shelved verticals.

**Provenance:** all quotes from the Otter transcript of the Aug 27 Rich–Adam call; buyer framework and "intel, not methodology" framing are Rich's own words on that call. Recommendations §5–§7 are mine (the analysis layer), marked as decisions precisely because reasonable people could choose otherwise.
