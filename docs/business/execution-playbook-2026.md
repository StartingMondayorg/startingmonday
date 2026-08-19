# Starting Monday — Execution Playbook v2 (200 by Dec 31, 2026)

**Companion to:** sales-marketing-master-plan-2026.md (the strategy)
**This version:** reconciled against a full codebase/site/stack audit (Jul 3, 2026). Assumption-based tooling replaced with what you actually run.
**Owner:** Founder (Richard) + sales consultant. Support: VA (hire by Jul 15).

---

## 0. Audit Findings — What Actually Exists (verified against code)

### Your real stack (no new purchases needed here)

| Function | You have | Status |
|---|---|---|
| CRM / pipeline | **HubSpot** (+ sales consultant) | Running — needs SM-specific pipeline config (§2.1) |
| Calendaring | **Microsoft** (Outlook/Bookings) + email | Running — needs a public booking link in DMs/site |
| Call notes | **Otter.ai** | Running — needs a call-summary → HubSpot habit |
| Billing | **Stripe** | Running — **products/prices likely incomplete** (§2.2) |
| Prospecting | **Sales Navigator + Apollo.io** | Running |
| Analytics | **PostHog** | Running — **critically under-instrumented** (§2.3) |
| Email sending | **Resend** + email-council quality gate | Running — 7+ automated sequences already live |
| AI | **Claude (product API + Claude Code in VS Code)** | Running |

**Net new spend required: VA + LinkedIn ads + misc ≈ $1,700–2,900/mo — lower than v1 estimated, because you already own most of the stack.**

### What the codebase already has (don't rebuild)

- **42 blog posts**, 15+ persona pages, full evidence/trust suite (evidence-hub, references, case-studies, pilot-findings, security, method-and-evidence).
- **Two free lead tools already live:** `/demo` (unauthenticated AI brief, rate-limited) and `/optimize` (free LinkedIn/resume review with A–F grading). v1's "Signal Check" idea is now **priority 3** — activate what exists first.
- **Email lifecycle automation:** weekly digest, reengagement drip, commitment Friday/Sunday nudges, drip campaign, Manager Tools partner lifecycle — all via Resend with a quality-scoring council gate.
- **Coach/white-label infrastructure:** coach tier, client seats, coach command center, co-branded client reporting, white-label API. The coach channel is a **sales problem, not a build problem**.
- **Partner attribution + reporting APIs** exist (`/api/partners/*`).
- **Admin GTM tooling:** social desk, coach-outreach playbook, speakers DB, metrics, CRM, sales-enablement pages.
- **Manager Tools partnership flow** live (UTM-locked signup, day-2 brief, lifecycle emails) — an existing warm channel to nurture.

### The real gaps (this is the work)

| # | Gap | Impact |
|---|---|---|
| G1 | **Stripe products misaligned:** no founding-member price, coupon, or promotional mechanism; price IDs in env need verification against the 4 tiers × 3 billing periods | Can't run the Phase-1 founding offer |
| G2 | **PostHog is ~blind:** only `$pageview` + `trial_converted`. No demo→signup chain, no activation events, no funnel can be built from current data | You cannot measure the funnel you're about to drive traffic into |
| G3 | **PHProvider not mounted on public marketing pages** (only auth + dashboard layouts + a few pages) — most marketing traffic is invisible | Same as G2 |
| G4 | **No referral / gift-link mechanism** in code | Phase-2/3 referral loop needs a build |
| G5 | **No exit-intent / lead-magnet capture** on the site | Losing ~97% of visitors with no second touch |
| G6 | **No landed-a-role alumni downgrade tier** ($19–29) in pricing/code | Churn protection missing |
| G7 | **No review-ask moment** in-app | Trust engine has no fuel line |
| G8 | **Pricing docs drift:** strategy docs said $129 Active; code says **$199** ($169 annual-effective). Trial is **30 days, no card** | Plan math and scripts must use real numbers (see below) |

### Corrected revenue math (real prices)

