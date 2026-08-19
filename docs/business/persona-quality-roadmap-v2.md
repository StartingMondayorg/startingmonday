# Starting Monday — Persona Quality Roadmap v2

**Date:** May 2026
**Status:** PQ1–PQ6 complete and deployed. This document assesses actual current state, identifies the gaps between B+ and A, and plans the sprints that close them.

---

## What Changed Since v1

PQ1–PQ6 shipped:
- Role type field (9 values) with full per-role framing in `roleTypeContext()`
- Company size field with startup/enterprise fork for CTO
- Career history verification with structured entries, acquisition annotation, and authoritative flagging in prep briefs
- Full role-specific prompt differentiation: CISO Board Communication Strategy required, COO technology language banned, CPO product insight question required, CDO data/digital distinction enforced
- Trust infrastructure: /security page, delete sensitive notes, confidentiality statement update
- Scan language fixed: no more "no job posting found" dead-ends
- Role-aware daily briefing with signal focus per role type
- VP transition framing: `transitionModeContext()` injects Transition Narrative and seniority gap objection when VP + C-suite target titles detected
- Step-Up Opportunity badge on matched roles for VP users
- Brief rating UI live

---

## Honest Current State Assessment

The roadmap v1 projected B+ average after PQ6. The projection assumed users would fill out rich profiles. The actual grade depends heavily on input quality. The structural requirements are declared in prompts — but declarations do not enforce. An AI will not always produce a Board Communication Strategy section for a CISO if the CISO's notes are sparse. A COO brief will still veer toward operational transformation language if the user has not filled out beyond_resume with explicitly operational context.

**The core problem that remains:** The platform has the right framing instructions. It does not have the right input. Role-specific prompts tell the AI how to interpret what it receives. They do not solve for what it does not receive.

---

## Grading Rubric (unchanged)

| Grade | Meaning |
|-------|---------|
| A | Meets or exceeds win condition. Executive forwards to a peer. |
| B | Clearly valuable and role-appropriate. Specific, not generic. Wins trust. |
| C | Useful but with notable gaps. Executive sees potential but finds flaws. |
| D | Generic or misframed. Executive recognizes effort but would not rely on it. |
| F | Wrong framing, wrong language, or demonstrates the platform does not understand the role. |

---

## Current Grades: Honest Assessment by Persona

### CIO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Brief specificity | B+ | ANTI_PATTERNS + SPECIFICITY_RULE + CIO roleTypeContext working. Not generic. |
| Career accuracy | B+ | Verified career entries now authoritative. Works when populated. |
| Scan language | B | Dead-end language fixed. But scan still misses unlisted, PE-backed, and search-firm roles. |
| Role framing | B+ | CIO context injected. Business outcome framing, not technical achievement. |
| Input quality dependency | C+ | With sparse notes or no career verification, brief degrades sharply. |
| Board dynamics coaching | C | Brief mentions board but does not have a structured board dynamics section. |
| Multi-stage awareness | F | Same brief for recruiter screen, CEO interview, and board presentation. |
| **Composite** | **B+** | Strong when input is rich. Falls to B or below with average input. |

**Distance to win condition:** 60%
**What win looks like:** Brief is stage-specific, names the exact board dynamic at this company, and tells the CIO something they could not have assembled in 45 minutes of their own research.

---

### CTO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Startup vs enterprise fork | B | Instruction exists. Fires when company_size is set. Most users have not set it yet. |
| CTO flavor specificity | D+ | No way to capture whether this is an infra CTO, product CTO, platform CTO, or AI/ML CTO. The prompt cannot differentiate without this. |
| Technical depth utilization | C | beyond_resume is the only mechanism for rich technical context. Most users write one paragraph. |
| Role differentiation from CIO | B | Clear separation in framing. |
| Questions to Ask quality | B | At least one architecture-specific question required. Fires when company notes are good. |
| **Composite** | **B** | Startup/enterprise fork is there. CTO flavor is not. Brief is still generic without rich technical input. |

**Distance to win condition:** 40%
**What win looks like:** Brief correctly identifies the CTO's technical flavor and produces a question that only someone who built what they built would think to ask in that room.

---

### VP of Technology

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Transition framing | B+ | Transition Narrative required. Seniority gap objection required. Both fire correctly. |
| Step-up badge | B | Visible on scan results. Useful signal. |
| Readiness assessment | F | No honest assessment of whether the VP is actually ready to step up. The product helps them prepare — it does not tell them whether the gap is credible. |
| Lateral vs step-up detection | B | transitionModeContext fires on persona + target title pattern. Works. |
| **Composite** | **B+** | Transition framing is working. Missing: honest readiness assessment and stage-specific coaching for the recruiter screen (where VPs get filtered out). |

