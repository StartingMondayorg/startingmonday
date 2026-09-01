# MandateSignal / Relationship Engine
## Engine change log and working agreements for Chris

**Prepared for:** Chris  
**Prepared by:** Rich, with Claude as analysis support  
**Date:** 2026-08-28  
**Status:** Revised working copy; the original handoff is preserved verbatim at [docs/inbox/Engine_Change_Log_and_Working_Agreements_for_Chris-2026-08-28.md](../inbox/Engine_Change_Log_and_Working_Agreements_for_Chris-2026-08-28.md)

## Read this first

You are changing the scan engine while Sol works on build items, Teddy owns schema and jobs, and scheduled work may run unattended. The safest assumption is that a change can affect a customer artifact, a scheduled cycle, or another product even when the local edit looks small.

**Stop and coordinate before shipping any change that changes a rule, data class, source, schema, prompt, schedule, renderer contract, recipient, credential, or external shared state.** Record the decision, owner, evidence, rollback, and affected consumers before implementation.

This document describes the intended operating boundary. It does not by itself prove that a system is live, deployed, legally approved, or ready for customer use. Those claims require commit-pinned repository evidence, hosted evidence, or owner/provider approval as applicable.

## 1. System boundary

MandateSignal remains a separate product, repository, database, deployment, tenant boundary, and release process from Starting Monday. A shared design pattern or aggregate learning proposal must not become shared tables, cross-product reads, synchronous dependencies, customer-level exports, or a shared release path.

The engine may use one logical pipeline with vertical configuration packs. That means common code and versioned contracts, not a shared runtime or data plane across products. A configuration pack may narrow an approved rule; it may never loosen a privacy, source-rights, tenant, or delivery control.

The current product surfaces include account monitoring / weekly delta briefs, deep-dive or prospect briefs, and narrowed client-facing collateral. Each surface must retain its own contract, renderer/version, QA checks, evidence standard, and owner.

## 2. Authority and evidence

Use this order when documents or instructions disagree:

1. Law, signed provider terms, privacy decisions, and launch controls.
2. Product-local deployed behavior verified in the same review cycle.
3. Executable code, migrations, and passing tests at a pinned commit.
4. The MandateSignal GA control register and applicable product-local readiness records.
5. The canonical cross-product signal-engine plan and its named `WS#-##` story.
6. Approved strategy documents, change logs, and briefs.
7. Informal precedent or memory.

The Drive amendment log is a coordination record, not a replacement for product-local release authority. A decision affecting MandateSignal must also have a product-local record or linked issue before it ships. A cross-product change requires the governing `WS#-##` story, applicable `DG-*` decisions, acceptance evidence, rollback/kill behavior, and confirmation that the change does not violate product separation.

Label claims as `CLAIMED`, `IMPLEMENTED`, `TESTED`, `DEPLOYED`, `MEASURED`, or `BLOCKED_EXTERNAL`. Do not describe a scheduled task, source, config pack, schema, or customer result as live from this document alone.

## 3. Live-state protection

The Monday and Tuesday John Dunn jobs are treated as protected consumers until their current deployment and ownership are verified. Do not rename, move, overwrite, or restructure their Drive folder, baseline files, Gmail labels, task prompts, trigger IDs, or output naming patterns without a coordinated change.

Before changing a shared contract:

- Identify every reader, writer, scheduled trigger, renderer, and downstream recipient.
- Announce the proposed change to Rich, Sol, and Teddy when their surfaces are affected.
- Make schema changes additive; never rename or repurpose an existing field.
- Update all consumers in one reviewed change.
- Test old and new fixtures, including an interrupted or partially failed run.
- Capture a rollback or forward-fix procedure.
- Observe the next scheduled cycle before declaring the change complete.

Nothing auto-sends. Briefs, drafts, client collateral, and outbound messages must stop at a human review step. Testing must use a safe recipient or a draft; never send to a customer merely to prove a path.

## 4. Data, source, and privacy red lines

