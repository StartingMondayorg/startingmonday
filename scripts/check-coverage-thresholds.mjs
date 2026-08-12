#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

function parseArgs(argv) {
  const args = {
    lcovPath: path.join(process.cwd(), 'coverage', 'lcov.info'),
    configPath: path.join(process.cwd(), 'config', 'coverage-thresholds.json'),
    baseRef: '',
    headRef: 'HEAD',
  }

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg.startsWith('--lcov=')) {
      args.lcovPath = path.resolve(process.cwd(), arg.slice('--lcov='.length))
    } else if (arg.startsWith('--config=')) {
      args.configPath = path.resolve(process.cwd(), arg.slice('--config='.length))
    } else if (arg.startsWith('--base-ref=')) {
      args.baseRef = arg.slice('--base-ref='.length)
    } else if (arg.startsWith('--head-ref=')) {
      args.headRef = arg.slice('--head-ref='.length)
    }
  }

  return args
}

function gitRefExists(ref) {
  if (!ref) return false
  try {
    execSync(`git rev-parse --verify --quiet ${ref}`, {
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

function isAncestor(baseRef, headRef) {
  try {
    execSync(`git merge-base --is-ancestor ${baseRef} ${headRef}`, {
      stdio: ['ignore', 'ignore', 'ignore'],
    })
    return true
  } catch {
    return false
  }
}

function resolveDiffScope(baseRef, headRef) {
  if (!baseRef) {
    return { effectiveBaseRef: '', skip: false }
  }

  if (!gitRefExists(headRef)) {
    return {
      effectiveBaseRef: '',
      skip: true,
      reason: `head ref not found: ${headRef}`,
    }
  }

  if (!gitRefExists(baseRef)) {
    return {
      effectiveBaseRef: '',
      skip: true,
      reason: `base ref not found: ${baseRef}`,
    }
  }

  if (!isAncestor(baseRef, headRef)) {
    return {
      effectiveBaseRef: '',
      skip: true,
      reason: `base ref is not an ancestor of head (${baseRef} !< ${headRef})`,
    }
  }

  return { effectiveBaseRef: baseRef, skip: false }
}

function getChangedFiles(baseRef, headRef) {
  const range = baseRef ? `${baseRef}...${headRef}` : headRef
  const cmd = `git diff --name-only --no-color ${range} -- "src/**/*.ts" "src/**/*.tsx"`
  const raw = execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  return raw
    .split('\n')
    .map((line) => normalizePath(line.trim()))
    .filter(Boolean)
    // Test files are excluded from coverage instrumentation, so a test-only
    // change cannot lower folder coverage — it must not trigger folder
    // enforcement (adding a test could otherwise fail the gate it improves).
    .filter((filePath) => !/\.(test|spec)\.(ts|tsx)$/.test(filePath) && !filePath.includes('__tests__/'))
}

function normalizePath(input) {
  return input.replace(/\\/g, '/').replace(/^\.\//, '')
}

function toWorkspaceRelative(sfValue) {
  const normalized = normalizePath(sfValue)
  const marker = '/startingmonday/'
  const markerIdx = normalized.lastIndexOf(marker)

  if (markerIdx !== -1) {
    return normalized.slice(markerIdx + marker.length)
  }

  if (path.isAbsolute(sfValue)) {
    return normalizePath(path.relative(process.cwd(), sfValue))
  }

  return normalized
}

function parseLcov(lcovText) {
  const files = []
  let current = null

  const flush = () => {
    if (current?.filePath) {
      files.push(current)
    }
    current = null
  }

  for (const rawLine of lcovText.split('\n')) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('SF:')) {
      flush()
      current = {
        filePath: toWorkspaceRelative(line.slice(3)),
        linesFound: 0,
        linesHit: 0,
        functionsFound: 0,
        functionsHit: 0,
        branchesFound: 0,
        branchesHit: 0,
      }
      continue
    }

    if (!current) continue

    if (line.startsWith('LF:')) current.linesFound = Number(line.slice(3)) || 0
    else if (line.startsWith('LH:')) current.linesHit = Number(line.slice(3)) || 0
    else if (line.startsWith('FNF:')) current.functionsFound = Number(line.slice(4)) || 0
    else if (line.startsWith('FNH:')) current.functionsHit = Number(line.slice(4)) || 0
    else if (line.startsWith('BRF:')) current.branchesFound = Number(line.slice(4)) || 0
    else if (line.startsWith('BRH:')) current.branchesHit = Number(line.slice(4)) || 0
    else if (line === 'end_of_record') flush()
  }

  flush()
  return files
}

function aggregate(files) {
  return files.reduce(
    (acc, file) => {
      acc.linesFound += file.linesFound
      acc.linesHit += file.linesHit
      acc.functionsFound += file.functionsFound
      acc.functionsHit += file.functionsHit
      acc.branchesFound += file.branchesFound
      acc.branchesHit += file.branchesHit
      return acc
    },
    {
      linesFound: 0,
      linesHit: 0,
      functionsFound: 0,
      functionsHit: 0,
      branchesFound: 0,
      branchesHit: 0,
    },
  )
}

function pct(hit, found) {
  if (found <= 0) return 100
  return Number(((hit / found) * 100).toFixed(2))
}

function evaluateThresholds(label, totals, thresholds) {
  const metrics = {
    lines: pct(totals.linesHit, totals.linesFound),
    functions: pct(totals.functionsHit, totals.functionsFound),
    statements: pct(totals.linesHit, totals.linesFound),
    branches: pct(totals.branchesHit, totals.branchesFound),
  }

  const failures = []
  for (const key of ['lines', 'functions', 'statements', 'branches']) {
    const threshold = thresholds[key]
    if (typeof threshold === 'number' && metrics[key] < threshold) {
      failures.push(`${label}: ${key} ${metrics[key]}% < ${threshold}%`)
    }
  }

  return { metrics, failures }
}

function readConfig(configPath) {
  const raw = fs.readFileSync(configPath, 'utf8')
  const parsed = JSON.parse(raw)

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('coverage config must be a JSON object')
  }

  if (!parsed.global || !parsed.folders) {
    throw new Error('coverage config must include global and folders keys')
  }

  return parsed
}

function main() {
  const { lcovPath, configPath, baseRef, headRef } = parseArgs(process.argv)
  const { effectiveBaseRef, skip, reason } = resolveDiffScope(baseRef, headRef)

  if (skip) {
    console.log(`coverage-thresholds: skipping gate for stale diff scope (${reason})`)
    process.exit(0)
  }

  if (!fs.existsSync(lcovPath)) {
    throw new Error(`Coverage file not found: ${lcovPath}`)
  }

  if (!fs.existsSync(configPath)) {
    throw new Error(`Coverage config not found: ${configPath}`)
  }

  const config = readConfig(configPath)
  const files = parseLcov(fs.readFileSync(lcovPath, 'utf8'))

  const changedFiles = getChangedFiles(effectiveBaseRef, headRef)

  if (files.length === 0) {
    throw new Error('No file coverage records found in lcov')
  }

  const failures = []

  const globalTotals = aggregate(files)
  const globalResult = evaluateThresholds('global', globalTotals, config.global)

  console.log('coverage-thresholds summary')
  console.log(`- global lines: ${globalResult.metrics.lines}%`) 
  console.log(`- global functions: ${globalResult.metrics.functions}%`) 
  console.log(`- global statements: ${globalResult.metrics.statements}%`) 
  console.log(`- global branches: ${globalResult.metrics.branches}%`) 

  if (effectiveBaseRef) {
    console.log(`- diff scope: ${effectiveBaseRef}...${headRef}`)
    console.log(`- changed files in scope: ${changedFiles.length}`)
  }

  if (effectiveBaseRef) {
    console.log('- global threshold enforcement: skipped in diff-scoped mode')
  } else {
    failures.push(...globalResult.failures)
  }

  for (const folderRule of config.folders) {
    let matched
    let label = folderRule.prefix

    if (effectiveBaseRef) {
      const changedInFolder = changedFiles.filter((filePath) => filePath.startsWith(folderRule.prefix))
      if (changedInFolder.length === 0) {
        console.log(`- ${folderRule.prefix} skipped (no changed files in diff scope)`)
        continue
      }

      const changedFileSet = new Set(changedInFolder)
      matched = files.filter((file) => changedFileSet.has(file.filePath))
      const matchedFileSet = new Set(matched.map((file) => file.filePath))
      const missingCoverageFiles = changedInFolder.filter((filePath) => !matchedFileSet.has(filePath))
      if (missingCoverageFiles.length > 0) {
        failures.push(`${folderRule.prefix}: missing coverage records for ${missingCoverageFiles.join(', ')}`)
      }
      label = `${folderRule.prefix} (changed files)`
    } else {
      matched = files.filter((file) => file.filePath.startsWith(folderRule.prefix))
    }

    const totals = aggregate(matched)
    const result = evaluateThresholds(label, totals, folderRule.thresholds)

    console.log(`- ${label} lines: ${result.metrics.lines}%`)
    console.log(`- ${label} functions: ${result.metrics.functions}%`)
    console.log(`- ${label} statements: ${result.metrics.statements}%`)
    console.log(`- ${label} branches: ${result.metrics.branches}%`)

    failures.push(...result.failures)
  }

  if (failures.length > 0) {
    console.error('coverage-thresholds gate failed:')
    for (const failure of failures) {
      console.error(`- ${failure}`)
    }
    process.exit(1)
  }

  console.log('coverage-thresholds gate passed')
}

try {
  main()
} catch (error) {
  console.error('coverage-thresholds gate error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
}
