# Starting Monday B2B Channel - Jira Epics & Tickets

**Project Key:** SMK  
**Last Updated:** 2026-06-25

## Instructions

### Option 1: CSV Import
Use Jira's bulk import feature to create all epics and tickets at once:
1. Go to Jira → Settings → Projects → Import/Export
2. Copy the CSV content below (under "CSV Export Format")
3. Import into project SMK

### Option 2: Manual Creation (Step-by-step)
Follow the order below to create hierarchy:
1. Create **Parent Epic** (SMK-0): B2B Channel Development Initiative
2. Create **Phase 1-3 Child Epics** (SMK-1, SMK-2, SMK-3)
3. Create **All tickets** (SMK-101 through SMK-309) under their parent epic
4. Link parent epic to all child epics

### Option 3: Use Jira CLI
```bash
jira epic create --project SMK --name "B2B Channel Development Initiative" --description "See JIRA-EPICS-AND-TICKETS.md for details"
```

---

## EPIC HIERARCHY

```
SMK-0: B2B Channel Development Initiative (Q3 2026) [PARENT]
├─ SMK-1: EPIC - Coach Referral Infrastructure (Phase 1) [CHILD]
│  ├─ SMK-101: Implement Referral Code Generation System
│  ├─ SMK-102: Track Referral Attribution in Signup Flow
│  ├─ SMK-103: Coach Partner Dashboard - UI & API
│  ├─ SMK-104: Commission Calculation & Tracking
│  ├─ SMK-105: Commission Payment Integration with Stripe
│  ├─ SMK-106: Coach Agreement Template & Legal
│  ├─ SMK-107: End-to-End Partner Onboarding Flow
│  └─ SMK-108: QA & Testing - Phase 1 Infrastructure
│
├─ SMK-2: EPIC - Coach Enablement & Pilot Program (Phase 2) [CHILD]
│  ├─ SMK-201: Create Coach Positioning & Sales One-Pager
│  ├─ SMK-202: Build ROI Calculator for Coaches
│  ├─ SMK-203: Identify & Qualify 10 Target Coaches
│  ├─ SMK-204: Coach Outreach Email Sequence
│  ├─ SMK-205: Pilot Program Agreement & Terms
│  ├─ SMK-206: Launch Pilot Outreach Campaign
│  ├─ SMK-207: Coach Feedback Loop & Monthly Check-ins
│  ├─ SMK-208: Capture & Publish Case Studies
│  ├─ SMK-209: Develop Coach Onboarding Copy & Messaging
│  └─ SMK-210: Pilot-to-Paid Conversion & Renewal
│
└─ SMK-3: EPIC - Outplacement Firm Expansion (Phase 3) [CHILD]
   ├─ SMK-301: Design & Implement Seat Management API
   ├─ SMK-302: Firm Admin Dashboard - UI & Reporting
   ├─ SMK-303: White-Label Customization Engine
   ├─ SMK-304: Firm-Specific Onboarding Flow
   ├─ SMK-305: Enterprise Contract Template & Legal Review
   ├─ SMK-306: Firm Identification & Qualification
   ├─ SMK-307: Firm Outreach & Pilot Recruitment
   ├─ SMK-308: Usage Monitoring & ROI Reporting
   └─ SMK-309: Outplacement Pilot-to-Paid Conversion
```

---

## EPIC 0 (PARENT): B2B Channel Development Initiative (Q3 2026)

**Type:** Epic  
**Summary:** B2B Channel Development Initiative (Q3 2026)  
**Assignee:** Chris Goodwin  
**Sprint:** Q3 2026 Planning  
**Labels:** b2b-channel, parent-epic, strategic-initiative  
**Priority:** Highest  

**Description:**

Strategic initiative to build B2B channel revenue via coach referrals and outplacement firm partnerships. Target: $15K MRR by Q4 2026.

### Timeline
June 25 - Sept 30, 2026 (7 sprints)

### Owner & Budget
- **Owner:** Chris Goodwin
- **Engineering Hours:** ~240 hours
- **Sales/Product/Ops Hours:** ~90 hours
- **Total Project Cost:** ~330 person-hours

### Why This Matters
- Coaches are the fastest path to recurring B2B revenue
- $15K+ MRR run rate by Q4 2026 with 80% gross margins
- Coaches provide acquisition; we provide product + retention
- Creates proof points for 2027 enterprise sales strategy

### Three Phases
1. **Phase 1 (July):** Coach Referral Infrastructure
   - Referral codes, coach dashboard, commission payments
   - Duration: Sprint 3-4
   - Lead: Engineering (80 hours)

2. **Phase 2 (Aug-Sept):** Coach Enablement & Pilot Program
   - Positioning, pilots with 3-5 coaches, case studies
   - Duration: Sprint 4-5
   - Lead: Sales/CS (40+ hours)

3. **Phase 3 (Sept-Oct):** Outplacement Firm Expansion
   - Seat management, white-label, enterprise contracts
   - Duration: Sprint 6-7
   - Lead: Product + Sales (150+ hours)

