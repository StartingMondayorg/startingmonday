# Starting Monday — Persona Win Gap Analysis & Quality Roadmap

**Date:** May 2026
**Purpose:** Grade current product against each persona's win condition. Identify gaps. Build the sprint plan to close them.

---

## Grading Rubric

| Grade | Meaning |
|-------|---------|
| A | Meets or exceeds win condition. Executive forwards to a peer. |
| B | Clearly valuable and role-appropriate. Specific, not generic. Wins trust. |
| C | Useful but with notable gaps. Executive sees potential but finds flaws. |
| D | Generic or misframed. Executive recognizes effort but would not rely on it. |
| F | Wrong framing, wrong language, or demonstrates the platform does not understand the role. |

Grades are assigned per dimension, then a composite letter grade is given.

---

## Current State: Grades by Persona

### What exists in the product right now

Before grading, here is what the platform actually does today:

**Working:**
- ANTI_PATTERNS block (no corporate speak, no AI-voice phrases)
- QUALITY_BAR instruction (forces senior-level output standard)
- SPECIFICITY_RULE (every sentence must be specific to this person)
- BLUF_RULE (most important finding leads every section)
- PERSONA_CALIBRATION for C-Suite, VP/SVP, and Board (3 generic tiers)
- `beyond_resume` and `positioning_summary` fields give the AI qualitative context
- Scan results, signals, and contacts all fed into prep brief context
- Token limit raised to 8000 (all 11 sections complete)
- Custom auth domain live (auth.startingmonday.app)
- Job posting URL input added to prep page

**Missing:**
- No role-type field — CIO, CTO, CDO, CISO, CPO, and COO are treated identically at the C-suite tier
- No company size field — CTO startup vs enterprise context unknown
- No career history verification step after LinkedIn import
- No CISO board communication section in brief
- No CPO product-specific framing or B2C vs B2B detection
- No COO operational framing — system prompt uses technology transformation language throughout
- No CDO data vs digital distinction
- No VP-to-CIO transition mode
- No /security or /trust page
- "No job posting found" language not yet changed in prep prompt
- No role-specific signal types in daily briefing

---

### Grades by Persona

#### CIO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Brief specificity | C+ | ANTI_PATTERNS + SPECIFICITY_RULE are working. Brief is not generic. But no CIO-specific framing beyond "C-suite." |
| Career history accuracy | D | LinkedIn import has no verification step. Acquisitions, reorgs, and title inflation produce errors. Any error destroys trust. |
| "No job posting" language | C | Backend now accepts URL input. Language in the Situation section still says "there is no job posting" — a dead end, not intelligence. |
| Confidentiality clarity | C- | Trust statement exists ("Your search stays invisible") but lacks technical specificity for an audience that scrutinizes these claims. |
| Win thesis specificity | B- | When career data is accurate and company notes are rich, win thesis is genuinely good. |
| **Composite** | **C+** | Close to useful for well-prepared users. Fails on first use when career import is wrong. |

**Distance to win condition:** 45%
Win condition: Brief is specific enough that the exec forwards it to a peer.

---

#### CTO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Role differentiation from CIO | D | Same brief template. Uses transformation and business-IT alignment language. A technical visionary would find this misframed. |
| Startup vs enterprise context | F | No company size or stage field. Startup CTO receives same enterprise-context brief as Fortune 500 CTO. |
| Technical depth utilization | D | LinkedIn only captures title. No mechanism to capture what the CTO actually built. Brief defaults to title-level inference. |
| **Composite** | **D** | Marginally useful for enterprise CTOs. Wrong framing for startup CTOs. Would be dismissed by the most technically rigorous users. |

**Distance to win condition:** 20%
Win condition: Brief identifies which flavor of CTO they are and surfaces a question that only their background would produce.

---

#### VP of Technology

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Step-up transition framing | D | PERSONA_CALIBRATION has one line on "readiness-to-step-up narrative." Not specific to "I have not been a CIO yet." |
| "Not yet CIO" objection anticipation | D | May surface generically. No structured transition arc ("from operator to strategist in four sentences"). |
| Positioning for C-suite vs. lateral | C- | Useful for lateral moves. Weak for step-up positioning. |
| **Composite** | **D+** | Functional for lateral moves. Misses the core use case: VP trying to step to CIO. |

**Distance to win condition:** 30%
Win condition: Anticipated Pushback names "no CIO title" and gives a specific, credible counter. Narrative arc from VP to C-suite ready.

---

#### CDO (Chief Data Officer)

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Data vs digital distinction | F | No role-type field exists. CDO data and CDO digital receive identical briefs. |
| Data strategy framing | D | Brief defaults to general "C-suite transformation" language. No data governance, analytics, or data-as-product framing. |
| Role definition variability | F | No mechanism to capture what "CDO" means at a specific company. |
| **Composite** | **F** | Would immediately be identified as wrong by a Chief Data Officer. |