Blended ARPU at realistic mix (~30% Monitor $49, ~60% Active $199, ~10% Executive $499): **~$180/mo** (annual prepay slightly lower effective).
**200 paying ≈ $34–36K MRR ≈ $410–430K ARR run-rate** — roughly **2x your Year-2 plan**. The 200 goal is more valuable than v1 stated.

**No-card trial implication:** the funnel's hard wall is trial→paid, not visitor→trial. Founder sales calls and week-2 activation are therefore even more central than v1 assumed; "card at trial start" is replaced by "founder-assisted conversion during trial" (§5).

---

## 1. Frameworks (unchanged from v1)

- **Bullseye** — 3 channels only: founder-led direct · coach partners · credibility engine.
- **AARRR** — instrumented in PostHog per §2.3.
- **Sean Ellis PMF survey** at customer #25 and #100 (target ≥40% "very disappointed").
- **MEDDICC-lite** on sales calls; log fields in HubSpot.
- **JTBD** interviews woven into the first 25 onboarding calls; verbatims feed copy.
- **Skok SaaS metrics** — LTV:CAC ≥3, CAC payback ≤12 mo, logo churn <6%/mo.
- **AIDA** audit once across the 20 money pages.

---

## 2. Infrastructure Work (Weeks 1–2) — configure what you own, build only 8 things

### 2.1 HubSpot configuration (with your sales consultant — their deliverable, week 1)

- [ ] **Deal pipeline "B2C Direct":** Lead → DM/Email sent → Replied → Call booked → Call held → Trial started → Paid → Churned/Alumni. Deal amount = tier × billing period.
- [ ] **Second pipeline "Coach Partners":** Prospect → Conversation → Founding Partner signed → First client onboarded → 3+ seats active.
- [ ] Import the 2 weeks of LinkedIn DM campaign contacts (Apollo/SalesNav export → HubSpot) with source property = `linkedin_dm_campaign_1`.
- [ ] Properties: `persona` (CIO/CTO/CISO/VP…), `signal_trigger` (layoff/reorg/M&A/none), `trial_start`, `activation_status`, `founding_member` (bool).
- [ ] **Stripe → HubSpot:** at minimum a Zapier/native integration writing subscription events to the contact timeline; deal auto-moves to Paid on `checkout.session.completed`.
- [ ] **Otter habit:** call summary pasted to the HubSpot deal within 30 min of every call (founder discipline, not tooling).
- [ ] Microsoft **Bookings page** ("20-min Campaign Strategy Call") → link in LinkedIn profile, DM templates, email signatures, /pricing footer.
- [ ] Weekly pipeline report (HubSpot dashboard): counts per stage + conversion % — feeds the Friday Scorecard.

### 2.2 Stripe product alignment (founder + Claude Code, 0.5 day)

- [ ] Verify env price IDs exist for all live tiers/periods: `STRIPE_PRICE_{PASSIVE|ACTIVE|EXECUTIVE|CONCIERGE}` monthly/quarterly/annual against src/lib/pricing.ts values ($49/132/470 · $199/469/2030 · $499/1200/4790 · $499/–/4990).
- [ ] **Create the Founding Member mechanism** (pick one, simplest first):
  - Option A (fastest): Stripe **coupon** `FOUNDING50` — e.g. Active at $149/mo or $1,490/yr for life of subscription, 50 redemptions max — surfaced via a dedicated payment link the founder sends on calls.
  - Option B: dedicated founding price IDs + pricing-page banner (ticket P1).
- [ ] Create **Alumni Monitor $19/mo** price (used by ticket P6).
- [ ] Verify coach-seat billing works end-to-end for one test coach ($30/seat or current coach-tier config).
- [ ] Confirm webhook fires `trial_converted` to PostHog on live mode.

### 2.3 PostHog instrumentation (founder + Claude Code, 1–2 days — **highest-leverage engineering of the quarter**)