### Financial Model
- **Coach Commission:** 20% of subscription revenue OR $79/seat/month (coach chooses)
- **Year 1 Target:** 15 coaches × 10 clients = 150 seats = $4.5K MRR
- **Year 2 Vision:** 50 coaches + 3-5 outplacement firms = $18K+ MRR
- **Gross Margin:** 79-80% (vs 91% B2C)
- **Payback:** Commission revenue minus engineering cost = payback in 2-3 months

### Key Success Metrics
- 3-5 coaches actively piloting by Sept 15, 2026
- 15+ referred clients with active usage by Sept 30
- $500-1,000 MRR from coach referrals by Sept 30
- 80%+ pilot-to-paid conversion rate by Oct 1
- Zero payment/commission processing errors
- Coach NPS score >50

### Strategic Rationale
**Why coaches first (not enterprise)?**
- Fastest sales cycle: independent coaches make decisions same day
- Lowest implementation overhead: coaches already know job search
- Highest feedback density: 3-5 clients per session = immediate feedback
- Lowest CAC: referral commission only cost, coaches provide acquisition

**Path to enterprise (2027):**
500 individual users → 20 coach partners → 3-5 outplacement firms → enterprise references → enterprise HR deals

We're at 70 users today. Coaches unlock steps 2-3. Enterprise is 2027 conversation with proof.

### Risk Mitigation
| Risk | Mitigation |
|------|-----------|
| Coaches don't value referral model | Test both: 20% commission + $79/seat — coaches choose |
| Referral code abuse/leakage | Rate limit generation, monitor suspicious patterns |
| Commission delays frustrate partners | Auto weekly reporting + monthly Stripe payouts |
| Pilots don't convert to paid | 50% discount months 4-6, standard pricing month 7+ |
| Product missing coach use case | Monthly 30-60-90 day check-ins, product iteration |

---

## CSV IMPORT FORMAT