**Distance to win condition:** 55%
**What win looks like:** Brief correctly frames the VP story as a C-suite story, and specifically addresses the recruiter screen ("how do you answer the CIO title question in the first 10 minutes").

---

### CDO (Chief Data Officer)

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Data vs digital distinction | B+ | roleTypeContext blocks digital framing. ROLE_TYPE_INSTRUCTION enforces it. |
| Mandate detection (governance vs products) | C | Instruction says to detect from company notes. Most notes do not contain this. Falls to generic data strategy framing. |
| Data platform experience capture | D | No structured field for what data platform the exec built, at what maturity level, with what stack. beyond_resume is the only vessel and most users do not provide this detail. |
| Scan coverage | D | CDO roles are often titled "Head of Data," "SVP Analytics," "Chief AI Officer," or "VP Data Science." The scan matches against career page titles. Significant miss rate. |
| **Composite** | **C+** | Framing is right. Input capture is wrong. Brief is generic for users without deep notes. |

**Distance to win condition:** 30%
**What win looks like:** Brief names what kind of data mandate this company has, frames the exec's data platform background in terms of what that company needs next, and distinguishes their profile from the AI-native candidates who will also be in the room.

---

### Chief Digital Officer

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Business transformation framing | B | Framing instruction is there. Works when background context is available. |
| Non-tech background detection | C | Instruction says to detect from positioning_summary or resume. This is inference-dependent. A McKinsey partner who writes a tech-forward positioning summary will get the wrong brief. |
| CIO/CMO power dynamic | B- | "What to Leave Out" instruction exists. Fires inconsistently depending on input quality. |
| Industry cycle context | F | No mechanism to surface which industries are in digital transformation inflection right now. The brief has no external market context beyond scan signals. |
| **Composite** | **B-** | Right framing exists but depends on correct inference from inputs the exec may not have optimized. |

**Distance to win condition:** 35%
**What win looks like:** Brief leads with business outcomes, explicitly names the internal political dynamic at this specific company, and tells the CDO what their non-traditional background enables that a pure technologist cannot match.

---

### CISO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Risk reduction framing | B+ | Required in ROLE_TYPE_INSTRUCTION. Works well. |
| Board Communication Strategy section | B | Required in roleTypeContext. Fires when the AI follows the instruction. No validation that it actually appears in the output. |
| Industry compliance injection | B | Fires from company sector. Works when sector is set correctly. |
| Auth domain and /security page | A | Complete. Passes CISO visual inspection. |
| Security framework capture | F | No structured field for what frameworks the CISO has implemented (SOC2, ISO 27001, NIST CSF, PCI-DSS, HIPAA). This is the most differentiating information a CISO brings to an interview and it is not captured. |
| NDA/confidentiality guidance | D | Inline note on company notes field. No guidance on what a CISO should NOT put in notes. This is a genuine compliance risk for the user. |
| **Composite** | **B+** | Trust infrastructure is solid. Brief framing is right. Missing: structured framework capture and NDA guidance. |

**Distance to win condition:** 65%
**What win looks like:** Brief names the specific compliance frameworks the CISO has navigated, ties that directly to what this company's regulatory environment requires, and includes a board communication strategy section that is specific to this CISO's communication style and this company's board maturity.

---

### CPO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Product philosophy framing | C+ | The instruction is there. But product philosophy cannot be inferred from a resume. Without an explicit "my product philosophy is..." input, the brief is generic. |
| B2C vs B2B detection | B | Fires from company sector. Mostly works. |
| Product insight question | B | Required and fires when company notes contain product signals. Sparse company notes produce generic questions. |
| Product background capture | D | No structured field for what product was shipped, what metric moved, what the product decision was most proud of. Product work is the worst-represented type on LinkedIn and the beyond_resume field rarely captures it at the depth needed. |
| **Composite** | **B** | The framing instructions work. The input problem is acute for CPOs because product work is the hardest to represent in free-text fields. |

**Distance to win condition:** 40%
**What win looks like:** Brief produces a specific insight about this company's product situation that the CPO had not already identified ("their mobile retention curve suggests a core loop problem, not an acquisition problem"), and the Questions to Ask section contains at least one question that could only come from someone who has shipped a similar product.

---

