# Day One Checklist

Use this on your first day. Work through every section. Log anything that is broken, confusing, or wrong as a GitHub issue using the format at the bottom of this doc.

The goal is a complete picture of product state: what works, what doesn't, and what needs to be fixed first.

---

## Before You Start

- [ ] `.env.local` received from Rich
- [ ] Added as GitHub collaborator (`richrothschild/startingmonday`)
- [ ] `npm install` completed with no errors
- [ ] `npm run dev` starts and localhost:3000 loads
- [ ] `npm run typecheck` passes with zero errors
- [ ] Contributor agreement signed and returned to Rich
- [ ] Async channel agreed (Slack / Teams / other): _______________
- [ ] Supabase dashboard access confirmed
- [ ] Railway access confirmed

---

## Section 1 — Signup and Onboarding

Walk through the full new user experience. Create a test account (use a personal email, not your work email).

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Landing page loads cleanly | No layout breaks; orange CTA visible | | |
| Signup form works | Email + password accepted | | |
| Email confirmation received | Arrives within 2 minutes | | |
| Onboarding step 1 — name and title | Saves correctly | | |
| Onboarding step 2 — employment status | Options are clear; selection saves | | |
| Onboarding step 3 — search timeline | Options are clear; selection saves | | |
| Onboarding step 4 — target role types | Checkboxes work; saves | | |
| Onboarding step 5 — resume upload or LinkedIn import | File uploads or import works | | |
| Dashboard loads after onboarding | No error; search path card visible for new user | | |
| Welcome card shown (campaign, nurture, or watcher) | Correct card for the path selected | | |

---

## Section 2 — Pipeline (Companies)

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Add a company | Search or manual entry works | | |
| Company saved to pipeline | Appears in list | | |
| Add career page URL to company | Field saves | | |
| Company stage updates | Stage changes (researching → engaged etc.) | | |
| Archive a company | Moves out of active list | | |
| Company detail page loads | No 500 errors | | |
| Prep brief — generate | Streams without error | | |
| Prep brief — content quality | Reads at executive level; role-specific | | |
| Strategy brief — generate (Active tier) | Streams without error | | |
| Conversation log — add note | Saves and displays | | |
| Interview log — add entry | Saves and displays | | |

---

## Section 3 — Contacts

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Add a contact | Form saves | | |
| Link contact to company | Dropdown works | | |
| Set outreach status | Dropdown (prospect / reached out / etc.) saves | | |
| Outreach draft — generate | Streams without error | | |
| Outreach draft — content quality | Sounds like an executive, not a chatbot | | |
| Contact list — filters work | Filter by status works | | |
| Contact detail page loads | No errors | | |

---

## Section 4 — Signals

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Signals page loads | No errors; list or empty state | | |
| Filter by company | Works | | |
| Filter by signal type | Works | | |
| Generate outreach angle | Button works; content generates | | |
| Add follow-up from signal | Creates a follow-up task | | |
| Source link opens correctly | Opens correct URL | | |

---

## Section 5 — AI Chat

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Chat page loads | Input visible | | |
| Send a message | Response streams | | |
| Response quality | Reads like an experienced advisor, not a generic chatbot | | |
| Tool use (if triggered) | Company or contact lookup returns accurate data | | |
| Chat history persists | Reload page; prior messages visible | | |

---

## Section 6 — Daily Briefing

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Briefing page loads | No errors | | |
| Briefing content present | Signals and follow-ups visible | | |
| Follow-up actions listed | Due dates correct | | |

---

## Section 7 — Profile and Settings

| Step | Expected | Pass / Fail | Notes |
|------|----------|-------------|-------|
| Profile page loads | No errors | | |
| Edit full name | Saves | | |
| Edit current title | Saves | | |
| Edit positioning summary | Saves | | |
| Career history — view entries | Displays correctly | | |
| Career history — edit entry | Saves changes | | |
| Resume download | DOCX downloads and opens | | |
| Billing page loads | No errors | | |
| Upgrade flow (test mode) | Stripe test card works; tier updates | | |

---

## Section 8 — Mobile Responsiveness

Open the site on a phone or use browser DevTools mobile emulation (375px width).

| Screen | Expected | Pass / Fail | Notes |
|--------|----------|-------------|-------|
| Landing page | No overflow; CTA visible | | |
| Dashboard | Readable; navigation works | | |
| Pipeline list | Cards stack correctly | | |
| Contact list | Readable | | |
| Signals list | Readable | | |
| Chat | Input accessible | | |

---

## Section 9 — Performance Spot Check

| Check | Expected | Result | Notes |
|-------|----------|--------|-------|
| Dashboard load time | Under 3 seconds on localhost | | |
| Prep brief first token | Under 3 seconds | | |
| No layout shift on load | CLS not visible | | |
| No console errors | DevTools console clean | | |

---

## What Is Working (Current State as of May 13, 2026)

These are known to be live and functioning based on prior development:

**Core platform:**
- Pipeline tracking with 5 stages (watching, researching, engaged, interviewing, offer)
- Career page scanning (browserless.io, 3x/week)
- Company signals from 9 sources
- AI prep briefs (all streaming)
- Search Strategy Brief (Opus model)
- AI Chat advisor with tool use
- Resume tailoring with DOCX export
- Outreach email drafting
- Daily briefings (email + in-app)

**Billing and auth:**
- 30-day free trial, no credit card required
- Stripe billing with pause/resume
- Full Supabase auth with RLS

**Product intelligence (new):**
- Arc-specific welcome cards for new users (campaign / nurture / watcher)
- Proactive dashboard cards: companies without contacts, contacts not yet reached, companies without prep briefs

---

## How to Log a Bug

Create a GitHub issue in `richrothschild/startingmonday` using this format:

```
Title: [Bug] Short description of what is broken

**What I did:**
1. Step 1
2. Step 2
3. Step 3

**What I expected:**
The thing that should have happened.

**What happened instead:**
The actual result. Include the error message or screenshot.

**Environment:**
- Browser: Chrome 125 / Safari 17 / Firefox 126
- Device: Desktop / Mobile (iPhone 15)
- URL: localhost:3000/dashboard/signals

**Screenshot:**
[attach if relevant]

**Priority:**
P1 = user can't complete the task / data at risk
P2 = feature is broken but there is a workaround
P3 = minor visual issue or edge case
```

---

## How to Log a UX / Quality Issue

Not everything is a bug. Some issues are "this works but it's confusing" or "this copy doesn't sound right." Log those too — separately from bugs.

```
Title: [UX] Short description of the friction

**Where it happens:**
URL and user flow context.

**What the current experience is:**
What the user sees or reads.

**Why it's a problem:**
What a senior executive would think when they hit this.

**Suggestion (optional):**
What would be better.
```

---

## End of Day 1

At the end of your first day, send Rich:

1. A count of bugs filed (P1, P2, P3)
2. A count of UX issues filed
3. The one thing that surprised you most — either worse than expected or better than expected
4. Any access or environment issues that slowed you down

That summary drives the week's bug fix priority.