**Distance to win condition:** 10%
Win condition: Brief demonstrates specific understanding of data strategy vs digital transformation, frames background in terms of this company's data mandate.

---

#### Chief Digital Officer (CDO)

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Business vs technology framing | F | No role-type field. Brief uses technology transformation language for an executive whose competitive advantage is often business-led. |
| Non-traditional background handling | F | A former McKinsey partner or CMO gets a CIO-style brief. |
| Industry cycle context | F | No industry-specific transformation context in briefing or prep. |
| Political dynamics in "What to Leave Out" | D | Generic. Does not address CIO/CMO power dynamics specific to CDO mandates. |
| **Composite** | **F** | Wrong framing. Would cause misframing of candidacy in an interview. |

**Distance to win condition:** 10%
Win condition: Brief identifies whether this company wants a business transformation leader or a digital technologist, frames background accordingly.

---

#### CISO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Auth flow trust | B | Custom domain live. Passes visual inspection. |
| Security architecture transparency | F | No /security page. No encryption statement. No access controls documentation. CISO will ask and find nothing. |
| Board communication section | F | No CISO-specific brief section. Board-level risk communication is a required interview component for this persona. |
| Industry compliance framing | F | No detection of FS vs healthcare vs tech CISO context. All CISO briefs are identical. |
| Risk reduction framing | D | Brief uses general "C-suite achievement" framing. CISO win condition is risk reduction narrative, not technical achievement. |
| Data deletion UI | F | No delete functionality for sensitive notes. |
| **Composite** | **D-** | The trust infrastructure problems block this persona before they even use the product. |

**Distance to win condition:** 15%
Win condition: Brief frames exec background in risk reduction terms; includes board communication strategy; passes CISO security scrutiny.

---

#### CPO (Chief Product Officer)

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Product philosophy framing | D | Brief uses executive leadership and transformation language. A CPO evaluating this will identify it as CIO framing with product words substituted. |
| B2C vs B2B detection | F | No detection. A B2B CPO gets the same brief as a B2C CPO. Interview dynamics are different. |
| Product-specific "Questions to Ask" | D | Questions are executive-level strategic. Not the product-specific insight questions that differentiate a CPO. |
| Product signals in briefing | F | Briefing is optimized for org-change signals. No app store, competitor feature, or product review signals. |
| **Composite** | **D** | Product executives will evaluate this as a product and find it lacking. |

**Distance to win condition:** 15%
Win condition: Brief produces a specific insight about the company's product situation that the CPO had not already identified. "How did it know that?"

---

#### COO

| Dimension | Grade | Reason |
|-----------|-------|--------|
| Operational vs tech framing | F | Every prompt and system instruction uses technology transformation language. A COO brief will read like a CIO brief. |
| CEO partnership emphasis | F | Not addressed in any prompt. |
| Scan relevance | D | Scan finds posted roles. COO roles are rarely posted. Value of scan is low; this is not acknowledged anywhere. |
| Operational signal quality | F | Daily briefing is optimized for technology org signals. |
| **Composite** | **F** | The most underserved persona on the platform. Would conclude the platform does not understand their role. |

**Distance to win condition:** 5%
Win condition: Brief frames competitive advantage as operational execution and CEO partnership, not technology. Operational mandate framing throughout.

---

### Summary Grade Table

| Persona | Composite Grade | Distance to Win |
|---------|---------------|-----------------|
| CIO | C+ | 45% |
| CTO | D | 20% |
| VP of Technology | D+ | 30% |
| CDO (data) | F | 10% |
| CDO (digital) | F | 10% |
| CISO | D- | 15% |
| CPO | D | 15% |
| COO | F | 5% |

**Platform average: D+**

The platform is defensible for the CIO use case when the user provides rich profile data. Every other persona is underserved to failing.

---

## Gap Analysis: What's Missing by Cross-Cutting Priority

### Priority 1 — Career history accuracy (affects all personas)

**Root cause:** LinkedIn import extracts raw text via AI and produces `resume_text` and `positioning_summary` with no verification step. Acquisitions, reorgs, and title inflation produce inferences that contradict lived experience.

**What needs to exist:**
- Structured career entry extraction (company, title, dates, key outcome) returned alongside raw text
- Post-import verification step: show structured entries in an editable table
- Acquisition annotation field: "This company was acquired by X in Y — I was at the acquiring company / the acquired entity"
- Verified history stored as `career_history_json` in DB
- Prep brief context updated to use verified entries when available, clearly flagged as "verified"

**Current state in code:** `linkedin-import/route.ts` returns a flat `resume_text` string. No structured entries. No verification UI. `buildContext()` in prep route passes raw resume text directly to Claude.

---

### Priority 2 — Role-specific AI differentiation (CDO, CISO, CPO, COO most acute)

**Root cause:** `search_persona` field stores only `csuite`, `vp`, or `board`. No role-type field. `personaContext()` returns a single label. `PERSONA_CALIBRATION` has 3 paragraphs covering 3 tiers.

