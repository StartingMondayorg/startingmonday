# Code Synthetic Council Audit

Generated: 2026-08-28T22:21:37.541Z
Scope: 2040 code files across src, scripts, worker, tests

## Overall

- Score: 86
- Grade: B
- Findings: 512

## Category Scores

| Category | Score |
| --- | ---: |
| correctness | 100 |
| security | 100 |
| maintainability | 72 |
| performance | 100 |
| testability | 49 |
| observability | 53 |
| typeSafety | 100 |
| complexity | 100 |
| deliveryRisk | 100 |

## Priority Fix Queue (Where To Fix First)

| File | Risk points |
| --- | ---: |
| src/app/onboarding/onboarding-form.tsx | 12 |
| src/app/(dashboard)/dashboard/_components/client-data-view.tsx | 10 |
| src/app/(dashboard)/dashboard/executive-brief/executive-brief-hub.tsx | 10 |
| src/app/api/(ai)/narrative/generate-linkedin/route.ts | 7 |
| src/app/api/(ai)/narrative/generate-positioning/route.ts | 7 |
| src/app/api/(intelligence)/intelligence/companies/route.ts | 7 |
| src/app/api/(intelligence)/intelligence/token/route.ts | 7 |
| src/app/api/(intelligence)/signals/classify/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/daily-operating-snapshots/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/exception-lists/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/intelligence-qa-scorecard/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/migration-playbook-comms/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/monthly-business-review-packs/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/onboarding-qa-scorecard/route.ts | 7 |
| src/app/api/(ops)/admin/automation/reporting/outplacement-cohort-admin/route.ts | 7 |

## Highest-Priority Findings (What To Fix)

| Severity | Area | File | Issue |
| --- | --- | --- | --- |
| high | maintainability | src/app/onboarding/onboarding-form.tsx | Very large file (1843 lines) |
| medium | maintainability | src/app/(dashboard)/dashboard/_components/client-data-view.tsx | Large file (1209 lines) |
| medium | maintainability | src/app/(dashboard)/dashboard/executive-brief/executive-brief-hub.tsx | Large file (1181 lines) |
| medium | testability | src/app/(dashboard)/_components/BackToTop.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/_components/BottomNav.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/_components/CommandPalette.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/_components/DashboardFooter.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/_components/DemoBanner.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/_components/PersonalEmailNudge.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/_components/WatermarkOverlay.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/coach/[clientId]/_components/ClientTaskNav.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/LocalGreeting.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/PipelineFilter.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/Breadcrumbs.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/BriefRating.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/CoachPreSessionSnapshot.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/ContactStatusStepper.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/ContactsList.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/DashboardSkeleton.tsx | No obvious colocated or mirrored test file found |
| medium | testability | src/app/(dashboard)/dashboard/_components/DraftPanel.tsx | No obvious colocated or mirrored test file found |

## Blind-Spot Companion Checks

- Import/parser corruption files: 0
- Placeholder baseline files: 0

| Largest Source Files | Lines |
| --- | ---: |
| src/app/(dashboard)/dashboard/page.tsx | 2036 |
| src/app/onboarding/onboarding-form.tsx | 1843 |
| src/app/(dashboard)/dashboard/companies/[id]/prep/prep-client.tsx | 1812 |
| src/lib/supabase/database.types.ts | 1676 |
| src/app/(dashboard)/dashboard/admin/page.tsx | 1265 |
| src/app/(dashboard)/dashboard/_components/client-data-view.tsx | 1209 |
| src/app/(dashboard)/dashboard/executive-brief/executive-brief-hub.tsx | 1181 |
| src/app/(dashboard)/dashboard/briefing/page.tsx | 1169 |

## Council Personas

- Principal Engineer: maintainability, architecture, coupling, complexity
- Security Engineer: unsafe evaluation, process execution, HTML injection vectors
- SRE and Observability Lead: logging and error-capture coverage on operational paths
- QA and Test Architect: source-to-test traceability and missing test surfaces
- Performance Engineer: expensive patterns and scalability-risk static signals

