#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const traceRoot = path.join(root, '.next', 'server', 'app')
const allowedDocsByTrace = new Map([
  [
    '(dashboard)/dashboard/admin/guide/page.js.nft.json',
    new Set(['docs/guide-retrieval-eval.latest.json', 'docs/user-guide.manifest.json']),
  ],
  [
    'api/(auth)/google-calendar/callback/route.js.nft.json',
    new Set(['docs/operations/reminders/startingmonday-posting-reminders.ics']),
  ],
  [
    'api/(auth)/google-calendar/connect/route.js.nft.json',
    new Set(['docs/operations/reminders/startingmonday-posting-reminders.ics']),
  ],
  [
    'api/(auth)/google-calendar/disconnect/route.js.nft.json',
    new Set(['docs/operations/reminders/startingmonday-posting-reminders.ics']),
  ],
  [
    'api/(ops)/cron/google-calendar-sync/route.js.nft.json',
    new Set(['docs/operations/reminders/startingmonday-posting-reminders.ics']),
  ],
  [
    'api/(ops)/cron/ui-ux-weekly-review/route.js.nft.json',
    new Set(['docs/ui-ux-page-scores-2026-05-21.csv']),
  ],
])

async function walk(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name)
    if (entry.isDirectory()) files.push(...await walk(entryPath))
    else if (entry.name.endsWith('.nft.json')) files.push(entryPath)
  }
  return files
}

function projectPath(tracePath, tracedFile) {
  return path.relative(root, path.resolve(path.dirname(tracePath), tracedFile)).replace(/\\/g, '/')
}

function setDifference(left, right) {
  return [...left].filter((value) => !right.has(value))
}

const tracePaths = await walk(traceRoot)
const observedDocsByTrace = new Map()

for (const tracePath of tracePaths) {
  const payload = JSON.parse(await readFile(tracePath, 'utf8'))
  const docs = new Set(
    (payload.files ?? [])
      .map((tracedFile) => projectPath(tracePath, tracedFile))
      .filter((filePath) => filePath.startsWith('docs/')),
  )

  if (docs.size > 0) {
    observedDocsByTrace.set(path.relative(traceRoot, tracePath).replace(/\\/g, '/'), docs)
  }
}

const failures = []
for (const [trace, docs] of observedDocsByTrace) {
  const allowed = allowedDocsByTrace.get(trace)
  if (!allowed) {
    failures.push(`${trace} unexpectedly traces ${[...docs].join(', ')}`)
    continue
  }

  const unexpected = setDifference(docs, allowed)
  if (unexpected.length > 0) failures.push(`${trace} unexpectedly traces ${unexpected.join(', ')}`)
}

if (failures.length > 0) {
  console.error('Runtime trace scope guard failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log(`Runtime trace scope guard passed (${tracePaths.length} traces, ${observedDocsByTrace.size} bounded docs routes)`)