**What needs to exist:**
- `role_type` field on `user_profiles`: cio, cto, cdo_data, cdo_digital, ciso, cpo, coo, vp_technology, other_csuite
- Role type selector on Profile page
- `roleTypeContext()` function returning specific guidance per role type:
  - CIO: transformation mandate, enterprise risk, board reporting line, vendor portfolio
  - CTO: startup vs enterprise fork (based on company size), technical architecture, product adjacency
  - CDO (data): data governance, analytics products, data-as-revenue, Chief AI Officer adjacency
  - CDO (digital): business transformation, P&L ownership, non-tech background handling, political dynamics
  - CISO: risk reduction framing, board communication required section, industry compliance detection
  - CPO: product philosophy, B2C vs B2B fork, taste and judgment framing, product insight questions
  - COO: operational execution, CEO partnership, no technology transformation language allowed
  - VP Technology: step-up mode, transition arc, "not yet C-suite" objection counter

---

### Priority 3 — "No job posting found" language

**Root cause:** When the scan returns no results and no URL was provided, prep brief Situation section says "there is no job posting." This is a dead end, not intelligence.

**What needs to exist:**
- Replace with: "No public posting found. This role may be unlisted or filled through retained search. Here is what we know about the likely mandate based on org signals, sector context, and notes."
- When company notes exist, use them to infer likely mandate even without a posting
- When URL was provided but fetch failed, say: "The posting URL was checked but could not be retrieved. Based on org signals..."

**Current state in code:** `buildScanSection()` in `prep-context.ts` needs to be read. The scan section language needs to change.

---

### Priority 4 — CISO security architecture transparency

**Root cause:** No /security page exists. No encryption statement. No access controls documentation. No delete functionality for sensitive notes. The CISO will ask and find nothing.

**What needs to exist:**
- /security page (or /trust page): Supabase database with encryption at rest and TLS in transit, accessed only by authenticated user, no third-party data sharing, deletion available
- "Delete all sensitive notes" button on profile or settings
- Inline note: "Your notes are private. Only you can access them. Delete at any time."
- Link to /security from footer and profile

---

### Priority 5 — Confidentiality architecture clarity

**Root cause:** "Your search stays invisible" is correct but insufficient for technically sophisticated users who want to know what is actually stored and where.

**What needs to exist:**
- One paragraph of technical specificity on the landing page or in the privacy statement: what data model, what access controls, what third parties (none), deletion
- CISO-readable: not just "we don't share" but "your data is isolated in an encrypted row-level-security database under your user ID"

---

### Priority 6 — COO and CPO brief differentiation

**Root cause:** The `PREP_SYSTEM` prompt uses exclusively technology-context language. COO and CPO are not technology executives. The framing is structurally wrong for both.

**What needs to exist:**
- COO: a role-type-specific instruction that explicitly prohibits technology transformation framing and substitutes operational execution framing
- CPO: a role-type-specific instruction that frames the brief around product philosophy and market insight, not technology leadership
- Both need different "Questions to Ask" logic — operational and product questions, not governance questions

---

## Work Breakdown Structure

### Epic PQ-1: Role Type Foundation
**Goal:** Give the AI enough context to know which kind of executive it is writing for.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-1.1 | DB migration: add `role_type` column to `user_profiles` | S |
| PQ-1.2 | Add `company_size` column to `companies` table (Startup <200, Mid-Market 200-2000, Enterprise 2000+) | S |
| PQ-1.3 | Profile page: add role type selector with 9 options | M |
| PQ-1.4 | Add company page: add company size selector | S |
| PQ-1.5 | Create `roleTypeContext()` function in prompts.ts with per-role guidance | M |
| PQ-1.6 | Update `personaContext()` to include role type label | S |
| PQ-1.7 | Update `buildContext()` in prep route to pass role type and company size | S |
| PQ-1.8 | Update `PREP_SYSTEM` with role-type framing instruction | S |

---

### Epic PQ-2: Career History Verification
**Goal:** Eliminate career history inaccuracy as the primary trust-killer.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-2.1 | DB migration: add `career_history_json` JSONB column to `user_profiles` | S |
| PQ-2.2 | Update `linkedin-import/route.ts` to return structured `career_entries` array alongside existing fields | M |
| PQ-2.3 | Career entry schema: {company, title, start_date, end_date, key_outcome, acquisition_note, verified} | S |
| PQ-2.4 | Create post-import verification UI: editable table of career entries with inline edit | L |
| PQ-2.5 | Add acquisition annotation field: "This company was acquired by [company] in [year]" | S |
| PQ-2.6 | Save verified entries to `career_history_json` on profile save | S |
| PQ-2.7 | Update `buildContext()` to use verified career history when available, prefixing with "[Verified]" | M |
| PQ-2.8 | Add "Review your career history" prompt in post-import flow | S |

---

