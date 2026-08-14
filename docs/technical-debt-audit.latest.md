# Technical Debt Deep-Dive Audit

Generated: 2026-06-18T04:29:18.955Z

## Build Health

- Typecheck status: pass
- Lint status: pass
- Parser-corruption files: 0

## Test Debt

- Placeholder baseline count: 334
- Placeholder files currently present: 317

## Structural Hotspots

| File | Lines | TODO/FIXME |
| --- | ---: | ---: |
| src/app/(dashboard)/dashboard/companies/[id]/prep/prep-client.tsx | 1441 | 0 |
| src/lib/supabase/database.types.ts | 1438 | 0 |
| src/app/onboarding/onboarding-form.tsx | 1419 | 0 |
| src/components/coach/client-data-view.tsx | 1191 | 0 |
| tests/e2e/generated/action-contracts.generated.spec.ts | 1185 | 0 |
| src/app/(dashboard)/dashboard/executive-brief/executive-brief-hub.tsx | 1176 | 0 |
| src/app/(dashboard)/dashboard/admin/traces/trace-client.tsx | 1148 | 0 |
| src/app/(dashboard)/dashboard/admin/page.tsx | 1132 | 0 |
| src/app/(dashboard)/dashboard/outreach/outreach-hub-client.tsx | 1105 | 0 |
| src/app/(dashboard)/dashboard/admin/social/social-client.tsx | 1060 | 0 |
| src/app/(dashboard)/dashboard/page.tsx | 971 | 0 |
| worker/jobs/signal-job.js | 909 | 0 |
| src/components/ResumeTailor.tsx | 824 | 0 |
| tests/e2e/synthetics.spec.ts | 819 | 0 |
| src/app/demo/cio/CioPresentationClient.tsx | 789 | 0 |
| src/app/demo/cio/CioDemoClient.tsx | 787 | 0 |
| src/app/(dashboard)/dashboard/companies/[id]/page.tsx | 733 | 0 |
| src/app/(dashboard)/dashboard/outreach/outreach-data.ts | 710 | 0 |
| src/app/(dashboard)/settings/team/team-settings.tsx | 693 | 0 |
| src/components/LandingPage.tsx | 688 | 0 |

## Dependency Drift

- Outdated package count: 17

| Package | Current | Wanted | Latest |
| --- | --- | --- | --- |
| @anthropic-ai/sdk | 0.91.1 | 0.91.1 | 0.104.2 |
| @playwright/test | 1.60.0 | 1.61.0 | 1.61.0 |
| @sentry/nextjs | 10.56.0 | 10.58.0 | 10.58.0 |
| @supabase/ssr | 0.10.3 | 0.10.3 | 0.12.0 |
| @supabase/supabase-js | 2.107.0 | 2.108.2 | 2.108.2 |
| @tailwindcss/postcss | 4.3.0 | 4.3.1 | 4.3.1 |
| @types/node | 20.19.42 | 20.19.43 | 25.9.3 |
| eslint | 9.39.4 | 9.39.4 | 10.5.0 |
| eslint-config-next | 16.2.7 | 16.2.9 | 16.2.9 |
| next | 16.2.7 | 16.2.9 | 16.2.9 |
| posthog-js | 1.381.0 | 1.390.2 | 1.390.2 |
| posthog-node | 5.36.3 | 5.38.0 | 5.38.0 |
| resend | 6.12.4 | 6.14.0 | 6.14.0 |
| stripe | 22.2.0 | 22.2.1 | 22.2.1 |
| tailwindcss | 4.3.0 | 4.3.1 | 4.3.1 |
| typescript | 5.9.3 | 5.9.3 | 6.0.3 |
| vitest | 4.1.8 | 4.1.9 | 4.1.9 |

