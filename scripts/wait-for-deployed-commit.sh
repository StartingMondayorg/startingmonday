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
#   TIMEOUT_SECS  - optional, default 900
#   POLL_SECS     - optional, default 15
set -euo pipefail

: "${BASE_URL:?BASE_URL is required}"
: "${EXPECTED_SHA:?EXPECTED_SHA is required}"
TIMEOUT_SECS="${TIMEOUT_SECS:-900}"
POLL_SECS="${POLL_SECS:-15}"

deadline=$(( $(date +%s) + TIMEOUT_SECS ))
last_served="(no response)"

while [ "$(date +%s)" -lt "$deadline" ]; do
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

  if [ "$served" = "$EXPECTED_SHA" ]; then
    echo "Deploy is live: $BASE_URL is serving commit $served"
    exit 0
  fi

  last_served="$served"
  echo "Waiting for deploy: expected $EXPECTED_SHA, currently serving $served"
  sleep "$POLL_SECS"
done

echo "Timed out after ${TIMEOUT_SECS}s: $BASE_URL never served commit $EXPECTED_SHA (last served: $last_served)" >&2
echo "Tests against a stale deployment would be misleading, so failing fast." >&2
exit 1