### Epic PQ-3: Role-Specific Prep Brief Differentiation
**Goal:** Each role type receives a brief that reads like a different expert produced it.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-3.1 | CIO role context: transformation mandate, board reporting, enterprise risk, vendor portfolio | S |
| PQ-3.2 | CTO role context: startup vs enterprise fork using company_size, architecture ownership, product adjacency | M |
| PQ-3.3 | CDO (data) role context: data products, governance, analytics, Chief AI adjacency | S |
| PQ-3.4 | CDO (digital) role context: business transformation frame, P&L ownership, non-tech background, political dynamics | S |
| PQ-3.5 | CISO role context: risk reduction (not technical achievement), board communication required section, industry compliance detection from company sector | M |
| PQ-3.6 | CPO role context: product philosophy, B2C vs B2B detection from company sector, taste/judgment framing, product-specific questions | M |
| PQ-3.7 | COO role context: operational execution, CEO partnership, explicit instruction — no technology transformation language | M |
| PQ-3.8 | VP Technology context: transition arc mode when targeting C-suite, "not yet [C-suite title]" objection counter | M |
| PQ-3.9 | Update prep brief prompt injection to include full roleTypeContext() output | S |
| PQ-3.10 | Update Questions to Ask route (/api/prep/[id]/questions) with role-type-specific question framing | M |

---

### Epic PQ-4: Trust Infrastructure
**Goal:** Pass the CISO scrutiny test. Address confidentiality concerns with technical specificity.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-4.1 | Create /security page: data storage, encryption (Supabase at rest + TLS), RLS, access controls, deletion | M |
| PQ-4.2 | Add "Delete my notes" button on profile or settings page (clears positioning_summary, beyond_resume, company notes) | M |
| PQ-4.3 | Add inline note proximate to company notes field: "Your notes are private. Only you can read them. Delete any time." | S |
| PQ-4.4 | Update landing page confidentiality statement with one paragraph of technical specificity | S |
| PQ-4.5 | Add /security link to footer and profile page | S |
| PQ-4.6 | Fix "no job posting found" language in `buildScanSection()` — replace with intelligence framing | M |

---

### Epic PQ-5: Signal & Intelligence Differentiation
**Goal:** The daily briefing surfaces what matters for each role type, not just technology org signals.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-5.1 | Add role-type-aware signal categories to briefing-job.js: security news for CISO, product news for CPO, operational news for COO | M |
| PQ-5.2 | CISO briefing signals: breach news, regulatory changes, SEC cyber rules, compliance deadlines | M |
| PQ-5.3 | CPO briefing signals: competitor product launches, app store movement, NPS/review trends, product announcement news | M |
| PQ-5.4 | COO briefing signals: M&A integration news, EBITDA/revenue signals, operational announcements (locations, supply chain), executive hiring in ops functions | M |
| PQ-5.5 | CTO company size context: if startup target and CTO role type, inject startup-specific framing into prep brief (replace enterprise-IT language with product-velocity, technical architecture, scaling language) | M |
| PQ-5.6 | CISO industry compliance injection: detect company sector, add compliance framework context to prep brief (FS: SOX/FFIEC; Healthcare: HIPAA; Tech: product security/SDLC) | M |

---

### Epic PQ-6: VP Transition Framing + Quality Review
**Goal:** VP-to-CIO step-up is a first-class use case. Brief quality reviewed and graded against win conditions.

| Story | Description | Effort |
|-------|-------------|--------|
| PQ-6.1 | Detect transition mode: if search_persona = 'vp' and target_titles contains a C-suite title, set transition_mode context flag | S |
| PQ-6.2 | Transition framing in prep brief: inject "Transition Narrative" section — four-sentence arc from VP background to C-suite readiness | M |
| PQ-6.3 | Transition objection counter: "Anticipated Pushback" section must include "not yet [title]" objection with specific counter when transition_mode is active | M |
| PQ-6.4 | Flag step-up opportunities: if scan returns C-suite role and user is VP, label as "Step-Up Opportunity" in scan results | S |
| PQ-6.5 | Quality review: generate test briefs for each of the 8 persona types, evaluate against win conditions, document findings | M |
| PQ-6.6 | Surface brief rating in dashboard UI: bring /api/briefs/[id]/rate into visible UI so rating data begins accumulating | M |

---

## Sprint Plan

All sprints are 2 weeks. These are **PQ (Product Quality)** sprints, separate from the DEV feature sprints and BIZ business sprints.

| Sprint | Epics | Focus | Key Deliverables |
|--------|-------|-------|-----------------|
| **PQ1** | PQ-1 | Role type foundation | DB migration, profile selector, company size, roleTypeContext() function, prompt injection |
| **PQ2** | PQ-2 | Career history verification | Structured extraction, verification UI, acquisition annotations, verified history in prep |
| **PQ3** | PQ-3 | Role-specific differentiation | All 8 role-type prompts, CDO/CISO/CPO/COO brief overhaul, Questions route update |
| **PQ4** | PQ-4 | Trust infrastructure | /security page, delete notes, confidentiality statement, "no job posting" language fix |
| **PQ5** | PQ-5 | Signal differentiation | Role-aware briefing, CISO/CPO/COO signal categories, industry compliance detection |
| **PQ6** | PQ-6 | VP transition + quality review | Transition framing mode, step-up detection, brief rating UI, quality review |

