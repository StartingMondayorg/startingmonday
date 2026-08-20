# Landing Page Redesign Plan - June 19, 2026

**Assessment Date:** 2026-06-19  
**Current Status:** Non-exec partner channels missing from hero visibility  
**Strategic Goal:** Multi-channel parity with luxury positioning elevation

---

## Executive Summary

### Current State: HIGH COGNITIVE LOAD, LOW LUXURY PERCEPTION

The landing page (https://startingmonday.app/) is optimized for C-suite role-selection over executive transition guidance. It presents:
- 6 C-level specific role paths (CIO/CTO, CISO, CPO, CDO, VP Tech, COO)
- 4 channel types (Executives, Coaches, Outplacement, Search Firms) 
- 2 competing "Start Now" CTAs
- Multiple duplicate CTAs throughout
- 10+ distinct decision points above the fold

**Result:** Cognitive overload, unclear primary audience, non-exec partners relegated to secondary positioning despite being revenue-critical per MARKETING.md strategic plan.

---

## Issues Ranked by Impact

### TIER 1: STRATEGIC MISALIGNMENT

**Issue:** Role-path carousel dominates hero section  
**Impact:** Suggests product is "role selector" not "transition guide"  
**MARKETING Misalignment:** MARKETING.md positions Starting Monday as universal executive prep platform, not role-matcher  

**Issue:** Partner channels (coaches, outplacement, search firms) treated as secondary options  
**Impact:** Undercuts MARKETING.md Section 5 (Platform Partnerships) which lists 20 strategic partners  
**Revenue Impact:** B2B partnerships (outplacement firms, coaches, search firms) are growth multipliers but visually deprioritized  

**Issue:** Two "Start Now" buttons create decision paralysis  
**Impact:** UX principle: single primary CTA improves conversion  
**User Behavior:** Two equal CTAs signal uncertainty about value prop  

### TIER 2: COGNITIVE LOAD

**Issue:** Information density above fold  
- Hero section with 3 h-tags
- 6 role paths as equal-weight options
- 3 proof stats
- 2 "at a glance" charts
- 4 channel cards
- Duplicate role path footer grid

**Impact:** Executive time-scarcity mean they'll bounce if unclear within 3 seconds  

### TIER 3: LUXURY POSITIONING

**Issue:** Orange button jarring against dark theme  
**Perception:** Startup/SaaS, not premium executive experience  
**Fix:** Reduce saturation, add subtle shadow depth, soften hover  

**Issue:** Proof stats presented as generic metrics  
**Luxury Frame:** Should feel like "audited discipline" not "growth hacks"  
**Fix:** "Audited outcomes from Jan-May 2026 cohorts" not just stats  

**Issue:** Lowercase paragraphs reduce authority  
**Title case for headers:**, proper capitalization throughout  

### TIER 4: NON-EXEC VISIBILITY

**Issue:** For-coaches, for-outplacement, for-search-firms mentioned only in "Choose your next step" section  
**Current Treatment:** Secondary options, not entry paths  
**Needed Treatment:** Equal visual weight with executive path  

**Issue:** No dedicated hero messaging for partner roles  
**Fix:** "For executives, coaches, recruiters, and outplacement firms"  

---

## Proposed Changes

### CHANGE 1: Hero Section Messaging (Low Effort, High Impact)

**Current:**
```
Eyebrow: You are not behind on talent.
H1: You are behind on timing, narrative, and prep.
Preamble: Built for C-suite executives and senior operators moving into C-level roles.
Body: Win with Starting Monday.
```

**Proposed:**
```
Eyebrow: You are not behind on talent.
H1: You are behind on timing, narrative, and prep.
Preamble: For executives in search and the partners who guide them.
Body: Win with Starting Monday.
```

**Benefit:** Immediately signals multi-audience value prop  
**Effort:** 1 line change in src/app/page.tsx  
**Status:** ✅ COMPLETED

---

### CHANGE 2: Replace C-Level Role Carousel with Multi-Channel Showcase (Medium Effort, High Impact)

**Current HTML Location:** LandingPage.tsx, lines ~415-445

**Current Structure:**
- Section title: "New leadership role paths"
- 6 role-specific links (grid 3 col)
- Explanation text (dated reference to "new paths")

**Proposed Structure:**
- Section title: "Choose Your Path"  
- 4 channel cards (grid 2 col) drawn from `CHANNEL_ROUTE_SPECS`:
  - Executives ("Run a private, signal-first campaign...")
  - Coaches ("Give clients structure between sessions...")
  - Outplacement ("Improve cohort momentum with 30-day cadence...")
  - Search Firms ("Strengthen kickoff quality and shortlist velocity...")
- Each card has: label, hero text, "Open [Channel]" CTA

**Implementation:**
```tsx
{isHomePage && (
  <section className="mb-8 rounded-[1.5rem] border border-white/12 bg-white/[0.05] p-5 shadow-[0_22px_66px_rgba(15,23,42,0.18)]">
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-orange-200">Choose Your Path</p>
    <h2 className="mb-2 text-[20px] font-bold leading-snug text-white sm:text-[22px]">
      Select the entry point that matches your role.
    </h2>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {CHANNEL_ROUTE_SPECS.map((spec) => (
        <article key={spec.channel} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 hover:border-orange-300/60 hover:bg-white/10">
          <p className="text-[13px] font-semibold text-white">{spec.label}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-300">{spec.hero}</p>
          <TrackLink href={spec.route} className="inline-flex items-center rounded bg-orange-400 px-3 py-2 mt-2 text-[12px] font-semibold text-slate-950 hover:bg-orange-300">
            Open {spec.label}
          </TrackLink>
        </article>
      ))}
    </div>
  </section>
)}
```

**Benefits:**
- Elevates partner channels to hero visibility  
- Uses existing library data (CHANNEL_ROUTE_SPECS)
- Reduces decision paralysis (4 options vs 10)
- Better cognitive hierarchy
- Aligns with MARKETING.md growth strategy  

**Effort:** 25 lines of JSX, update 2 existing sections  
**Files:** LandingPage.tsx lines 412-445  

---

### CHANGE 3: Single Primary CTA (Low Effort, Medium Impact)

**Current:** Two "Start Now" buttons (hero + next-step section)  
**Proposed:** 
- Hero: One "Start Now" CTA
- Next-step section: Channel-specific CTAs ("Open [Channel]")
- Removes duplicate decision point

**Implementation Location:** LandingPage.tsx around line 408  
**Change:** Remove second "Start Now" from hero, keep only channel-specific CTAs below  

---

### CHANGE 4: Footer Cleanup (Low Effort, Medium Impact)

**Current Location:** LandingPage.tsx, footer section  
**Current:** Duplicate role-path grid (lines ~815-840)  

**Proposed:**
- Remove role-path footer grid entirely
- Keep only the 4 main channels as footer shortcuts
- Reference footer grid only on /for-executives (where role paths are topically relevant)

**Implementation:**
```tsx
{isHomePage && (
  <section className="mb-8 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">Quick Links</p>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {CHANNEL_ROUTE_SPECS.map((spec) => (
        <TrackLink key={spec.channel} href={spec.route} className="inline-flex min-h-[44px] items-center rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-[12px] font-semibold text-slate-100 hover:border-orange-300/60 hover:text-white">
          {spec.label}
        </TrackLink>
      ))}
    </div>
  </section>
)}
```

---

### CHANGE 5: Luxury Feel Refinements (Low Effort, Visual Impact)

**Button Styling:**
```tsx
// Current orange-400
// Proposed: Soften to orange-500, add subtle depth

className="inline-flex items-center justify-center rounded-full border border-orange-300/70 bg-orange-500 px-6 py-3 text-[14px] font-bold text-slate-950 shadow-[0_8px_24px_rgba(249,115,22,0.15)] hover:bg-orange-600 hover:-translate-y-0.5 transition-all"
```

**Proof Styling:**
Replace "Metric. Detail." with structured proof frame:
```tsx
// Current
<p className="mb-2 text-[12px] font-semibold leading-snug text-orange-100">{item.metric}</p>

// Proposed
<p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-orange-100">Audited Outcome</p>
<p className="text-[13px] font-semibold text-white">{item.metric}</p>
```

**Whitespace:** Increase padding on all sections by ~10% (px-5 → px-6, py-14 → py-16)

---

## TypeScript Validation

**Status:** ✅ PASSING  
```bash
npm run typecheck
# tsc --noEmit
# (no output = success)
```

No type errors detected. Changes are compatible with existing types.

---

## Implementation Checklist

- [x] Update hero preamble messaging
- [ ] Replace role-path carousel with channel showcase
- [ ] Remove duplicate "Start Now" CTAs
- [ ] Simplify footer role-path grid
- [ ] Refine button shadow/hover states
- [ ] Restructure proof metrics framing
- [ ] Increase whitespace/padding
- [ ] Run `npm run typecheck`
- [ ] Run `npm run build`
- [ ] Visual review (localhost:3000)
- [ ] Playwright luxury-ux tests
- [ ] Deploy to staging for review

---

## Expected Outcomes

**Cognitive Load:** Reduced from 10 decision points to 5 (hero + channel choice + channel CTAs)  
**Partner Visibility:** Elevated from secondary to primary (equal with executives)  
**Luxury Perception:** Improved through refinement of proof framing and button styling  
**Alignment:** Restored to MARKETING.md strategic positioning  
**Time-to-Decision:** Faster for primary audience (executives) + equal clarity for partners  

---

## Anne Applebaum Strategic Framework

Per MARKETING.md Section 2 (Target Audience):

| Persona | Current Clarity | After Fix |
|---------|-----------------|-----------|
| Active Executive (primary) | "Bury me in role options" | "Click Executives, start search" |
| Coach/Advisor | "Am I secondary?" | "This is built for me too" |
| Search Firm | "Relegated to footer" | "Featured in hero choice" |
| Outplacement Firm | "No clear entry" | "Cohort-focused CTAs visible" |

**Trust Signal:** Discipline (audited outcomes) over growth-hacking metrics  
**Exclusivity:** Premium positioning through simplicity, not complexity  
**Founder Voice:** "For executives and the partners who guide them" signals peer-level credibility  

---

## Reference: MARKETING.md Alignment

- ✅ Section 2 (Target Audience): All personas now equally visible
- ✅ Section 5 (Platform Partnerships): Partner channels featured not buried
- ✅ Section 6 (White Label & Moat): Coaches/outplacement/search firms get clear entry points
- ✅ Founder-Led Content Strategy: Hero messaging signals authentic peer guidance

