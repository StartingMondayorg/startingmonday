# 03 CI/CD and Release Gates

## Branch and Promotion Workflows
- .github/workflows/ci.yml
- .github/workflows/post-deploy.yml
- .github/workflows/promote-staging-to-main.yml
- .github/workflows/sync-staging.yml
- .github/workflows/production-growth-gate.yml

## Scheduled Quality Pipelines
- .github/workflows/nightly-audit.yml
- .github/workflows/weekly-unified-audit.yml
- .github/workflows/slo-weekly-report.yml
- .github/workflows/performance-release-gate.yml

## Core Build and Push Guards
- scripts/prebuild-guard.mjs
- scripts/check-clean-worktree-for-push.mjs
- scripts/check-untracked-tests.mjs
- scripts/check-docs-commands.mjs

## Deployment Validation
- scripts/emi-postdeploy-smoke.mjs
- scripts/run-launch-load-rehearsal.mjs
- scripts/check-api-guards.mjs
- scripts/check-auth.mjs