---

### Sprint PQ1 Detail: Role Type Foundation

**Sprint goal:** The AI knows what role the executive is targeting, not just their tier. This is the prerequisite for everything else in PQ3-6.

**Tasks (2 weeks):**

1. Run Supabase migration: add `role_type` VARCHAR to `user_profiles`, nullable
2. Run Supabase migration: add `company_size` VARCHAR to `companies`, nullable
3. Profile page: add role type selector below search level
   - Options: CIO, CTO, CDO (Data/Analytics), Chief Digital Officer, CISO, CPO, COO, VP of Technology, Other C-Suite
   - Label: "Role type" — "Lets the AI use the right framing for your function."
4. Add company page: add company size selector
   - Options: Startup (under 200), Mid-Market (200-2,000), Enterprise (2,000+)
5. `src/lib/prompts.ts`: create `roleTypeContext(roleType)` function — detailed guidance per type (see PQ-3 for full content; sprint PQ1 builds the function stub and wires it in; sprint PQ3 fills the per-type content)
6. Update `personaContext()` to also include role type label
7. Update `loadContext()` in prep route to fetch `role_type` from profile
8. Update `buildContext()` to include role type in candidate section
9. Update `PREP_SYSTEM`: add sentence "When role type is specified, every section uses role-appropriate framing, vocabulary, and success metrics."

**Definition of done:**
- Profile page shows role type selector
- Selecting "CISO" appears in the prep brief candidate section as "Role type: CISO"
- The AI brief shows some differentiation from a CIO brief when CISO is selected (even before PQ3 fills in full guidance)
- TypeScript clean, tests pass, committed and deployed

---

### Sprint PQ2 Detail: Career History Verification

**Sprint goal:** Eliminate "the AI got my career history wrong" as a trust killer. One bad first-session experience with a senior executive poisons their peer network.

**Tasks (2 weeks):**

1. Supabase migration: add `career_history_json` JSONB to `user_profiles`
2. Update `linkedin-import/route.ts` prompt to also return `career_entries` array:
   ```
   career_entries: [{company, parent_company, title, start_year, end_year, key_outcome, acquisition_note}]
   ```
3. Update `linkedin-import/extract/route.ts` response to return career entries alongside existing fields
4. Create `CareerVerification` component: editable table showing career entries
   - Each row: company, title, dates, key outcome (short edit field), acquisition note
   - "Add entry" button for gaps
   - "Delete entry" for miscategorized items
   - Orange highlight on rows the AI flagged as uncertain (acquisition detected, date gap, title anomaly)
5. Post-import flow: after LinkedIn import, if career_entries returned, show verification step before returning to profile
6. On profile save: write verified entries to `career_history_json`
7. Update `buildContext()`: if `career_history_json` exists, use structured entries for "Verified career history:" section in prep brief instead of raw resume text for the career section
8. Prompt update: "Verified career history entries are confirmed by the executive. Treat them as authoritative. Do not infer or contradict them."

**Definition of done:**
- LinkedIn import shows career table after extraction
- Executive can edit, add, and annotate entries
- Verified history appears in prep brief and is labeled [Verified]
- An executive with an acquisition in their history can correctly annotate it before the first brief runs

---

### Sprint PQ3 Detail: Role-Specific Prep Brief Differentiation

**Sprint goal:** Each of the 8 role types receives a brief that reads like it was written by a different expert. No two role type briefs should be interchangeable.

**Tasks (2 weeks):**

Fill `roleTypeContext()` stub created in PQ1 with full per-type guidance:

**CIO:**
- Frame around: business-technology integration, enterprise risk governance, board reporting line, vendor portfolio rationalization, transformation mandate
- Forbidden: product architecture deep-dives, startup velocity language, individual contributor framing
- Anticipated pushback probe: "What's your relationship with the CFO?" "How do you handle a board that doesn't fund the technology plan?"

**CTO:**
- If company_size = startup: frame around technical architecture ownership, scaling decisions, product velocity, talent and team-building at speed
- If company_size = enterprise: frame around platform strategy, engineering productivity, build vs buy, vendor technology decisions
- Forbidden for startup CTOs: enterprise IT governance language, large-scale ERP framing
- Anticipated pushback probe: "What's your philosophy on technical debt?" "How do you balance engineering investment with product roadmap?"

**CDO (data):**
- Frame around: data as a strategic asset, data governance foundations, analytics maturity, productizing data, Chief AI Officer proximity
- Distinguish: data governance mandate (compliance-first) vs data products mandate (revenue-generating)
- Anticipate: "What's your data platform philosophy?" "How do you get the business to trust the data?"

