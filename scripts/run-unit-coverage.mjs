#!/usr/bin/env node
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const root = process.cwd()
const vitest = path.join(root, 'node_modules', 'vitest', 'vitest.mjs')

execFileSync(process.execPath, [vitest, 'run', '--coverage', ...process.argv.slice(2)], {
  cwd: root,
  env: { ...process.env, SKIP_GIT_FIXTURE_TEST: '1' },
  stdio: 'inherit',
})