```csv
Issue Type,Summary,Description,Assignee,Sprint,Labels,Priority,Parent Issue,Estimate (Hours)
Epic,B2B Channel Development Initiative (Q3 2026),"Strategic initiative to build B2B channel revenue via coach referrals and outplacement firm partnerships. Target: $15K MRR by Q4 2026.",Chris Goodwin,Q3 2026 Planning,b2b-channel parent-epic strategic-initiative,Highest,,
Epic,EPIC: Coach Referral Infrastructure (Phase 1),"Build referral tracking, partner dashboard, and payment infrastructure. 8 tickets, 80 eng hours + 20 product hours.",Chris Goodwin,Sprint 3,b2b-channel phase-1 epic,High,B2B Channel Development Initiative (Q3 2026),100
Epic,EPIC: Coach Enablement & Pilot Program (Phase 2),"Launch pilots with 3-5 coaches, gather feedback, create case studies. 9 tickets, 40 sales + 20 product + 10 CS hours.",Chris Goodwin,Sprint 4-5,b2b-channel phase-2 epic,High,B2B Channel Development Initiative (Q3 2026),70
Epic,EPIC: Outplacement Firm Expansion (Phase 3),"Build seat management and white-label for firms. 9 tickets, 120 eng + 30 product + 20 sales hours.",Chris Goodwin,Sprint 6-7,b2b-channel phase-3 epic,High,B2B Channel Development Initiative (Q3 2026),170
Story,SMK-101: Implement Referral Code Generation System,"Create API endpoint and database schema for generating and tracking unique referral codes per coach partner.",TBD,Sprint 3,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),8
Story,SMK-102: Track Referral Attribution in Signup Flow,"Modify signup flow to accept and store referral code, auto-link new user to coach partner.",TBD,Sprint 3,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),5
Story,SMK-103: Coach Partner Dashboard - UI & API,"Build partner-facing dashboard showing referral performance, attributed clients, and earnings.",TBD,Sprint 3-4,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),13
Story,SMK-104: Commission Calculation & Tracking,"Implement automated commission tracking based on partner agreement (20% or $79/seat).",TBD,Sprint 4,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),8
Story,SMK-105: Commission Payment Integration with Stripe,"Automate monthly commission payouts to coaches via Stripe Connect.",TBD,Sprint 4,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),8
Task,SMK-106: Coach Agreement Template & Legal,"Draft coach partnership agreement including commission terms, data usage, liability.",Legal,Sprint 4,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),4
Story,SMK-107: End-to-End Partner Onboarding Flow,"Create guided onboarding for coach partners: signup → agreement → Stripe setup → first code → dashboard.",TBD,Sprint 4,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),5
Task,SMK-108: QA & Testing - Phase 1 Infrastructure,"Full regression testing of referral infrastructure with real coaches.",QA,Sprint 4,b2b-channel phase-1,High,EPIC: Coach Referral Infrastructure (Phase 1),6
Task,SMK-201: Create Coach Positioning & Sales One-Pager,"Create 1-page positioning deck for coach outreach.",Chris Goodwin,Sprint 4,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),4
Story,SMK-202: Build ROI Calculator for Coaches,"Interactive calculator showing coach earnings potential based on client count and plan selection.",TBD,Sprint 4,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),6
Task,SMK-203: Identify & Qualify 10 Target Coaches,"Research and build target list of executive coaches for pilot outreach.",Chris Goodwin,Sprint 4,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),8
Task,SMK-204: Coach Outreach Email Sequence,"Write 3-email outreach sequence for coach pilots.",Chris Goodwin,Sprint 4,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),5
Task,SMK-205: Pilot Program Agreement & Terms,"Document pilot program terms: 3 free seats for 90 days, expectations, conversion terms.",Chris Goodwin,Sprint 4,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),3
Task,SMK-206: Launch Pilot Outreach Campaign,"Execute outreach sequence to 10 coaches, book calls, enroll pilots.",Chris Goodwin,Sprint 4,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),6
Task,SMK-207: Coach Feedback Loop & Monthly Check-ins,"Set up structured feedback collection from pilot coaches at 30/60/90 days.",Support,Sprint 4-5,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),4
Task,SMK-208: Capture & Publish Case Studies,"Document 2-3 pilot case studies: coach story, client story, outcomes, ROI.",Marketing,Sprint 5,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),8
Task,SMK-209: Develop Coach Onboarding Copy & Messaging,"Document language coaches use to explain Starting Monday to clients.",Chris Goodwin,Sprint 5,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),4
Task,SMK-210: Pilot-to-Paid Conversion & Renewal,"At end of 90-day pilot, convert coaches to paid partnership.",Chris Goodwin,Sprint 5,b2b-channel phase-2,High,EPIC: Coach Enablement & Pilot Program (Phase 2),3
Story,SMK-301: Design & Implement Seat Management API,"Build API for firm admins to purchase, assign, and track seats.",TBD,Sprint 6,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),12
Story,SMK-302: Firm Admin Dashboard - UI & Reporting,"Build admin interface for firms to manage seat pool, view usage, run ROI reports.",TBD,Sprint 6,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),10
Story,SMK-303: White-Label Customization Engine,"Enable firms to customize branding, domain, email templates without code.",TBD,Sprint 6-7,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),16
Story,SMK-304: Firm-Specific Onboarding Flow,"Create custom onboarding for clients assigned through firm, branded with firm logo/colors.",TBD,Sprint 7,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),8
Task,SMK-305: Enterprise Contract Template & Legal Review,"Draft enterprise-grade partnership agreement covering seats, SLA, data, pricing.",Legal,Sprint 6,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),6
Task,SMK-306: Firm Identification & Qualification,"Research and build target list of outplacement firms.",Chris Goodwin,Sprint 6,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),6
Task,SMK-307: Firm Outreach & Pilot Recruitment,"Execute outreach to 5-10 outplacement firms, pitch pilot, book demos.",Chris Goodwin,Sprint 6,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),8
Story,SMK-308: Usage Monitoring & ROI Reporting,"Build analytics to track client outcomes and prove ROI for firm partners.",Analytics,Sprint 7,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),8
Task,SMK-309: Outplacement Pilot-to-Paid Conversion,"At end of 90-day pilot, convert to full partnership with standard pricing.",Chris Goodwin,Sprint 7,b2b-channel phase-3,High,EPIC: Outplacement Firm Expansion (Phase 3),3
```

**How to use this CSV:**
1. Copy the CSV content above
2. In Jira: Settings → Issues → Import/Export
3. Select "CSV import" and paste
4. Map columns to your Jira fields
5. Review and confirm creation

---

## EPIC 1: Coach Referral Infrastructure (Phase 1)

**Type:** Epic  
**Summary:** EPIC: Coach Referral Infrastructure (Phase 1)  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 3  
**Parent Epic:** B2B Channel Development Initiative (Q3 2026)  
**Labels:** b2b-channel, phase-1, epic, coaching-partners  
**Priority:** High  

**Description:**

Build the foundational referral tracking, partner dashboard, and payment infrastructure needed to launch coach partnerships.

### Timeline
Sprint 3-4 (July-August 2026)

### Why This Matters
- Coaches are the fastest path to recurring B2B revenue
- Enables 15K+ MRR run rate by Q4 2026
- Coaches handle acquisition; we handle retention + infrastructure

### Key Deliverables
1. Referral code generation & tracking system
2. Coach partner dashboard (view referred clients + usage + earnings)
3. Conversion flow (referral code → signup → payment)
4. Commission tracking & payment infrastructure
5. Partner agreement template

### Success Criteria
- Referral codes track end-to-end (code generated → signup → payment)
- Coach dashboard real-time, accurate within 5 minutes
- Commission payment system tested with 2+ coaches
- All systems documented and tested with beta coach

### Estimated Effort
80 engineering hours + 20 product hours

---

### Tickets under EPIC 1:

#### SM-101: Implement Referral Code Generation System
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 3  
**Estimate:** 8 hours  

**Description:**

