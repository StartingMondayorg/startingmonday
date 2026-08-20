import fs from 'node:fs'
import path from 'node:path'
import { ESLint } from 'eslint'

const root = process.cwd()
const baselinePath = path.join(root, 'docs', 'lint-warning-baseline.json')
const shouldUpdateBaseline = process.argv.includes('--update-baseline')

function summarize(report) {
  const warningsByFile = {}
  let totalWarnings = 0
  let totalErrors = 0

  for (const file of report) {
    const warnings = file.warningCount ?? 0
    totalWarnings += warnings
    totalErrors += file.errorCount ?? 0
    if (warnings > 0) {
      const relativePath = path.relative(root, file.filePath).replace(/\\/g, '/')
      warningsByFile[relativePath] = warnings
    }
  }

  return { warningsByFile, totalWarnings, totalErrors }
}

async function main() {
  const eslint = new ESLint({ cache: false })
  const report = await eslint.lintFiles(['.'])
  const current = summarize(report)

  if (current.totalErrors > 0) {
    console.error(`ESLint has ${current.totalErrors} errors. Fix errors before baseline check.`)
    process.exitCode = 1
    return
  }

  if (shouldUpdateBaseline) {
    const updated = {
      warnings: current.totalWarnings,
      warningsByFile: current.warningsByFile,
      capturedAt: new Date().toISOString().slice(0, 10),
      notes: 'Per-file ratchet: a PR fails only if a specific file\'s warning count increases past its baseline here. Regenerate with `node scripts/check-lint-baseline.mjs --update-baseline` after intentionally accepting new warnings.',
    }
    fs.writeFileSync(baselinePath, `${JSON.stringify(updated, null, 2)}\n`)
    console.log(
      `Lint baseline updated: ${current.totalWarnings} total warnings across ${Object.keys(current.warningsByFile).length} files.`,
    )
    return
  }

  if (!fs.existsSync(baselinePath)) {
    console.error(`Missing baseline file: ${baselinePath}`)
    process.exitCode = 1
    return
  }

  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'))
  const baselineByFile = baseline.warningsByFile ?? {}

  const regressions = []
  for (const [file, count] of Object.entries(current.warningsByFile)) {
    const baselineCount = baselineByFile[file] ?? 0
    if (count > baselineCount) {
      regressions.push(`${file}: ${count} warnings (baseline ${baselineCount})`)
    }
  }

  if (regressions.length > 0) {
    console.error('Lint warning regression (per-file ratchet — a file exceeded its own baseline):')
    for (const regression of regressions) {
      console.error(`- ${regression}`)
    }
    console.error(
      'Note: fixing warnings elsewhere does not offset a regression in one file. Fix the file(s) above, or run `node scripts/check-lint-baseline.mjs --update-baseline` if the increase is intentional.',
    )
    process.exitCode = 1
    return
  }

  console.log(
    `Lint baseline check passed: current=${current.totalWarnings} total warnings, baseline=${baseline.warnings ?? 'n/a'} (per-file ratchet, no file regressed).`,
  )
}

main().catch((err) => {
  console.error('Lint baseline check failed:', err)
  process.exitCode = 1
})
