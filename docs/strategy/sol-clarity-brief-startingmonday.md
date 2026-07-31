---
doc_id: sm-clarity-brief
version: 2.1
date: 2026-07-31
status: ready-to-commit
home: Starting Monday repo → docs/strategy/
supersedes: Sol clarity audit 2026-07-30 (amended, not replaced)
rule: a copy of this doc not committed at its home is a DRAFT
---

# Build Brief for Sol — Starting Monday Clarity Pass (v2)
*Kit-side handoff (from Claude, strategy layer). v2 incorporates Sol's
verified code feedback of 2026-07-30 (all six pushback items accepted,
with refinements below) and two founder rulings from Rich. Where this
conflicts with observed code, flag — don't silently resolve.*

**v2 amendment log:**
- D-A downgraded to confirm-only (trial = active-tier verified in code).
- D-B expanded: the mapping file must also fix /pricing body copy (which
  currently renders mode names against tier-name metadata).
- NEW D-C: spine claims verified against default trial behavior BEFORE
  the verbatim lock (Sol P3 — ordering was backwards).
- Spine Step 3 rewritten per Rich: no "20+ companies" promise.
- All gates and budgets are per-brand-host (Sol P1 — dual-brand hazard).
- Situations grid: explicit decision D-D added, no silent deletion (P2).
- CLR-4 dashboard rebuild SPLIT OUT to its own future brief; only the
  week-one banner + trial status line remain here (P4).
- Proof artifact: reuse the /demo brief component, static-data variant;
  mobile constraint relaxed to ≤1.5 scrolls (P5). NEW D-E: hero photo
  replacement decision.
- CLR-6 gates join the existing gate family; CLR-1 routes through the
  existing landing-page approval process (P6).
- Word budgets seeded from a MEASURED render, then locked (engine
  section is ~250–350 rendered words, not ~800 — v1 premise corrected).
- Explicit-removals list added; CLR-7 baseline round moved to the front
  of the sequence.

---

## 0. The two rules of this pass (unchanged)

1. **Subtract before you add.** The 5-step spine replaces existing copy;
   net word count on every touched surface goes down.
2. **Show before you tell.** A real briefing artifact is the primary
   proof, prominently visible on the landing page.

## 1. CLR-0 — Decisions & verifications (first, with the CLR-7 baseline)

- **D-A (confirm-only).** Code verified: trial grants active-tier
  (`subscription.ts:61-64`, test at `subscription.test.ts:100`), and
  first-briefing-tomorrow is base behavior. **Spine Variant A is
  operative.** Rich confirms in one line; no build dependency.
- **D-B (naming).** Public tier names Monitor / Active / Executive are
  canonical. One mapping file; internal mode names never render. Scope
  EXPLICITLY includes fixing the current /pricing body copy ("Quiet
  monitor mode / Active campaign mode / High-intensity mandate mode" at
  page L82–L104), not just guarding new copy.
- **D-C (claim verification — blocks the §2 verbatim lock).** Sol
  verifies against a default trial account: (1) what a day-5 user
  actually has under watch, given onboarding requires only 3+ companies;
  (2) whether a decision-path artifact exists by day 5 as DEFAULT
  behavior, not an outcome target. Spine Step 3 text finalizes only
  after this report. The bracketed sentence in §2 is included or cut
  based on D-C — the copy conforms to the product, never the reverse.
- **D-D (situations grid — Rich decides).** The 6-card SITUATIONS
  section feeds the 9 `?from=` signup variants CLR-3 depends on. It is
  the choice-curation mechanism and may not be silently deleted.
  Options: (a) RECOMMENDED — keep, compressed to a single compact
  strip/chip-row ("Which of these is you?") between spine and FAQ,
  budget +40 words; (b) demote to a /situations route linked from the
  landing page, accepting weaker signup personalization. Rich picks.
- **D-E (hero visual — Rich decides; recommendation and trade-offs in
  the accompanying note).** Options: (a) RECOMMENDED — artifact-primary
  hero: the embedded sample briefing replaces the offer-letter
  photograph as the page's primary visual; (b) hybrid: artifact primary,
  small human element retained; (c) keep photo, artifact directly after
  (weakest for proof visibility — conflicts with the "very visible"
  requirement).
