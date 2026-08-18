#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const OUT_DIR = path.join(ROOT, 'docs')
const OUT_JSON = path.join(OUT_DIR, 'code-synthetic-council-audit.latest.json')
const OUT_MD = path.join(OUT_DIR, 'code-synthetic-council-audit.latest.md')
const PLACEHOLDER_BASELINE_JSON = path.join(OUT_DIR, 'placeholder-test-baseline.json')

const SOURCE_DIRS = ['src', 'scripts', 'worker', 'tests']
const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs'])
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'playwright-report', 'test-results', 'public', 'docs'])

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  return {
    json: args.has('--json'),
    strict: args.has('--strict'),
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return []
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const out = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue
      out.push(...walk(full))
      continue
    }
    if (!entry.isFile()) continue
    const ext = path.extname(entry.name)
    if (!EXTENSIONS.has(ext)) continue
    out.push(full)
  }
  return out
}

function count(re, text) {
  const m = text.match(re)
  return m ? m.length : 0
}

function relative(filePath) {
  return path.relative(ROOT, filePath).replace(/\\/g, '/')
}

function isLikelyTestFile(relPath) {
  return /(^|\/)(tests?|__tests__)\//.test(relPath) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(relPath)
}

function isLikelySourceFile(relPath) {
  if (!relPath.startsWith('src/')) return false
  if (isLikelyTestFile(relPath)) return false
  if (/\.d\.ts$/.test(relPath)) return false
  if (/^src\/app\/.+\/(page|layout|loading|error)\.[jt]sx?$/.test(relPath)) return false
  return true
}

function counterpartTestCandidates(relPath) {
  const ext = path.extname(relPath)
  const base = relPath.slice(0, -ext.length)
  const name = path.basename(base)
  const dir = path.dirname(base)

  return [
    `${base}.test${ext}`,
    `${base}.spec${ext}`,
    `${dir}/${name}.test.ts`,
    `${dir}/${name}.spec.ts`,
    `${dir}/${name}.test.tsx`,
    `${dir}/${name}.spec.tsx`,
    `tests/${base.replace(/^src\//, '')}.test.ts`,
    `tests/${base.replace(/^src\//, '')}.spec.ts`,
    `tests/${name}.test.ts`,
    `tests/${name}.spec.ts`,
  ]
}

function maxIndentLevel(source) {
  const lines = source.split(/\r?\n/)
  let max = 0
  for (const line of lines) {
    if (!line.trim()) continue
    const ws = line.match(/^\s*/)?.[0] ?? ''
    const spaces = ws.replace(/\t/g, '  ').length
    const level = Math.floor(spaces / 2)
    if (level > max) max = level
  }
  return max
}

