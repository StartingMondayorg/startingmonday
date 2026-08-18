#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const ROOT = process.cwd()
const PAGE_FILE = path.join(ROOT, 'src', 'app', 'page.tsx')
const LANDING_FILE = path.join(ROOT, 'src', 'components', 'LandingPage.tsx')
const OUT_DIR = path.join(ROOT, 'docs')
const OUT_JSON = path.join(OUT_DIR, 'hero-dual-track-council.latest.json')
const OUT_MD = path.join(OUT_DIR, 'hero-dual-track-council.latest.md')
const OUT_SLACK = path.join(OUT_DIR, 'hero-dual-track-council.slack.txt')
const OUT_EMAIL = path.join(OUT_DIR, 'hero-dual-track-council.email.txt')

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  return {
    json: args.has('--json'),
    strict: args.has('--strict'),
  }
}

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(score)))
}

function avg(values) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function extractQuotedValue(source, key) {
  const re = new RegExp(`${key}:\\s*'([^']*)'`, 'm')
  const match = source.match(re)
  return match ? match[1].replace(/\\n/g, '\n') : ''
}

function extractH1Lines(source) {
  const match = source.match(/h1Lines:\s*\[([\s\S]*?)\]/m)
  if (!match) return []
  return [...match[1].matchAll(/'([^']+)'/g)].map((m) => m[1])
}

function extractLandingLiteral(source, prefix) {
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`${escapedPrefix}([^<]+)<`, 'm')
  const match = source.match(re)
  return match ? match[1].trim() : ''
}

