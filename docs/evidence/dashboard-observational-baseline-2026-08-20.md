# Dashboard Observational Baseline

Date received: 2026-08-19
Source document: `docs/inbox/dashboard-observational-baseline-2026-08-19.docx`
Dashboard version observed: current pre-simplification `/dashboard?focus=main`
Flag state: `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED=off`
Status: partial observational baseline recorded; remaining live-session and zero-narration walkthrough requirements waived by Rich on 2026-08-19

## Intake

The source DOCX was copied verbatim into `docs/inbox/` before review. This markdown file summarizes its contents for review and future dashboard gate decisions.

## Evidence Quality

The document contains three observations:

| Observation | Source type | Counts toward 3-5 executive baseline? | Notes |
| --- | --- | --- | --- |
| Observation 1 | Static expert review; no live participant session | No | Useful heuristic baseline; no timing or participant quotes. |
| Observation 2 | Claude LLM cold-reader probe | No | Useful floor for comprehension defects; not a human substitute. |
| Observation 3 | VP of IT, first exposure to test account | Yes | One real executive-style observation with first action, trust issues, and stall points. |

Result before waiver: 1 of the required 3-5 executive observations was satisfied. Rich waived the remaining two live executive baseline sessions on 2026-08-19.

## Waiver Record

Approved by Rich Rothschild in Copilot chat on 2026-08-19:

- Waive the remaining two live executive observational baseline sessions.
- Waive the zero-narration walkthrough evidence requirement on the flagged layout.

Risk accepted:

- The baseline evidence is thinner than the original D-A requirement.
- The flagged layout can proceed to staged validation without additional live walkthrough evidence.
- Product owner review and product-local technical gates remain required before any production flag flip.

## Cross-Observation Findings

- The current dashboard gives too many simultaneous starting points.
- The clearest product sentence is buried in an empty-state relationship section rather than presented at the top.
- Users cannot reconstruct the company -> people -> angle loop from the primary dashboard.
- The current empty first-run state points users toward actions that require prerequisites that do not exist yet.
- Trial and week-one state copy can contradict each other and damage trust.
- Internal implementation/spec language has reached user-facing surfaces in more than one place.
- Numeric/internal scoring language remains a trust risk when exposed to candidates.
- Empty company tables and duplicate setup/progress modules add friction instead of guidance.

## Notable Observations

Observation 1 found that the dashboard behaves like several dashboards stacked vertically. It identified `Today's three actions` as the strongest component, but noted that it is buried below account, onboarding, and campaign setup material.

Observation 2 found that the loudest first action was `Choose your plan`, not a search-progress action. It also identified the relationship empty-state sentence as the clearest articulation of the product loop.

Observation 3, from a VP of IT, reported that the page was overwhelming, that the likely first useful action was `Add a company`, and that the user wanted to get quickly to contacting the right people. The participant could see relationship-building value but did not see the angle step.

## Metrics Recorded

| Metric | Result |
| --- | --- |
| Median time to first action | Not measured across live sessions |
| Live users who could explain product loop | Not enough live sessions |
| Live users who identified company -> people -> angle | Not enough live sessions |
| Users requiring narration | Observation 3 required explanation |
| First action in live observation | `Choose your plan` |
| Live participant posture | First exposure to a test account |

## Implications For The Three-Zone Dashboard

- Zone 1 should use dependency-aware state selection. In an empty first-run account, it should ask for the missing prerequisite, not suggest moving a relationship.
- Zone 2 should explicitly carry the company -> people-to-know -> angle loop in each row.
- Zone 3 should stay quiet and avoid competing with Zone 1.
- Help should explain the loop, not the widgets.
- Account/trial status should never overpower the operational next move unless it truly blocks product use.
- The dashboard should not expose implementation language, internal scoring details, or setup instructions written for engineers.

## Gate Impact

This evidence supports the three-zone direction. The human-session and zero-narration walkthrough requirements are waived as recorded above, but technical and product-local gate evidence remains required before a flag flip.

Still required before `NEXT_PUBLIC_SM_DASHBOARD_SIMPLIFICATION_ENABLED` can be enabled:

- staged authenticated desktop/mobile validation of the flagged layout;
- final WS7/DG-09 product-local gate review; and
- production flag approval after staged evidence passes.

## Raw Source

The full raw content remains in the DOCX source file in `docs/inbox/`.