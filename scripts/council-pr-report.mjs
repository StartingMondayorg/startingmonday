#!/usr/bin/env node
/**
 * Render a code council delta between two audit runs as a PR comment.
 *
 * The council scores the whole repository, which makes its absolute number
 * meaningless to a pull request author: they did not cause the accumulated
 * debt and cannot fix it. The delta is the part they own, so that is what this
 * reports — what this branch introduced, what it resolved, and which way the
 * score moved.
 *
 * Advisory only. This always exits 0; nothing here blocks a merge.
 *
 * Usage:
 *   node scripts/council-pr-report.mjs <base.json> <head.json> [--out report.md]
 */

import fs from 'node:fs'

const args = process.argv.slice(2)
const files = args.filter((a) => !a.startsWith('--'))
const outIdx = args.indexOf('--out')
const outFile = outIdx === -1 ? null : args[outIdx + 1]

if (files.length < 2) {
  console.error('Usage: node scripts/council-pr-report.mjs <base.json> <head.json> [--out report.md]')
  process.exit(2)
}

const read = (f) => JSON.parse(fs.readFileSync(f, 'utf8'))
const base = read(files[0])
const head = read(files[1])

/**
 * Findings carry a count in their text ("Large file (803 lines)"). Normalise it
 * so a file growing by three lines reads as the same finding rather than as a
 * resolve plus an add.
 */
const keyOf = (f) => `${f.area} ${f.path} ${f.issue.replace(/\d+/g, 'N')}`

const baseKeys = new Set(base.findings.map(keyOf))
const headMap = new Map(head.findings.map((f) => [keyOf(f), f]))
const headKeys = new Set(headMap.keys())

const introduced = [...headMap].filter(([k]) => !baseKeys.has(k)).map(([, f]) => f)
const resolvedCount = [...baseKeys].filter((k) => !headKeys.has(k)).length

const delta = head.overallScore - base.overallScore
const signed = (n) => (n > 0 ? `+${n}` : `${n}`)

const SEVERITY_RANK = { critical: 0, high: 1, medium: 2, low: 3 }
introduced.sort((a, b) => {
  const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
  return bySeverity !== 0 ? bySeverity : a.path.localeCompare(b.path)
})

const md = []
md.push('### Code council')
md.push('')

// Lead with the counts, not the score. Scoring the whole repo means one branch
// moves the overall number by a fraction of a point even when it introduces a
// dozen findings — the counts are the part the author can act on.
const scoreNote =
  delta === 0
    ? `score holds at ${head.overallScore} (${head.grade})`
    : `score ${base.overallScore} → ${head.overallScore} (${signed(delta)})`

if (introduced.length === 0 && resolvedCount === 0) {
  md.push(`No new findings — ${scoreNote}.`)
} else {
  const parts = []
  if (introduced.length > 0) parts.push(`**${introduced.length} introduced**`)
  if (resolvedCount > 0) parts.push(`${resolvedCount} resolved`)
  md.push(`${parts.join(' · ')} — ${scoreNote}.`)
}
md.push('')

// Category movement, so a flat overall score does not hide offsetting changes.
const moved = Object.keys(head.scores)
  .filter((k) => head.scores[k] !== base.scores?.[k])
  .map((k) => ({ name: k, from: base.scores?.[k], to: head.scores[k] }))

if (moved.length > 0) {
  md.push('| Category | Before | After |')
  md.push('| --- | ---: | ---: |')
  for (const m of moved) md.push(`| ${m.name} | ${m.from} | ${m.to} |`)
  md.push('')
}

if (introduced.length > 0) {
  const byArea = new Map()
  for (const f of introduced) {
    if (!byArea.has(f.area)) byArea.set(f.area, [])
    byArea.get(f.area).push(f)
  }

  // Expanded while the list is short enough to skim; collapsed once it would
  // dominate the PR thread.
  md.push(introduced.length <= 10 ? '<details open>' : '<details>')
  md.push(`<summary><strong>Introduced by this branch (${introduced.length})</strong></summary>`)
  md.push('')
  for (const [area, list] of byArea) {
    md.push(`**${area}** — ${list.length}`)
    md.push('')
    for (const f of list.slice(0, 15)) {
      md.push(`- \`${f.path}\` — ${f.issue} _(${f.severity})_`)
    }
    if (list.length > 15) md.push(`- …and ${list.length - 15} more`)
    md.push('')
  }
  md.push('</details>')
  md.push('')
}

const cov = head.coverage
if (cov) {
  md.push(
    `<sub>Coverage: ${cov.coveredSourceFiles}/${cov.sourceFiles} source files have a test · ` +
      `${cov.loggedApiRoutes}/${cov.mutatingApiRoutes} mutating API routes log or capture errors.</sub>`
  )
  md.push('')
}

md.push('<sub>Advisory — the council does not block merges. Repo-wide status goes out in the weekly unified audit.</sub>')

const output = md.join('\n') + '\n'

if (outFile) {
  fs.writeFileSync(outFile, output, 'utf8')
  console.log(`Wrote ${outFile} (${introduced.length} introduced, ${resolvedCount} resolved, delta ${signed(delta)})`)
} else {
  process.stdout.write(output)
}
