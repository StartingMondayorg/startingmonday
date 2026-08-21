# Intelligence and Job Scanner: Independent Assessment

**Date:** 2026-08-13
**Author:** Chris Goodwin (with Claude Code)
**Subject doc:** `docs/chris-intelligence-job-scanner-overview.md` (PR #401, commit `479b3b80`)
**Status:** Findings only. No code changes made or proposed for merge.

---

## Scope and method

This assesses the scanner described in Rich's overview doc against two sources of evidence:

1. **Repository read** of `worker/scanner/*`, `worker/jobs/scan-job.js`, `worker/jobs/executive-scan-job.js`, and `worker/index.js`.
2. **Read-only SQL** against production Supabase (`mytnhoxcgvnzxhgcumkf`), 35-day window ending 2026-08-13.

All database access was `SELECT` only. No writes, no migrations, no code changes.

Claims below are labeled **Verified** (backed by command or query output in this session) or **Unverified** (inference pending measurement), per the truthfulness contract in `AGENTS.md`.

---

## Headline

The architecture is sound and the strategic framing in the overview doc is correct. The limiting factor is not the AI layer, it is **page acquisition**: quota errors, a scheduling collision, and missing career URLs. One customer-facing claim is currently inaccurate.

---

## Concerns, ranked

### 1. Browserless quota is the dominant failure mode

**Verified.** Of 154 scan errors in the 35-day window, **105 are HTTP 429 (Too Many Requests)** from Browserless. A further 44 are Browserless 500s. Together they account for 97% of all errors.

`MAX_CONCURRENT_SCANS = 10` in `worker/jobs/scan-job.js:9` fires a burst of renders at 08:00 UTC when the cron triggers. The scanner has no backoff or rate limiter in front of Browserless.

**Impact:** roughly 15% of all scans return nothing for a quota reason unrelated to the target site.

**Nature of fix:** plan tier, concurrency reduction, or request throttling. Not a design change.

---

### 2. Wednesday scans are largely skipped, making the "3x per week" claim inaccurate

**Verified.** Scan counts by weekday, 35-day window:

| Day | Scans | Success | Blocked | Error |
|-----|------:|--------:|--------:|------:|
| Mon | 269 | 206 | 10 | 53 |
| Wed | **108** | 44 | 12 | 52 |
| Fri | 252 | 197 | 9 | 46 |

Wednesday runs at roughly 40% of Monday and Friday.

**Cause (Verified by code read).** `RESCAN_WINDOW_HOURS = 48` in `worker/scanner/deduplicate.js:3` is checked against a Mon/Wed/Fri 08:00 UTC cron (`worker/index.js:310`). The Mon-to-Wed gap is exactly 48 hours. Monday's `scan_results` row is written *after* fetch and Haiku scoring complete, so its `scanned_at` lands a minute or more past the Wednesday cutoff. `wasRecentlyScanned` therefore returns true and the company is skipped.

**Why this matters commercially.** "3x per week" is a priced plan feature, stated in:

- `src/lib/plans.ts:11` ("Signal scans 3x per week")
- `src/app/onboarding/onboarding-done-step.tsx:142`
- `src/app/blog/cio-job-market-2026/page.tsx` (three separate mentions)

Standard tier is receiving approximately 2.4 scans per week, and which companies get the Wednesday scan varies nondeterministically with queue timing.

**Nature of fix:** reduce the window (for example to 40 hours) so it cannot collide with the cadence it is meant to protect. One line. Deliberately not implemented pending Rich's direction.

---

### 3. The event rate is inherently low, which validates the doc's framing

**Verified.** Across the full production base in 35 days:

| Measure | Count |
|---------|------:|
| Candidate titles detected | 740 |
| Scored as a match (`is_match`) | 45 |
| New **and** matching | **14** |
| Companies producing any hit | 56 |
| Active or trialing users | 65 |

That is roughly 0.4 new relevant roles per week across all customers.

**This is not a defect.** Executive roles are genuinely rare events. But it does mean the scanner cannot carry the value proposition alone, and any copy promising a steady stream of early alerts will underdeliver.

**This is the strongest argument for the overview doc's own framing.** The "center of gravity is relationship building, the scanner is the timing and context engine" position is the one the data supports. Recommend leading with it rather than treating it as a caveat.

---

### 4. A third of watchlisted companies are silently never scanned

**Verified.** 173 active (non-archived) companies exist. **112 have a `career_page_url`.** The remaining 61 are skipped at `worker/scanner/scan-company.js:18`, which returns `{ skipped: true }` with no user-facing consequence and no alert.

A user can watch a company for months, receive nothing, and have no indication that the cause is a missing URL rather than an absence of roles.

**Nature of fix:** UX prompt at company-add time, plus a dashboard state. Likely the highest impact-per-effort item on this list.

---

### 5. Detector recall risk on large career pages

**Verified (cap binding rate).** `MAX_HITS = 20` in `worker/scanner/detect-roles.js:14` uses a `break`, so it takes the first 20 matching lines **in page order**, not the 20 best. The cap binds on **18 of 231 productive scans (approximately 8%)**, and those are by definition the largest career pages, where a buried executive role is most likely.

Two contributing factors, both from code read:

- `LEVEL_KEYWORDS` includes `senior`, `manager`, `lead`, `staff`, `principal`. A page dense with "Senior Software Engineer" listings can exhaust the 20-slot budget before reaching a VP or Chief role further down.
- Target-title matching uses only the first word: `lower.includes(role.split(' ')[0])` at `detect-roles.js:34`. A target of "Head of Data" matches any line containing "head."

**Unverified:** the actual false-negative rate. This cannot be measured from `scan_results` alone, since missed roles leave no record. The existing `worker/jobs/scanner-miss-verifier-job.js` is the right instrument to point at this.

---

### 6. Duplicate failure alerting

**Verified.** The three-consecutive-failure alert is implemented twice and both paths run on the same condition:

- `checkAndAlertScanFailures` fires per company at `worker/scanner/write-results.js:61`, called from `scan-company.js` on every scan outcome.
- `checkSilentFailures` fires per run over the same company set at `worker/jobs/scan-job.js:170`.

Expect duplicate notifications when a company crosses the threshold during a scheduled run.

---

## What is *not* a concern

**The AI scoring layer is performing well and should not be a target for change.**

**Verified.** Score distribution across 740 scored candidates:

| Score band | Count |
|-----------|------:|
| 0-9 | 38 |
| 10-19 | 387 |
| 20-29 | 149 |
| 30-39 | 96 |
| 40-49 | 25 |
| 50-69 | **0** |
| 70-79 | 7 |
| 80-89 | 25 |
| 90-99 | 13 |

The distribution is cleanly bimodal with **nothing at all between 50 and 69**. Haiku is making decisive calls rather than hedging near the `>= 60` match threshold. Precision on what reaches the user is likely good.

The noise visible in the 10-29 bands originates in the heuristic detector, not the model. Because Haiku scoring is inexpensive (approximately 200 tokens per candidate), that noise costs little. It matters only insofar as it consumes the `MAX_HITS` budget (see concern 5).

**Architecture claims in the overview doc check out.** ATS adapters, Browserless escalation with visible-text thresholding, SSRF blocklist, robots checks, advisory locks, dead-letter writes, transient-error retry, and `career_scan` outcome labeling are all present and behave as documented. Cadence is real: MWF 08:00 UTC for all tiers, plus Tue/Thu/Sat/Sun 08:00 and a daily 20:00 run for executive tier (`worker/index.js:309-316`).

---

## Two notes on the overview document itself

1. **It serves two audiences at once.** The first half is a scanner explainer suitable for sharing; the second half is an Epic A-D closure checklist that is internal. Worth splitting before any part of it travels outside the team.

2. **Governance ambiguity.** `AGENTS.md` names `docs/signal-engine-cross-product-master-plan-2026-07-26.md` as the canonical plan for anything touching the scanner, and states that other scanner documents are evidence inputs only. Recommend confirming which document governs so this overview does not become a competing source of truth.

---

## Recommended sequence, if and when work is authorized

1. Fix the 48-hour window collision. One line, restores the advertised cadence, and any measurement taken before this is fixed is measuring a degraded system.
2. Throttle or upgrade Browserless. Removes 97% of current errors.
3. Add the missing-career-URL prompt. Unlocks 61 dark companies.
4. Re-measure yield after 1-3 above, then decide whether the detector needs work.
5. Point `scanner-miss-verifier-job` at the recall question.

Item 5 is the only genuinely open research question. Items 1-4 are known quantities.

---

## Appendix: reproducing these numbers

```sql
-- Concern 2: scans by weekday
select to_char(scanned_at at time zone 'UTC','Dy') dow,
       count(*) scans,
       count(*) filter (where status='success') ok,
       count(*) filter (where status='blocked') blocked,
       count(*) filter (where status='error') err
from scan_results
where scanned_at > now() - interval '35 days'
group by 1, extract(dow from scanned_at at time zone 'UTC')
order by extract(dow from scanned_at at time zone 'UTC');

-- Concern 1: error breakdown
select left(coalesce(error_message,'(none)'),90) err, count(*) c
from scan_results
where scanned_at > now() - interval '35 days' and status in ('error','blocked')
group by 1 order by c desc;

-- Concern 3: match yield
with h as (
  select company_id, jsonb_array_elements(raw_hits) hit
  from scan_results
  where scanned_at > now() - interval '35 days' and status='success'
)
select count(*) total_hits,
       count(*) filter (where (hit->>'is_match')::boolean) matches,
       count(*) filter (where (hit->>'is_match')::boolean
                          and (hit->>'is_new')::boolean) new_matches,
       count(distinct company_id) companies_with_hits
from h;
```
