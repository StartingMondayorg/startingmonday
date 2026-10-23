#!/usr/bin/env bash
# Waits until the deployed app at BASE_URL is serving EXPECTED_SHA.
#
# On pushes to staging/main, CI E2E jobs test the live Railway deployment.
# Railway deploys the same commit in parallel, so tests can race ahead of the
# deploy and screenshot the previous build (observed on main run 30577420063).
# This script polls /api/health (which reports RAILWAY_GIT_COMMIT_SHA) until
# the served commit matches the commit under test.
#
# Env:
#   BASE_URL      - deployment root, e.g. https://example.up.railway.app
#   EXPECTED_SHA  - full commit SHA CI is testing (GITHUB_SHA)
#   TIMEOUT_SECS  - optional, default 2700 (45 min; Railway builds have taken
#                   ~26 min, see docs/evidence/production-promotion-2026-10-21.md D2)
#   POLL_SECS     - optional, default 15
set -euo pipefail

: "${BASE_URL:?BASE_URL is required}"
: "${EXPECTED_SHA:?EXPECTED_SHA is required}"
TIMEOUT_SECS="${TIMEOUT_SECS:-2700}"
POLL_SECS="${POLL_SECS:-15}"

started=$(date +%s)
deadline=$(( started + TIMEOUT_SECS ))
last_served="(no response)"
attempt=0

echo "Waiting up to ${TIMEOUT_SECS}s for $BASE_URL to serve $EXPECTED_SHA (poll every ${POLL_SECS}s)"

while [ "$(date +%s)" -lt "$deadline" ]; do
  attempt=$(( attempt + 1 ))
  served=$(curl -fsS --max-time 15 "${BASE_URL%/}/api/health" | node -e '
    let data = "";
    process.stdin.on("data", (c) => (data += c));
    process.stdin.on("end", () => {
      try {
        const body = JSON.parse(data);
        process.stdout.write(String(body.commit ?? "null"));
      } catch {
        process.stdout.write("unparseable");
      }
    });
  ' || echo "unreachable")

  now=$(date +%s)
  if [ "$served" = "$EXPECTED_SHA" ]; then
    echo "Deploy is live after $(( now - started ))s: $BASE_URL is serving commit $served"
    exit 0
  fi

  last_served="$served"
  echo "Attempt ${attempt} (+$(( now - started ))s, $(( deadline - now ))s left): expected ${EXPECTED_SHA:0:12}, currently serving ${served:0:40}"
  sleep "$POLL_SECS"
done

# /api/health only reports the commit, so the two failure modes are "an older
# commit is still live" (Railway still building/deploying, or the deploy failed)
# and "no commit reported at all" (endpoint down or RAILWAY_GIT_COMMIT_SHA unset).
if [[ "$last_served" =~ ^[0-9a-f]{7,40}$ ]]; then
  echo "::error title=Deployment still pending::Timed out after ${TIMEOUT_SECS}s: deployment still pending; $BASE_URL is still serving ${last_served:0:12}, not ${EXPECTED_SHA:0:12}. Check the Railway build for this commit." >&2
else
  echo "::error title=Deployment status unknown::Timed out after ${TIMEOUT_SECS}s: $BASE_URL/api/health never reported a commit (last result: $last_served), so it is unknown whether ${EXPECTED_SHA:0:12} deployed." >&2
fi
echo "Tests against a stale deployment would be misleading, so failing fast." >&2
exit 1
