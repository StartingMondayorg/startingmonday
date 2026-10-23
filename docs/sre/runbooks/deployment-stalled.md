# Deployment Stalled Runbook

Use this when the latest `main` commit has not produced a successful production deployment within the expected window, or when the Railway build fails before deploy status is emitted.

## First checks

1. Open the latest GitHub Actions or Railway build log.
2. Confirm the commit SHA that is missing from production.
3. Check for disk-space errors, Docker context bloat, or missing production env vars.
4. Verify the latest `main` commit has a corresponding successful deployment status.

## If the build failed with disk space or context issues

1. Confirm `.dockerignore` excludes docs, test artifacts, and other non-runtime assets.
2. Remove or compress unused large assets from `public/` if they are not needed at runtime.
3. Re-run the deploy after the repository is trimmed.

## If the build failed because of environment variables

1. Check Railway production variables.
2. Compare against `scripts/prebuild-guard.mjs` and the production build requirements.
3. Restore the required variables, then redeploy.

## If no deployment status exists

1. Treat the deployment as stalled.
2. Redeploy from the latest successful commit if needed.
3. Confirm the `Deployment Watchdog` workflow is still running.

## After recovery

1. Mark the incident in Slack.
2. Add the failure mode to the reliability notes.
3. Tune the threshold if this was a false positive.

## Wait windows and staleness alerts

- Release gates (`post-deploy.yml`, `release-completion-gate.yml`, the watchdog's pushed-SHA check) and CI's "Wait for deployment of this commit" wait up to 45 minutes, because Railway builds have taken about 26 minutes. A timeout message says either "deployment still pending" (an older SHA is still served: check the Railway build) or "deployed but checks failed" (the SHA is live but the homepage/hero checks fail: treat it as a broken release).
- The daily `production-staleness` job in `deployment-watchdog.yml` warns whenever production is behind `origin/main` and alerts Slack and fails when the oldest unpromoted runtime-affecting commit is more than 7 days old. Commits touching only `docs/**` or `tests/**` do not count. Run it locally with `npm run monitor:production:staleness`. Recovery is a normal promotion: `scripts/promote-to-production.mjs` once staging has a successful deploy of the target SHA.