- **CLR-7 baseline round (Rich, cannot be reconstructed later):** before
  ANY change merges, ask three current users: "What does this product
  do?" and "What happens in your first week after signup?" Log verbatim
  in the evidence corpus.

## 2. Verbatim spine copy (canonical; finalize after D-C)

Stored once, rendered per-surface, per-brand. Diff-clean AC applies
AFTER D-C finalization stamps this section.

**Heading:**
> Here's your first week with Starting Monday

**Spine (Variant A, operative per D-A):**
> **Today, in 10 minutes:** Create your free account and tell us your
> target roles and companies. No credit card. Employers never see you.
>
> **Tomorrow morning:** Your first briefing arrives: roles likely to
> open, the signals behind them, and one priority action.
>
> **By Friday:** Every target role and company you named is under watch,
> with the first signals logged. [D-C-CONDITIONAL: And a decision-path
> map for your top targets.] That's how you'll know it's working.
>
> **Every Monday:** A cadence review keeps your search moving. Cancel
> anytime and keep everything you've built.
>
> **When your search intensifies:** Upgrade for daily execution and
> deeper prep, or invite a coach to work alongside you.

**Trust line (verbatim; once per page, directly above the final CTA):**
> Cancel anytime. Keep your data. Never visible to employers.

**Condensed 3-line variant (persona routes /for-*, signup):**
> Today: tell us your targets (10 minutes, no credit card).
> Tomorrow morning: your first briefing arrives.
> By Friday: everything you named is under watch, first signals logged.