- [ ] Mount `PHProvider` on the **public marketing layout** (root layout or a public-pages layout) so marketing traffic is captured (respecting existing consent posture).
- [ ] Add client events: `demo_brief_generated`, `demo_cta_clicked`, `optimize_review_completed`, `pricing_viewed`, `signup_started`, `signup_completed` (exists partially), `booking_link_clicked`.
- [ ] Add server events: `trial_started`, `activation_target_list_built` (≥10 companies), `activation_first_brief`, `week2_activated` (both within 14 days), `subscription_cancelled`, `alumni_downgrade`.
- [ ] Build 4 funnels + dashboards: (1) marketing visit→demo→signup · (2) signup→week-2 activation · (3) trial→paid · (4) paid→referral sent (after G4 ships).
- [ ] UTM convention doc: `utm_source=linkedin|newsletter|podcast|coldemail`, `utm_campaign=founding|report|jan-wave`. Thought-Leader-Ads links always UTM'd.
- [ ] Weekly digest email from PostHog to founder + consultant.

### 2.4 Product tickets (the only allowed builds — Claude Code, ~8–12 days total across 6 months)

| # | Ticket | Est. | Phase |
|---|---|---|---|
| P1 | Founding Member surface: pricing banner + founding payment link/coupon path + account badge | 1 d | 1 (Jul) |
| P2 | Demo as hero CTA for logged-out home traffic + `demo_*` events (§2.3) | 0.5–1 d | 1 (Jul) |
| P3 | Proof block above the fold (n=27 / 81% / 9-day + methodology link + 5 vignettes) | 1 d | 1 (Jul) |
| P4 | Exit-intent modal + gated 90-Day Plan PDF + Resend nurture sequence (5 emails through the email-council gate) | 1–1.5 d | 1 (Jul) |
| P5 | **Activate /optimize as a front-door:** link from nav/home, email-capture step before results, nurture hookup, `optimize_*` events | 1 d | 1–2 (Aug) |
| P6 | Landed-a-role flow: congrats → Alumni $19 downgrade offer → private gift link (2 months Monitor for a colleague) | 2–3 d | 2 (Sep) |
| P7 | In-app review ask (Trustpilot/G2) after 3rd generated brief | 0.5 d | 1 (Aug) |
| P8 | Coach co-branded weekly client report — verify + polish branding (mostly exists) | 1 d | 1–2 (Aug) |
| P9 | (Deferred unless capacity) Signal Check tool — 5 companies in → emailed signal report | 3–5 d | 3 or 2027 |

**Everything else: feature freeze.** The audit confirms the product is not the bottleneck — measurement, offer mechanics, and proof are.

---

## 3. Costs (revised down against owned stack)

### Monthly run-rate (from August)

| Category | Item | $/mo |
|---|---|---|
| People | VA/contractor 15–20 hrs/wk | 1,000–1,800 |
| Ads | LinkedIn Thought Leader Ads | 500 → 1,000 (Oct+) |
| Stack you already pay for | HubSpot, SalesNav, Apollo, Otter, Resend, PostHog, Stripe | ~0 incremental |
| New tools (minimal) | Buffer/Typefully ($0–29), Canva ($13), Qwoted ($0–99), cold-email tool if consultant wants one ($97) | 50–240 |
| Media tests | Newsletter sponsorships (Sep–Nov amortized) | ~500 |
| **Total incremental** | | **~$2,050–3,540/mo** |

### One-time
Warmup domains ~$60 (Jul, only if cold-email rail is approved by consultant) · Data-report PR specialist $1–3K (Sep) · Report design $0–500 · Panel travel $500–2K (Oct–Nov).

**6-month envelope: ~$15K–24K.** Against corrected exit MRR (~$34K), blended CAC ≈ $75–120 and LTV:CAC comfortably >5.

---

## 4. Metrics System (targets restated on real pricing)

**North Star: cumulative paying customers.** 25 (Aug 31) → 100 (Oct 31) → 200 (Dec 31).
**Shadow metric (report alongside, never instead): MRR.** ~$4K (Aug) → ~$17K (Oct) → ~$34K (Dec).

