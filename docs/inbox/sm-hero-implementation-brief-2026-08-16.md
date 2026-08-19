---
doc_id: sm-hero-implementation-brief
version: 1.0
date: 2026-08-16
status: approved copy (Rich, Version A) — implementation brief for Sol
scope: Starting Monday landing page, hero section only (top of page through privacy strip) + one new /example page the secondary CTA requires
priority: SM surface — per the execution order this must not displace REM-01, ORD-01/02, or any MS revenue commitment; it is a small, self-contained slice suitable for a gap in the queue
---

# SM Landing Hero — Implementation Brief (Version A)

## 0. Governance constants (restated once; all apply to every string on this surface)

- **Evidence language only (D9 applied to SM marketing surfaces — founder ruling via approval of this copy).** No prediction words, no percentages, no numeric confidence, no scores. Banned-word lint list in §6.
- **Em-dash-free customer-facing copy.** No U+2014 anywhere in rendered marketing copy. Lint in §6.
- **D15 boundary.** Nothing on this surface may promise person-level intelligence beyond what SM compliantly delivers (person names display-only, sourced from a single held public document, no person scoring, no cross-document joins). The approved copy respects this; do not "improve" it.
- **D19.** No MS data, assets, or shared analytics. SM telemetry stays in SM.
- **Copy is verbatim.** The strings in §1-§4 ship exactly as written. Any change routes back through Rich.

## 1. Hero copy (verbatim)

**Eyebrow** (replaces "Find roles before they are posted. Meet the decision-makers. Start Monday."):

> Career intelligence for managers and executives.

**H1** (unchanged from current site):

> Be on the shortlist before the role is posted.

**Subhead** (replaces current subhead):

> Starting Monday reads public signals. Leadership changes, funding, expansion, filings. You see roles forming before the job ad exists, and who to know before you apply.

**Privacy strip** (promoted in visual weight; replaces current footer-whisper styling):

> Private by default. No one knows you're looking until you decide they do.

## 2. CTAs (verbatim)

- **Primary:** `Get access` (unchanged label, unchanged destination).
  - Microcopy beneath, ONLY if Gate G-SM-1 confirms it is true: `Free during pilot.`
  - If G-SM-1 fails, ship no microcopy. Do not substitute alternative claims.
- **Secondary (new):** `See a live example` → routes to `/example` (§4). Ghost/outline style, secondary visual weight, left of or below primary per breakpoint.

## 3. Proof card (replaces the stock photograph)

Remove the stock image entirely. In its place, a product-style signal-timeline
card implemented as HTML/CSS (not a raster image), matching product visual
language (dark navy surface, card radius consistent with the copy panel).

**Content:** one anonymized signal timeline. Sourcing rule, in order of
preference:

1. A REAL case from SM's own signal history, anonymized (company renamed to
   a descriptor such as "Mid-size fintech, Denver"; dates may be shifted
   uniformly to preserve intervals). Preferred because the page's claims
   stay literally true.
2. If no suitable real case passes Gate G-SM-2, an illustrative mock is
   permitted ONLY with the visible label `Illustrative example` on the card.

**Structure (field spec, not verbatim copy — Gate G-SM-2 approves the
actual instance):**

- Card title: `Signal timeline` + bracketed anonymized descriptor.
- Three to four dated evidence lines, each: date + factual event + source
  class in parentheses where it strengthens (e.g. `(8-K filing)`,
  `(press release)`). Facts only. No interpretation inside evidence lines.
- Status line: `Status: role forming. N signals in M weeks.` Counts and
  durations only. Never a percentage, score, or the words in §6's ban list.

**Example instance (shape reference only; the shipped instance comes from
G-SM-2):**

> **Signal timeline — [Mid-size fintech, Denver]**
> Mar 12 · VP Marketing departure (8-K filing)
> Apr 02 · No successor announced
> Apr 18 · Two director-level marketing roles posted
> **Status: role forming. 3 signals in 5 weeks.**

Note: the interpunct separators above are layout styling, not em dashes;
implement as styled list rows, not literal punctuation in copy strings.

**Alt text:** `Example signal timeline showing three public signals that a role is forming at an anonymized company.`

## 4. `/example` page (new, small, required by the secondary CTA)

Purpose: deliver the aha before the signup. Ungated. No form, no wall.

Content, top to bottom:

1. H1: `What a forming role looks like.`
2. The same proof-card component as §3, expanded: the full timeline with
   one to two sentences of plain-language context per signal explaining
   why it matters (evidence language; each sentence points at the fact,
   not at a prediction).
3. One closing line: `Signals like these usually appear weeks before a job ad does. Starting Monday watches for them so you see the role forming, not just the posting.` (verbatim; "usually appear weeks before" is acceptable only if G-SM-2's chosen case and SM's held examples support it — otherwise Rich supplies a replacement line at gate review).
4. CTA: `Get access` (same destination as hero).

Reuse the §3 component; do not build a second card implementation. If a
real anonymized case is used, the same case appears in both places.

## 5. Layout, style, accessibility

- Grid unchanged: copy panel left, proof card right; stack card below copy
  on mobile with the card ABOVE the CTAs (proof before ask on small
  screens).
- Eyebrow: small caps or spaced caps, gold accent (existing eyebrow
  treatment). H1 serif treatment unchanged. Subhead: existing body style;
  maximum ~34 characters per line at desktop width is fine as-is.
- Privacy strip: move from footer-whisper to directly beneath the CTAs
  within the hero, smaller than subhead but clearly legible; keep the
  letterspaced-caps treatment if desired but raise contrast to meet
  WCAG AA (4.5:1) against the navy background.
- All text on navy must meet AA contrast. Both CTAs need visible focus
  states. The proof card is real text (selectable, screen-readable), not
  an image.
- No layout shift from the card: reserve its space at load.

## 6. Copy lint (executable, part of CI for this surface)

Add a test that scans rendered marketing strings for this page and fails on:

- Em dash `—` (U+2014) and en dash `–` (U+2013) in any copy string.
- Case-insensitive banned terms: `likely`, `predict`, `prediction`,
  `probability`, `chance`, `odds`, `score`, `scored`, `guarantee`,
  `guaranteed`, `%` adjacent to any signal/role/outcome noun, `AI-powered`.
- The string `decision-makers` and `map of the people` (retired claims;
  prevents regression to the old copy).

The lint list is additive to, not a replacement for, the ORD DM QA regexes;
they are separate surfaces and separate test suites (D19).

## 7. Telemetry (SM-side only)

Minimal events, SM analytics only: `hero_view`, `cta_get_access_click`,
`cta_example_click`, `example_page_view`, `example_to_access_click`.
Purpose: measure whether the example page lifts access clicks (the page's
one job). No person-level enrichment, no cross-product joins.

## 8. Acceptance criteria

- AC1: Rendered hero matches §1-§3 copy byte-for-byte (excluding layout
  punctuation per §3 note); §6 lint passes in CI.
- AC2: Stock photograph removed; proof card renders as text/HTML, passes
  AA contrast, and has the specified alt text.
- AC3: `See a live example` routes to `/example`; `/example` renders the
  same card component and its `Get access` CTA works; page is reachable
  logged-out with no gate.
- AC4: If microcopy `Free during pilot.` is present, G-SM-1 sign-off is
  recorded; if the card is a mock, the `Illustrative example` label is
  visible; if real, G-SM-2 sign-off names the source case.
- AC5: Mobile stack order is copy → card → CTAs → privacy strip; no CLS
  from the card.
- AC6: Telemetry events fire once per action (idempotent on re-render) and
  exist only in SM analytics.

## 9. Founder gates (Rich, before ship)

- **G-SM-1:** Confirm "Free during pilot." is factually true for new
  signups today. Yes → ship microcopy; No → omit.
- **G-SM-2:** Approve the proof-card instance: real anonymized case
  (preferred; approve the anonymization) or mock (approve the
  `Illustrative example` label placement). Also approve or replace the
  §4 closing line's "usually appear weeks before" claim against held
  examples.
- **G-SM-3 (recorded ruling):** By approving this brief, marketing
  surfaces for SM follow D9 evidence language. This ruling is why
  "likely-to-open" does not appear in the new copy and why §6's lint
  exists.

## 10. Out of scope (do not build)

- Version B (loss-framed) headline test. Recorded as the first A/B
  candidate AFTER this ships and baseline telemetry exists; not now.
- Any change below the hero fold.
- A/B testing infrastructure. Ship A; measure with §7 events first.
- Any MS-side reuse of this copy or components (D19).