### COO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Operational framing | B | Technology transformation language banned. CEO partnership required. Working. |
| Mandate type capture | F | No structured field for what kind of COO mandate this exec is pursuing (scaling/turnaround/post-M&A/professionalization). The brief cannot be specific about mandate fit without this. |
| Scan relevance | D | COO roles are rarely posted. The scan still runs and returns technology leadership roles. This creates noise and implicitly signals the platform thinks like a tech job board. |
| CEO partnership framing | B- | Required in roleTypeContext. Fires. But brief quality depends on notes about the specific CEO. |
| Signal quality | B | COO signal layer added in PQ5. M&A, EBITDA, operational announcements. Working but depends on signals being available. |
| **Composite** | **B-** | The framing is right. The input problem is worst here because COO mandates are idiosyncratic and cannot be inferred from standard profile fields. |

**Distance to win condition:** 30%
**What win looks like:** Brief frames the exec's competitive advantage as the specific operational challenge they have solved before that this company is facing now. The Win Thesis names the phase (scaling through $100M-$500M inflection, post-M&A integration, PE-to-enterprise professionalization) and explicitly ties the candidate's history to that phase.

---

## Updated Grade Summary

| Persona | Composite Grade | Distance to Win |
|---------|---------------|-----------------|
| CIO | B+ | 60% |
| CTO | B | 40% |
| VP of Technology | B+ | 55% |
| CDO (data) | C+ | 30% |
| CDO (digital) | B- | 35% |
| CISO | B+ | 65% |
| CPO | B | 40% |
| COO | B- | 30% |
| **Avg** | **B** | **44%** |

**Reality check vs v1 projection:** The v1 roadmap projected B+ after PQ6. Actual composite is B. The gap is the input quality problem. The structural requirements in the prompts are correct. The product does not yet actively elicit the inputs those requirements need to produce A-grade output.

---

## What Pushes from B to A: Root Cause Analysis

Every persona's path from B to A has the same underlying cause: **the product tells the AI how to write a great brief but does not tell the user what to give it.**

The specific gaps by category:

### Gap 1: No role-specific input prompting
The profile page is identical for all 9 role types. A CISO and a CPO fill out the same fields. The CISO's most valuable input is which compliance frameworks they have navigated and what the board's security awareness looked like when they started. The CPO's most valuable input is what product they shipped and what metric moved. Neither of those fields exists.

**What an A grade requires:** The profile page shows role-type-specific guidance on what to enter in the key fields (beyond_resume, positioning_summary), and adds role-specific structured fields for the information that cannot be inferred from a LinkedIn import.

### Gap 2: No company-specific input prompting
The company notes field is a freeform textarea with the placeholder "Warm intro through Sarah, strong culture fit…" That placeholder is for a VP filling out a job application tracker. A CIO should be capturing the company's transformation agenda, the current CIO's tenure and departure reason, the board's technology appetite, and the CFO relationship dynamic. A COO should be capturing what operational phase the company is in and what the CEO's operational blindspot is. A CISO should be capturing what regulatory events have recently hit the sector and what the board's last security conversation looked like.

**What an A grade requires:** Company notes input is guided by role type, with a structured template or role-appropriate placeholder that tells the exec what intelligence to capture.

### Gap 3: No interview stage differentiation
Every prep brief is the same format regardless of whether it is for a 30-minute recruiter screen, a 90-minute CEO interview, or a board presentation. These are different events with different objectives, different audiences, and different success criteria.

- Recruiter screen: objective is to get to the CEO. Stakes are low, tempo is fast, the only goal is to not be filtered out. Different brief.
- CEO interview: the real interview. This is what the current brief is designed for.
- Board presentation: only CISO and CIO roles regularly include a board component. Requires a different document entirely.

**What an A grade requires:** The prep page includes a stage selector. Recruiter screen mode produces a shorter, faster brief focused on not getting filtered. Board presentation mode produces a presentation framework, not an interview brief.

### Gap 4: No competitive positioning
The brief tells the executive their story. It does not tell them what the room probably looks like. Who else is being considered? What do those other candidates look like? What is the decisive difference between this candidate and the most dangerous alternative?

The Win Thesis section is supposed to address this ("why they win over everyone else being considered") but it is working from inference, not from explicit competitive context.

**What an A grade requires:** A structured "Competitive Field" input where the exec captures what they know about other candidates or what the typical finalist field looks like for this type of role. This unlocks a Win Thesis that is genuinely differentiated rather than generically strong.

### Gap 5: No post-interview feedback loop
The brief is a pre-event document. After the interview, the executive has information that would make the next brief sharper: what questions surprised them, what the interviewer's reaction was to the Win Thesis framing, what came up that the brief did not prepare them for.

**What an A grade requires:** A post-interview prompt (either triggered by pipeline stage change to "Interviewing" or by user action) that captures what happened and feeds it into the next prep session.

---

## Work Breakdown Structure