**Chief Digital Officer:**
- Frame around: business transformation (not technology), P&L ownership or impact, customer experience, organizational change management
- Detect executive background: if positioning_summary or resume suggests non-tech origin (McKinsey, marketing, operations), lead with business outcomes, not technology credentials
- "What to Leave Out" section must address: CDO/CIO power dynamic, CMO territorial conflict, CFO ROI skepticism
- Anticipate: "How do you get the CIO to partner with you instead of fight you?"

**CISO:**
- Frame around: risk reduction (every Win Thesis sentence must be in risk terms, not achievement terms), board-level risk communication, regulatory compliance
- Required section: Board Communication Strategy — how the exec frames security risk for a board that does not understand technology
- Industry compliance injection (PQ5 completes this, PQ3 adds the placeholder): if sector is Financial Services, probe SOX/FFIEC; if Healthcare, probe HIPAA/breach; if Technology, probe product security/SDLC
- Forbidden: technical achievement framing, credentials-led narrative
- Anticipate: "What do you tell the board when you can't prevent every breach?" "How do you report on security posture without scaring them?"

**CPO:**
- Frame around: product philosophy, taste and judgment, product-market fit insight, roadmap governance, team organizational design
- B2C vs B2B detection: if company sector is consumer/retail/media, use B2C framing (engagement, retention, growth); if enterprise/SaaS/B2B, use B2B framing (customer success alignment, enterprise sales feedback loop, roadmap governance)
- Questions to Ask must include at least one question that reveals specific product insight about this company's product situation (not generic strategic questions)
- Anticipate: "What product are you most proud of and why?" "What's a bet you made on the roadmap that was wrong and what did you learn?"

**COO:**
- Frame around: operational execution, organizational design, process improvement, financial discipline, CEO partnership
- Explicit instruction: do not use technology transformation language. Do not lead with technology credentials. Do not use "digital," "platform," "modernization" as primary framing.
- Scan context: COO roles are rarely publicly posted; if no scan result, say "This role is likely not publicly posted — COO mandates are created around a specific operational challenge. What we know about the company's operational needs comes from signals and notes."
- Anticipate: "What's your model for a CEO-COO working relationship?" "Walk me through a time you told the CEO they were wrong about an operational decision and how that resolved."

**VP of Technology (step-up mode):**
- When target titles include C-suite: inject Transition Framing mode
- "Anticipated Pushback" must include: "You haven't been a [CIO/CTO] before" with specific counter (reframe VP scope as C-suite-equivalent outcome delivery)
- Add "Transition Narrative" after win thesis: four-sentence arc from VP background to C-suite readiness

**Additional tasks:**
- Update `/api/prep/[id]/questions/route.ts` system prompt to accept role type and produce role-appropriate questions
- Update PREP_SYSTEM with: "When role_type is CISO, the Win Thesis must use risk reduction language. When role_type is COO, do not use technology transformation framing. When role_type is CPO, produce one product-specific insight question under Questions to Ask."

**Definition of done:**
- Run test brief for each of 8 role types. CIO and COO briefs must be clearly distinguishable at first read.
- CISO brief must include a board communication section.
- CPO brief's Questions to Ask must include at least one product-specific insight question, not a generic executive question.
- COO brief must not use the words "digital transformation" or "technology modernization" in the win thesis.

---

### Sprint PQ4 Detail: Trust Infrastructure + "No Job Posting" Fix

**Sprint goal:** Pass the CISO scrutiny test. Address confidentiality concerns with technical specificity. Fix the "no job posting found" dead-end language.

**Tasks (2 weeks):**

1. Create `/app/(marketing)/security/page.tsx`:
   - "How we store your data": Supabase database with row-level security — your data is accessible only to your authenticated session. No other user can read your records.
   - "Encryption": All data is encrypted at rest (AES-256) and in transit (TLS 1.2+). This is infrastructure-level encryption provided by Supabase (AWS infrastructure).
   - "Third parties": We use Anthropic's API to generate your briefs. Text is sent to Anthropic for generation only — not stored by us or shared with any other party.
   - "Deletion": You can delete your notes, profile, and account at any time. Account deletion removes all your data within 30 days.
   - "Who has access": Your data is accessible only to you. Founders do not have routine access to individual user records.

2. "Delete my notes" button on profile page:
   - Clears: `positioning_summary`, `beyond_resume`, `career_history_json`
   - Separate confirmation: "This clears your positioning summary and career context. Your email and account remain active."
   - Does NOT clear: name, email, target titles (these are not sensitive)

3. Inline note proximate to company notes field in company detail page:
   - Small text below the notes textarea: "Your notes are private. Only you can read them."

4. Landing page confidentiality statement update:
   - Current: "We never share your identity, your targets, or your activity with employers, recruiters, or anyone else."
   - Add one sentence: "Your data is stored in an encrypted, isolated database under your account. No other user or employer can access it."
   - Add link: "Security details →" pointing to /security

5. Footer: add Security link