```
PAYING CUSTOMERS
├── B2C direct
│   ├── DM/email → reply ≥15% · reply → call ≥33% (net DM→call ≥5%)
│   ├── Calls held 6→10/wk · call → trial ≥50%
│   ├── Trial → paid ≥20% (no-card trial = the hard wall; founder-assisted)
│   └── Week-2 activation ≥60% (list ≥10 companies + first brief)
├── Coach seats
│   ├── Coach convos 10–12/mo · convo → signed ≥10% · seats/coach 4–6 by month 2
└── Retention
    ├── Logo churn <6%/mo · alumni-downgrade saves tracked
    └── Gift links sent per landed-role event ≥1 (post-P6)
```

| Metric | Source of truth |
|---|---|
| Pipeline counts & conversion | HubSpot dashboards |
| Funnel events (demo/signup/activation/paid) | PostHog (after §2.3) |
| MRR / churn / LTV | Stripe (+ free ProfitWell-class tool if desired) |
| Ad CAC per trial | PostHog UTM + LinkedIn Ads |
| Proof assets | Tracker sheet (VA) |
| Founder sales hours | Outlook calendar audit — **first number read every Friday** |

**Friday Scorecard (30 min, founder + sales consultant):** sales hours → funnel vs target → cumulative paying vs phase line → coach pipeline → one thing to double / one to kill → kill-criteria check.

---

## 5. Sales Motion (adjusted for the no-card 30-day trial)

The audited trial reality replaces v1's "card at trial start":

1. **Call → trial:** on the 20-min call (Bookings link), build the target list together *live in the product*, generate the first brief on screen, start the trial before hangup. Otter summary → HubSpot.
2. **Trial day 0–14 = activation sprint:** week-2 activation (≥10 companies + first brief + briefing time set) is the conversion predictor. Missed activation → personal founder email/DM within 48 hrs (automation can flag via PostHog → HubSpot task).
3. **Founding close:** days 7–21 of trial, founder sends the founding payment link ($149-class coupon, 50 named slots, expires Dec 31) with a one-line ROI anchor ("one hour with an exec coach costs more than a quarter of this").
4. **Day 25 save:** trial expiring + activated + not converted → personal call offer, not a discount ladder.
5. **Landed a role:** congrats flow → Alumni $19 + gift link (P6).

MEDDICC-lite fields captured per call in HubSpot; JTBD verbatims collected on the first 25.

---

## 6. Weekly Operating Rhythm (unchanged structure, real tools)

| Day | AM (protected 9:00–12:00) | PM |
|---|---|---|
| **Mon** | Sales block: Monday list (SalesNav/Apollo → HubSpot), 10–15 personalized DMs, follow-ups | Pipeline hygiene · post #1 live · 2-hr comment window |
| **Tue** | Calls ×3–4 (Bookings) | Otter→HubSpot notes · post #2 draft from best call insight (Claude) · coach outreach ×3–5 |
| **Wed** | Sales block: follow-ups + signal-triggered outreach (fresh reorg/layoff/M&A) | Post #2 live · byline/report hour · HARO approvals |
| **Thu** | Calls ×3–4 | Coach calls ×1–2 · podcast recordings · post #3 draft |
| **Fri** | Sales block: trial nudges, founding links, day-25 saves | Post #3/4 live · **Scorecard 4pm with consultant** · next week's lists |

**Founder daily:** 90-min AM sales block (booked first) · every comment answered <2 hrs · 15-min HubSpot hygiene · tomorrow's first task written.
**VA daily:** list building → HubSpot · social queue drafts · HARO/Qwoted monitoring · podcast pitches (3/wk) · review-ask follow-ups · tracker upkeep.
**Sales consultant weekly:** pipeline review, call coaching from Otter transcripts, HubSpot report integrity, Friday Scorecard co-owner.

---

