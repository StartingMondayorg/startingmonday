# Technical Debt Deep-Dive Audit

Generated: 2026-08-14T15:50:21.874Z

## Build Health

- Typecheck status: pass
- Lint status: pass
- Parser-corruption files: 0

## Test Debt

- Placeholder baseline count: 334
- Placeholder files currently present: 200

## Structural Hotspots

| File | Lines | TODO/FIXME |
| --- | ---: | ---: |
| src/app/(dashboard)/dashboard/companies/[id]/prep/prep-client.tsx | 1769 | 0 |
| src/app/onboarding/onboarding-form.tsx | 1763 | 0 |
| src/app/(dashboard)/dashboard/page.tsx | 1702 | 0 |
| src/lib/supabase/database.types.ts | 1491 | 0 |
| tests/e2e/generated/action-contracts.generated.spec.ts | 1431 | 0 |
| src/app/(dashboard)/dashboard/admin/page.tsx | 1281 | 0 |
| src/components/coach/client-data-view.tsx | 1193 | 0 |
| src/app/(dashboard)/dashboard/briefing/page.tsx | 1191 | 0 |
| src/app/(dashboard)/dashboard/executive-brief/executive-brief-hub.tsx | 1176 | 0 |
| scripts/export-weekly-agent-dashboard-snapshot.mjs | 1156 | 0 |
| src/app/(dashboard)/dashboard/admin/traces/trace-client.tsx | 1150 | 0 |
| src/app/(dashboard)/dashboard/outreach/outreach-hub-client.tsx | 1105 | 0 |
| src/app/(dashboard)/dashboard/admin/social/social-client.tsx | 1060 | 0 |
| worker/jobs/signal-job.js | 918 | 0 |
| src/app/demo/cio/CioPresentationClient.tsx | 790 | 0 |
| src/app/demo/cio/CioDemoClient.tsx | 787 | 0 |
| tests/e2e/generated/page-routes.generated.spec.ts | 765 | 0 |
| src/app/(dashboard)/dashboard/outreach/outreach-data.ts | 747 | 0 |
| scripts/luxury-page-sentinel.mjs | 725 | 0 |
| src/components/LandingPage.tsx | 721 | 0 |

## Dependency Drift

- Outdated package count: 28

| Package | Current | Wanted | Latest |
| --- | --- | --- | --- |
| @anthropic-ai/sdk | 0.91.1 | 0.91.1 | 0.117.1 |
| @playwright/test | 1.60.0 | 1.62.1 | 1.62.1 |
| @sentry/nextjs | 10.56.0 | 10.70.0 | 10.70.0 |
| @supabase/ssr | 0.10.3 | 0.10.3 | 0.12.4 |
| @supabase/supabase-js | 2.107.0 | 2.112.3 | 2.112.3 |
| @tailwindcss/postcss | 4.3.0 | 4.3.3 | 4.3.3 |
| @types/node | 20.19.42 | 20.19.43 | 26.2.0 |
| @types/react | 19.2.17 | 19.2.18 | 19.2.18 |
| @types/react-dom | 19.2.3 | 19.2.4 | 19.2.4 |
| @vitest/coverage-v8 | 4.1.8 | 4.1.10 | 4.1.10 |
| eslint | 9.39.4 | 9.39.5 | 10.8.1 |
| eslint-config-next | 16.2.7 | 16.3.1 | 16.3.1 |
| mammoth | 1.12.0 | 1.12.1 | 1.12.1 |
| next | 16.2.11 | 16.3.1 | 16.3.1 |
| postcss | 8.5.25 | 8.5.26 | 8.5.26 |
| posthog-js | 1.417.0 | 1.417.1 | 1.417.1 |
| posthog-node | 5.36.3 | 5.49.1 | 5.49.1 |
| react | 19.2.7 | 19.2.8 | 19.2.8 |
| react-dom | 19.2.7 | 19.2.8 | 19.2.8 |
| recharts | 3.8.1 | 3.10.1 | 3.10.1 |

