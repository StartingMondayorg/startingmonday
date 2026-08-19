# Adjacent Product Analysis: Director & Senior Manager Search Platform

**Date:** May 2026  
**Status:** Strategic analysis — not yet greenlit

---

## 1. The Concept

Starting Monday serves senior technology executives at the C-suite and VP level. The adjacent opportunity is one rung down: Directors, Senior Directors, and senior Managers who are actively searching for their next role or positioning themselves for a VP promotion.

The core problem is similar — job search is poorly supported by generic tools — but the mechanics are meaningfully different. This is not a price-reduced version of Starting Monday. It is a distinct product for a distinct phase of a career.

**Working brand name: "Next Monday"**
Rationale: Connects clearly to Starting Monday, implies forward progress, and positions the two products as a portfolio — the platform for where you are now (Director) and the platform for where you are going (C-suite). Alternative names worth considering: Advancing Monday, Moving Monday, Runway.

**Critical brand rule:** Next Monday should never be described as "Starting Monday for Directors." The C-suite audience values exclusivity. The director audience values aspiration. Each must believe the product was built for them specifically.

---

## 2. How This Audience Differs From C-Suite

Understanding the differences is what determines what must be built versus what can be reused.

| Dimension | C-Suite / VP (Starting Monday) | Director / Senior Manager (Next Monday) |
|-----------|-------------------------------|----------------------------------------|
| Job postings | Most roles never posted; filled by retained search | Mix: 40% posted, 60% relationship/referral |
| Search firms | Retained only; relationships drive everything | Contingency and some retained; less relationship-dependent |
| Resume | Secondary to brand and positioning | Critical — ATS filters, keyword optimization matter |
| LinkedIn | Brand/visibility platform | Active sourcing tool — recruiters search here |
| Interview format | Strategic vision, board dynamics, transformation thesis | Behavioral + technical competency + some strategic |
| Avg. comp range | $300K–$800K+ | $130K–$250K |
| Avg. search duration | 7–9 months | 4–5 months |
| Competition per role | 5–15 finalists | 20–80 candidates |
| Willingness to pay for tools | High (trivial relative to comp) | Moderate — more price-sensitive |
| Primary fear | Employer finding out they're looking | Being invisible to the right recruiters |

The product implications: Resume optimization matters more. Job board intelligence matters more. Interview prep is competency-based rather than strategic. The AI prompts, content strategy, and positioning must reflect these differences.

---

## 3. Build Estimate

The Starting Monday codebase is the foundation. The question is what percentage is directly reusable.

### Reusable Without Significant Modification (~75%)

- Core infrastructure: Supabase, Railway, auth (Google OAuth), Stripe billing
- Pipeline tracking: company stages, contacts, follow-up reminders
- Document upload and storage
- AI integration layer (Claude API, streaming, watermarking)
- Admin panel and analytics
- Email delivery (Resend)
- Worker process (scanning, briefing job)
- Blog and content architecture
- Component library (nav, footer, design system)

### Requires Meaningful Adaptation (~15%)

- Marketing site: entirely new positioning, pricing, persona pages, hero copy
- Onboarding flow: director-specific questions (role type, target companies, comp range, ATS experience)
- Daily briefing: reweighted for posted roles, recruiter signals, less exec org change intelligence
- Scan logic: add job board scanning (LinkedIn Jobs, Indeed) alongside career page scanning
- Interview prep brief: rewritten prompts for behavioral + competency framing vs. strategic vision

### Net New Build Required (~10%)

- Resume optimization feature (ATS keyword analysis, formatting feedback)
- LinkedIn profile grader integration (the /optimize page concept, adapted for director level)
- Recruiter outreach tracker (directors get cold-messaged by recruiters; tracking response rates matters)
- Content: 15–20 net-new blog posts for director audience

**Total build estimate:**
- With one engineer (Richard or hired): 10–14 weeks to production MVP
- With Richard building solo at Starting Monday's current pace: 16–20 weeks
- The right time to build: when Starting Monday has an engineer and proven P/M fit — Year 3

---

## 4. Market Analysis

### Total Addressable Market (US)

| Persona | US Population | In Active Search (~15%/yr) |
|---------|--------------|---------------------------|
| IT Director | 80,000 | 12,000 |
| Senior IT Manager | 150,000 | 22,500 |
| Engineering Director | 60,000 | 9,000 |
| Data / Analytics Director | 30,000 | 4,500 |
| Security Director / Senior Manager | 25,000 | 3,750 |
| Technical Program Manager (Sr.) | 40,000 | 6,000 |
| **Total** | **385,000** | **57,750/yr** |