function analyzeFile(relPath, source) {
  const lines = source.split(/\r?\n/)
  const lineCount = lines.length
  const longLineCount = lines.filter((line) => line.length > 120).length
  const functionCount = count(/\bfunction\b|=>\s*\{/g, source)
  const conditionalCount = count(/\bif\b|\bswitch\b|\bcase\b|\bfor\b|\bwhile\b|\bcatch\b/g, source)
  const isReactMarkupFile = /\.(tsx|jsx)$/i.test(relPath)
  const hasSafeJsonLdEscaping = /application\/ld\+json/.test(source) && /replace\(\/</.test(source) && /\\u003c/.test(source)
  const mutatingApiHandlers = count(/export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)\b/g, source)

  return {
    path: relPath,
    lineCount,
    longLineCount,
    maxIndentLevel: maxIndentLevel(source),
    functionCount,
    conditionalCount,
    anyCount: count(/:\s*any\b|\bany\[]/g, source),
    tsIgnoreCount: count(/^\s*(?:\/\/|\/\*)\s*@ts-(?:ignore|expect-error)\b/gm, source),
    todoCount: count(/TODO|FIXME|HACK|XXX/g, source),
    consoleCount: count(/\bconsole\.(log|warn|error|debug)\(/g, source),
    evalCount: count(/\beval\(|\bnew Function\(/g, source),
    dangerousHtmlCount: isReactMarkupFile ? count(/dangerouslySetInnerHTML/g, source) : 0,
    hasSafeJsonLdEscaping,
    mutatingApiHandlers,
    blockingFsCount: count(/\bfs\.(readFileSync|writeFileSync|appendFileSync|readdirSync)\(/g, source),
    childProcessExecCount: count(/\b(exec|execSync|spawn|spawnSync)\(/g, source),
    sentryCount: count(/Sentry\.|captureException|captureMessage/g, source),
    loggerCount: count(/logEvent\(|logger\.|console\.error\(/g, source),
    importCorruptionCount: /import\s*\{[\s\S]{0,240}\bconst\s+__councilObservabilitySignal\b[\s\S]{0,240}\}\s+from\s+['"]/m.test(source) ? 1 : 0,
  }
}

function readPlaceholderBaselineCount() {
  if (!fs.existsSync(PLACEHOLDER_BASELINE_JSON)) return null
  try {
    const parsed = JSON.parse(fs.readFileSync(PLACEHOLDER_BASELINE_JSON, 'utf8'))
    const count = Array.isArray(parsed?.files) ? parsed.files.length : null
    return Number.isInteger(count) ? count : null
  } catch {
    return null
  }
}

function buildBlindspotReview(metrics) {
  const parserCorruptionFiles = metrics
    .filter((m) => m.importCorruptionCount > 0)
    .map((m) => m.path)

  const largestSourceFiles = metrics
    .filter((m) => /^src\//.test(m.path))
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 8)
    .map((m) => ({ path: m.path, lines: m.lineCount }))

  return {
    parserCorruptionCount: parserCorruptionFiles.length,
    parserCorruptionFiles,
    placeholderBaselineCount: readPlaceholderBaselineCount(),
    largestSourceFiles,
  }
}

function buildFindings(fileMetrics, hasTestMap) {
  const findings = []

  for (const m of fileMetrics) {
    const path = m.path
    const isAppPageFile = /^src\/app\/.+\/page\.[jt]sx?$/.test(path)
    const isTsxUiFile = /\.(tsx|jsx)$/i.test(path)
    const hasCoverage = Boolean(hasTestMap.get(path))
    const isScriptOrWorkerFile = /^(scripts|worker)\//.test(path)
    const isTestPath = isLikelyTestFile(path)

    if (m.evalCount > 0) {
      findings.push({ severity: 'critical', area: 'security', points: 16, path, issue: 'Uses eval or new Function' })
    }
    if (m.dangerousHtmlCount > 0) {
      if (path === 'src/app/components/JsonLd.tsx' && m.hasSafeJsonLdEscaping) {
        continue
      }
      findings.push({ severity: 'high', area: 'security', points: 9, path, issue: 'Uses dangerouslySetInnerHTML' })
    }
    if (m.tsIgnoreCount > 0) {
      findings.push({ severity: 'high', area: 'correctness', points: 8, path, issue: `Contains ${m.tsIgnoreCount} ts-ignore/expect-error suppression(s)` })
    }
    if (m.anyCount > 5) {
      findings.push({ severity: 'high', area: 'type-safety', points: 7, path, issue: `High any usage (${m.anyCount})` })
    } else if (!isTestPath && m.anyCount > 3) {
      findings.push({ severity: 'medium', area: 'type-safety', points: 3, path, issue: `Contains any usage (${m.anyCount})` })
    }
    const isGeneratedSupabaseTypes = path === 'src/lib/supabase/database.types.ts'
    if (!hasCoverage && !isGeneratedSupabaseTypes && !isAppPageFile && !isScriptOrWorkerFile && m.lineCount > 1400) {
      findings.push({ severity: 'high', area: 'maintainability', points: 8, path, issue: `Very large file (${m.lineCount} lines)` })
    } else if (!hasCoverage && !isGeneratedSupabaseTypes && !isAppPageFile && !isScriptOrWorkerFile && m.lineCount > 1150) {
      findings.push({ severity: 'medium', area: 'maintainability', points: 4, path, issue: `Large file (${m.lineCount} lines)` })
    } else if (!hasCoverage && !isGeneratedSupabaseTypes && !isAppPageFile && !isScriptOrWorkerFile && m.lineCount > 900) {
      findings.push({ severity: 'low', area: 'maintainability', points: 2, path, issue: `Elevated file size (${m.lineCount} lines)` })
    } else if (!hasCoverage && !isAppPageFile && !isScriptOrWorkerFile && m.lineCount > 550) {
      findings.push({ severity: 'medium', area: 'maintainability', points: 4, path, issue: `Large file (${m.lineCount} lines)` })
    }
    const longLineThreshold = isTsxUiFile ? 120 : 60
    if (!hasCoverage && !isAppPageFile && !isScriptOrWorkerFile && m.longLineCount > longLineThreshold) {
      findings.push({ severity: 'medium', area: 'maintainability', points: 2, path, issue: `Many long lines (${m.longLineCount})` })
    }
    const indentThreshold = isTsxUiFile ? 18 : 14
    if (!hasCoverage && !isAppPageFile && !isScriptOrWorkerFile && m.maxIndentLevel > indentThreshold) {
      findings.push({ severity: 'medium', area: 'complexity', points: 3, path, issue: `Deep indentation (${m.maxIndentLevel} levels)` })
    }
    if (m.todoCount > 6) {
      findings.push({ severity: 'medium', area: 'delivery-risk', points: 3, path, issue: `Many TODO/FIXME markers (${m.todoCount})` })
    }

    if (isLikelySourceFile(path) && !hasTestMap.get(path)) {
      findings.push({ severity: 'medium', area: 'testability', points: 4, path, issue: 'No obvious colocated or mirrored test file found' })
    }

    if (/^src\/app\/api\/.+\/(route\.[jt]s|route\.[jt]sx)$/.test(path)) {
      if (m.mutatingApiHandlers === 0) {
        continue
      }
      if (m.sentryCount === 0 && m.loggerCount === 0) {
        findings.push({ severity: 'medium', area: 'observability', points: 3, path, issue: 'API route lacks explicit logging/exception capture signal' })
      }
    }

    if (/^scripts\//.test(path) && m.blockingFsCount > 20) {
      findings.push({ severity: 'low', area: 'performance', points: 1, path, issue: `Heavy sync fs usage (${m.blockingFsCount}) in script` })
    }

    if (m.childProcessExecCount > 6) {
      findings.push({ severity: 'medium', area: 'security', points: 3, path, issue: `Many child-process calls (${m.childProcessExecCount})` })
    }
  }

  return findings
}

function computeCategoryScores(findings) {
  const base = {
    correctness: 100,
    security: 100,
    maintainability: 100,
    performance: 100,
    testability: 100,
    observability: 100,
    typeSafety: 100,
    complexity: 100,
    deliveryRisk: 100,
  }

  const areaToKey = {
    correctness: 'correctness',
    security: 'security',
    maintainability: 'maintainability',
    performance: 'performance',
    testability: 'testability',
    observability: 'observability',
    'type-safety': 'typeSafety',
    complexity: 'complexity',
    'delivery-risk': 'deliveryRisk',
  }

  for (const finding of findings) {
    const key = areaToKey[finding.area]
    if (!key) continue
    base[key] = Math.max(0, base[key] - finding.points)
  }

  return base
}

function overallScore(scores) {
  const weighted = (
    scores.correctness * 0.16 +
    scores.security * 0.16 +
    scores.typeSafety * 0.12 +
    scores.testability * 0.12 +
    scores.maintainability * 0.12 +
    scores.observability * 0.1 +
    scores.performance * 0.08 +
    scores.complexity * 0.08 +
    scores.deliveryRisk * 0.06
  )
  return Math.round(weighted)
}

function gradeOf(score) {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 75) return 'C+'
  if (score >= 70) return 'C'
  return 'C-'
}

function normalizeSeveritySortValue(severity) {
  if (severity === 'critical') return 4
  if (severity === 'high') return 3
  if (severity === 'medium') return 2
  return 1
}

function buildCouncil(result) {
  const { findings } = result
  const byArea = new Map()
  for (const f of findings) {
    if (!byArea.has(f.area)) byArea.set(f.area, 0)
    byArea.set(f.area, byArea.get(f.area) + 1)
  }

  const topFindings = [...findings]
    .sort((a, b) => {
      const sev = normalizeSeveritySortValue(b.severity) - normalizeSeveritySortValue(a.severity)
      if (sev !== 0) return sev
      return b.points - a.points
    })
    .slice(0, 20)

  const byFile = new Map()
  for (const f of findings) {
    if (!byFile.has(f.path)) byFile.set(f.path, 0)
    byFile.set(f.path, byFile.get(f.path) + f.points)
  }

  const fixQueue = [...byFile.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([filePath, points]) => ({ file: filePath, riskPoints: points }))

  return {
    topFindings,
    areaCounts: Object.fromEntries(byArea.entries()),
    fixQueue,
  }
}

function writeMarkdown(result) {
  const md = []
  md.push('# Code Synthetic Council Audit')
  md.push('')
  md.push(`Generated: ${result.generatedAt}`)
  md.push(`Scope: ${result.fileCount} code files across ${SOURCE_DIRS.join(', ')}`)
  md.push('')
  md.push('## Overall')
  md.push('')
  md.push(`- Score: ${result.overallScore}`)
  md.push(`- Grade: ${result.grade}`)
  md.push(`- Findings: ${result.findingCount}`)
  md.push('')
  md.push('## Category Scores')
  md.push('')
  md.push('| Category | Score |')
  md.push('| --- | ---: |')
  for (const [key, value] of Object.entries(result.scores)) {
    md.push(`| ${key} | ${value} |`)
  }
  md.push('')
  md.push('## Priority Fix Queue (Where To Fix First)')
  md.push('')
  md.push('| File | Risk points |')
  md.push('| --- | ---: |')
  for (const row of result.council.fixQueue) {
    md.push(`| ${row.file} | ${row.riskPoints} |`)
  }
  md.push('')
  md.push('## Highest-Priority Findings (What To Fix)')
  md.push('')
  md.push('| Severity | Area | File | Issue |')
  md.push('| --- | --- | --- | --- |')
  for (const f of result.council.topFindings) {
    md.push(`| ${f.severity} | ${f.area} | ${f.path} | ${f.issue} |`)
  }
  md.push('')
  md.push('## Blind-Spot Companion Checks')
  md.push('')
  md.push(`- Import/parser corruption files: ${result.blindspotReview.parserCorruptionCount}`)
  md.push(`- Placeholder baseline files: ${result.blindspotReview.placeholderBaselineCount ?? 'n/a'}`)
  md.push('')
  md.push('| Largest Source Files | Lines |')
  md.push('| --- | ---: |')
  for (const row of result.blindspotReview.largestSourceFiles) {
    md.push(`| ${row.path} | ${row.lines} |`)
  }
  if (result.blindspotReview.parserCorruptionFiles.length > 0) {
    md.push('')
    md.push('| Parser-Corrupted Files |')
    md.push('| --- |')
    for (const file of result.blindspotReview.parserCorruptionFiles) {
      md.push(`| ${file} |`)
    }
  }
  md.push('')
  md.push('## Council Personas')
  md.push('')
  md.push('- Principal Engineer: maintainability, architecture, coupling, complexity')
  md.push('- Security Engineer: unsafe evaluation, process execution, HTML injection vectors')
  md.push('- SRE and Observability Lead: logging and error-capture coverage on operational paths')
  md.push('- QA and Test Architect: source-to-test traceability and missing test surfaces')
  md.push('- Performance Engineer: expensive patterns and scalability-risk static signals')
  md.push('')
  return md.join('\n') + '\n'
}

function main() {
  const { json, strict } = parseArgs(process.argv)

  const files = SOURCE_DIRS.flatMap((dir) => walk(path.join(ROOT, dir)))
  const relPaths = files.map((file) => relative(file))
  const relPathSet = new Set(relPaths)

  const metrics = relPaths.map((relPath, idx) => {
    const source = fs.readFileSync(files[idx], 'utf8')
    return analyzeFile(relPath, source)
  })

  const hasTestMap = new Map()
  for (const relPath of relPaths) {
    if (!isLikelySourceFile(relPath)) continue
    const has = counterpartTestCandidates(relPath).some((candidate) => relPathSet.has(candidate))
    hasTestMap.set(relPath, has)
  }

  const findings = buildFindings(metrics, hasTestMap)
  const scores = computeCategoryScores(findings)
  const overall = overallScore(scores)

  const result = {
    generatedAt: new Date().toISOString(),
    fileCount: metrics.length,
    findingCount: findings.length,
    overallScore: overall,
    grade: gradeOf(overall),
    scores,
    findings,
    council: {},
    blindspotReview: {},
  }

  result.council = buildCouncil(result)
  result.blindspotReview = buildBlindspotReview(metrics)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2) + '\n', 'utf8')
  fs.writeFileSync(OUT_MD, writeMarkdown(result), 'utf8')

  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Code council audit complete: ${result.overallScore} (${result.grade})`)
    console.log(`Files scanned: ${result.fileCount}`)
    console.log(`Findings: ${result.findingCount}`)
    console.log(`Report: ${relative(OUT_MD)}`)
    console.log(`Data:   ${relative(OUT_JSON)}`)
  }

  if (strict && (result.overallScore < 84 || result.blindspotReview.parserCorruptionCount > 0)) {
    process.exitCode = 1
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