Create API endpoint and database schema for generating and tracking unique referral codes per coach partner.

**Acceptance Criteria:**
- Endpoint: POST /api/partners/referral-codes with response { code: "ref_XYZ", coachId, expiresAt }
- Codes are 8-12 characters, URL-safe, unique
- Codes stored in database with coach_id, created_at, converted_count
- Rate limit: max 10 codes per coach per day
- Real-time conversion tracking when code is used in signup flow

**Dependencies:**
- Database schema: coach_partners table with referral_codes relationship

---

#### SM-102: Track Referral Attribution in Signup Flow
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 3  
**Estimate:** 5 hours  

**Description:**

Modify signup flow to accept and store referral code, auto-link new user to coach partner.

**Acceptance Criteria:**
- Signup accepts optional ?ref=code_param
- Code validation: checks if code exists, is valid, not expired
- On signup success, user.coach_partner_id = coach from code
- Attributed user marked in database with attribution timestamp
- Analytics: track conversion rate per code

**Dependencies:**
- SM-101

---

#### SM-103: Coach Partner Dashboard - UI & API
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 3-4  
**Estimate:** 13 hours  

**Description:**

Build partner-facing dashboard showing referral performance, attributed clients, and earnings.

**Acceptance Criteria:**
- Dashboard endpoint: GET /api/partners/dashboard returns { referralCodes: [], attributedClients: [], earnings: {} }
- UI displays:
  - List of referral codes with click count, conversion count, conversion %
  - List of attributed clients with name, status (active/inactive), current plan, monthly spend
  - Running total earnings (actual + projected)
  - Chart: attributed users over time
- Real-time updates (data within 5 minutes)
- Performance: loads in <2 seconds

**Dependencies:**
- SM-101, SM-102

---

#### SM-104: Commission Calculation & Tracking
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 4  
**Estimate:** 8 hours  

**Description:**

Implement automated commission tracking based on partner agreement (20% of subscription revenue or $79/seat).

**Acceptance Criteria:**
- Monthly commission calculation: sum all payments from attributed users for the month
- Commission = (attributed_user_payment * 0.20) OR ($79 * seats), partner chooses
- Commission record stored with: coach_id, month, amount, user_list, payment_status
- Reconciliation: auto-check against Stripe invoice data
- Report generation: CSV export of monthly commission for accounting

**Dependencies:**
- SM-102, Stripe integration existing

---

#### SM-105: Commission Payment Integration with Stripe
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 4  
**Estimate:** 8 hours  

**Description:**

Automate monthly commission payouts to coaches via Stripe Connect or bank transfer.

**Acceptance Criteria:**
- Stripe Connect account registration flow for coaches (KYC)
- Monthly payout automated: calculate commission → initiate payout → track status
- Email notification to coach: monthly commission report + payout status
- Reconciliation: payout amount matches commission calculation within $0.01
- Retry logic: failed payouts automatically retry next day

**Dependencies:**
- SM-104

---

#### SM-106: Coach Agreement Template & Legal
**Type:** Task  
**Assignee:** [Legal/Operations TBD]  
**Sprint:** Sprint 4  
**Estimate:** 4 hours  

**Description:**

Draft coach partnership agreement including commission terms, data usage, liability, termination.

**Acceptance Criteria:**
- Agreement drafted with legal review
- Covers: commission split (20% + $79 seat options), payment terms, term length, termination, data usage, liability
- Digital signature capability (e-signature tool)
- Template stored and versioned in Jira/Confluence

---

#### SM-107: End-to-End Partner Onboarding Flow
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 4  
**Estimate:** 5 hours  

**Description:**

Create guided onboarding for coach partners: signup → agreement → Stripe setup → first referral code → dashboard access.

**Acceptance Criteria:**
- Coach signup form: email, name, ICF cert (optional), target clients
- Agreement e-signature integration
- Stripe Connect setup (embedded or redirect)
- First referral code generated on completion
- Welcome email + dashboard link sent
- Onboarding completion tracked in CRM

**Dependencies:**
- SM-106, SM-105, SM-103

---

#### SM-108: QA & Testing - Phase 1 Infrastructure
**Type:** Task  
**Assignee:** [QA TBD]  
**Sprint:** Sprint 4  
**Estimate:** 6 hours  

**Description:**

Full regression testing of referral infrastructure with real coaches.

**Acceptance Criteria:**
- End-to-end test: code generation → signup with ref code → attribution → commission calculation → payout
- Test with 2+ live coaches, 10+ attributed clients
- No data loss or miscalculations
- Performance: all systems <2s response time
- Security: referral codes not exposed in logs/URLs
- Documentation: runbook for support team

---

---

## EPIC 2: Coach Enablement & Pilot Program (Phase 2)

**Type:** Epic  
**Summary:** EPIC: Coach Enablement & Pilot Program (Phase 2)  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 4-5  
**Parent Epic:** B2B Channel Development Initiative (Q3 2026)  
**Labels:** b2b-channel, phase-2, epic, coaching-partners, pilots  
**Priority:** High  

