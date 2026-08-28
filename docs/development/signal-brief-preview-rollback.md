# Signal Brief Preview Disable and Rollback

**Scope:** Internal signal-brief preview route only
**Controls:** `SIGNAL_BRIEF_SAMPLE_MODE_ENABLED`, `SIGNAL_BRIEF_PREVIEW_ENABLED`
**Default state:** Both flags are `0` or unset

## Disable procedure

1. Set `SIGNAL_BRIEF_SAMPLE_MODE_ENABLED=0` first. This stops one-profile sample rendering while leaving the route available for non-sample internal validation.
2. Set `SIGNAL_BRIEF_PREVIEW_ENABLED=0`. This returns `503` for all subsequent preview requests.
3. Restart or redeploy the service using the normal release process so the new environment values are loaded.
4. Verify an authorized request returns `503` with `Signal brief preview is disabled`.
5. Verify an unauthorized request still returns `403`; disabling the feature must not bypass authorization.

## Re-enable procedure

1. Confirm the source payload producer, client configuration, HTTPS provenance, SPIN structure, and investigate-first quality checks are passing.
2. Enable `SIGNAL_BRIEF_PREVIEW_ENABLED` only in the internal validation environment.
3. Enable `SIGNAL_BRIEF_SAMPLE_MODE_ENABLED` only when the caller configuration explicitly requests sample mode and the commercial approval is recorded.
4. Verify a non-sample preview first, then a sample preview with exactly one full-depth profile.
5. Record the environment, commit, payload fixture, and operator who performed the check.

## Kill behavior

- Missing or false preview flag: `503` before request parsing or rendering.
- Missing or false sample-mode flag with `sample_mode.enabled=true`: `503` before rendering.
- Invalid JSON: `400`.
- Invalid source payload or quality contract: `422`.
- Failed internal secret/IP authorization: `403` regardless of feature flags.
- Responses are `Cache-Control: no-store`; no preview payload is persisted by this route.

## Rollback boundary

This route currently has no database migration, live-brief persistence, billing write, email send, or public prospect delivery. Rollback is therefore an environment-flag disable and, if necessary, a code rollback through the normal protected branch process. Do not add persistence or enable prospect delivery without a new integration review and rollback plan.