### Epic PQ-7: Role-Specific Input Depth
**Goal:** The platform actively elicits the information it needs from each role type rather than relying on the user to know what matters.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-7.1 | Role-type-specific hints on `beyond_resume` field: different placeholder text and helper copy per role type | S |
| PQ-7.2 | Role-type-specific hints on `positioning_summary` field: what a CISO should write vs what a CPO should write | S |
| PQ-7.3 | Add CISO-specific structured fields: security frameworks (multi-select), board security maturity rating, NDA caution note | M |
| PQ-7.4 | Add CPO-specific structured fields: product type experience (B2C/B2B/both), biggest product shipped (text), primary metric moved (text) | M |
| PQ-7.5 | Add COO-specific structured fields: mandate type sought (multi-select: scaling/turnaround/post-M&A/professionalization), CEO partnership model preference (text) | M |
| PQ-7.6 | Add CTO-specific structured fields: technical flavor (multi-select: infra/product/platform/AI-ML), biggest architectural decision (text) | M |
| PQ-7.7 | Add CDO (data)-specific structured fields: data maturity orientation (governance-first vs products-first), data platform built (text) | S |
| PQ-7.8 | Add CDO (digital)-specific structured fields: background type (consulting/operations/marketing/tech), primary transformation delivered (text) | S |
| PQ-7.9 | DB migration: add structured fields for PQ-7.3 through PQ-7.8 | S |
| PQ-7.10 | Update `buildContext()` in prep route to include structured role-specific fields in candidate section | M |

---

### Epic PQ-8: Company Intel Depth by Role Type
**Goal:** Company notes become role-appropriate intelligence capture, not a generic text field.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-8.1 | Role-type-specific placeholder for company notes field in company detail page | S |
| PQ-8.2 | CIO company notes template: transformation agenda, current CIO tenure/departure context, CFO relationship dynamic, board technology appetite | S |
| PQ-8.3 | CISO company notes template: recent regulatory events in sector, board's last security conversation, known incidents, CISO departure reason | S |
| PQ-8.4 | COO company notes template: operational phase (scaling/turnaround/M&A integration), what the CEO cannot do alone, what broke operationally | S |
| PQ-8.5 | CPO company notes template: current product health signals, core loop problem vs acquisition problem, what product leadership change created this opening | S |
| PQ-8.6 | CDO (data) company notes template: data maturity level, governance vs analytics mandate, what business decisions are currently made without data | S |
| PQ-8.7 | "No notes yet" prompt: when company notes are empty and prep brief is generated, inject a role-type-specific suggestion for what to add before regenerating | M |
| PQ-8.8 | COO scan context fix: when role_type = coo and no scan result, replace scan section with "COO mandates are created around operational challenges, not posted roles. Add notes on the specific challenge this company is navigating." | S |

---

### Epic PQ-9: Interview Stage Differentiation
**Goal:** A recruiter screen, a CEO interview, and a board presentation are different events. The brief adapts to the stage.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-9.1 | Add interview stage selector to prep page: Recruiter Screen / First Interview / CEO Interview / Board Presentation / Final Round | S |
| PQ-9.2 | Recruiter screen mode prompt: shorter format, focused on "what to not get filtered for," what question to ask that advances to the CEO, what not to say | M |
| PQ-9.3 | Board presentation mode for CISO: structured framework for security risk presentation to a non-technical board. Output is a presentation outline, not an interview brief. | L |
| PQ-9.4 | Board presentation mode for CIO: board-level technology strategy presentation framework. Governance, risk, investment, and transformation aligned to board priorities. | L |
| PQ-9.5 | Follow-up round mode: "You are going back for round [N]. What changed from round [N-1]?" Inject prior round context and shift prep to what is still being evaluated. | M |
| PQ-9.6 | Stage-appropriate prep generation: when pipeline stage = "Interviewing," default stage selector to "CEO Interview." When stage = "Offer," surface negotiation coaching instead of prep brief. | S |
| PQ-9.7 | DB migration: add `interview_stage` field to `briefs` table for tracking which stage each brief was generated for | S |

---