**Description:**

Launch pilot partnerships with 3-5 executive coaches to validate the referral model, gather product feedback, and create case studies.

### Timeline
Sprint 4-5 (August-September 2026)

### Why This Matters
- Pilots provide proof points for broader coach outreach
- Coaches' direct feedback shapes product roadmap
- Real case studies >10x more persuasive than marketing claims
- Pilots convert to paid partnerships with highest confidence

### Success Criteria
- 3-5 coaches actively using platform with referred clients
- Minimum 15 referred clients in pilot phase
- Coach NPS score >50
- 2+ case studies documented (coach + client outcomes)
- Pilot conversion rate >80% to paid partnership

### Estimated Effort
40 sales hours + 20 product hours + 10 customer success hours

---

### Tickets under EPIC 2:

#### SM-201: Create Coach Positioning & Sales One-Pager
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 4  
**Estimate:** 4 hours  

**Description:**

Create 1-page positioning deck for outreach to coaches. Emphasize coach value prop, not user features.

**Acceptance Criteria:**
- Positioning statement: "Starting Monday is the search management tool your clients deserve but won't find elsewhere"
- Key benefits: organizes clients, reflects well on coach, no admin overhead
- ROI callout: "3-5 clients per coach × 3 months × referral commission = $500-1000/month passive income"
- Visual: clean, coach-branded, usable in email
- Success rate of coaches who pilot: 80%+ conversion to paid

**Deliverable:** 
- One-page PDF + email version + Slack message template

---

#### SM-202: Build ROI Calculator for Coaches
**Type:** Story  
**Assignee:** [Engineer/Product TBD]  
**Sprint:** Sprint 4  
**Estimate:** 6 hours  

**Description:**

Interactive calculator showing coach earnings potential based on client count and plan selection.

**Acceptance Criteria:**
- Input fields: # active clients, avg plan (Intelligence/Search/Executive), referral commission % vs seat fee
- Output: monthly revenue, annual revenue, break-even clients
- Shows scenarios: 5 clients, 10 clients, 15 clients
- Embeddable in email or webpage
- Mobile-responsive

**Deliverable:**
- Hosted at /tools/coach-roi-calculator
- Shareable link in outreach templates

---

#### SM-203: Identify & Qualify 10 Target Coaches
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 4  
**Estimate:** 8 hours  

**Description:**

Research and build target list of executive coaches for pilot outreach.

**Acceptance Criteria:**
- 10 coaches identified via LinkedIn/Google search
- Qualification criteria:
  - ICF-certified (professional standard)
  - Focus on C-level transitions (CIO, VP Tech, CFO)
  - 10-30 active clients
  - Visible online presence (LinkedIn, website, podcast appearances)
  - Show interest in modern tools/best practices
- Contact info: email, LinkedIn, phone (if available)
- Personalization notes: what they post about, why we target them

**Deliverable:**
- Spreadsheet with coach list, qualification notes, contact info, outreach hooks

---

#### SM-204: Coach Outreach Email Sequence
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 4  
**Estimate:** 5 hours  

**Description:**

Write 3-email outreach sequence for coach pilots. Personalized, value-first, low-pressure.

**Acceptance Criteria:**
- Email 1 (Day 1): Personalized hook (something about them), intro to Starting Monday, pilot offer (3 free seats for 90 days)
- Email 2 (Day 7): Soft follow-up, ROI example, link to positioning + ROI calculator
- Email 3 (Day 14): Final touch, limited-time offer, ask for 15-min call
- Tone: peer-to-peer, not sales-y, focus on coach benefit to clients
- Target: 5-10% open rate (coach-heavy audience)
- Subject lines A/B testable

**Deliverable:**
- Email template in Outreach/Salesloft or plain text

---

#### SM-205: Pilot Program Agreement & Terms
**Type:** Task  
**Assignee:** Chris Goodwin / Legal  
**Sprint:** Sprint 4  
**Estimate:** 3 hours  

**Description:**

Document pilot program terms: 3 free seats for 90 days, expectations, conversion terms.

**Acceptance Criteria:**
- Pilot term: 90 days (July-Sept 2026)
- Free seats: 3, no cost to coach
- Coach expectations: 
  - Assign seats to active clients
  - Weekly usage feedback
  - Monthly check-ins (calls)
  - End-of-pilot survey
- Conversion offer: 50% off month 4-6 if converting to paid
- Coach confidentiality: coach can't share login with non-clients
- Data usage: coach consents to feedback/testimonial (permission-based case study)

**Deliverable:**
- PDF attachment to pilot outreach email

---

#### SM-206: Launch Pilot Outreach Campaign
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 4  
**Estimate:** 6 hours  

**Description:**

Execute outreach sequence to 10 coaches, book calls, enroll pilots.

**Acceptance Criteria:**
- All 10 coaches contacted by August 15
- Minimum 3 coaches enrolled by August 31
- Pilot onboarding complete (3 coaches with 9 seats assigned, 1st clients using platform)
- Weekly tracking: email opens, replies, calls booked, enrollments