The director/senior manager market is approximately 5x the C-suite market by search volume. Annual replenishment rate is ~58,000 — the ceiling on new customer acquisition before awareness and conversion constraints.

Search rate is higher (15% vs 12%) because tenure is shorter at this level and involuntary transitions are more common.

### Unit Economics

| Metric | Starting Monday | Next Monday |
|--------|----------------|-------------|
| Blended ARPU | $100/month | $60/month |
| Avg. subscription duration | 7–9 months | 4–5 months |
| Blended LTV | ~$790 | ~$270 |
| Gross margin | ~91% | ~88% |
| Gross profit per customer | ~$720 | ~$238 |

**The LTV gap is the central economic challenge.** At $270 LTV, you need 3x as many customers to generate the same gross profit per dollar of marketing spend. This makes the B2B channel even more important for Next Monday than it is for Starting Monday.

### B2B Channel Differences

The outplacement channel at director level operates differently:

- **Mass-market outplacement firms** (Right Management, Career Partners International, Challenger Gray) serve this level in volume. They handle thousands of directors annually.
- Per-engagement pricing: $150–$200 (vs. $350 for C-suite) — lower because the firm's contract value with the employer is lower
- Volume is higher: a single firm might route 2,000–5,000 directors per year
- Coach channel also applies: career coaches at director level are numerous, charge $150–300/hour, carry 15–25 clients

B2B LTV for Next Monday:
- Outplacement: $175/engagement × 80% margin = $140 gross profit
- Coach seat: $20/month × 14-month coach retention = $280 LTV × 78% margin = $218 gross profit

Lower per-unit than Starting Monday but meaningfully higher volume potential.

### Global English-Speaking Market

Same expansion logic as Starting Monday. UK, Canada, and Australia add ~88% more addressable volume. India adds volume at lower ARPU (~0.25x).