## 7. Phase Plan (gates unchanged; week-1 tasks rewritten against audit)

### PHASE 1 — PROVE (Jul – Aug) · Gate: ≥25 paying, ≥5 coaches, funnel rates known

**Week of Jul 6 — Configure & convert existing interest**
- [ ] §2.1 HubSpot config + DM-campaign import (consultant)
- [ ] §2.2 Stripe: founding coupon/link + alumni price + price-ID verification (founder, 0.5 d)
- [ ] §2.3 PostHog instrumentation started (founder + Claude Code)
- [ ] Bookings link live everywhere
- [ ] P1 + P3 shipped
- [ ] **Book 8–10 calls from the existing DM-interest backlog before it goes cold** — this is the single most valuable task of the month
- [ ] VA job posted

**Week of Jul 13** — VA onboarded · P2 + P4 shipped · first 5 paying target · coach list (25) built from existing admin playbook · byline #1 outline · Trustpilot/G2 claimed + first review asks to pilot users
**Jul 20 & 27** — full rhythm · 10–12 calls/wk · cumulative 10–12 paying · 2 coaches signed · byline #1 submitted · podcast pitching starts · Thought Leader Ads live ($250 test) · hero A/B live
**August** — 10 calls/wk steady · paying: 15 → 19 → 22 → **25+** · coaches ≥5 (concierge-onboard first 2 clients each) · P5 + P7 + P8 shipped · reviews ≥15 · cold-email rail decision with consultant (if yes: warmup started, first signal-triggered sequence ~Aug 15) · Sean Ellis at #25
**Aug 31 gate:** <10 paying after 100 calls → STOP; 2-week offer/price/onboarding rebuild before any scaling.

### PHASE 2 — SYSTEMATIZE (Sep – Oct) · Gate: ~100 paying, trial→paid ≥20%, coach seats ≥3/wk
Sep: data report published (Sep 15) + PR push · P6 shipped (alumni + gift links) · newsletter test #1 · coaches 5→8 · paying ~40→60.
Oct: newsletter #2–3 (keep ≥20-demo-visit performers) · ads $750–1K if CAC/trial <$300 · byline #3 · 4–6 podcasts aired · Q4 panels booked (speakers DB) · coaches 8→12 · paying **90–110**.
**Oct 31 gate:** <60 → December target formally revised to 120–150; same motions.

### PHASE 3 — COMPOUND (Nov – Dec) · Exit: 200
Nov: "start before the January wave" campaign · annual push (founding expires Dec 31) · kill weakest experiment by Nov 15 · panels delivered · coaches 12→15 · paying 130→155.
Dec 1–15: hardest close window — founder touch on every open trial · gift-link harvest. Dec 15–31: January pipeline + annual deals only.
**Dec 31: 200 paying (~$34K MRR) · Sean Ellis #2 · 2027 plan drafted from real funnel data.**

---

## 8. Template Library (VA-maintained; due dates hold from v1)

DM sequences (cold/warm/signal/follow-up×3) · sales-call script (MEDDICC-lite, live-demo arc, founding close) · Founding Member one-pager · coach partner one-pager + rev-share terms · cold email 3-touch (if rail approved) · review-ask snippets · podcast pitch ×2 angles · HARO Claude prompt · nurture 5-email sequence (through email council) · trial onboarding emails (verify existing crons cover day 0/2/5/9/13; patch gaps only) · vignette format · Friday Scorecard template.

---

## 9. Definition of Success (Dec 31)

1. 200 paying (~$34K MRR — ~2x the original Year-2 plan).
2. Every §4 rate has ≥3 months of real PostHog/HubSpot data.
3. Sean Ellis ≥40% among actives.
4. Proof engine: 25+ reviews · 8+ vignettes · 3 bylines · 6+ podcasts · 1 data report with earned links.
5. Two working channels + credibility flywheel, playbook-documented, runnable by a future hire.
6. LTV:CAC ≥3 demonstrated with real numbers.
