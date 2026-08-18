import { readFile } from 'node:fs/promises'
import process from 'node:process'
import { evaluateEmailCouncilQuality } from '../src/lib/email/email-council'

function getArg(flag: string): string {
  const idx = process.argv.indexOf(flag)
  if (idx === -1) return ''
  return process.argv[idx + 1] ?? ''
}

async function main() {
  const subject = getArg('--subject')
  const html = getArg('--html')
  const htmlFile = getArg('--html-file')
  const channel = getArg('--channel') || 'general'
  const min = Number(getArg('--min-score') || process.env.EMAIL_COUNCIL_MIN_SCORE || '90')

  const resolvedHtml = html || (htmlFile ? await readFile(htmlFile, 'utf8') : '')

  if (!subject || !resolvedHtml) {
    console.error('Usage: npm run email:council:check -- --subject "..." --html "..." [--channel executives] [--min-score 90]')
    console.error('   or: npm run email:council:check -- --subject "..." --html-file path/to/body.html')
    process.exit(2)
  }

  const result = evaluateEmailCouncilQuality({
    channel: channel as any,
    subject,
    html: resolvedHtml,
    minEjes: Number.isFinite(min) ? min : 90,
  })

  const output = {
    channel,
    subject,
    minScore: min,
    scores: result.scores,
    passes: result.passes,
    blockers: result.blockers,
    warnings: result.warnings,
  }

  console.log(JSON.stringify(output, null, 2))

  if (!result.passes) process.exit(1)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exit(1)
})
