# Starting Monday — Project Overview

Read this before writing any code.

---

## What It Is

Starting Monday is an AI-powered job search platform for VP and C-suite technology executives — CIOs, CTOs, CDOs, CISOs, VPs of Technology and Engineering. The target user is a senior executive ($250,000+ total compensation) who is in an active job search or watching the market.

The product is not a job board. It is the infrastructure for a deliberate, campaign-style search at the executive level.

---

## The Problem It Solves

At the executive level, most roles are filled before they are posted. The informal short list is assembled through search firm relationships and board/CEO networks in the weeks before a formal search opens. The executive who finds out about an opportunity when it's posted on LinkedIn is already 6 weeks behind.

Starting Monday gives executives the intelligence infrastructure to be in the right conversation before the search opens:

- **Company intelligence** — tracking signals that precede CIO/CTO searches (new CEO, board changes, PE acquisition, transformation announcements)
- **Pipeline management** — structured tracking of target companies, contacts, and conversations
- **Prep briefs** — AI-assembled interview preparation in 60 seconds that reads at the level of a peer, not a candidate
- **Daily briefing** — the morning report: new signals, pending actions, follow-ups due

---

## The Hero Message

> The role was never posted. You found it anyway.

This is not a feature claim. It's the outcome. Every product decision should ask: does this help the user find the role before it's posted?

---

## Who the User Is

Read `docs/product-personas.md` for the full breakdown. In short:

- **Actively searching** — just left a role or within 6 months of a transition; urgency is high; needs the full platform
- **Passively watching** — employed, monitoring the market; lower urgency, higher patience; needs intelligence and relationship maintenance
- **Making the jump** — VP targeting the CIO/CTO seat; needs positioning help and signal identification

Current pricing:
- **Intelligence** ($49/mo) — pipeline tracking + signals, no AI features
- **Active** ($199/mo) — full platform including AI prep, chat, resume tailoring
- **Executive** ($499/mo) — same as Active + priority AI, Opus model for briefs, salary intelligence, unlimited pipeline

---

## The Six Things That Predict Conversion

If a user does these six things in their first session or first two days, they convert to paid and stay. If they do two or three, they don't.

1. Upload resume or import LinkedIn profile
2. Add first target company with career page URL
3. Generate first prep brief and read it
4. Add first contact at a target company
5. Set up daily briefing time and timezone
6. Log first conversation note

This list drives the Phase 1 roadmap. Every product decision right now should ask: does this help users complete these six actions faster?

---

## Current State (May 2026)

**What's live and working:**
- Full pipeline tracking (5 stages)
- Career page scanning (3x/week via browserless.io)
- Company intelligence and signals
- AI prep briefs (all streaming)
- Search Strategy Brief (Opus model)
- AI Chat advisor with tool use
- Resume tailoring with DOCX export
- Outreach email drafting
- Daily briefings (email + in-app)
- 30-day free trial, no credit card required
- Stripe billing with pause/resume
- Full Supabase auth + RLS

**What's in active development (Phase 1):**
- Six-actions activation framework (getting started tracker)
- PostHog event tracking for all activation events
- Staging environment and multi-developer workflow
- Stripe pricing update ($49/$199/$499)
- Email lifecycle system

**What's coming (Phase 2-3):**
- Alumni mode (post-offer downgrade)
- In-app referral program
- Executive tier feature set
- Outplacement integration

Full details: `docs/product-roadmap.md`

---

## What Rich Is Focused On

Rich is stepping back from day-to-day feature development to focus on:
- Customer acquisition (direct outreach, Wake Forest/Stanford networks)
- Partnerships (outplacement firms, Manager Tools / Mark Horstman, search firm relationships)
- Content (blog, LinkedIn, SEO)
- Alpha user success (personal attention to first users)

This means **you own the technical roadmap** week to week. Rich sets the direction; you build it.

When to pull Rich in:
- Architectural decisions that affect the data model or billing
- Anything that touches the Stripe webhook or billing logic
- User-facing copy and messaging changes
- Any production incident

When to proceed without asking:
- Feature development within the Phase 1 roadmap
- Bug fixes
- Performance and accessibility improvements
- Test infrastructure

---

## The Tech Voice

Starting Monday communicates with executives the way a board advisor would — not a startup, not a chatbot. Direct sentences. Short paragraphs. No buzzwords. No em dashes in source files (the pre-commit hook enforces this). If in doubt, read a few blog posts at `/blog` to hear the voice.

---

## The Design System

- **Colors**: `slate-900` dominant background, `orange-500` (#f97316) as the only accent
- **Typography**: All sizes in px (`text-[13px]`), not Tailwind's named scale
- **Buttons**: Orange primary CTAs use `text-slate-900` (not white) — WCAG contrast requirement
- **Reference file**: `docs/ui-guide.md` and `src/app/components/LandingPage.tsx` for patterns

Never add a second accent color. Never use purple, teal, or green as UI chrome.
