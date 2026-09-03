#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const visualScope = [
  'src/app/(marketing)/',
  'src/app/components/',
  'src/app/globals.css',
  'src/app/layout.tsx',
  'src/app/page.tsx',
  'src/components/ui/',
  'src/lib/starting-monday-hero-content.ts',
  'public/',
  'tests/e2e/mobile-visual-smoke.spec.ts',
  'tests/e2e/__screenshots__/smoke-',
  'playwright.config.ts',
]

const upstream = (() => {
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}'], { encoding: 'utf8' }).trim()
  } catch {
    return 'origin/main'
  }
})()

const changed = execFileSync('git', ['diff', '--name-only', `${upstream}...HEAD`], { encoding: 'utf8' })
  .split('\n')
  .map((value) => value.trim())
  .filter(Boolean)

if (!changed.some((file) => visualScope.some((scope) => file === scope || file.startsWith(scope)))) {
  console.log('mobile visual pre-push: skipped (no matching visual scope changes)')
  process.exit(0)
}

console.log('mobile visual pre-push: running Linux Playwright smoke snapshots in Docker')
const image = 'mcr.microsoft.com/playwright:v1.62.1-noble'
const mount = `${path.resolve(root)}:/source:ro`
const command = `set -e
mkdir -p /tmp/startingmonday
tar \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=coverage \
  --exclude=playwright-report \
  --exclude=test-results \
  --exclude=tmp \
  -C /source -cf - . | tar -C /tmp/startingmonday -xf -
cd /tmp/startingmonday
npm ci
npm run guide:user:sync
npm run guide:internal:sync
MOBILE_ELITE_GATE_STRICT=0 NEXT_PUBLIC_SM_HERO_EVIDENCE_ENABLED=1 npm run build
NEXT_PUBLIC_SM_HERO_EVIDENCE_ENABLED=1 npm run start -- --hostname 0.0.0.0 --port 3000 > /tmp/next-start.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
ready=false
for attempt in $(seq 1 60); do
  if curl -fsS http://127.0.0.1:3000/api/health >/dev/null; then
    ready=true
    break
  fi
  sleep 2
done
if [ "$ready" != true ]; then
  tail -n 200 /tmp/next-start.log || true
  exit 1
fi
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npm run test:e2e:mobile-visual:smoke`

execFileSync('docker', ['run', '--rm', '--ipc=host', '-v', mount, image, '/bin/bash', '-lc', command], {
  stdio: 'inherit',
})