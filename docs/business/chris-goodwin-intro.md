# Starting Monday — Intro for Chris Goodwin

---

Subject: Starting Monday — want you involved if you're up for it

Chris,

You've been using Starting Monday as a test user, so you have a better read on it than almost anyone. I want to bring you in as a contributor if that interests you.

Here is everything you need to understand what we are building, where it stands, and what the work looks like.

---

## What it is

Starting Monday is an AI-powered job search platform built specifically for C-suite and VP-level executives. It helps them track their search pipeline, run company intelligence scans against targets, and generate pre-interview prep briefs that are actually useful — not generic career coaching, but specific preparation tied to real company data and their actual career history.

The target users are CIOs, CTOs, CDOs, CISOs, CPOs, COOs, and VP-level operators in active or exploratory searches. These are people who will not use LinkedIn Premium or a job board. They will pay for something that makes them sharper in the room.

---

## Current state

Alpha is live. First external users are in. I have two active alpha testers — one is a Wake Forest/Stanford-connected network, the other is a potential partnership with Mark Horstman (Manager Tools — 8M podcast listeners). I have already shipped two substantial product quality improvements this sprint cycle:

**PQ1 — Role type personalization.** The AI now knows whether it is writing a brief for a CISO vs. a COO vs. a CDO. Before this, every executive got the same "C-suite" framing regardless of function.

**PQ2 — Career history verification.** LinkedIn import now returns structured career entries. The user can review, edit, and annotate them before the AI ever sees them. Verified history is stored separately and treated as authoritative in all prep brief generation. This eliminates the most common trust killer: the AI producing a brief that contradicts what the executive knows to be true about their own career.

---

## Tech stack

- **Next.js 16** (App Router, server actions, TypeScript throughout — no separate API layer for most operations)
- **Supabase** (Postgres, row-level security, auth, JSONB for career history and scan data)
- **Railway** (hosting, auto-deploys on every push to main)
- **Anthropic Claude API** (claude-sonnet-4-6, streaming and non-streaming, all AI generation)
- **Tailwind CSS**

The codebase is clean. Server actions handle form submissions directly. The prep brief generation is a streaming endpoint in `src/app/api/prep/[id]/route.ts`. The LinkedIn import lives in `src/app/api/linkedin-import/route.ts`. The daily briefing is a background job.

One thing to know about the deployment setup: Supabase migrations do not run automatically. When a DB schema change is needed, we write a `.sql` file in `supabase/migrations/`, review it, and run it manually in the Supabase SQL Editor. Railway picks up code changes on push. There is a pre-commit hook that blocks commits with TypeScript errors or em dashes in source files (house style: no em dashes in any AI-generated or source file content).

---

## Two documents attached

I am attaching two internal planning documents. Read these before looking at the code.

**`persona-friction-analysis.md`** — An honest assessment of the 8 personas the platform serves: CIO, CTO, VP of Technology, CDO (data), CDO (digital), CISO, CPO, and COO. For each persona it covers the search dynamic, pre-trial pushback, in-product friction, critical failure mode, and win condition. This is the product strategy document. It tells you who the users are, what makes them hard to convert, and what the product has to do to keep them. A developer who understands this document makes better decisions.

**`persona-quality-roadmap.md`** — The full product quality roadmap. It grades the current product against each persona's win condition (current platform average: D+), identifies the root causes in the code, and lays out 6 sprints (PQ1 through PQ6) that take the platform to B+ by end of Q2 2026. PQ1 and PQ2 are complete and deployed. The next sprint is PQ3.

---

## What PQ3 looks like

PQ3 is the highest-impact remaining sprint. The role-type field and function now exist (PQ1). Verified career history now feeds the AI (PQ2). What is missing: the actual per-role content that makes each brief read like it was written by a different expert for a different function.

The sprint involves filling out `roleTypeContext()` in `src/lib/prompts.ts` for all 8 role types with full per-role guidance — specific framing rules, forbidden language, required sections (CISO needs a board communication strategy section; COO must not use technology transformation language at all), and B2C vs B2B detection for CPO. The definition of done is: run a test brief for each of the 8 role types, and a CIO brief and a COO brief must be clearly distinguishable at first read.

The full task list with detailed instructions per role type is in `persona-quality-roadmap.md` under "Sprint PQ3 Detail."

---

## What I would want from you

Own PQ3 end to end. That means reading the two documents, understanding the win condition for each persona, then filling in the prompt content and wiring it correctly. I review PRs before merge — not because I do not trust the work, but because every merge goes straight to production.

Weekly sync to stay aligned. Tell me upfront what a realistic timeline looks like for you.

---

## What is in it for you

That is a conversation worth having directly. I want to make it worth your time and do right by you if this goes somewhere. Let me know you are in and we will sort it out.

---

## Access

Send me your GitHub username and I will add you to the repo as a collaborator. I will share the `.env.local` file directly — you will need it to run the project locally. You do not need Railway or Supabase access to build; all schema changes go through the migration file pattern described above and I run them on the Supabase side before or after the code deploy.

Interested?

Rich

---

*Attachments: `persona-friction-analysis.md`, `persona-quality-roadmap.md`*
