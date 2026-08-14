# Starting Monday Intelligence and Job Scanner

## Purpose

This document gives Chris a concise view of what the intelligence and job-scanning system is, what it watches, how it works, why it is robust enough to build on, where its current limits are, and what remains before the related engineering epics can be closed.

The short version: Starting Monday watches a user's chosen companies and public signals so an executive can learn about a relevant opportunity before it becomes a generic job-board event. It turns scattered public information into a prioritized next action.

## The Center of Gravity: Relationship Building

The scanner is not the product's end goal. It is the timing and context engine for a relationship-building system.

Starting Monday helps an executive decide **who to contact, why now, what to say, and what to do next**. The core loop is:

1. **Watch the market.** Scan target companies, roles, leadership changes, funding, expansion, and other public signals.
2. **Choose the right person.** Connect a company or role signal to existing contacts, suggested people to reach, coaches, recruiters, or other relevant relationships.
3. **Create a credible reason to reach out.** Use the signal, company context, role context, and the user's positioning to make outreach specific rather than generic.
4. **Take the relationship action.** Draft or send outreach, add the person to the pipeline, schedule a follow-up, or record a conversation.
5. **Protect follow-through.** Follow-up dates, calendar views, reminders, and the daily briefing keep a promising relationship from going quiet.
6. **Learn and compound.** Contact history, touchpoints, outcomes, and company intelligence create a stronger context base for the next conversation.

This is the distinction between a job alert and an executive search operating system. A job alert tells someone that a role exists. Starting Monday is meant to help them build the relationships that make them credible before, during, and after that role becomes public.

### Relationship workflows already in the product

- **Contacts and relationship records:** Maintain people, titles, companies, notes, status, and relationship context.
- **People to Reach:** Surface relationship actions from the daily briefing and connect them to a current company or role signal.
- **Outreach Hub:** Draft, review, send, suppress, reconcile, and measure outreach with audience and confidence controls.
- **Follow-Up Manager and Calendar:** Track due dates, overdue actions, contact-linked follow-ups, and completion so momentum survives a busy week.
- **Company and pipeline context:** Keep the relationship attached to a target company, role, stage, interview, or offer rather than treating outreach as an isolated message.
- **Briefing and coaching rhythm:** Turn signals and stale follow-ups into one concrete relationship move for the day or the next coaching conversation.
- **Board and long-horizon relationship cadence:** Support relationship warmth, cadence tiers, and patient relationship development for board-track and executive opportunities.

### Business value of the relationship layer

The value is not simply saving research time. It improves the quality and timing of conversations:

- **More relevant outreach:** A real company event gives the executive a reason to contact someone now.
- **Higher trust:** Messages can be grounded in the recipient's company situation and the sender's actual experience.
- **Less relationship leakage:** Follow-up tracking reduces the number of promising contacts that disappear after one conversation.
- **Compounding advantage:** Each contact, touchpoint, and outcome improves the user's working context instead of disappearing into an inbox.
- **Coach leverage:** Coaches can review relationship momentum, stalled lanes, and next actions rather than manually reconstructing a client's week.
- **Retention beyond a single job search:** Relationships, board positioning, and market intelligence remain useful when a user is employed or post-placement.

## The Product in One Sentence

Starting Monday is a relationship-building operating system for executive search, with an intelligence layer that monitors target companies, detects relevant leadership roles and precursor signals, and turns those signals into specific conversations, follow-ups, and pipeline actions.

## What It Scans

### Career pages and job postings

For each company in a user's watchlist, the scanner can inspect the company's public career page or supported applicant-tracking-system feed. It looks for roles related to the user's target titles, functions, seniority, and company-specific watch description.

The scanner is intentionally focused on public pages. It does not depend on LinkedIn Jobs, authenticated recruiter boards, or a user's credentials for third-party sites.

Supported paths include:

- Structured ATS feeds where available, including Greenhouse, Lever, SmartRecruiters, and other adapters in `worker/scanner/ats-adapters.js`.
- Static public career pages through a normal HTTP fetch.
- JavaScript-rendered career pages through Browserless when a normal fetch returns an application shell or too little visible text.

### Company intelligence signals

The broader intelligence worker also gathers public company signals that can precede a leadership search:

- News and press coverage
- SEC filings and material events
- Executive hires and departures
- Funding, acquisition, expansion, and restructuring signals
- Company press rooms and public press wires
- Career-page hiring activity
- Correlated patterns across signals within a time window

The current signal catalog and source restrictions are maintained in `config/signal-source-catalog.json` and documented in `docs/onboarding/06-product-intelligence.md`.

## How a Job Scan Works

1. **Select a due company.** The worker scans companies that are due according to the scan cadence. A successful scan is not repeated inside the 48-hour deduplication window.
2. **Check robots rules.** The scanner checks whether the public URL allows the request. A disallowed page is recorded as blocked rather than silently treated as empty.
3. **Choose the least expensive reliable fetch.** It first tries a browser-like HTTP request. Known single-page-app career hosts and sparse HTML are escalated to Browserless rendering.
4. **Protect the fetch boundary.** The fetcher accepts only HTTP and HTTPS URLs and rejects localhost, private network ranges, and cloud metadata addresses to reduce SSRF risk.
5. **Extract visible text.** HTML is reduced to usable page text before role detection. Scripts, styles, markup, and common entities are removed.
6. **Find candidate roles.** Lightweight heuristics look for seniority and function terms, target-title matches, and plausible title-length boundaries. The detector caps candidates at 20 so one noisy page cannot create an unbounded AI workload.
7. **Score candidate fit.** Claude Haiku evaluates each candidate against target titles, sectors, role type, and the user's optional company-specific description. It returns a bounded score, match decision, and one-sentence explanation.
8. **Identify new matches.** Previously seen titles are compared case-insensitively so the same role is not repeatedly treated as new.
9. **Persist an auditable result.** Each scan writes a result with timestamp, status, raw detected hits, highest score, summary, and error information when applicable.
10. **Surface the next action.** Matching roles can feed alerts, the company page, the pipeline, outreach drafting, and preparation workflows.
11. **Create outcome labels.** Newly detected leadership postings can be recorded as `career_scan` role openings. Those labels support later lead-time and precursor analysis without making outcome labeling a dependency of the scan itself.

## Why the Scanner Is Robust

The scanner is not robust because it assumes every career page looks the same. It is robust because it has explicit fallbacks and failure states.

### Layered acquisition

- ATS adapters avoid browser rendering when a reliable structured feed exists.
- Plain fetch is fast and inexpensive for sufficiently rich static pages.
- Browserless rendering handles client-side career boards and sparse application shells.
- Explicit blocked statuses distinguish access denial from an empty result.

### Bounded and defensive behavior

- Robots checks run before a new page is scanned.
- Private and internal network targets are rejected before fetching.
- Fetches have timeouts and redirect handling.
- Candidate extraction has length and count limits.
- AI output is requested as JSON and safely falls back to a non-match if scoring fails.
- A scan failure is stored instead of disappearing from the system.
- Scan writes are tied to the company and user, preserving tenant context in the result record.

### Duplicate and silent-failure controls

- Successful scans are not repeated within 48 hours.
- Previously observed titles are not repeatedly marked as new.
- Three consecutive empty or failed scans trigger an administrative notification path.
- The UI distinguishes no career URL, blocked pages, and scan-in-progress states so "no result" does not automatically mean "no job exists."

### Operational visibility

The worker emits structured logs for fetch strategy, ATS selection, candidate counts, matches, blocked pages, scoring errors, and completed scans. The monitoring and release workflows are designed to catch stale or failing scheduled jobs rather than allowing the scanner to fail silently.

## How a User Uses It

1. Add a target company to the watchlist.
2. Add or confirm the public career-page URL.
3. Describe the kind of role to watch for; specific beats generic.
4. Let the scheduled scanner monitor the page.
5. Review a new role or company signal in the dashboard or briefing.
6. Move the opportunity into the pipeline, draft outreach, or generate a company and interview preparation brief.
7. Keep the company on the watchlist even after a quiet period; the value is early detection, not just reacting to posted jobs.

The current product copy describes the standard cadence as three scans per week, with more frequent scanning available for the Executive tier. Actual cadence is controlled by worker schedules and should be confirmed against the deployed worker configuration before making a contractual promise.

## Business Value

### For an executive