**Deliverable:**
- Pilot cohort confirmed, dashboard ready

---

#### SM-207: Coach Feedback Loop & Monthly Check-ins
**Type:** Task  
**Assignee:** [Support/Success TBD]  
**Sprint:** Sprint 4-5  
**Estimate:** 4 hours  

**Description:**

Set up structured feedback collection from pilot coaches at 30/60/90 days.

**Acceptance Criteria:**
- Call template: what's working, what's confusing, feature requests, would you recommend?
- Feedback captured in CRM + shared with product team
- Monthly summary: key themes, blockers, requests
- Follow-up: product team responds to requests within 1 week
- NPS tracking: monthly NPS score from coaches

**Deliverable:**
- Feedback templates, CRM integration, monthly reports

---

#### SM-208: Capture & Publish Case Studies
**Type:** Task  
**Assignee:** [Marketing/Content TBD]  
**Sprint:** Sprint 5  
**Estimate:** 8 hours  

**Description:**

Document 2-3 pilot case studies: coach story, client story, outcomes, ROI.

**Acceptance Criteria:**
- Case study format:
  - Coach intro (name, specialty, firm, years in business)
  - Challenge (what their clients face in search)
  - Solution (how Starting Monday + coach combo works)
  - Results (# clients placed, time to placement, plan used, coach revenue if paid)
  - Quote: coach's language about recommending to other coaches
  - Metrics: client satisfaction, job quality, timeline impact
- Permission: coach approves, client (if named) approves
- Format: 1-2 page PDF + 500-word blog post version
- Messaging: coach case studies trump marketing copy

**Deliverable:**
- 2-3 case study PDFs + blog posts
- Testimonial quotes for website
- Coach permission/NDA signed

---

#### SM-209: Develop Coach Onboarding Copy & Messaging
**Type:** Task  
**Assignee:** Chris Goodwin / [Content TBD]  
**Sprint:** Sprint 5  
**Estimate:** 4 hours  

**Description:**

Document the language coaches use to explain Starting Monday to clients. Use in product onboarding.

**Acceptance Criteria:**
- Collect 3-5 coach quotes during pilot on "how do you describe this to your clients?"
- Consolidate into 2-3 core messages
- Update product onboarding copy to use coach language (coaches are credible messengers)
- Test: coach-referred client onboarding vs organic onboarding (track activation rate)

**Deliverable:**
- Onboarding copy refresh, A/B test setup

---

#### SM-210: Pilot-to-Paid Conversion & Renewal
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 5  
**Estimate:** 3 hours  

**Description:**

At end of 90-day pilot, convert coaches to paid partnership.

**Acceptance Criteria:**
- Conversion offer: 50% discount on seat fee for months 4-6, revert to standard pricing month 7+
- Coaching decision: commission (20%) or seat fee ($79) — coaches choose
- Payment processing: Stripe Connect setup (should be complete from Phase 1)
- First referral revenue generated by October 2026
- Success metric: 80%+ of pilot coaches convert to paid

**Deliverable:**
- First paid partnerships signed, revenue recorded

---

---

## EPIC 3: Outplacement Firm Expansion (Phase 3)

**Type:** Epic  
**Summary:** EPIC: Outplacement Firm Expansion (Phase 3)  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 6-7  
**Parent Epic:** B2B Channel Development Initiative (Q3 2026)  
**Labels:** b2b-channel, phase-3, epic, outplacement, enterprise  
**Priority:** High (dependent on Phase 1-2 success)  

**Description:**

Build seat management, white-label infrastructure, and enterprise contracts needed for outplacement firm partnerships.

### Timeline
Sprint 6-7 (September-October 2026, depends on Phase 1-2 success)

### Why This Matters
- Outplacement firms represent 3-5x larger seat pools than individual coaches ($18K+ MRR potential)
- White-label capability removes competitive positioning concern
- Validates enterprise-grade infrastructure before direct enterprise sales

### Success Criteria
- 1-2 outplacement firms in pilot with 50+ seats assigned
- White-label customization working end-to-end
- Firm dashboard showing real-time seat usage + ROI
- Contract legal review complete
- Revenue model validated ($350/engagement or $500/10 seats/month)

### Estimated Effort
120 engineering hours + 30 product hours + 20 sales hours

---

### Tickets under EPIC 3:

#### SM-301: Design & Implement Seat Management API
**Type:** Story  
**Assignee:** [Engineer TBD]  
**Sprint:** Sprint 6  
**Estimate:** 12 hours  

**Description:**

Build API for firm admins to purchase, assign, and track seats.

**Acceptance Criteria:**
- Endpoints:
  - POST /api/firm/seats/purchase { quantity, plan, engagementDays } → creates seat pool
  - POST /api/firm/seats/assign { email, engagementStart, engagementEnd } → sends invite, reserves seat
  - GET /api/firm/seats { filter: active/inactive/expired } → list with usage, status
  - DELETE /api/firm/seats/{seatId} → unassign if within grace period
- Seat lifecycle: purchased → assigned to client → client activates → active (usage tracked) → expires
- Auto-expiration: seats expire after engagement period (typically 3-6 months)
- Grace period: 7 days to reassign expired seat before seat count deducted
- Reconciliation: daily sync with Stripe invoice

**Dependencies:**
- Phase 1 infrastructure stable

---

#### SM-302: Firm Admin Dashboard - UI & Reporting
**Type:** Story  
**Assignee:** [Engineer/Product TBD]  
**Sprint:** Sprint 6  
**Estimate:** 10 hours  

**Description:**

Build admin interface for firms to manage seat pool, view usage, run ROI reports.

**Acceptance Criteria:**
- Dashboard sections:
  - Seat pool overview: active/inactive/expired counts, utilization %
  - Client list: assigned email, status, plan, usage metrics, job placement status (if known)
  - Usage chart: assigned seats over time, active usage per week
  - ROI report: # clients placed, avg time to placement, cost per placement
  - Bulk assign UI: upload CSV of emails, auto-send invites
- Real-time updates (data within 1 hour)
- Export: CSV/PDF of seat usage + ROI report
- Mobile-responsive, accessible

**Dependencies:**
- SM-301

---

#### SM-303: White-Label Customization Engine
**Type:** Story  
**Assignee:** [Engineer/Design TBD]  
**Sprint:** Sprint 6-7  
**Estimate:** 16 hours  

**Description:**

Enable firms to customize branding, domain, email templates without code.

**Acceptance Criteria:**
- Customizable elements:
  - Logo (upload PNG/SVG)
  - Primary color + accent colors
  - Email domain (custom domain + DNS setup flow)
  - Email templates (onboarding, reminder, completion)
  - Website/login page: firm branding, custom message
- Admin UI: drag-drop color picker, logo uploader, email template editor
- Preview: live preview of emails, login page before publishing
- Deployment: custom domain routing, DNS validation
- Performance: custom branding cached, zero performance impact

**Dependencies:**
- SM-302

---

#### SM-304: Firm-Specific Onboarding Flow
**Type:** Story  
**Assignee:** [Engineer/Product TBD]  
**Sprint:** Sprint 7  
**Estimate:** 8 hours  

**Description:**

Create custom onboarding for clients assigned through firm, branded with firm logo/colors.

**Acceptance Criteria:**
- Onboarding flow:
  - User receives email from firm (firm branding)
  - Clicks link → login page with firm logo
  - Guided setup: name, title, target companies
  - First brief generation + preview
  - Setup complete: user directed to dashboard
- Messaging: mentions firm name (e.g., "Your [Firm Name] Career Advisor set this up for you")
- Tracking: identify firm-assigned users in analytics
- Performance: <3s load time, mobile-friendly

**Dependencies:**
- SM-303, Phase 1 core infrastructure

---

#### SM-305: Enterprise Contract Template & Legal Review
**Type:** Task  
**Assignee:** Chris Goodwin / Legal  
**Sprint:** Sprint 6  
**Estimate:** 6 hours  

**Description:**

Draft enterprise-grade partnership agreement covering seats, SLA, data, pricing.

**Acceptance Criteria:**
- Contract sections:
  - Pricing model: option 1) $350 per engagement (3-6 months) OR option 2) $500/10 seats/month
  - Term: 12 months, auto-renew
  - SLA: 99.5% uptime, <2s response time, support hours
  - Data: firm data isolation, security, deletion on termination
  - Confidentiality: firm can't share logins, must route through firm admin
  - Liability cap: standard indemnification
  - Termination: 30-day notice, pro-rata refund of unused seats
