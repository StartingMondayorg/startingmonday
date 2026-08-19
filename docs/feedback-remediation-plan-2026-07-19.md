# Feedback Remediation Plan — Thomas + Aleksei (2026-07-19)

Source analysis: two independent testers converged on one root cause — product
intelligence is not translated into personalized, actionable guidance.
Feedback docs: docs/Aleksei feedback 7.docx, Thomas email 2026-07-19 (pasted in chat).

Order of execution matches the rated priority (importance x urgency). Each item
has concrete file targets, an approach, and acceptance criteria. No unverified
outcome claims may be added to any copy produced in this work.

---

## Phase 1 — Verified defects (this week)

### 1.1 Wire star_stories + career_history_json into prep sub-routes  [T1, P0]

Verified gap: the main brief route selects and uses these fields; sub-routes do not.

- Main route (correct reference implementation): src/app/api/prep/[id]/route.ts
  - Selects: `career_history_json, role_context, star_stories` (line ~110)
  - Has `buildStarStoriesSection()` + `ProfileRow` type (lines ~176-240)
- Sub-routes missing the fields (verify each select before editing):
  - src/app/api/prep/[id]/questions/route.ts  (highest value — "Likely Questions" is where stiff answers hurt most)
  - src/app/api/prep/[id]/wins/route.ts
  - src/app/api/prep/[id]/why-here/route.ts
  - src/app/api/prep/[id]/priorities/route.ts
  - src/app/api/prep/[id]/challenges/route.ts
  - src/app/api/prep/[id]/leadership/route.ts
  - src/app/api/prep/[id]/competitive/route.ts
  - src/app/api/prep/[id]/tech-stack/route.ts
  - src/app/api/prep/[id]/background/route.ts

Approach:
1. Extract shared helpers to a new module `src/lib/prep-profile-context.ts`:
   - `PREP_PROFILE_SELECT` (single canonical select string incl. star_stories, career_history_json, role_context, search_persona)
   - `buildStarStoriesSection(profile)` (move from main route; keep main route importing it)
   - `buildCareerHistorySection(profile)` (formats career_history_json into prompt text)
   - `buildRoleSpecificContext(profile)` (move from main route)
2. Update each sub-route: swap select string, inject the sections into the
   CANDIDATE block of the prompt. Questions route additionally gets the
   "reference the story explicitly in the answer frame" instruction (already
   written in buildStarStoriesSection).
3. Sequence: questions -> wins -> why-here -> remaining six.

Acceptance:
- A profile with 3 STAR stories produces Likely Questions answers that reference them.
- All existing route tests pass; add one test per updated route asserting the
  select includes star_stories (mock-level check).
- `npm run build` green.

### 1.2 Guided missing-input state in interview prep  [A-2.11, P0 — demo killer]

Target: src/app/(dashboard)/dashboard/companies/[id]/prep/prep-client.tsx
(warnings block at ~line 1165, "Career history missing").

Approach:
- Replace the flat warning cards with one consolidated "Brief readiness" card:
  - Checklist with state per input: career history, positioning, target roles, company notes.
  - Each unmet item gets explicit paths: "Add manually" (existing profile links),
    "Import from resume" (prefill from resume_text where derivable).
  - Progress indicator (e.g., 2 of 4 ready) instead of a wall of amber warnings.
- Copy frames it as a guided next step, not a blocked state (Aleksei 2.11 wording).

Acceptance:
- Empty-profile user sees a single guided card with actionable paths, never a dead end.
- Aleksei review account no longer shows "Career history missing" after 1.3.

### 1.3 Demo/review account audit  [P0 — sales-critical]

Targets: scripts/seed-demo.ts, scripts/seed-aleksei-review.ts

Approach:
- Verify both seeds populate: career_history_json, star_stories, positioning_summary,
  target_titles, beyond_resume. Add any missing fields with persona-consistent content
  (Sarah Chen; Alex Morgan from docs/inbox/legacy-root-intake/Anonymized_Candidate_Profile_for_Starting_Monday_Demo.docx).
- Re-run both seeds against production (env gotcha: real values FIRST in .env.local;
  placeholders later — set explicitly in-shell per repo memory).