- **Earlier timing:** Relevant roles can be seen on the company's own page before a user notices them on a general job board.
- **Better focus:** The candidate sees a short list tied to their target instead of searching thousands of irrelevant postings.
- **Higher-quality action:** A match can lead directly to a preparation brief, pipeline entry, or outreach draft.
- **Lower cognitive load:** The platform watches a finite set of target companies while the executive spends time on relationships and positioning.
- **Confidentiality:** The workflow supports a quiet search without requiring broad public job-board activity.

### For a coach or search advisor

- **Leverage:** Monitoring work that would otherwise require repeated manual research becomes part of the client operating system.
- **Better conversations:** Coaching sessions can start from a real company signal or role rather than a vague weekly update.
- **Retention:** Intelligence monitoring remains useful when a client is employed, in a quiet search, or post-placement.
- **Evidence:** Scan history and signal history create a shared record of what changed and when.

### For Starting Monday as a business

- **Differentiation:** The product is focused on a chosen-company intelligence layer, not generic job aggregation or mass application automation.
- **Retention:** A watchlist and accumulated scan history create ongoing utility and data gravity.
- **Expansion path:** Signals can support monitoring, active search, preparation, outreach, salary intelligence, and post-placement retention tiers.
- **Defensibility over time:** The strongest moat is not fetching today's news. It is the historical dataset connecting precursor events, leadership changes, job openings, role families, and time-to-opening.

## Important Boundaries

The scanner should be described accurately:

- It scans public pages and feeds; it cannot guarantee access to a site that blocks automation.
- A blocked page is an operational state, not proof that no role exists.
- A career-page scan detects postings; it does not predict with certainty that a company will open a role.
- AI scoring prioritizes candidate review; it is not a hiring decision or a guarantee of fit.
- Results depend on the quality of the career URL, the user's target profile, source availability, and the freshness of the deployed worker.
- Third-party source terms and commercial-use restrictions must remain part of launch governance.

Known product risks include career-page redesigns, anti-bot systems, missing source coverage, and source-specific terms of service. The current mitigation strategy is layered fetching, explicit failure reporting, source catalog compliance metadata, user transparency, and a fallback to manual review when automation is blocked.

## Epic Closure: What Is Still Needed

### Current implementation status

The closeout work has now added and verified several concrete controls:

- Strict API guard audit: 0 true auth gaps.
- Forwarded-header rate-limit hardening: rightmost-hop regression test passes.
- Nonce-based proxy CSP: source and production build pass; production header validation still requires deployment of this change.
- Sentry release identity: web and worker runtimes now use the deploy SHA when configured.
- Tier-0 accessibility gate: `/`, `/login`, and `/signup` pass serious/critical axe checks locally.
- Lighthouse and performance checks: wired as required checks in the branch-protection manifest.
- Monitoring closure workflow: added as a scheduled/manual evidence harness for security, debt, agents, and observability.
- Page Experience Auditor artifact: published successfully and consumed by calibration loop run `31769784492`, which completed successfully.
- ZAP baseline workflow: added for scheduled/manual staging scans through `.github/workflows/zap-baseline.yml`.
- Sentry release-health workflow: added for comparing two deploy-SHA releases through `.github/workflows/sentry-release-health.yml`.

The current repository measurements still show that the broader initiative is not fully closed: 217 placeholder test files remain against a target of 200, the deep-dive report lists more than 14 files above 800 lines, and monitoring route/action coverage is below its tier-1 targets. ZAP and Sentry release-health workflows are now wired but still require their external staging/Sentry secrets and successful hosted runs. GitHub push protection and the two-week green history remain intentionally excluded from this closeout pass.

The roadmap's Codebase Health Remediation initiative is organized into four epics: Security Hardening, Technical Debt Reduction, Agent Fleet Buildout, and Observability/SLOs/Release Gates. The latest repository evidence shows meaningful implementation, but the plan's initiative-level exit gate is stricter than "the workflows exist."

### Initiative-level exit evidence

To close the parent initiative, all of these need evidence:

- Security deep-dive reports zero true authentication gaps and the production CSP no longer relies on unsafe script directives.
- Debt metrics meet the plan targets: placeholder tests at or below 200, lint warnings at or below 450, explicit `any` usage at or below 150, and files over 800 lines at or below 14.
- All ten roster agents are live, registered, and healthy in the monitoring watchdog.
- SLO burn-rate alerting, structured logs, Sentry tracing/release health, and severity routing are live and documented.
- New CI gates remain green for two consecutive weeks without baseline increases.

### Epic A - Security Hardening

Close only after the remaining security implementation and proof are complete, not just after CodeQL and secret scanning exist:

- Confirm all route/auth gaps are remediated with the strict security audit at zero true gaps.
- Finish and validate nonce-based CSP in production, including Stripe, PostHog, Turnstile, and Sentry compatibility.
- Verify dev-auth code is excluded from production output and rate-limit identity cannot be spoofed through forwarded headers.
- Run the ZAP baseline against staging and triage high findings; the workflow is now wired, pending `ZAP_STAGING_URL` or a manual target URL.
- Confirm GitHub push protection is enabled in repository settings.

### Epic B - Technical Debt Reduction

Close after the metric targets and decomposition work are demonstrated in CI:

- Replace the remaining placeholder tests in both planned waves; the current placeholder count is 217, so 17 more real behavior-test replacements are needed to reach the stated target.
- Ratchet coverage thresholds only after real test coverage supports them.
- Finish the listed god-file decompositions and dashboard data extraction.
- Complete palette debt waves and repo hygiene cleanup.
- Prove lint and `any` baselines trend downward for the required period rather than simply freezing today's values.

### Epic C - Agent Fleet Buildout

Close after every roster agent has a working schedule, a useful output, an owner or runbook, and a green watchdog history:

- Complete Debt Ratchet, Security Sentinel, Dependency Update, Test Realness, God-File, Hygiene Janitor, and synthetic gap agents.
- Triage the branches surfaced by the Unshipped Code Agent.
- Add the outreach-draft and contact-follow-up synthetics.
- Repair the monitoring backlog: the deleted `site-sweep-agent.yml` registry reference was removed and the affected experience reports, dashboard baseline, and portfolio rollup checks have passed. The strict route/action coverage target remains open at 55/270 routes and 22/308 actions.
- Hold the full roster green for the initiative's two-week evidence window.

### Epic D - Observability, SLOs, and Release Gates

Close after observability is queryable and tested in production:

- Define the SLO catalog and prove multi-window burn-rate alerts with a staged test.
- Ship structured JSON logs to a queryable store with retention and documented queries.
- Enable Sentry traces on the three priority routes.
- Prove two deploys are tracked as distinct Sentry releases keyed by deploy SHA, including a regression test; the workflow is now wired and requires `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT`.
- Publish and enforce the Sev-1 versus Sev-2 policy across alert workflows.
- Make the axe-core accessibility gate and Lighthouse/header budgets required checks.

## Recommended Closeout Sequence

1. Finish the current monitoring runs and capture their conclusions.
2. Run the security and debt deep-dive audits; compare results to the plan baselines.
3. Build a ticket-by-ticket evidence table for SMK-401 through SMK-447, marking each as shipped, verified, blocked, or intentionally deferred.
4. Resolve high-risk blockers first: auth/CSP, scanner reliability and legal boundaries, missing observability evidence, and unbounded debt metrics.
5. Keep the scanner's public contract conservative until the production worker cadence, alert latency, block-rate handling, and source compliance evidence are measured.
6. Run the full CI and monitoring gates for two consecutive weeks without baseline increases.
7. Close the epics with links to the audit reports, dashboards, workflow runs, test evidence, and any explicit deferrals approved by the owner.

## Suggested Message to Chris

Starting Monday is not just a job board. It is a private intelligence and execution layer for an executive search. A user chooses the companies that matter, and the system watches their public hiring and company signals, filters noise against the user's target, and turns meaningful changes into a next action: prepare, reach out, or move the opportunity into the pipeline.

The core scanner is already built with layered acquisition, ATS support, Browserless fallback, robots and SSRF protections, bounded detection, AI fit scoring, deduplication, explicit failure states, and outcome labeling. The remaining work is primarily proof and operational maturity: close the security and debt evidence gates, finish the agent fleet, make observability queryable, and demonstrate that the scanner stays trustworthy when career sites change or block automation.

That is the difference between a promising feature and a dependable intelligence product.