6. Fix "no job posting found" language:
   - In `buildScanSection()` (likely in `src/lib/prep-context.ts`), when scan returns no results:
   - Replace: "there is no job posting" or "no posting found"
   - With: "No public posting found for this company. The role may be unlisted or filled through retained search. Use company notes and signals to infer the likely mandate."
   - When URL was provided but failed: "The job posting URL was provided but could not be retrieved. Here is what we know from org signals and notes."

**Definition of done:**
- /security page is live and linked from footer
- Delete notes flow works and confirms deletion
- Landing page confidentiality statement includes technical specificity
- Prep brief no longer says "there is no job posting" in any form

---

### Sprint PQ5 Detail: Signal & Intelligence Differentiation

**Sprint goal:** The daily briefing surfaces what is actually relevant for each role type. CPO, COO, and CISO are not technology organization watchers.

**Tasks (2 weeks):**

1. Update briefing generation to read `role_type` from user profile
2. CISO signal layer: in briefing prompt, add instruction to surface cybersecurity-relevant signals:
   - Breach news at target companies or sector peers
   - Regulatory changes (SEC cybersecurity rules, HIPAA updates, SOC2 changes)
   - Compliance deadlines relevant to target company sector
3. CPO signal layer: in briefing prompt, add instruction to surface product-relevant signals:
   - App store rating changes (if consumer product)
   - Competitor product announcements
   - Product-related press (launches, retirements, pivots)
   - Customer feedback signals (if public reviews available)
4. COO signal layer: in briefing prompt, add instruction to surface operational signals:
   - M&A announcements (integration challenges create COO mandates)
   - EBITDA/margin pressure signals
   - Operational announcements: supply chain, facility openings/closures
   - Hiring patterns in operations functions (COO indicators)
5. CTO company size context injection: if `role_type = 'cto'` and target company `company_size = 'startup'`, inject startup context into prep brief:
   - Replace enterprise IT framing with: technical architecture, team velocity, scaling decisions, product proximity
   - Remove: ERP, vendor rationalization, IT governance language
6. CISO industry compliance injection: read company `sector` field when generating CISO prep brief:
   - If Financial Services: add SOX, FFIEC, PCI-DSS framing to Anticipated Pushback
   - If Healthcare: add HIPAA, breach notification, OCR audit framing
   - If Technology: add product security, secure SDLC, bug bounty, pen test framing

**Definition of done:**
- CISO user receives a briefing that includes a cybersecurity news section
- CPO user receives a briefing with product-signal section
- COO user receives a briefing with operational-signal section
- CTO user targeting a startup sees startup-appropriate framing in prep brief
- CISO brief for a Healthcare company target mentions HIPAA in anticipated pushback

---

### Sprint PQ6 Detail: VP Transition Framing + Quality Review

**Sprint goal:** VP-to-C-suite step-up is a first-class use case. Establish ongoing quality monitoring.

**Tasks (2 weeks):**

1. Detect transition mode: in `buildContext()`, if `search_persona = 'vp'` and any target title matches C-suite titles (CIO, CTO, COO, CPO, CISO, CDO), set `transition_mode = true` and include in prompt
2. Transition framing injection in prep brief prompt when transition_mode is active:
   - After win thesis, add: "Transition Narrative: Four sentences that take the candidate from where they are to why they are C-suite ready. Start with what they have delivered at VP scope. Connect it to what a CIO/CTO/etc. owns. Name the specific gap they are positioned to close. End on: the difference between their current title and their next one is a label, not a capability."
3. "Anticipated Pushback" injection for transition mode:
   - Must include: "[C-suite title] experience objection: 'You haven't been a [CIO/CTO] before.' Counter: [specific reframe of VP-scope delivery as C-suite-equivalent outcome]"
4. Scan step-up flag: if scan result returns C-suite role and user `search_persona = 'vp'`, add badge or label "Step-Up Opportunity" on the company card
5. Brief rating UI: add thumbs up/down rating to the prep brief page, connecting to existing `/api/briefs/[id]/rate` endpoint
6. Quality review (manual, 1-2 days):
   - Generate test briefs for each role type (CIO, CTO, CDO, CISO, CPO, COO, VP transition)
   - Evaluate each against win condition criteria
   - Document pass/fail per dimension
   - File issues for any remaining failures as PQ-7 candidates

**Definition of done:**
- VP targeting CIO role sees "Step-Up Opportunity" label on qualifying company cards
- VP prep brief for CIO interview includes Transition Narrative and "not yet CIO" pushback counter
- Brief rating buttons visible on prep page
- Quality review document produced with per-persona pass/fail against win conditions

---

## Projected Grade Improvement by Sprint