- Manual pass on the review account through Aleksei's 2.13 checklist
  (strategy understood / companies why / signals why / contacts why / today's action / navigation).

Acceptance:
- Prep brief on review account personalizes background with zero missing-input warnings.

---

## Phase 2 — Trust spine ("it understands me")

### 2.1 Campaign Foundation: "What we understood about your search"  [A-2.4]

Approach:
- New component at the top of the dashboard home (or its own card zone):
  target roles, target sectors, positioning statement, differentiators,
  filters (location/travel if present), roles to avoid (field may need adding),
  and a one-line search hypothesis.
- Data source: user_profiles (existing fields cover ~80%). Add `roles_to_avoid text[]`
  and `search_hypothesis text` via migration if product review agrees.
- Every line links to its edit surface on /dashboard/profile.
- Empty fields render as prompts ("Add your positioning") — the card doubles as
  onboarding completion driver.

Acceptance:
- New user sees an accurate strategy summary in first session; every field editable in <=2 clicks.

### 2.2 Why-chain on daily actions  [A-2.5]

Approach:
- Locate daily-actions generation (dashboard operating rhythm / "today's actions" job or route).
- Extend the action payload to a structured logic chain:
  `{ action, why_now (signal_id + one-liner), why_you (profile-match one-liner), buttons: view signal / view company / view contact / draft message }`
- Generation prompt must consume the user's positioning + the triggering signal.
- UI: render the chain under each action (Aleksei 2.5 example is the spec).

Acceptance:
- Every recommended action displays why-now and why-you with working deep links.
- No action renders without a reason attached.

---

## Phase 3 — Intelligence translation + orientation

### 3.1 Candidate-specific signal translation  [A-2.6]

Approach:
- Extend signal rendering (dashboard/signals page + company signals tab) to a
  three-part layout: What happened / Why it may matter for YOUR search / What to do next.
- `signal_summary` covers part 1; `outreach_angle` is currently generic-persona —
  regenerate or augment at read-time with the user's positioning_summary and target_titles.
- Prefer a new column `candidate_relevance` (migration) populated by the signal job
  using profile context; fall back to outreach_angle when absent.
- "What to do next" maps signal_type -> recommended move (research / contact / prep / ignore)
  with links.

Acceptance:
- Signals page shows the three-part card for new signals; each includes at least
  one profile-specific noun (role, sector, or positioning term), not just persona boilerplate.

### 3.2 Breadcrumbs + consistent back buttons  [A-2.3]

Approach:
- New shared component `src/components/Breadcrumbs.tsx`.
- Apply to: companies/[id], companies/[id]/prep, contacts/[id] (+ outreach),
  signals detail surfaces, strategy, briefs.
- Pattern: Dashboard > Companies > {Name} > Interview Prep.
- Remove reliance on browser back anywhere a modal/page transition exists.

Acceptance:
- Every detail page shows breadcrumbs and an explicit back affordance.

### 3.3 Company fit card  [A-2.7]

Approach:
- Card at top of companies/[id]: fit score (exists: companies.fit_score),
  "why this fits" bullets, "risks to verify" bullets, best roles to watch.
- Generate via a small endpoint reusing prep-brief context (profile + signals + notes);
  cache to a new `fit_summary jsonb` column on companies; regenerate on demand.

Acceptance:
- Company page answers "why this company, why me, what to verify" above the fold.

---

## Phase 4 — Roadmap (spec before build)

### 4.1 Search Strategy Intake Form  [A-1 — coach-channel bridge]
- Staged form per Aleksei's field list (target/stretch/avoid roles, industries,
  companies, size/stage, geography, comp, culture criteria, positioning,
  differentiators, proof points, relationship targets, red flags, decision criteria).
- Imports into user_profiles + drives Campaign Foundation (2.1) and prep context.
- Coach-shareable: completable by client alone or with a coach — this is the
  Lead Forward referral wedge. Write a one-page spec first; review with Aleksei
  before building (it converts him from critic to design partner).
- Spec draft: docs/search-strategy-intake-form-spec.md

### 4.2 Seniority calibration in prep outputs  [T2]
- Derive target seniority from target_titles + attached job_description document;
  add a calibration instruction block to prep prompts (associate/manager/director/VP/C-suite).
- Do NOT chase the associate segment; this is about register accuracy for the existing ICP.

### 4.3 Role & Culture Fit Check module  [A-2.8]
- Company-page module: consultative-vs-transactional, leadership support, comp clarity,
  travel, autonomy, growth path, red flags + generated interview questions.
- Depends on 4.1 fields (culture criteria) — sequence after.

### 4.4 Workspace visual-density pass  [A-2.12 — handle with care]
- Scope: logged-in workspace only. The landing/editorial dark standard
  (docs/landing-page-standard.md) is NOT in scope and does not change.
- Changes: more whitespace between zones, orange reserved for single primary action,
  clearer section headings (Daily Command Center / Search Campaign Workspace per A-2.1/2.2),
  reduced card text density.
- Consider an optional light workspace theme only after measuring; one opinion is not a mandate.

---

## Cross-cutting

1. New acceptance gate: "5-minute comprehension" — Aleksei 2.13 as a checklist,
   runnable via the Page Experience Auditor agent against /dashboard routes.
   Add to release checklist for Phases 2-3.
2. Re-engage Aleksei after Phase 2 ships: invite second review + share the 4.1 spec.
   His approval unlocks the coach referral channel (Motion 3).
3. Thank-you notes to both testers referencing the specific items shipped.

## Verification protocol (every phase)
- Unit/route tests updated alongside changes; `npm run test` green.
- `npm run build` (runs all pre-commit gates) green before commit.
- Stage on `staging`, verify on review account, then push staging:main per deploy flow.
