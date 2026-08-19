#!/usr/bin/env bash
set -euo pipefail

for attempt in 1 2 3; do
  echo "Playwright OS dependency install attempt ${attempt}/3"
  if timeout --kill-after=15s 240s npx playwright install-deps chromium; then
    echo "Playwright OS dependency installation completed on attempt ${attempt}"
    exit 0
  else
    status=$?
    echo "::warning::Playwright OS dependency attempt ${attempt}/3 failed with status ${status}"
  fi
done

echo "::error::Playwright OS dependency installation failed after 3 bounded attempts"
exit 1