### Epic PQ-10: Competitive Positioning
**Goal:** The Win Thesis is sharper when the exec knows what the room looks like.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-10.1 | Add "Competitive field" input to prep page: free-text field for "What do you know about other candidates or the typical finalist field for this type of role?" | S |
| PQ-10.2 | Inject competitive field context into `buildContext()` as a new section: "COMPETITIVE CONTEXT" | S |
| PQ-10.3 | Update Win Thesis prompt instruction: "When competitive context is provided, the Win Thesis must explicitly name what the typical alternative candidate looks like and why this candidate wins over that alternative, not just why they are qualified." | S |
| PQ-10.4 | Add "Who else is in the room" sub-section to Anticipated Pushback: the 1-2 structural advantages the other finalists have over this candidate, and the specific counter | M |
| PQ-10.5 | Post-interview debrief prompt: when pipeline stage changes to "Interviewing," surface a prompt — "How did it go? What surprised you? What came up that the brief did not prepare you for?" — and capture response as a company note | M |
| PQ-10.6 | Use post-interview debrief in subsequent brief generation: inject captured debrief as "PRIOR ROUND CONTEXT" section | S |

---

### Epic PQ-11: Output Validation and Feedback Loop
**Goal:** Close the loop between brief quality ratings and what gets fixed.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-11.1 | When brief is rated negatively (rating = -1), trigger follow-up prompt: "What was missing or wrong?" Capture response and store with brief. | M |
| PQ-11.2 | Surface negative-rating reasons in an internal quality dashboard (admin only): count of negative ratings, which sections were cited, which role types have the highest negative rate | M |
| PQ-11.3 | Missing-input detector: before brief generation, check if key fields are empty for this role type. CISO with no company sector: warn "Add sector for compliance framework injection." COO with no company notes: warn "Add operational context for a useful brief." | M |
| PQ-11.4 | Brief completeness indicator: after generation, check if required sections are present (CISO must have Board Communication Strategy, COO must not have "digital transformation" as a phrase). Flag to user if detected missing. | L |
| PQ-11.5 | A/B prompt quality tracking: store prompt version hash with each brief so rating data can be attributed to specific prompt versions | S |

---

## Sprint Plan

All sprints are 2 weeks. These are PQ (Product Quality) sprints.

| Sprint | Epics | Focus | Key Deliverables |
|--------|-------|-------|-----------------|
| **PQ7** | PQ-7 | Role-specific input depth | Role-aware profile prompts, CISO/CPO/COO/CTO/CDO structured fields, profile page updated, prep brief updated |
| **PQ8** | PQ-8 | Company intel depth | Role-aware notes templates, COO scan fix, "no notes" warning |
| **PQ9** | PQ-9 | Interview stage differentiation | Stage selector, recruiter screen mode, board presentation mode for CISO and CIO |
| **PQ10** | PQ-10 | Competitive positioning | Competitive field input, Win Thesis sharpened, post-interview debrief |
| **PQ11** | PQ-11 | Feedback loop | Negative rating follow-up, missing input detector, completeness check |

---

### Sprint PQ7 Detail: Role-Specific Input Depth

**Sprint goal:** Stop relying on inference. Collect the information each role type actually needs.

**Tasks (2 weeks):**

1. DB migration: add columns for role-specific structured fields
   - `security_frameworks` (text[] — CISO)
   - `board_security_maturity` (text — CISO)
   - `product_type_exp` (text — CPO: b2c/b2b/both)
   - `product_achievement` (text — CPO)
   - `product_metric` (text — CPO)
   - `coo_mandate_types` (text[] — COO: scaling/turnaround/post_ma/professionalization)
   - `cto_technical_flavor` (text[] — CTO: infra/product/platform/ai_ml)
   - `cto_architecture_decision` (text — CTO)
   - `data_maturity_orientation` (text — CDO data: governance/products)
   - `data_platform_built` (text — CDO data)
   - `digital_background_type` (text — CDO digital: consulting/operations/marketing/tech)
   - `digital_transformation_delivered` (text — CDO digital)

2. Profile page: show role-specific fields conditionally based on selected role_type
   - CISO fields visible only when role_type = ciso
   - CPO fields visible only when role_type = cpo
   - (etc.)

3. Profile page: update beyond_resume placeholder text based on role_type
   - CISO: "What frameworks have you implemented? What was the board's security awareness when you started vs when you left? What breach or regulatory event shaped your approach?"
   - CPO: "What is your product philosophy? What product are you most proud of and why? What metric did you move? What product bet was wrong and what did you learn?"
   - COO: "What is your model for the CEO-COO relationship? What operational phase have you navigated that no one sees in your title? What broke and how did you fix it?"
   - CTO: "What did you actually build? What is the architectural decision you are most proud of? What technical debt did you inherit and what did you do with it?"
   - COO: same operational depth
   - CDO (data): "What was the data maturity of the organization when you joined? What business decision changed because of what you built? What does your data platform actually look like?"
   - CDO (digital): "What is your background and what does it give you that a pure technologist does not have? What business transformation did you drive? What did the customer experience look like before and after?"

4. Update `buildContext()` in prep route to include structured role-specific fields when present

