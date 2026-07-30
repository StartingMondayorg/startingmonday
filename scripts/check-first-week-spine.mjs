#!/usr/bin/env node
// First-week spine guard (CLR-6 Gate 3 + word budgets).
// 1. Word budgets: each canonical block stays within its declared budget.
// 2. Single-source: no surface hard-codes a spine block; copy renders via import only.
// 3. Canonical copy itself must pass the plain-language lexicon.
// Usage: node scripts/check-first-week-spine.mjs [--json]
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const spinePath = path.join(root, 'src', 'content', 'first-week-spine.json')
const lexiconPath = path.join(root, 'config', 'plain-language-lexicon.json')
const asJson = process.argv.includes('--json')

const spine = JSON.parse(fs.readFileSync(spinePath, 'utf8'))
const lexicon = JSON.parse(fs.readFileSync(lexiconPath, 'utf8'))

const violations = []

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length
}

// 1. Word budgets
const spineTotal =
  wordCount(spine.heading) +
  spine.steps.reduce((sum, step) => sum + wordCount(step.label) + wordCount(step.body), 0)
const checks = [
  { id: 'spine-total', words: spineTotal, budget: spine.budgets.spineTotalWords },
  { id: 'trust-line', words: wordCount(spine.trustLine), budget: spine.budgets.trustLineWords },
  { id: 'guarantee-line', words: wordCount(spine.guaranteeLine), budget: spine.budgets.guaranteeLineWords },
  { id: 'confirmation-line', words: wordCount(spine.confirmationLine), budget: spine.budgets.confirmationLineWords },
  { id: 'condensed-total', words: spine.condensed.reduce((sum, line) => sum + wordCount(line), 0), budget: spine.budgets.condensedTotalWords },
]
for (const check of checks) {
  if (check.words > check.budget) {
    violations.push({ type: 'word-budget', block: check.id, words: check.words, budget: check.budget, message: `${check.id}: ${check.words} words exceeds budget of ${check.budget}.` })
  }
}

// 2. Single-source: spine block literals may not appear in app/component sources.
const canonicalStrings = [
  spine.heading,
  spine.trustLine,
  spine.guaranteeLine,
  spine.confirmationLine,
  ...spine.steps.map((step) => step.body),
  ...spine.condensed,
]
const allowedExtensions = new Set(['.ts', '.tsx'])
function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(fullPath, files)
    else if (allowedExtensions.has(path.extname(entry.name))) files.push(fullPath)
  }
  return files
}
const sourceFiles = [...walk(path.join(root, 'src', 'app')), ...walk(path.join(root, 'src', 'components'))]
for (const fullPath of sourceFiles) {
  const relPath = path.relative(root, fullPath).replace(/\\/g, '/')
  const source = fs.readFileSync(fullPath, 'utf8')
  for (const literal of canonicalStrings) {
    if (source.includes(literal)) {
      violations.push({ type: 'hard-coded-copy', file: relPath, message: `${relPath}: hard-codes spine copy ("${literal.slice(0, 48)}..."). Import from src/content/first-week-spine.json instead.` })
    }
  }
}

// 3. Canonical copy passes the plain-language lexicon.
const allCopy = canonicalStrings.concat(spine.steps.map((step) => step.label)).join('\n')
for (const term of lexicon.terms) {
  const regex = new RegExp(term.pattern, 'gi')
  if (regex.test(allCopy)) {
    violations.push({ type: 'jargon-in-spine', term: term.id, message: `Spine copy contains blocklisted term "${term.id}". Use: ${term.plainSubstitute}.` })
  }
}
for (const phrase of lexicon.retiredPhrases) {
  if (allCopy.toLowerCase().includes(phrase.toLowerCase())) {
    violations.push({ type: 'retired-phrase-in-spine', phrase, message: `Spine copy contains retired phrase "${phrase}".` })
  }
}

if (asJson) {
  console.log(JSON.stringify({ ok: violations.length === 0, spineTotalWords: spineTotal, violations }, null, 2))
} else if (violations.length > 0) {
  console.error(`First-week spine guard: ${violations.length} violation(s).\n`)
  for (const v of violations) console.error(`  ${v.message}`)
} else {
  console.log(`First-week spine guard: OK (spine ${spineTotal}/${spine.budgets.spineTotalWords} words).`)
}

process.exit(violations.length > 0 ? 1 : 0)
