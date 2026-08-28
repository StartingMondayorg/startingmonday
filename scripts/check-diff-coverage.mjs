#!/usr/bin/env node

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import readline from 'node:readline'
import { isUnitCoverageSourceFile } from './lib/coverage-scope.mjs'
import { resolveDiffScope } from './lib/git-diff-scope.mjs'

function parseArgs(argv) {
  const args = {
    baseRef: '',
    headRef: 'HEAD',
    minCoverage: 90,
    lcovPath: path.join(process.cwd(), 'coverage', 'lcov.info'),
    includePrefix: 'src/',
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--base-ref=')) args.baseRef = arg.slice('--base-ref='.length)
    else if (arg.startsWith('--head-ref=')) args.headRef = arg.slice('--head-ref='.length)
    else if (arg.startsWith('--min-coverage=')) args.minCoverage = Number(arg.slice('--min-coverage='.length))
    else if (arg.startsWith('--lcov=')) args.lcovPath = path.resolve(process.cwd(), arg.slice('--lcov='.length))
    else if (arg.startsWith('--include-prefix=')) args.includePrefix = arg.slice('--include-prefix='.length)
  }

  if (!Number.isFinite(args.minCoverage) || args.minCoverage < 0 || args.minCoverage > 100) {
    throw new Error(`Invalid --min-coverage value: ${args.minCoverage}`)
  }

  return args
}

function normalizePath(input) {
  return input.replace(/\\/g, '/').replace(/^\.\//, '')
}

/*
  Only two line types matter here: the `+++ b/<path>` header that names the file
  and the `@@` hunk header that carries the changed line numbers. Every `+`/`-`
  content line is discarded. Feeding lines in one at a time rather than parsing
  one big string keeps memory proportional to the number of changed hunks
  instead of the byte size of the diff -- which is what let a 3.2MB diff kill
  this gate when it was read through execSync's 1MiB default maxBuffer.
*/
function createHunkCollector(includePrefix) {
  const changed = new Map()
  let currentFile = ''

  return {
    consume(rawLine) {
      const line = rawLine.trimEnd()

      if (line.startsWith('+++ b/')) {
        currentFile = normalizePath(line.slice('+++ b/'.length))
        return
      }

      if (!currentFile || !currentFile.startsWith(includePrefix) || !isUnitCoverageSourceFile(currentFile)) return

      if (!/^@@ /.test(line)) return

      const plusMatch = line.match(/\+(\d+)(?:,(\d+))?/)
      if (!plusMatch) return

      const start = Number(plusMatch[1])
      const count = plusMatch[2] ? Number(plusMatch[2]) : 1
      if (count <= 0) return

      const target = changed.get(currentFile) ?? new Set()
      for (let i = 0; i < count; i += 1) {
        target.add(start + i)
      }
      changed.set(currentFile, target)
    },
    result() {
      return changed
    },
  }
}

function toWorkspaceRelativeFromSourceFile(sfValue) {
  const normalized = normalizePath(sfValue)
  const marker = '/startingmonday/'
  const idx = normalized.lastIndexOf(marker)

  if (idx !== -1) {
    return normalized.slice(idx + marker.length)
  }

  if (path.isAbsolute(sfValue)) {
    return normalizePath(path.relative(process.cwd(), sfValue))
  }

  return normalized
}

function parseLcov(lcovText) {
  const coverage = new Map()
  let currentFile = ''

  for (const rawLine of lcovText.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('SF:')) {
      currentFile = toWorkspaceRelativeFromSourceFile(line.slice(3))
      if (!coverage.has(currentFile)) coverage.set(currentFile, new Map())
      continue
    }

    if (line.startsWith('DA:') && currentFile) {
      const payload = line.slice(3).split(',')
      const lineNo = Number(payload[0])
      const hits = Number(payload[1])
      if (Number.isFinite(lineNo) && Number.isFinite(hits)) {
        coverage.get(currentFile).set(lineNo, hits)
      }
    }
  }

  return coverage
}