5. Update profile page `actions.ts` to save new fields

**Definition of done:**
- CISO sees a security frameworks multi-select and board maturity field on their profile
- CPO sees product achievement fields
- COO sees mandate type selector and CEO partnership note field
- CTO sees technical flavor multi-select
- CDO fields visible for data and digital types
- Structured fields appear in prep brief context
- TypeScript clean, committed, deployed

---

### Sprint PQ8 Detail: Company Intel Depth

**Sprint goal:** Company notes become the right intelligence capture tool for each role type, not a blank text box.

**Tasks (2 weeks):**

1. Company detail page: make notes placeholder role-type-aware
   - Read user's `role_type` from session/profile
   - Show appropriate placeholder when notes are empty:
   - CIO: "Transformation agenda, current CIO tenure and departure context, CFO relationship dynamic, board's technology appetite..."
   - CISO: "Recent regulatory events in their sector, board's last security conversation, known incidents, why the CISO role opened..."
   - COO: "What operational phase are they in? What can the CEO not do alone right now? What broke operationally in the last 12 months?"
   - CPO: "Current product health, is this an engagement problem or an acquisition problem, what created this CPO opening..."
   - CDO (data): "Current data maturity, governance vs analytics mandate, what business decisions are made without data today..."

2. "No notes" warning before brief generation:
   - When company notes are empty and user clicks "Generate prep brief," show an inline warning: "Your brief will be stronger with company context. [Role-specific prompt for what to add.] Continue anyway?"
   - This is not a blocker. It is an invitation.

3. COO scan context fix:
   - In `buildContext()`, when `role_type = 'coo'` and no scan result exists, replace the scan section with: "COO mandates are created around specific operational challenges, not posted roles. Add notes describing the operational situation this company is navigating to generate a mandate-specific brief."
   - This removes the confusing "no scan on file" message for COO users

4. Improve "no notes" company scan section for all role types:
   - Current fallback is generic intelligence framing
   - Make it role-type-specific: CISO fallback emphasizes what to add about regulatory context; CPO fallback asks about product situation

**Definition of done:**
- CIO user sees CIO-appropriate placeholder in company notes
- "No notes" warning fires before prep generation when notes are empty
- COO user sees mandate inference framing instead of scan fallback
- TypeScript clean, committed, deployed

---

### Sprint PQ9 Detail: Interview Stage Differentiation

**Sprint goal:** The brief is calibrated to the actual conversation it is preparing for.

**Tasks (2 weeks):**

1. Add interview stage selector to prep page (above "Generate prep brief" button):
   - Options: Recruiter Screen / First Interview / Executive Interview / Board Presentation / Final Round
   - Default: "First Interview"
   - Stored client-side for this session; passed as query param to API

2. Update prep API (`/api/prep/[id]/route.ts`) to accept `interview_stage` query param

3. Recruiter screen mode:
   - Shorter brief format (Bottom Line + 3 sections maximum)
   - Goal: survive the filter. Do not get cut.
   - Specific instruction: "The recruiter's job is to qualify or disqualify. Three things get you disqualified: compensation mismatch, title level mismatch, location mismatch. Address these proactively. The recruiter brief is about getting to the CEO, not about winning the role."
   - Add: "What to say when asked about compensation before you are ready to answer"
   - Add: "What to say when asked why you left your last role"

4. Board presentation mode (CISO):
   - Full output format change: not an interview brief, a presentation outline
   - Sections: Risk Narrative for Board / Current State Assessment / 90-Day Priorities / What We Cannot Prevent vs What We Will / Ask (budget/headcount/authority) / Q&A Anticipation
   - This is a genuine deliverable for a CISO board interview, not a coaching document

5. Board presentation mode (CIO):
   - Sections: Technology Strategy Alignment / Current State vs Target State / Investment Priorities / Risk and Governance / Board-Level Questions and Answers
   - Calibrated to board-level language (investment, risk, governance — not project names or technical details)

6. Final round mode:
   - Assume prior rounds have established competence. This round is about fit and conviction.
   - Sections: What They Learned About You / What You Need to Demonstrate Now / How to Close / Reference Check Preparation

**Definition of done:**
- Stage selector visible on prep page
- Recruiter screen mode generates a brief that is clearly different from the CEO interview brief
- Board presentation mode for CISO generates a presentation outline, not an interview brief
- Board presentation mode for CIO is distinct from CISO
- TypeScript clean, committed, deployed

---

### Sprint PQ10 Detail: Competitive Positioning

**Sprint goal:** The Win Thesis names what the exec wins over, not just what they are good at.

**Tasks (2 weeks):**