function sentenceSplit(text) {
  return text
    .split(/[.!?]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function wordCount(text) {
  const words = text.match(/[A-Za-z0-9']+/g)
  return words ? words.length : 0
}

function scoreFromBudget(actual, idealMax, hardMax) {
  if (actual <= idealMax) return 100
  if (actual >= hardMax) return 60
  const span = hardMax - idealMax
  const over = actual - idealMax
  return clamp(100 - (over / span) * 40)
}

function extractTopFoldMarkup(landingSource) {
  const sectionStart = landingSource.indexOf('<section className="bg-slate-900')
  if (sectionStart === -1) return ''

  const channelChooserStart = landingSource.indexOf('Pick your channel first', sectionStart)
  const sectionEnd = channelChooserStart === -1
    ? landingSource.indexOf('</section>', sectionStart)
    : channelChooserStart

  if (sectionEnd === -1) return landingSource.slice(sectionStart)
  return landingSource.slice(sectionStart, sectionEnd)
}

function main() {
  const { json, strict } = parseArgs(process.argv)
  const pageSource = read(PAGE_FILE)
  const landingSource = read(LANDING_FILE)
  const topFoldMarkup = extractTopFoldMarkup(landingSource)

  const heroCopy = {
    eyebrow: extractQuotedValue(pageSource, 'eyebrow'),
    h1Lines: extractH1Lines(pageSource),
    bodyPreamble: extractQuotedValue(pageSource, 'bodyPreamble'),
    body: extractQuotedValue(pageSource, 'body'),
    competitiveEdge: extractQuotedValue(pageSource, 'competitiveEdge'),
    scrutinyLine: extractLandingLiteral(landingSource, 'Built for executive scrutiny:'),
    privacyBody: extractLandingLiteral(landingSource, 'Your search is completely private.'),
  }

  const textBlocks = [
    heroCopy.eyebrow,
    heroCopy.h1Lines.join(' '),
    heroCopy.bodyPreamble,
    heroCopy.body,
    heroCopy.scrutinyLine ? `Built for executive scrutiny: ${heroCopy.scrutinyLine}` : '',
    heroCopy.competitiveEdge,
    heroCopy.privacyBody ? `Your search is completely private. ${heroCopy.privacyBody}` : '',
  ].filter(Boolean)

  const combinedText = textBlocks.join(' ')
  const topFoldWords = wordCount(combinedText)
  const sentences = sentenceSplit(combinedText)
  const averageSentenceWords = avg(sentences.map(wordCount))
  const textBlockCount = textBlocks.length

  const fontSizes = new Set([...topFoldMarkup.matchAll(/text-\[(\d+)px\]/g)].map((m) => Number(m[1])))
  const fontSizeCount = fontSizes.size

  const topFoldActionCandidates =
    (topFoldMarkup.match(/<(Link|TrackLink|button|a)\b/g) || []).length +
    (landingSource.includes('CHANNEL_ROUTE_SPECS.map') ? 4 : 0) +
    (landingSource.includes('Start with the executive path and refine from there') ? 1 : 0)

  const hasMethodAndEvidence = /claimMethodLabel|claimEvidenceLabel/.test(pageSource)
  const hasPrivacyCue = /Private by default/i.test(landingSource)
  const hasQuantSignal = /\b\d+\s*(seconds?|minutes?|hours?|days?|weeks?|months?)\b/i.test(combinedText)

  const clarityMetrics = [
    {
      key: 'copy_brevity',
      label: 'Copy brevity',
      score: scoreFromBudget(topFoldWords, 90, 145),
      actual: topFoldWords,
      target: '<= 90 words',
    },
    {
      key: 'hierarchy_simplicity',
      label: 'Hierarchy simplicity',
      score: clamp(100 - Math.max(0, fontSizeCount - 4) * 10),
      actual: fontSizeCount,
      target: '<= 4 font sizes',
    },
    {
      key: 'information_chunking',
      label: 'Information chunking',
      score: clamp(100 - Math.max(0, textBlockCount - 5) * 8),
      actual: textBlockCount,
      target: '<= 5 text blocks',
    },
    {
      key: 'reading_flow',
      label: 'Reading flow',
      score: clamp(100 - Math.max(0, averageSentenceWords - 16) * 4),
      actual: Number(averageSentenceWords.toFixed(1)),
      target: '<= 16 words per sentence average',
    },
    {
      key: 'decision_path_clarity',
      label: 'Decision path clarity',
      score: clamp(100 - Math.max(0, topFoldActionCandidates - 4) * 8),
      actual: topFoldActionCandidates,
      target: '<= 4 top-fold action choices',
    },
  ]

  const conversionMetrics = [
    {
      key: 'value_prop_focus',
      label: 'Value proposition focus',
      score: clamp(
        scoreFromBudget(wordCount(heroCopy.h1Lines.join(' ')), 9, 16) * 0.55 +
        scoreFromBudget(wordCount(heroCopy.bodyPreamble), 14, 24) * 0.45
      ),
      actual: `${wordCount(heroCopy.h1Lines.join(' '))} H1 words / ${wordCount(heroCopy.bodyPreamble)} preamble words`,
      target: 'H1 <= 9 words and preamble <= 14 words',
    },
    {
      key: 'cta_discipline',
      label: 'CTA discipline',
      score: clamp(100 - Math.max(0, topFoldActionCandidates - 4) * 9),
      actual: topFoldActionCandidates,
      target: '<= 4 top-fold action choices',
    },
    {
      key: 'trust_signal_balance',
      label: 'Trust signal balance',
      score: clamp((hasPrivacyCue ? 55 : 35) + (hasMethodAndEvidence ? 35 : 20) + (heroCopy.scrutinyLine ? 10 : 0)),
      actual: `privacy=${hasPrivacyCue} method_evidence=${hasMethodAndEvidence} scrutiny=${Boolean(heroCopy.scrutinyLine)}`,
      target: 'privacy + evidence + credibility cues present',
    },
    {
      key: 'proof_specificity',
      label: 'Proof specificity',
      score: hasQuantSignal ? 92 : 74,
      actual: hasQuantSignal,
      target: 'explicit quantified outcome or time signal',
    },
    {
      key: 'scan_efficiency',
      label: 'Scan efficiency',
      score: clamp(scoreFromBudget(topFoldWords, 85, 140) * 0.6 + scoreFromBudget(textBlockCount, 5, 9) * 0.4),
      actual: `${topFoldWords} words / ${textBlockCount} blocks`,
      target: '<= 85 words and <= 5 blocks',
    },
  ]

  const conversionScore = clamp(avg(conversionMetrics.map((m) => m.score)))
  const clarityScore = clamp(avg(clarityMetrics.map((m) => m.score)))

  const allMetrics = [...conversionMetrics, ...clarityMetrics]
  const hardStopMetrics = allMetrics.filter((m) => m.score < 80)
  const passDualTrack = conversionScore >= 90 && clarityScore >= 90
  const hardStopTriggered = hardStopMetrics.length > 0
  const releaseStatus = passDualTrack && !hardStopTriggered ? 'pass' : 'fail'

  const result = {
    generatedAt: new Date().toISOString(),
    scope: {
      pageFile: 'src/app/(marketing)/page.tsx',
      componentFile: 'src/app/components/LandingPage.tsx',
      area: 'hero top fold',
    },
    council: {
      boardModel: 'dual-track',
      trackA: {
        name: 'Conversion Council',
        members: [
          'Conversion Scientist',
          'Growth Product Lead',
          'Lifecycle Strategist',
          'Analytics Lead',
        ],
      },
      trackB: {
        name: 'Clarity Council',
        members: [
          'Information Architect',
          'UX Psychologist',
          'Editorial Lead',
          'Accessibility Specialist',
        ],
      },
      arbitration: 'Product + UX tie-break arbitration',
      operatingCouncil: [
        'Conversion Scientist',
        'Growth Product Lead',
        'Lifecycle Strategist',
        'Analytics Lead',
        'Information Architect',
        'UX Psychologist',
        'Editorial Lead',
        'Accessibility Specialist',
        'Frontend Performance Engineer',
      ],
    },
    policy: {
      conversionPassThreshold: 90,
      clarityPassThreshold: 90,
      metricHardStopThreshold: 80,
      releaseStatus,
      passDualTrack,
      hardStopTriggered,
      hardStopMetrics: hardStopMetrics.map((m) => ({ key: m.key, score: m.score })),
    },
    signals: {
      topFoldWords,
      textBlockCount,
      fontSizeCount,
      averageSentenceWords: Number(averageSentenceWords.toFixed(1)),
      topFoldActionChoices: topFoldActionCandidates,
    },
    tracks: {
      conversion: {
        score: conversionScore,
        metrics: conversionMetrics,
      },
      clarity: {
        score: clarityScore,
        metrics: clarityMetrics,
      },
    },
  }

  const md = []
  md.push('# Hero Dual-Track Council Audit')
  md.push('')
  md.push(`Generated: ${result.generatedAt}`)
  md.push(`Release status: ${result.policy.releaseStatus.toUpperCase()}`)
  md.push('')
  md.push('## Dual-Track Policy')
  md.push('')
  md.push('- Track A (Conversion Council) must score >= 90')
  md.push('- Track B (Clarity Council) must score >= 90')
  md.push('- Any individual metric < 80 triggers hard stop')
  md.push('- Tie-break decisions are Product + UX arbitration')
  md.push('')
  md.push('## Scores')
  md.push('')
  md.push(`- Conversion score: ${conversionScore}`)
  md.push(`- Clarity score: ${clarityScore}`)
  md.push(`- Hard stop triggered: ${result.policy.hardStopTriggered ? 'yes' : 'no'}`)
  md.push('')
  md.push('## Conversion Metrics')
  md.push('')
  md.push('| Metric | Score | Actual | Target |')
  md.push('| --- | ---: | --- | --- |')
  for (const metric of conversionMetrics) {
    md.push(`| ${metric.label} | ${metric.score} | ${metric.actual} | ${metric.target} |`)
  }
  md.push('')
  md.push('## Clarity Metrics')
  md.push('')
  md.push('| Metric | Score | Actual | Target |')
  md.push('| --- | ---: | --- | --- |')
  for (const metric of clarityMetrics) {
    md.push(`| ${metric.label} | ${metric.score} | ${metric.actual} | ${metric.target} |`)
  }
  md.push('')
  md.push('## Operating Council (Option 2 + Dual Track)')
  md.push('')
  for (const role of result.council.operatingCouncil) {
    md.push(`- ${role}`)
  }
  md.push('')

  const slackSummary = [
    '*Hero Dual-Track Council Audit*',
    `release_status=${result.policy.releaseStatus.toUpperCase()}`,
    `conversion=${conversionScore} clarity=${clarityScore}`,
    `hard_stop=${result.policy.hardStopTriggered ? 'yes' : 'no'}`,
    `signals: words=${topFoldWords}, blocks=${textBlockCount}, font_sizes=${fontSizeCount}, action_choices=${topFoldActionCandidates}`,
  ].join('\n')

  const emailSummary = [
    '# Hero Dual-Track Council Audit',
    '',
    `Release status: ${result.policy.releaseStatus.toUpperCase()}`,
    `Conversion score: ${conversionScore}`,
    `Clarity score: ${clarityScore}`,
    `Hard stop triggered: ${result.policy.hardStopTriggered ? 'yes' : 'no'}`,
    '',
    'Hard-stop metrics (<80):',
    ...(hardStopMetrics.length
      ? hardStopMetrics.map((m) => `- ${m.label}: ${m.score}`)
      : ['- none']),
    '',
    `Signals: words=${topFoldWords}, blocks=${textBlockCount}, font_sizes=${fontSizeCount}, action_choices=${topFoldActionCandidates}`,
  ].join('\n')

  fs.mkdirSync(OUT_DIR, { recursive: true })
  fs.writeFileSync(OUT_JSON, JSON.stringify(result, null, 2) + '\n', 'utf8')
  fs.writeFileSync(OUT_MD, md.join('\n') + '\n', 'utf8')
  fs.writeFileSync(OUT_SLACK, slackSummary + '\n', 'utf8')
  fs.writeFileSync(OUT_EMAIL, emailSummary + '\n', 'utf8')

  if (json) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Hero dual-track council audit complete: ${releaseStatus.toUpperCase()}`)
    console.log(`Conversion: ${conversionScore}`)
    console.log(`Clarity: ${clarityScore}`)
    console.log(`Report: ${path.relative(ROOT, OUT_MD).replace(/\\/g, '/')}`)
    console.log(`Data:   ${path.relative(ROOT, OUT_JSON).replace(/\\/g, '/')}`)
  }

  if (strict && releaseStatus !== 'pass') {
    process.exitCode = 1
  }
}

try {
  main()
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