async function collectChangedLines(baseRef, headRef, includePrefix) {
  const range = baseRef ? `${baseRef}...${headRef}` : headRef
  const child = spawn(
    'git',
    ['diff', '--unified=0', '--no-color', range, '--', '*.ts', '*.tsx', '*.js', '*.jsx'],
    { stdio: ['ignore', 'pipe', 'pipe'] },
  )

  let stderr = ''
  child.stderr.setEncoding('utf8')
  child.stderr.on('data', (chunk) => {
    if (stderr.length < 4096) stderr += chunk
  })

  // Registered before the read loop so a fast-exiting git cannot fire `close`
  // before anyone is listening.
  const exited = new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', resolve)
  })

  const collector = createHunkCollector(includePrefix)
  for await (const line of readline.createInterface({ input: child.stdout, crlfDelay: Infinity })) {
    collector.consume(line)
  }

  const code = await exited
  if (code !== 0) {
    throw new Error(`git diff exited with code ${code}${stderr ? `: ${stderr.trim()}` : ''}`)
  }

  return collector.result()
}

async function main() {
  const { baseRef, headRef, minCoverage, lcovPath, includePrefix } = parseArgs(process.argv)
  const { effectiveBaseRef, skip, reason } = resolveDiffScope(baseRef, headRef)

  if (skip) {
    console.error(`diff-coverage: cannot resolve diff scope (${reason})`)
    console.error('Failing closed rather than silently skipping the coverage gate. If this is a legitimate infra issue (shallow clone, rebase), fix the checkout/base-ref resolution rather than bypassing this check.')
    process.exit(1)
  }

  if (!fs.existsSync(lcovPath)) {
    throw new Error(`Coverage file not found: ${lcovPath}. Run vitest with coverage before this check.`)
  }

  const changed = await collectChangedLines(effectiveBaseRef, headRef, includePrefix)

  if (changed.size === 0) {
    console.log('diff-coverage: no changed source lines under include prefix; skipping gate')
    process.exit(0)
  }

  const coverage = parseLcov(fs.readFileSync(lcovPath, 'utf8'))

  let totalLines = 0
  let coveredLines = 0

  const details = []

  for (const [filePath, lines] of changed.entries()) {
    const lineList = [...lines].sort((a, b) => a - b)
    const fileCoverage = coverage.get(filePath) ?? new Map()

    let fileCovered = 0
    let fileTracked = 0
    for (const lineNo of lineList) {
      // Lines without a DA record are not instrumentable (blank lines,
      // template-literal continuations, type-only lines) - standard
      // diff-cover behavior is to exclude them from the denominator.
      if (!fileCoverage.has(lineNo)) continue
      totalLines += 1
      fileTracked += 1
      const hits = fileCoverage.get(lineNo)
      if (hits > 0) {
        coveredLines += 1
        fileCovered += 1
      }
    }

    const pct = fileTracked === 0 ? 100 : (fileCovered / fileTracked) * 100
    details.push({
      filePath,
      changedLines: fileTracked,
      coveredLines: fileCovered,
      pct,
    })
  }

  const overallPct = totalLines === 0 ? 100 : (coveredLines / totalLines) * 100

  console.log('diff-coverage summary')
  console.log(`- base: ${effectiveBaseRef || '(working tree/head)'}`)
  console.log(`- head: ${headRef}`)
  console.log(`- include prefix: ${includePrefix}`)
  console.log(`- covered lines: ${coveredLines}/${totalLines} (${overallPct.toFixed(2)}%)`)
  console.log(`- threshold: ${minCoverage.toFixed(2)}%`)

  for (const item of details.sort((a, b) => a.pct - b.pct)) {
    console.log(`  - ${item.filePath}: ${item.coveredLines}/${item.changedLines} (${item.pct.toFixed(2)}%)`)
  }

  if (overallPct < minCoverage) {
    console.error(`diff-coverage gate failed: ${overallPct.toFixed(2)}% < ${minCoverage.toFixed(2)}%`)
    process.exit(1)
  }

  console.log('diff-coverage gate passed')
}

try {
  await main()
} catch (error) {
  console.error('diff-coverage gate error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