1. Add "Competitive context" input field to prep page:
   - Label: "Who else is in the room?"
   - Placeholder: "What do you know about other candidates or the typical finalist profile for this type of role? (Optional — improves the Win Thesis)"
   - Stored as session state, passed to API as query param or request body

2. Inject competitive context into `buildContext()`:
   - New section: "COMPETITIVE CONTEXT"
   - Used to sharpen Win Thesis and Anticipated Pushback

3. Update Win Thesis prompt instruction in the brief template:
   - Current: "One paragraph. Written as a conviction, not a summary."
   - Add: "When competitive context is provided, name the profile of the most dangerous alternative candidate and explain why this candidate wins over that alternative specifically. What does the alternative have that this candidate does not? What does this candidate have that the alternative cannot match?"

4. Add "Competitive field analysis" to Anticipated Pushback section instruction:
   - "If competitive context is available, the first pushback item must be: the one structural advantage the alternative candidate has over this one (e.g., incumbent, bigger brand name, deeper industry experience) and the specific counter."

5. Post-interview debrief prompt:
   - When a brief is generated and the company is in "Interviewing" stage, show a prompt after the brief: "Used this brief? Tell us how it went. What surprised you?"
   - Capture as a company note with label "Post-interview debrief"
   - Displayed in the company detail page notes section

6. Inject prior debrief into subsequent brief generation:
   - When `company.notes` contains a post-interview debrief entry, inject as "PRIOR ROUND CONTEXT" in `buildContext()`

**Definition of done:**
- Competitive context field appears on prep page
- Win Thesis with competitive context is clearly different from one without
- Post-interview debrief prompt appears when company is in Interviewing stage
- Prior debrief context appears in subsequent brief generation
- TypeScript clean, committed, deployed

---

### Sprint PQ11 Detail: Feedback Loop and Output Validation

**Sprint goal:** The product closes the loop between what it produces and whether it worked.

**Tasks (2 weeks):**

1. Negative rating follow-up:
   - When `BriefRating` is clicked "No," show a follow-up: "What was wrong? (optional)" with quick-select options:
     - "Career history was wrong"
     - "Company framing was off"
     - "Too generic"
     - "Wrong tone for this role"
     - "Sections were missing"
   - Store selection with brief record

2. Missing input detector (pre-generation):
   - Before brief generation, run role-type-specific completeness check:
     - CISO: is `sector` set? (needed for compliance injection). If not: "Add company sector for compliance framework injection."
     - COO: are company notes non-empty? If not: "COO briefs require operational context. Add company notes."
     - CPO: does positioning_summary or beyond_resume mention a specific product or metric? If not: "Add your biggest product achievement in your profile for a better brief."
     - CDO: does company notes mention data maturity or mandate type? If not: suggest.
   - Display as dismissible inline warnings, not blockers

3. Brief completeness check (post-generation, client-side):
   - After brief renders, scan the text:
     - CISO: check for "Board Communication Strategy" heading presence
     - COO: scan for "digital transformation" or "technology modernization" (should not appear in Win Thesis)
     - VP Technology step-up: check for "Transition Narrative" heading
   - If required section is missing or forbidden phrase detected: show a subtle inline note: "This brief may be missing a required section. Regenerate for a stronger output."
   - This is informational, not blocking

4. Quality dashboard (admin):
   - `/dashboard/admin/quality` page
   - Shows: brief ratings by role type, most common negative feedback categories, role types with lowest average rating
   - Used to identify which personas are underperforming and prioritize prompt improvements

**Definition of done:**
- Negative rating follow-up appears when "No" is clicked
- Missing input warnings appear before generation for key role types
- Post-generation completeness check fires for CISO and COO
- Admin quality dashboard shows ratings by role type
- TypeScript clean, committed, deployed

---

## Projected Grade Improvement by Sprint

| Persona | Now (post PQ6) | After PQ7 | After PQ8 | After PQ9 | After PQ10 | After PQ11 |
|---------|---------------|-----------|-----------|-----------|------------|------------|
| CIO | B+ | A- | A- | A | A | A |
| CTO | B | B+ | B+ | A- | A- | A- |
| VP of Technology | B+ | A- | A- | A | A | A |
| CDO (data) | C+ | B | B+ | B+ | A- | A- |
| CDO (digital) | B- | B | B+ | B+ | A- | A- |
| CISO | B+ | A- | A- | A | A | A |
| CPO | B | B+ | A- | A- | A | A |
| COO | B- | B | B+ | B+ | A- | A- |
| **Avg** | **B** | **B+** | **A-** | **A-** | **A** | **A** |

---