| Persona | Pre-PQ1 | After PQ1 | After PQ2 | After PQ3 | After PQ4 | After PQ5 | After PQ6 |
|---------|---------|-----------|-----------|-----------|-----------|-----------|-----------|
| CIO | C+ | B- | B | B+ | B+ | B+ | A- |
| CTO | D | C | C+ | B- | B- | B | B |
| VP of Technology | D+ | C | C | C+ | C+ | C+ | B+ |
| CDO (data) | F | D+ | C- | B- | B- | B- | B- |
| CDO (digital) | F | D+ | C- | B- | B- | B | B |
| CISO | D- | D+ | C | B- | B+ | A- | A- |
| CPO | D | D+ | C | B- | B- | B | B |
| COO | F | D | D+ | C+ | C+ | B- | B- |
| **Avg** | **D+** | **C-** | **C** | **B-** | **B-** | **B** | **B+** |

---

## Post-Sprint Acceptance Criteria by Persona

These are the observable outcomes that define "win condition reached" for each persona. Use these to grade each sprint.

### CIO — Win condition reached when:
- [ ] Brief win thesis names a specific reason this CIO wins this role over other CIOs
- [ ] Anticipated Pushback section predicts at least one objection the exec was already worried about
- [ ] Questions to Ask are C-suite governance level, not generic executive questions
- [ ] Brief is accurate against the exec's stated career history (no contradictions)
- [ ] No "there is no job posting" dead-end language

### CTO — Win condition reached when:
- [ ] Brief identifies which flavor of CTO the candidate is (infra/product/platform/AI)
- [ ] If startup target: brief uses startup framing, not enterprise IT framing
- [ ] Questions to Ask include at least one technically specific question about this company's architecture situation
- [ ] CTO brief is clearly distinguishable from CIO brief in the first paragraph

### VP of Technology — Win condition reached when:
- [ ] If targeting C-suite: brief includes Transition Narrative and "not yet [title]" pushback counter
- [ ] Anticipated Pushback section anticipates seniority gap objection first
- [ ] Brief does not over-claim by treating VP as already equivalent to C-suite

### CDO (data) — Win condition reached when:
- [ ] Brief does not use Chief Digital Officer language
- [ ] Win thesis connects exec's data background to what this company specifically needs from a data leader
- [ ] Brief distinguishes governance mandate from data products mandate based on company notes

### Chief Digital Officer — Win condition reached when:
- [ ] Brief leads with business transformation framing, not technology leadership
- [ ] If exec's background is non-tech: brief frames that as an asset, not a gap
- [ ] "What to Leave Out" includes CDO/CIO political dynamic at this company

### CISO — Win condition reached when:
- [ ] Win thesis uses risk reduction language — not technical achievement
- [ ] Brief includes a Board Communication Strategy section
- [ ] If company sector is Financial Services, Healthcare, or Technology: brief names the relevant compliance framework
- [ ] /security page exists and answers the questions a CISO would ask

### CPO — Win condition reached when:
- [ ] Brief produces at least one insight about this company's product situation the exec had not already identified
- [ ] Questions to Ask includes at least one product-specific question (not a generic executive question)
- [ ] If B2C company: brief uses engagement/growth framing. If B2B: brief uses roadmap governance/CS alignment framing
- [ ] Brief does not read like a CIO brief with product words substituted

### COO — Win condition reached when:
- [ ] Win thesis does not use the words "digital transformation," "technology modernization," or "IT strategy"
- [ ] Brief frames competitive advantage as operational execution and CEO partnership
- [ ] If no scan result: brief acknowledges COO roles are created, not posted, and offers mandate inference from signals and notes
- [ ] "Questions to Ask" are operational and CEO-partnership focused, not technology governance focused

---

## Sprint Calendar Integration

These PQ sprints run concurrently with DEV feature sprints and BIZ business sprints. They are product quality sprints — internal quality improvements that do not require user-facing release announcements until PQ3 and beyond.

| Sprint | Suggested Timing | External Announcement |
|--------|-----------------|----------------------|
| PQ1 | B1 (May 2026) | No — internal DB and profile change |
| PQ2 | B2 (May 2026) | Soft: "Improved career history accuracy" in onboarding |
| PQ3 | B3 (Jun 2026) | Yes — announce role-specific brief differentiation |
| PQ4 | B4 (Jun 2026) | Yes — announce /security page and data controls |
| PQ5 | B5 (Jul 2026) | Yes — announce role-specific briefing signals |
| PQ6 | B6 (Jul 2026) | Yes — announce VP transition framing and brief rating |

By end of B6 (end of Q2 2026), platform average moves from D+ to B+. This is the quality baseline needed before scaling B2C acquisition or entering B2B coach conversations.

---

## A Note on Prioritization

PQ1 is the prerequisite for PQ3. Do not skip it.
PQ2 is independent of PQ3 and can run in parallel if capacity allows.
PQ4 is independent of everything and can move earlier if the CISO acquisition channel is being actively targeted.
PQ5 and PQ6 depend on PQ3 being complete (role_type must be in the system).

If capacity forces a choice, the priority order is: **PQ1 → PQ3 → PQ2 → PQ4 → PQ5 → PQ6.**

The role-type foundation (PQ1) and role-specific differentiation (PQ3) produce the largest quality jump per sprint invested. Everything else builds on them.