- Legal review: internal counsel + external counsel if needed
- Signature: e-signature integration
- Variations: pricing tiers, volume discounts documented

**Deliverable:**
- Signed contract template ready for first firm deal

---

#### SM-306: Firm Identification & Qualification
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 6  
**Estimate:** 6 hours  

**Description:**

Research and build target list of outplacement firms for Phase 3 pilot.

**Acceptance Criteria:**
- 5-10 firms identified via Google, LinkedIn, industry databases (TheLadders, etc.)
- Qualification criteria:
  - Boutique regional firms (5-20 consultants, 50-200 clients/year)
  - Serve senior execs (VP+) in transition
  - Located in major metros (NYC, SF, Boston, Chicago, LA)
  - Differentiated positioning (vs commodity providers like RMC, Lee Hecht)
  - Digitally forward (use modern tools, active social presence)
- Contact: owner/managing director email, phone
- Personalization: what they claim as differentiator, why Starting Monday fits

**Deliverable:**
- Target firm list with contact info + outreach hooks

---

#### SM-307: Firm Outreach & Pilot Recruitment
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 6  
**Estimate:** 8 hours  

**Description:**

Execute outreach to 5-10 outplacement firms, pitch pilot, book demos.

**Acceptance Criteria:**
- Pilot offer: 50 seats for 90 days at 50% discount ($250/engagement or $250/10 seats/month)
- Pitch focus: differentiation for clients, usage data showing ROI, co-brand option
- Messaging: "Starting Monday is the tool you've been looking for to differentiate vs [competitor]"
- Target: 1-2 firms enrolled by September 30, seats assigned by October 15
- Success: firm reports 10%+ seat utilization by end of pilot