Effective global multiplier (ex-India): +70% on US revenue (slightly discounted from Starting Monday's +83% due to more competitive market outside US).

---

## 5. Five-Year Financial Model

**Key assumptions:**
- Launch in Year 3 of Starting Monday (Q2 2028)
- Year 1 of Next Monday = Year 3 of the overall portfolio
- Uses Starting Monday infrastructure — marginal infrastructure cost is low
- Pricing: Monitor $29/month, Active $69/month, blended ARPU $60

### Revenue by Year (Next Monday standalone)

| | NM Yr 1 (2028) | NM Yr 2 (2029) | NM Yr 3 (2030) | NM Yr 4 (2031) | NM Yr 5 (2032) |
|---|---|---|---|---|---|
| B2C US | $22K | $95K | $240K | $430K | $600K |
| B2B (coaches + outplacement) | — | $40K | $200K | $580K | $1.05M |
| Global B2C | — | $10K | $50K | $130K | $210K |
| **Total** | **$22K** | **$145K** | **$490K** | **$1.14M** | **$1.86M** |

Lower absolute revenue than Starting Monday in equivalent years due to lower ARPU. Year 3 ($490K) vs. Starting Monday Year 3 ($600K). But comparable trajectory because the market is larger.

### P&L by Year (Next Monday, incremental to existing portfolio)

Because infrastructure is shared, the marginal OpEx for Next Monday is lower than it would be for a standalone business. It does not need its own Railway, Supabase, or core engineering. It needs: brand, content, and (eventually) a dedicated sales effort for its B2B channel.

| | NM Yr 1 | NM Yr 2 | NM Yr 3 | NM Yr 4 | NM Yr 5 |
|---|---|---|---|---|---|
| Revenue | $22K | $145K | $490K | $1.14M | $1.86M |
| Gross Margin | 88% | 88% | 86% | 84% | 83% |
| **Gross Profit** | **$19K** | **$128K** | **$421K** | **$958K** | **$1.54M** |
| Brand / site build (one-time) | $30K | — | — | — | — |
| Content (blog + marketing) | $12K | $20K | $30K | $40K | $50K |
| B2B sales (shared or dedicated) | — | $20K | $75K | $150K | $200K |
| CS (shared with SM team) | — | $10K | $30K | $50K | $70K |
| Allocated infrastructure | $5K | $8K | $12K | $15K | $18K |
| **Total Incremental OpEx** | **$47K** | **$58K** | **$147K** | **$255K** | **$338K** |
| **Incremental EBITDA** | **-$28K** | **+$70K** | **+$274K** | **+$703K** | **+$1.20M** |

Next Monday reaches profitability in Year 2 (its own Year 2, which is calendar Year 4 of the portfolio). This is faster than Starting Monday because the infrastructure is already paid for.

### Combined Portfolio at Year 5 of Starting Monday (Q4 2030)

At the Starting Monday exit in 2030, Next Monday is in its Year 3:

| | Starting Monday | Next Monday | Combined |
|---|---|---|---|
| ARR | $2.13M | $490K | $2.62M |
| Gross Profit (annual) | $1.81M | $421K | $2.23M |
| Incremental EBITDA | $840K | $274K | $1.11M |

**Combined exit valuation at the same 7x ARR multiple:**  
$2.62M × 7 = **$18.3M**

That is $3.3M more than the Starting Monday standalone exit — for a product that costs approximately $30K to brand and 12-16 weeks of development time. The incremental return on building Next Monday before the exit is significant.

If the combined exit is pushed to Starting Monday Year 6 (Next Monday Year 4):

| | SM Yr 6 (est.) | NM Yr 4 | Combined |
|---|---|---|---|
| ARR | ~$2.8M | $1.14M | ~$3.9M |
| Exit at 7x | ~$20M | ~$8M | **~$28M** |

This scenario — hold one additional year and sell both products together — is the highest-value path if Next Monday launches on schedule and B2B traction develops.

---

## 6. Pros and Cons

### Pros

**1. Expands the overall brand (as noted)**
"Starting Monday" becomes a brand family, not a single product. The makers of Starting Monday have built the category. This changes the conversation with strategic buyers from "interesting niche tool" to "the platform for executive career management across career stages." Brand equity accrues to the portfolio, not just one product.

**2. Reuses 75% of existing infrastructure**
Most of what was built for Starting Monday — the database schema, the AI layer, the billing, the auth, the worker — transfers directly. The marginal cost to launch Next Monday is a fraction of what Starting Monday cost to build. The first $30K buys a product that would cost $300K to build from scratch.

**3. Creates a career-stage funnel**
Directors who use Next Monday and get promoted become C-suite executives. They already trust the brand, understand the product, and have established data in the platform. The natural upgrade path is Starting Monday. This is a built-in acquisition channel for the premium product that costs nothing.

**4. 5x larger TAM unlocks volume economics**
58,000 directors entering the US search market annually vs. 10,900 C-suite executives. With lower LTV per customer, volume is the lever. A larger market creates more room for SEO content, B2B partnerships, and growth without hitting ceilings early.

**5. Different B2B channel — no cannibalization**
Mass-market outplacement firms (Challenger, Career Partners) serve directors. Boutique outplacement firms serve C-suite. These are different buyer relationships. A contract with Right Management for director-level engagements does not interfere with a Korn Ferry Advance contract for C-suite. Two parallel B2B channels, both with Starting Monday-affiliated brands.

**6. Materially increases exit valuation**
At the same multiple, adding Next Monday's ARR to the combined exit increases valuation by $3-8M depending on timing. A strategic acquirer buying both products is buying the entire career stage, not just the top of the market. That is worth more than the sum of the parts.

**7. Content and SEO compound together**
Director-level content ("How to Get Promoted to VP," "How to Position Yourself for a Director to VP Move") and C-suite content share domain authority under the same brand family. Google indexes the total depth of expertise. The blog network effect is real.

**8. Competitive moat deepens**
A competitor entering the executive search tool market has to fight one brand. If Starting Monday has two products covering two career stages, the competitor has to fight the whole ladder. The switching cost for a user who moves from Next Monday to Starting Monday after a promotion is zero — they already have the muscle memory.

---

### Cons

**1. Focus risk — the most important con**
The #1 cause of startup failure at this stage is splitting focus before product-market fit is proven. Starting Monday needs to reach $200K ARR and demonstrate the B2B channel before any engineering capacity goes to a second product. Launching Next Monday in Year 1 or Year 2 of Starting Monday would likely damage both. The discipline to wait is hard when the adjacent opportunity is visible.

**2. Lower LTV economics require higher volume to matter**
$270 LTV vs. $790 means the unit economics are less forgiving. A bad trial-to-paid conversion rate at Starting Monday is recoverable. At Next Monday's LTV, a 15% conversion rate instead of 25% cuts the entire revenue projection by 40%. The platform must be sharper, faster to value, and more obviously differentiated to justify payment from a more price-sensitive audience.

**3. More competitive market**
At the director level, the competition is broader. LinkedIn Learning, Coursera, Glassdoor, Resume.io, Jobscan, and dozens of other tools already serve career management for this audience. Starting Monday has a genuine blue ocean at the C-suite level — almost nothing competes directly. Next Monday enters a red-ish ocean. Differentiation must be sharp: pipeline tracking and AI prep are meaningfully better than anything in this space, but the comparison set is more crowded.

**4. Content credibility requires thought**
Richard's authentic domain expertise is as a transformation CIO. Writing deeply credible content about director-level career strategy requires either (a) genuine experience at that level, which Richard has from earlier in his career, or (b) collaboration with directors who can validate the content. The risk is creating content that reads like a senior executive talking down to a less senior audience — which this audience detects immediately and discounts.

**5. Brand separation adds operational complexity**
Two domains, two marketing sites, two content strategies, two email lists, two LinkedIn presences, two sets of landing pages. The brand family benefit is real but it comes with overhead. In Year 3, when Starting Monday is first reaching profitability and the team is lean, managing two brands simultaneously is genuinely hard.

**6. B2B sales cycles are different and overlapping**
The same B2B sales person who is closing outplacement firms for Starting Monday may be pitching a different set of firms for Next Monday. The risk: sales effort gets diluted, neither product gets the focused relationship-building it needs. Requires either two dedicated sales motions (expensive in Year 3-4) or sequential focus (Starting Monday B2B first, Next Monday B2B second).

**7. Cannibalization at the VP boundary**
A VP of Technology earning $280K — are they a Starting Monday customer or a Next Monday customer? The product positioning can handle this, but the messaging, pricing, and persona pages need to be precise. If the boundary is blurry, each product underperforms because some of the audience lands in the wrong funnel.

---

## 7. Recommendation

**Build Next Monday. Do not start before Starting Monday Year 3 (Q2 2028).**

The case for building it is strong: the infrastructure exists, the market is large, the brand extension is natural, and the exit value impact is meaningful. This is one of the clearest adjacent opportunities in the portfolio.

The case against building it now is stronger: Starting Monday has zero paying customers today. The product-market fit is unproven. The B2B channel is theoretical. Every hour spent on Next Monday before Starting Monday reaches $200K ARR is a misallocation of the only resource that matters — founder attention.

**The right sequence:**

| Milestone | Date | Action |
|-----------|------|--------|
| Starting Monday at 50 paying customers | Q3 2026 | Add Next Monday to the product roadmap for future development. No build. |
| Starting Monday at $200K ARR | Q1 2028 | Begin brand design and architecture scoping for Next Monday. |
| Starting Monday first outplacement contract signed | Q2 2028 | Greenlight Next Monday build. Assign to engineer (hired in Q2 2028). |
| Next Monday MVP | Q4 2028 | First paying customers. |
| Next Monday at $145K ARR | Q4 2029 | Launch B2B channel with mass-market outplacement firms. |
| Combined portfolio exit evaluation | Q1 2031 | Sell Starting Monday + Next Monday together. Target: $20-28M. |

**The holding move for today:** Domain secured (nextmonday.app, purchased May 7, 2026). Put a one-sentence waitlist page up if you want to capture signal. Do nothing else until the sequence above says otherwise.

---

## 8. Technical Appendix: What Gets Built

When Next Monday is greenlit (Q2 2028), here is what the build actually entails:

### New (net new code and content)
- nextmonday.app domain and Vercel/Railway deployment
- Marketing site: homepage, persona pages (IT Director, Engineering Director, Data Director, etc.), pricing, about, blog
- New onboarding questionnaire (role type, target companies, target comp, ATS history)
- Director-specific AI system prompt and prep brief structure
- Resume ATS analysis feature (new — not in Starting Monday)
- Job board scanning addition to worker (LinkedIn Jobs, Indeed — in addition to career page scanning)
- Recruiter outreach tracker UI
- 15–20 director-specific blog posts at launch

### Forked from Starting Monday (adapted)
- Dashboard layout and navigation (re-skinned)
- Company pipeline (same schema, different stage labels)
- Contact tracking (same)
- Document uploads (same)
- Prep brief client (same UI, different AI output)
- Strategy brief (adapted prompts)
- Daily briefing (reweighted for posted roles and recruiter signals)
- Settings, profile, billing pages (adapted)

### Shared (zero duplication)
- Supabase project (separate schema/tenant, same project)
- Railway deployment infrastructure
- Claude API integration
- Stripe account (separate products/prices)
- Email delivery (Resend)
- Admin tooling

**Total engineering estimate:** 12–16 weeks with one engineer (the hire made in Q2 2028). Richard contributes product direction, content, and marketing — not code during this phase.