- Client account intake is company-name-only unless a separately approved contract says otherwise. Do not add contacts, revenue, contract terms, or candidate data to the account-list path.
- Person names may appear only as attributes of dated, linked public events. Do not create person profiles, cross-company individual tracking, or inferred personal attributes.
- Contact data is BYO only. Do not store, redistribute, or use a customer's Apollo, ZoomInfo, Clay, or similar contact data in shared engine tables or model training. Enrichment must occur in the customer's licensed workspace under an approved authorization model and be audit-logged.
- Do not fetch LinkedIn directly. Search-index snippets must be labeled and treated as lower-confidence evidence. Do not republish paywalled or regional-press text; cite the source and preserve only the minimum necessary internal evidence.
- Every fact requires a date and source URL. Separate fact, coverage, and inference. Inference is a hypothesis to investigate, not a diagnosis to announce.
- Client-facing artifacts must use approved source classes and show a transparency note. Do not remove material uncertainty, coverage gaps, stale-source indicators, or rights restrictions merely to improve sales copy.
- Never introduce a cross-product table, direct cross-product query, stable customer-level identifier, event-level export, or synchronous Starting Monday dependency without an approved governance decision and product-local evidence.

The Apollo interpretation in the original handoff is a risk input, not legal advice or permission. The DataEndure exposure remains an open remediation item and must not be treated as a precedent.

## 5. Change protocol

A change requires a short entry before implementation when it affects any of the following:

- data class, retention, deletion, consent, person/contact handling, or source rights;
- database schema, RPC, migration, JSON/YAML contract, baseline, or artifact naming;
- scheduled task, prompt, search budget, source adapter, Gmail/Drive state, or recipient;
- brief type, renderer, pricing, sample-depth rule, customer claim, or outbound behavior;
- authentication, authorization, tenant boundary, secret, provider, or release configuration.

The entry must state: decision ID, problem, proposed change, affected consumers, owner, implementation owner, acceptance test, evidence location, rollback/kill action, and whether a new plan story or owner approval is required. Reversals are new decisions; old entries are never rewritten.

A config-pack request that cannot be expressed without special-case code is a template issue first. Three repeated issues may justify a new versioned seam. Do not silently add a fourth vertical exception.

## 6. Ownership and coordination

- **Rich:** product decisions, pricing, external shared state, customer delivery, final outbound approval, and launch authority.
- **Chris:** scan-engine implementation and proposed engine changes; must raise contract, source-rights, schema, scheduler, or prompt changes before shipping.
- **Sol:** build queue and template/config-pack work; coordinate before changing shared renderer or prompt seams.
- **Teddy:** schema and job scaffolding; coordinate migrations, RPCs, scheduled jobs, and rollback evidence.

Ownership does not grant permission to change another person's surface. A handoff is complete only when the affected owner acknowledges the change and the evidence is linked.

## 7. Current product rules

The value-cover format leads with the customer's problems, supported economic implications, what the brief does, and the price. Use **Tactics**, SPIN-ordered discovery questions, and investigate-first positioning. Do not present an inferred diagnosis as established fact.

Sample mode provides one free full-depth artifact per prospect. Additional editions or deep dives are teaser-only until paid. The current approved commercial reference is a $2,500 first report/deep dive and a $599/month weekly delta subscription. Any pilot, family favor, or grandfathered account is an explicit owner decision, not a general pricing rule.

These rules govern rendering and offer language only when the relevant product-local contract and tests support them. Do not copy pricing or brief policy into an engine config without versioning and consumer review.

## 8. Handoff checklist for every engine change

Before merge or deployment, Chris should be able to answer yes to each item:

- Is the change inside MandateSignal's product and data boundary?
- Is the controlling decision, story, or owner approval identified?
- Did we identify every scheduled, schema, prompt, renderer, and data consumer?
- Did we preserve additive compatibility and old artifact reproduction?
- Are source rights, person/contact rules, retention, and consent unchanged or explicitly approved?
- Are search budgets, coverage failures, retries, and quiet/no-result states observable?
- Does outbound work still terminate in a draft or human review step?
- Did focused tests, contract fixtures, and the applicable build gate pass?
- Is the rollback or kill action written down?
- Is the next scheduled cycle assigned an observer and a success check?

If any answer is no, stop at implementation or review and raise the item to Rich. Do not solve the uncertainty by changing a prompt, schema, source, recipient, or config locally.

## Open items requiring owner or external action

- Verify the actual deployed state, ownership, and current contracts of the John Dunn Monday/Tuesday jobs before treating their stated behavior as production fact.
- Resolve the DataEndure contact-data exposure under provider terms and an approved remediation plan.
- Decide Stage-1.5 retention and deletion periods.
- Record the actual regional-press subscriptions and spend against the approved cap.
- Confirm Phase B authorization only after the required edition and customer reaction evidence.
- Reconcile pricing and pilot language across renderer, collateral, config packs, and strategy records.
