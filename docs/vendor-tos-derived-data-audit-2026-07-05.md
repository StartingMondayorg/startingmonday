# Vendor ToS Derived-Data Audit — 2026-07-05 (T2.7)

Purpose: before precursor_stats ships as a durable dataset, verify whether any
licensed source's terms restrict retaining or aggregating *derived* data
(labels, statistics) built from their feeds. Kill criterion K7 applies: a
blocking restriction quarantines that source's events from precursor_stats.

Status legend: Verified = confirmed against current vendor terms by counsel or
direct review. Unverified = preliminary assessment pending review.

## Quarantine mechanism (implemented)

- `QUARANTINED_SOURCE_KINDS` env var (comma-separated `source_kind` values).
- `precursor-stats-job` excludes events whose sources are ALL quarantined
  kinds; events with at least one non-quarantined corroborating source remain
  countable.
- Default: empty (no quarantine). Set only on confirmed restriction.

## Source assessments

| Source | source_kind | Rights | Assessment | Status |
|---|---|---|---|---|
| SEC EDGAR (8-K, DEF 14A, 13D, Form 4) | sec_filing | Public (US gov) | Public-domain filings; no derived-data restriction possible. Safe for labels and stats. | Verified (public record) |
| Google News / PR wire / bizjournals / trade press RSS | news, pr_wire, bizjournal, trade_press | Public web | We store our own one-sentence classifications and dates, not article text. Facts and our own annotations are not copyrightable; low risk. | Unverified — counsel sanity check recommended |
| Company press rooms / career pages | press_room, career_scan | Public web | Same footing as news; robots.txt honored at fetch time. Posting-detection labels are our own observations. | Unverified — low risk |
| Crunchbase | crunchbase | Licensed API | Crunchbase terms historically restrict redistribution of their *data*; internal derived aggregates are typically permitted but resale or republication of Crunchbase-derived datasets may be restricted. Do not expose funding rows in any external dataset or API. | Unverified — REVIEW BEFORE Ring 3 licensing |
| PredictLeads | predictleads | Licensed API | Event feeds licensed for internal use; check clauses on data retention after termination and on derived-model outputs. | Unverified — REVIEW REQUIRED |
| People Data Labs (exec snapshots) | pdl | Licensed API | PDL terms include person-data retention/refresh obligations and restrictions on building derivative databases of person records. Our exec-departure *events* (facts we infer) are likely fine; retained person snapshots must follow retention rules already implemented in enrichment-contact-retention-job. | Unverified — REVIEW REQUIRED before person-events (E6) |
| Apollo (enrichment; future org-diff source) | apollo | Licensed seat/API | Governed by existing provider-enrichment-compliance-runbook.md. Org-level headcount diffs for internal signals: verify "no derivative works" scope before Phase 5 T5.8 ships. | Unverified — REVIEW REQUIRED before T5.8 |

## Decisions

1. No quarantine set today: no confirmed blocking clause, and all current
   precursor inputs are dominated by public-record sources.
2. Before Phase 5 T5.8 (Apollo org-diff) and Phase 6 person-events: obtain
   counsel review of PDL and Apollo derived-data and retention clauses.
3. Before any Ring 3 external data product: re-audit Crunchbase and
   PredictLeads redistribution clauses; assume external exposure of their
   derived rows is prohibited until proven otherwise.
4. Review cadence: revisit this audit at each quarterly IP & Moat Review.

## Action items

- [ ] Counsel review: PDL derivative-database and retention clauses (owner: Rich, by Phase 6 gate)
- [ ] Counsel review: Apollo derivative-works scope for org-diff signals (owner: Rich, by T5.8)
- [ ] Counsel review: Crunchbase/PredictLeads external-exposure clauses (owner: Rich, before Ring 3)