## Post-Sprint Acceptance Criteria by Persona

### CIO — A grade reached when:
- [ ] Brief includes a board dynamics section specific to this company's board (governance appetite, how much the board involves itself in technology decisions)
- [ ] Stage-specific brief: recruiter screen brief is clearly different from CEO interview brief
- [ ] Win Thesis names the specific transformation phase this company is in and why this CIO has already navigated it
- [ ] Anticipated Pushback includes the CFO relationship objection with a specific, non-generic counter
- [ ] No "no job posting" dead-end language in any form

### CTO — A grade reached when:
- [ ] Brief identifies which technical flavor this CTO is (infra/product/platform/AI-ML) from structured input
- [ ] Startup CTOs receive briefs with no enterprise IT governance language
- [ ] Questions to Ask include a technically specific question about this company's actual architecture situation
- [ ] CTO and CIO briefs are clearly distinguishable at the first paragraph by a reader who does not know the role type

### VP of Technology — A grade reached when:
- [ ] Recruiter screen brief addresses the title mismatch objection in the first 10 minutes
- [ ] Transition Narrative is specific to the VP's actual scope, not a generic step-up arc
- [ ] "Not yet CIO/CTO" objection is first in Anticipated Pushback with a counter that uses a specific outcome from the VP's career
- [ ] Step-Up Opportunity badges visible on relevant company scan results

### CDO (data) — A grade reached when:
- [ ] Brief correctly identifies whether this is a governance mandate or a products mandate for this specific company
- [ ] Win Thesis frames the exec's data background in terms of what this company needs in data capability now
- [ ] Brief distinguishes this candidate from AI-native candidates who will also be in the room
- [ ] No Chief Digital Officer language appears anywhere

### Chief Digital Officer — A grade reached when:
- [ ] Brief leads with business transformation framing for executives with non-tech backgrounds
- [ ] "What to Leave Out" includes the specific CIO/CMO power dynamic at this company
- [ ] Win Thesis frames the non-technical background as the decisive competitive advantage, not a gap to explain

### CISO — A grade reached when:
- [ ] Win Thesis is written entirely in risk reduction terms with no technical achievement language
- [ ] Board Communication Strategy section appears in every CISO brief
- [ ] Brief names the relevant compliance framework for this company's sector (SOX, HIPAA, or product security)
- [ ] /security page passes a CISO's professional-level scrutiny (it currently does)
- [ ] Missing input warning fires if company sector is not set (needed for compliance injection)

### CPO — A grade reached when:
- [ ] Brief produces at least one insight about this company's product situation the CPO had not already identified
- [ ] Questions to Ask includes at least one product-specific observation question, not a generic executive question
- [ ] B2C briefs and B2B briefs are clearly distinguishable in the Questions to Ask section
- [ ] Post-interview debrief informs the second brief for second-round interviews

### COO — A grade reached when:
- [ ] Win Thesis names the specific operational phase this company is in and ties the candidate's history to that phase
- [ ] Win Thesis contains no technology transformation language
- [ ] COO scan section is replaced with mandate inference language when no scan result exists
- [ ] Questions to Ask are operational and CEO-partnership focused — zero technology governance questions

---

## Sprint Calendar

These PQ sprints run concurrent with DEV and BIZ sprints.

| Sprint | Suggested Timing | External Announcement |
|--------|-----------------|----------------------|
| PQ7 | B7 (Jun 2026) | Soft: "Improved role-specific profile guidance" |
| PQ8 | B8 (Jun 2026) | Soft: "Smarter company intelligence prompts" |
| PQ9 | B9 (Jul 2026) | Yes: "Stage-specific prep briefs — recruiter screen through board presentation" |
| PQ10 | B10 (Jul 2026) | Yes: "Competitive positioning and post-interview debrief" |
| PQ11 | B11 (Aug 2026) | Internal quality improvement |

By end of B11, platform average reaches A. This is the quality threshold for:
- B2B pitch to executive coaches and search firms ("here is what you could offer clients")
- Mark Horstman / Manager Tools partnership conversation
- Premium tier launch with concierge positioning

---

## A Note on the Gap Between B and A

The distance from D+ to B was a framing problem. The AI was writing CIO briefs for CISOs. That is fixed.

The distance from B to A is an input problem. The AI writes a great brief when it has what it needs. It does not have what it needs often enough.

PQ7-PQ11 solve the input problem. Not by making the profile longer but by making the profile smarter: collecting the specific information each role type needs, in the place it is most likely to be provided, at the moment it is most likely to matter.

An A-grade brief is not better AI. It is better context. The platform's job is to collect that context without making the user feel like they are filling out a form.
