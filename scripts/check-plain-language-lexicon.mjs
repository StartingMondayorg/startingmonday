#!/usr/bin/env node
// Plain-language lexicon gate (CLR-8 Layer 1).
// Ratcheted: jargon term counts on scoped candidate-facing surfaces may not
// exceed the baseline; retired tier phrases may not appear at all.
// Usage: node scripts/check-plain-language-lexicon.mjs [--json] [--update-baseline]
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const lexiconPath = path.join(root, 'config', 'plain-language-lexicon.json')
const baselinePath = path.join(root, 'config', 'plain-language-baseline.json')

const asJson = process.argv.includes('--json')
const updateBaseline = process.argv.includes('--update-baseline')

const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'))
const baseline = fs.existsSync(baselinePath)
  ? JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  : { fileTermCounts: {} }

const allowedExtensions = new Set(['.ts', '.tsx'])

function isExcluded(relPath) {
  return lexicon.excludeSuffixes.some((suffix) => relPath.endsWith(suffix))
}

function collectScopedFiles() {
  const files = new Set()
  for (const entry of lexicon.scope) {
    if (entry.endsWith('*')) {
      // Prefix glob like "src/app/(marketing)/for-*": match directories by prefix.
      const prefix = entry.slice(0, -1)
      const parentDir = path.join(root, path.dirname(prefix))
      const basePrefix = path.basename(prefix)
      if (!fs.existsSync(parentDir)) continue
      for (const child of fs.readdirSync(parentDir, { withFileTypes: true })) {
        if (child.isDirectory() && child.name.startsWith(basePrefix)) {
          walk(path.join(parentDir, child.name), files)
        }
      }
    } else if (entry.endsWith('/')) {
      walk(path.join(root, entry), files)
    } else {
      const fullPath = path.join(root, entry)
      if (fs.existsSync(fullPath)) files.add(fullPath)
    }
  }
  return [...files]
}

function walk(dir, files) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath, files)
    } else if (allowedExtensions.has(path.extname(entry.name))) {
      files.add(fullPath)
    }
  }
}

function countMatches(source, regex) {
  return [...source.matchAll(regex)].length
}

const termRegexes = lexicon.terms.map((term) => ({
  ...term,
  regex: new RegExp(term.pattern, 'gi'),
}))
const retiredRegexes = lexicon.retiredPhrases.map((phrase) => ({
  phrase,
  regex: new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'),
}))

const fileTermCounts = {}
const violations = []

for (const fullPath of collectScopedFiles()) {
  const relPath = path.relative(root, fullPath).replace(/\\/g, '/')
  if (isExcluded(relPath)) continue
  const source = fs.readFileSync(fullPath, 'utf8')

  for (const { phrase, regex } of retiredRegexes) {
    const count = countMatches(source, regex)
    if (count > 0) {
      violations.push({
        type: 'retired-phrase',
        file: relPath,
        phrase,
        count,
        message: `Retired phrase "${phrase}" must not render on candidate-facing surfaces. Use the canonical tier names from src/lib/billing/pricing.ts.`,
      })
    }
  }

  for (const term of termRegexes) {
    const count = countMatches(source, term.regex)
    if (count > 0) {
      fileTermCounts[relPath] ??= {}
      fileTermCounts[relPath][term.id] = count
    }
    const baselineCount = baseline.fileTermCounts?.[relPath]?.[term.id] ?? 0
    if (!updateBaseline && count > baselineCount) {
      violations.push({
        type: 'jargon-increase',
        file: relPath,
        term: term.id,
        count,
        baseline: baselineCount,
        message: `"${term.id}" count rose ${baselineCount} -> ${count}. Use plain language instead: ${term.plainSubstitute}.`,
      })
    }
  }
}

if (updateBaseline) {
  fs.writeFileSync(
    baselinePath,
    JSON.stringify({ generatedAt: new Date().toISOString().slice(0, 10), fileTermCounts }, null, 2) + '\n',
  )
  console.log(`Baseline written to ${path.relative(root, baselinePath)} (${Object.keys(fileTermCounts).length} files with existing jargon).`)
  process.exit(0)
}

// Ratchet-down notices: baseline entries whose counts dropped (informational).
const improvements = []
for (const [relPath, terms] of Object.entries(baseline.fileTermCounts ?? {})) {
  for (const [termId, baselineCount] of Object.entries(terms)) {
    const current = fileTermCounts[relPath]?.[termId] ?? 0
    if (current < baselineCount) {
      improvements.push({ file: relPath, term: termId, baseline: baselineCount, count: current })
    }
  }
}

if (asJson) {
  console.log(JSON.stringify({ ok: violations.length === 0, violations, improvements }, null, 2))
} else {
  if (violations.length > 0) {
    console.error(`Plain-language lexicon gate: ${violations.length} violation(s).\n`)
    for (const v of violations) {
      console.error(`  ${v.file}: ${v.message}`)
    }
  }
  if (improvements.length > 0) {
    console.log(`\n${improvements.length} jargon count(s) dropped below baseline. Lock the gains: npm run guard:plain-language:baseline`)
  }
  if (violations.length === 0) {
    console.log('Plain-language lexicon gate: OK.')
  }
}

process.exit(violations.length > 0 ? 1 : 0)
