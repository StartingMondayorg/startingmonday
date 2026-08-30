# Runtime Trace Release Checkpoint

Date: 2026-08-30

## Release state

- PR #492 merged as `53ca4ec7b138cc5053a06adaa0c0e762c1bee309`.
- The integrated PR head and squash-merge commit have the same Git tree:
  `fd788d64ac587c9d4434f7ff872bd16354a01038`.
- PR validation passed 23 checks with zero failures.
- The post-merge predeploy build failed before deployment because the strict
  mobile visual gate compared the current light semantic-token production UI
  with stale dark home and pricing baselines.
- Home differed by 65-68% and pricing by 10% on both protected mobile
  projects. The failures reproduced on retry. The runtime trace guard itself
  did not fail.

## Recovery

Use the repository's `PR Autofix` workflow with target `elite-visual` to
regenerate the four protected home/pricing baselines against the current
staging UI in the Linux Playwright environment. Review the generated images,
rerun the elite visual suite, and merge only after protected checks pass.

This recovery changes visual evidence only. It does not alter application UI,
runtime tracing, routes, deployment configuration, or the mobile gate's
failure thresholds. Rollback is reverting the refreshed baseline commit.