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

## Railway trace follow-up

- PR #493 merged as `b2ea1e86ea7d6028e6df4d524a12406157a458ad` and
  cleared the strict main mobile visual gate.
- Railway staging deployment `b7a2a107-798f-4e8c-bf56-8eb522d4f420`
  then failed because PR #492 had reintroduced a six-line required-presence
  loop removed by the last successful release, PR #491.
- Railway's build context legitimately omitted six optional docs assets. The
  guard rejected their absence even though its security contract is a maximum
  allowlist: unapproved routes and unexpected docs assets fail closed, while
  approved assets may be absent.
- Recovery removes only the required-presence loop and adds a two-case Node
  regression suite proving absent optional assets pass and unexpected docs
  tracing still fails.

This follow-up does not broaden the route/asset allowlist or weaken unexpected
path detection. Rollback is reverting the guard change; the prior behavior is
known to block Railway builds and does not represent a viable release state.