**Deliverable:**
- Pilot cohort confirmed, white-label specs gathered

---

#### SM-308: Usage Monitoring & ROI Reporting
**Type:** Story  
**Assignee:** [Engineer/Analytics TBD]  
**Sprint:** Sprint 7  
**Estimate:** 8 hours  

**Description:**

Build analytics to track client outcomes and prove ROI for firm partners.

**Acceptance Criteria:**
- Metrics tracked:
  - Seat utilization: % of assigned seats with active users
  - Client outcomes: # placed / # active (by engagement end date)
  - Time to placement: avg days from onboarding to user marks "placed"
  - Plan preference: which tier (Intelligence/Search/Executive) most popular
  - Engagement quality: time in app per week, features used
- Reporting: weekly digest email to firm with key metrics
- Dashboard: firm admin can view metrics, export CSV
- Benchmarking: compare firm performance vs anonymous peer average

**Dependencies:**
- SM-302, SM-301

---

#### SM-309: Outplacement Pilot-to-Paid Conversion
**Type:** Task  
**Assignee:** Chris Goodwin  
**Sprint:** Sprint 7  
**Estimate:** 3 hours  

**Description:**

At end of 90-day outplacement pilot, convert to full partnership with standard pricing.

**Acceptance Criteria:**
- Conversion terms: full pricing ($350/engagement or $500/10 seats/month)
- Seat commitment: minimum 25 seats/month (or 1-year contract)
- First outplacement revenue: by October 31, 2026
- ROI: prove cost-per-placement vs traditional outplacement methods
- Success: 80%+ of pilot firms convert to annual partnership

**Deliverable:**
- First outplacement firm contract signed, revenue recognized

---

---

## Summary: Timeline & Rollout

```
Sprint 3 (Jun 25 - Jul 8):
- SM-101: Referral code gen
- SM-102: Attribution tracking
- SM-103: Dashboard start
- SM-201: Positioning deck
- SM-203: Coach identification

Sprint 4 (Jul 9 - Jul 22):
- SM-103: Dashboard complete
- SM-104: Commission tracking
- SM-106: Agreement template
- SM-107: Partner onboarding
- SM-202: ROI calculator
- SM-204: Outreach sequence
- SM-205: Pilot terms
- SM-206: Outreach launch
- SM-207: Feedback setup

Sprint 5 (Jul 23 - Aug 5):
- SM-105: Stripe integration
- SM-108: QA & testing
- SM-207: 30-day check-ins
- SM-208: Case studies
- SM-209: Onboarding copy
- SM-210: Conversion offer

Sprint 6 (Aug 6 - Aug 19):
- SM-301: Seat management API
- SM-302: Firm dashboard
- SM-303: White-label (start)
- SM-305: Enterprise contract
- SM-306: Firm identification
- SM-307: Firm outreach

Sprint 7 (Aug 20 - Sep 2):
- SM-303: White-label (finish)
- SM-304: Firm onboarding
- SM-308: ROI reporting
- SM-309: Pilot conversion

Post-Sprint 7:
- Outplacement revenue generation begins
- Coach channel active & recurring
- Foundation for enterprise sales in 2027
```

---

## Dependencies & Blockers

**Hard blockers:**
- Phase 1 infrastructure must be stable before Phase 2 pilots launch
- Pilot success required before Phase 3 funding/resourcing

**Soft dependencies:**
- Product design can iterate in parallel during engineering
- Sales can prep positioning while SM-101 is in flight
- No sequential bottleneck — multiple sprints can overlap

**Risk mitigation:**
- If Phase 1 slips by 1 week, push pilot outreach back 1 week (still recoverable)
- If pilot enrollment < 2 coaches by Aug 31, adjust messaging and try 5 more coaches

---

## Success Metrics (End of Q3 2026)

**Functional:**
- ✓ All Phase 1 infrastructure working, tested with 2+ real coaches
- ✓ 3-5 coaches in active pilot with referred clients
- ✓ Commission tracking and payments working error-free
- ✓ Case studies captured and shared

**Revenue:**
- ✓ $500-1,000 MRR from coach pilots by end of Q3
- ✓ 15+ referred clients, 5+ active users per coach

**Strategic:**
- ✓ Proof of model validation from coach feedback
- ✓ Foundation laid for outplacement expansion in Q4
- ✓ Referral economics proven (79-80% margin, <5% CAC)

**Operational:**
- ✓ Partner agreement finalized and e-signeable
- ✓ Commission payment process reliable and auditable
- ✓ Support playbook for partner issues documented

---

**Owner:** Chris Goodwin  
**Last Updated:** 2026-06-25  
**Next Review:** Sprint 3 kickoff (week of June 25)