Rationale for Step 3 (Rich's ruling): "every target you named is under
watch" is true by construction for any user — it promises coverage of
THEIR list, not an arbitrary count. No numeric watchlist promises
pre-signup.

## 3. Word budgets — seeded from measurement, then locked

Step 1: Sol produces a measured render report of the current landing
page per region (per brand host), stripping nav/footer/FAQ/legal.
Step 2: budgets below are ratified or adjusted ±20% against that report
in one round with Rich, then locked into CI. They are targets, not
guesses — v1's 800-word premise was wrong and this table inherits that
risk until measured.

| Surface / region | Target budget |
|---|---|
| Landing: hero block (headline + sub + CTA) | ≤ 40 words |
| Landing: first-week spine section | ≤ 110 words |
| Landing: how-it-works (collapsed) | ≤ 60 words |
| Landing: proof-artifact caption | ≤ 25 words |
| Landing: situations strip (if D-D option a) | ≤ 40 words |
| Landing: trust line | ≤ 15 words |
| **Landing: total above FAQ** | **≤ 290 words (with situations strip) / ≤ 250 (without)** |
| Persona routes /for-*: added spine block | ≤ 45 words |
| Signup page: total visible copy | ≤ 120 words |
| Dashboard first-run banner | ≤ 40 words |

**Explicit removals (listed, not discovered in review):**
- The ~250–350-word "How The Monday Engine Works" prose collapses to
  three ≤15-word steps + link to /learn-more. The timeline diagram MAY
  stay if it fits the artifact section without displacing the briefing
  (it is the only current visual that explains the mechanism).
- The hero `trialNote` ("Private by default… Free for 30 days…") is
  removed from the hero and re-homed into the trust line + signup
  guarantee line.
- The offer-letter photograph: per D-E.

## 4. Build stories

### CLR-1 — Landing page rewrite (replacement; SM brand variant ONLY)
Scope: the Starting Monday host variant of the shared LandingPage
component. The MandateSignal variant is explicitly out of scope; the
refactor must leave its render byte-identical (snapshot test per brand
host). Routes through the EXISTING `guard:landing-page-approval`
process.
- Hero headline kept verbatim: **"Be on the shortlist before the role
  is posted."**
- Structure: hero (≤40w) → proof artifact → spine (≤110w) → collapsed
  how-it-works → [situations strip per D-D] → trust line → single CTA →
  FAQ.
- **Proof artifact (P5 + Rich's "very visible" ruling):** reuse the
  existing /demo brief component in a static-data variant — do NOT
  commission a new image. Embed inline (not a link-out; the current
  HomepageBriefTeaser link-out pattern is what this replaces).
  Prominence requirements: desktop — artifact top edge within 100vh of
  hero top at 1440×900; mobile (390×844) — within 1.5 scrolls.
  Artifact must be readable without interaction (no click-to-reveal).
- AC1: spine + trust line diff-clean against §2 (post-D-C stamp).
- AC2: word-count CI per ratified §3 table, per brand host.
- AC3: exactly one primary CTA per viewport-height above the FAQ.
- AC4: artifact prominence per above, tested at both breakpoints.
- AC5: claims-manifest gate passes (CLR-6), per brand host.
- AC6: MandateSignal host variant snapshot unchanged.

### CLR-2 — Persona routes (/for-*)
Condensed spine + trust line, ≤45 added words, cut elsewhere on-route
to keep net total flat or down. Same gates.

### CLR-3 — Signup page
- Day-anchored condensed spine replaces the vague third bullet.
- Guarantee line (verbatim): "Free for 30 days. No credit card. Delete
  everything anytime."
- Email-confirmation state: "After you confirm, setup takes about 10
  minutes and your first briefing arrives tomorrow morning."
- Preserves the 9 `?from=` situation variants (dependency on D-D).
- AC: ≤120 words total; manifest gate; variants intact.

### CLR-4-lite — Dashboard copy-scale items ONLY
The three-pane IA rebuild is SPLIT OUT to its own future brief, which
must reconcile with the Dashboard A-grade contracts in AGENTS.md
(signal parity, chrome consistency, single main landmark) and the
pending dashboard restructure in the onboarding rebuild plan. Retained
here (copy-scale, most of the retention-side win):
- AC1: first-run "Week One" banner (days 1–7): next briefing time, next
  scan day, today's single action. ≤40 words. Auto-dismisses day 8.
- AC2: trial status line (day N of 30 + what happens at day 30) visible
  from day 1.

### CLR-5 — Onboarding done-step polish
One Step-5 line added ("When your search intensifies…"), ≤20 words
added, nothing else touched.

### CLR-6 — Claims manifest + gates (join the existing family)
`content/claims-manifest.json`: claim → feature key → tiers-true →
`trial: bool`. Gates implemented INSIDE the existing gate/script family
(alongside `guard:landing-page-approval`, visual-darkness, funnel-drift)
— not a parallel system. All gates run per brand host.
- Gate 1: pre-signup surface rendering a `trial: false` claim fails CI
  unless the copy names the tier.
- Gate 2: any rendered tier/mode name outside the D-B mapping fails CI
  (this catches the current /pricing violation and proves the fix).
- Gate 3: spine/trust/guarantee blocks imported from the canonical
  content file only; grep proves no hard-coded copies.
- AC: a planted violation test per gate; Gate 2's test uses the actual
  pre-fix /pricing strings.

### CLR-8 — Feynman gate (comprehension, not just brevity)
Rationale from the 2026-07-30 audit: the landing page PASSES standard
readability (Flesch-Kincaid grade 8.1, one sentence over 20 words) yet
fails a cold reader on unexplained abstractions ("while the mandate is
still forming," "problem-level context," "process formalizes," "sharpen
narrative," "momentum is designed"). Readability metrics cannot see this
failure — so the gate has three layers, and Layer 2 is the one that
encodes the actual Feynman rule.

**Layer 1 — deterministic CI (joins the CLR-6 gate family, per route,
per brand host):**
- Flesch-Kincaid grade ≤ 8 per route (currently passing; this is a
  floor-keeper, not the fix).
- No sentence > 24 words; route average ≤ 16.
- **Plain-language lexicon** (`content/plain-language-lexicon.json`):
  blocklisted terms that may not render on candidate-facing surfaces
  without either replacement or an inline plain gloss on first use.
  Seed list from the audit: mandate, cadence, narrative (as a verb
  object), problem-level context, process formalizes, shaping power,
  decision-grade, plus every internal mode/tier codename (D-B overlap).
  Each entry carries an approved plain substitute (e.g., mandate →
  "the role," "the decision to hire"; sharpen narrative → "improve
  your story"). CI fails on a bare blocklisted term.

**Layer 2 — cold-reader probe (the encoded Feynman test):**
A CI job strips a route to its visible text and gives it to an LLM with
ZERO other context, prompting: answer only from this text — (1) What
does this product do? (2) What do you get, and when do you get it?
(3) What does it cost to try? (4) What should you do next? (5) List any
phrases you could not confidently interpret.
- Answers are scored against a **route-purpose manifest**: every route
  declares, in one sentence, what a cold visitor must understand and do
  ("this page exists so X understands Y and does Z"). A route that
  cannot state one purpose sentence is merged or cut — that's the
  Feynman rule applied to information architecture, not just prose.
- Fail on any wrong or absent answer. Phrases flagged under (5) are
  triaged into the lexicon.
- Honest caveat, recorded in the gate's README: an LLM comprehends far
  above any five-year-old, so this probe is NECESSARY, not sufficient —
  a floor that catches regressions on every merge, never a substitute
  for Layer 3.

**Layer 3 — human explain-back (extends CLR-7):**
The 3-user test becomes recurring: after any major copy change, three
users answer the same two questions, plus one Feynman addition — "explain
what this product does as if to a friend who knows nothing about job
searching." Pass = their explanation survives without borrowing our
jargon. Log verbatim in the evidence corpus.

- AC1: lexicon file exists, seeded per above; planted-violation test.
- AC2: probe runs per route per brand host in CI; a planted
  incomprehensible phrase fails the build.
- AC3: route-purpose manifest covers every public route; CI fails on an
  unmanifested route.
- AC4: probe results archived per run (drift is visible over time).

### CLR-7 — Verification (baseline FIRST, after-round LAST)
- Baseline 3-user round runs in CLR-0 (see §1) — before any merge.
- After-round ~1 week post-ship: same three users, same two questions.
  Pass = answers converge on the spine's story. Log both rounds in the
  evidence corpus.
- Route-inventory audit + Page Experience Auditor on all touched
  routes, per brand host, including §3 word-count checks.

## 5. Sequencing (amended per Sol)

CLR-7 baseline + CLR-0 (D-A confirm, D-B mapping incl. /pricing fix,
D-C verification, D-D/D-E rulings) → CLR-6 + CLR-8 gates together
(per-brand; the lexicon and cold-reader probe must exist BEFORE the new
copy lands, so the rewrite is born gated) → CLR-1 → CLR-3 → CLR-2 →
CLR-5 → CLR-4-lite → CLR-7 after-round.
Dashboard IA rebuild: separate brief, separate sequence, reconciled
with AGENTS.md contracts + onboarding rebuild plan before it starts.

## 6. Out of scope

MandateSignal brand variant (byte-identical render) · pricing changes ·
new features · capability removal · /learn-more beyond receiving
re-homed content · numeric performance claims · dashboard IA (moved to
its own brief) · SM candidate data rules unchanged.

## 7. Founder items (Rich)

1. Confirm D-A in one line (Variant A operative).
2. Approve D-B naming (Monitor/Active/Executive canonical; /pricing
   body copy gets fixed).
3. Review Sol's D-C report; stamp the final Step-3 text (the
   "every target you named" formulation is pre-approved by your ruling;
   only the bracketed decision-path sentence is open).
4. D-D: situations strip (recommended) or demote to /situations route.
5. D-E: hero visual — artifact-primary (recommended), hybrid, or keep
   photo.
6. Run the baseline 3-user round BEFORE anything merges; name the three
   users.
7. Review the CLR-8 lexicon seed list and approve the plain substitutes
   (especially "mandate" → plain alternatives — it is load-bearing
   vocabulary internally but opaque to a cold candidate).
