#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { loadSES } from './lib/agent-report-kit.mjs'

const ROOT = process.cwd()
const args = new Set(process.argv.slice(2))
const asJson = args.has('--json')
const ses = loadSES(path.join(ROOT, 'config', 'site-experience-standard.json'))
const visualDiscipline = ses?.visualDiscipline ?? {}

/** @typedef {{ id: string, route: string, files: string[] }} RouteSpec */

/** @type {RouteSpec[]} */
const SPECS = [
  { id: 'homepage-visual-darkness', route: '/', files: ['src/app/(marketing)/page.tsx', 'src/app/components/LandingPage.tsx'] },
  { id: 'pricing-visual-darkness', route: '/pricing', files: ['src/app/(marketing)/pricing/page.tsx', 'src/app/(marketing)/pricing/pricing-cards.tsx'] },
  { id: 'demo-visual-darkness', route: '/demo', files: ['src/app/(marketing)/demo/page.tsx'] },
  { id: 'blog-visual-darkness', route: '/blog', files: ['src/app/(marketing)/blog/page.tsx'] },
  { id: 'method-evidence-visual-darkness', route: '/method-and-evidence', files: ['src/app/(marketing)/method-and-evidence/page.tsx'] },
  { id: 'signup-visual-darkness', route: '/signup', files: ['src/app/(auth)/signup/page.tsx'] },
]

const THRESHOLDS = {
  minBackgroundLuminanceP10: visualDiscipline.minBackgroundLuminanceP10 ?? 0.02,
  maxDarkPixelShareProxy: visualDiscipline.maxDarkPixelShareProxy ?? 0.9,
  minEstimatedContrastRatio: visualDiscipline.minEstimatedContrastRatio ?? 4.5,
  minApcaProxy: visualDiscipline.minApcaProxy ?? 45,
  maxLowContrastTextOnDarkRatio: visualDiscipline.maxLowContrastTextOnDarkRatio ?? 0.45,
}

/*
  The app styles itself with semantic tokens now, so the old literal-palette proxy
  measured nothing. Luminance is read from the real token definitions in
  globals.css instead, and every route is evaluated in BOTH themes -- a pairing
  that only works in one theme is exactly the regression this gate should catch.
  oklch's L channel is perceptual lightness, on the same footing as the legacy
  SCALE below (mid grey ~= 0.5), which is retained so reintroduced literals are
  still scored rather than silently ignored.
*/
const GLOBALS_CSS = path.join(ROOT, 'src', 'app', 'globals.css')

function parseTokenLuminance() {
  const css = fs.readFileSync(GLOBALS_CSS, 'utf8')
  const block = (selector) => {
    const start = css.indexOf(selector)
    if (start === -1) return ''
    const open = css.indexOf('{', start)
    const close = css.indexOf('\n}', open)
    return css.slice(open + 1, close)
  }
  const lumOf = (value) => {
    const oklch = /oklch\(\s*([0-9.]+)/.exec(value)
    if (oklch) return Number(oklch[1])
    const hex = /#([0-9a-fA-F]{6})/.exec(value)
    if (hex) {
      const h = hex[1]
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
      // relative luminance -> perceptual lightness, to match the oklch L scale
      return Math.cbrt(0.2126 * r + 0.7152 * g + 0.0722 * b)
    }
    return null
  }
  const collect = (selector) => {
    const map = new Map()
    for (const m of block(selector).matchAll(/--([a-z0-9-]+)\s*:\s*([^;]+);/g)) {
      const lum = lumOf(m[2])
      if (lum !== null) map.set(m[1], lum)
    }
    return map
  }
  const light = collect(':root {')
  const dark = collect('.dark {')
  // .dark only redefines what changes; inherit the rest from :root
  for (const [k, v] of light) if (!dark.has(k)) dark.set(k, v)
  return { light, dark }
}

const TOKEN_LUM = parseTokenLuminance()

const BG_TOKENS = ['background', 'card', 'popover', 'muted', 'secondary', 'accent', 'primary', 'destructive', 'success', 'warning', 'info', 'sidebar']
const TEXT_TOKENS = ['foreground', 'muted-foreground', 'card-foreground', 'popover-foreground', 'primary-foreground', 'secondary-foreground', 'accent-foreground', 'destructive-foreground', 'success-foreground', 'warning-foreground', 'info-foreground', 'primary', 'destructive', 'success', 'warning', 'info']

const SCALE = {
  50: 0.98,
  100: 0.94,
  200: 0.86,
  300: 0.74,
  400: 0.62,
  500: 0.5,
  600: 0.38,
  700: 0.27,
  800: 0.16,
  900: 0.09,
  950: 0.04,
}

function read(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function median(values) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

function percentile(values, p) {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.max(0, Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1))))
  return sorted[index]
}

/*
  Inputs are perceptual lightness (oklch L). WCAG contrast is defined on relative
  luminance, and for greys L ~= Y^(1/3), so cube back before applying the ratio.
  Without this the "4.5" threshold was not a 4.5:1 contrast ratio at all.
*/
function contrastRatio(lightL, darkL) {
  const y = (l) => Math.max(0, Math.min(1, l)) ** 3
  return (y(lightL) + 0.05) / (y(darkL) + 0.05)
}

function apcaProxy(textLum, bgLum) {
  // Absolute delta: dark-on-light and light-on-dark are both legitimate.
  return Math.abs(textLum - bgLum) * 100
}

function collectScaleTokens(content, kind, theme) {
  const lums = []
  const tokenLum = TOKEN_LUM[theme]

  // semantic tokens (the current vocabulary)
  const names = (kind === 'bg' ? BG_TOKENS : TEXT_TOKENS).slice().sort((a, b) => b.length - a.length)
  const tokenRe = new RegExp(`\\b${kind}-(${names.join('|')})(?:/\\d+|/\\[[0-9.]+\\])?\\b`, 'g')
  for (const m of content.matchAll(tokenRe)) {
    const lum = tokenLum.get(m[1])
    if (typeof lum === 'number') lums.push(lum)
  }

  // legacy literal palette, still scored so a reintroduction is not invisible
  const legacyRe = new RegExp(`${kind}-(?:slate|gray|zinc|neutral)-(50|100|200|300|400|500|600|700|800|900|950)`, 'g')
  for (const m of content.matchAll(legacyRe)) {
    const lum = SCALE[m[1]]
    if (typeof lum === 'number') lums.push(lum)
  }
  const white = (content.match(new RegExp(`${kind}-white`, 'g')) || []).length
  const black = (content.match(new RegExp(`${kind}-black`, 'g')) || []).length
  for (let i = 0; i < white; i++) lums.push(1)
  for (let i = 0; i < black; i++) lums.push(0)

  // Each <Card> call site renders a panel surface; score it as the card token so
  // the panel count still shows up in the distribution, per theme.
  if (kind === 'bg') {
    const cardTags = (content.match(/<Card\b/g) || []).length
    const cardLum = tokenLum.get('card')
    if (typeof cardLum === 'number') for (let i = 0; i < cardTags; i++) lums.push(cardLum)
  }

  return lums
}

/*
  Contrast is measured on background/foreground token pairs that co-occur in one
  className -- the text against the surface it actually sits on. The previous
  percentile proxy compared the darkest background on the page against the
  lightest text anywhere on it, which are rarely the same element and is simply
  wrong once both a light and a dark theme exist.
*/
function pairMetrics(content, theme, floor) {
  const tokenLum = TOKEN_LUM[theme]
  const bgNames = BG_TOKENS.slice().sort((a, b) => b.length - a.length).join('|')
  const textNames = TEXT_TOKENS.slice().sort((a, b) => b.length - a.length).join('|')
  const failures = []
  const pairs = []

  for (const attr of content.matchAll(/className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\})/g)) {
    const cn = attr[1] ?? attr[2] ?? attr[3] ?? ''
    const bg = new RegExp(`\\bbg-(${bgNames})\\b(?!/)`).exec(cn)
    const tx = new RegExp(`\\btext-(${textNames})\\b(?!/)`).exec(cn)
    if (!bg || !tx) continue
    const b = tokenLum.get(bg[1])
    const t = tokenLum.get(tx[1])
    if (typeof b !== 'number' || typeof t !== 'number') continue
    pairs.push({ label: `bg-${bg[1]} + text-${tx[1]}`, bg: b, text: t })
  }

  // Text with no explicit surface inherits the page pairing, which is what the
  // body renders with.
  if (pairs.length === 0) {
    const b = tokenLum.get('background')
    const t = tokenLum.get('foreground')
    if (typeof b === 'number' && typeof t === 'number') pairs.push({ label: 'bg-background + text-foreground', bg: b, text: t })
  }

  let worstApca = Infinity
  let worstContrast = Infinity
  for (const pr of pairs) {
    const delta = Math.abs(pr.text - pr.bg) * 100
    const ratio = contrastRatio(Math.max(pr.text, pr.bg), Math.min(pr.text, pr.bg))
    if (delta < worstApca) worstApca = delta
    if (ratio < worstContrast) worstContrast = ratio
    if (delta < floor) failures.push(`${pr.label} (delta ${delta.toFixed(1)})`)
  }
  return {
    failures,
    worstApca: Number.isFinite(worstApca) ? worstApca : 0,
    worstContrast: Number.isFinite(worstContrast) ? worstContrast : 0,
  }
}

function evaluateTheme(combined, theme) {
  const bgLums = collectScaleTokens(combined, 'bg', theme)
  const textLums = collectScaleTokens(combined, 'text', theme)

  const darkBgCount = bgLums.filter((lum) => lum <= 0.12).length
  const darkShare = bgLums.length > 0 ? darkBgCount / bgLums.length : 0
  const bgLumP10 = percentile(bgLums, 10) ?? 0.08
  const textLumP90 = percentile(textLums, 90) ?? 0.92

  const pm = pairMetrics(combined, theme, THRESHOLDS.minApcaProxy)
  const estContrast = pm.worstContrast
  const estApcaProxy = pm.worstApca

  const failures = pm.failures
  const lowContrastTextOnDark = failures.length
  const lowContrastTextOnDarkRatio = textLums.length > 0 ? lowContrastTextOnDark / textLums.length : 0

  return { bgLums, textLums, darkShare, bgLumP10, textLumP90, estContrast, estApcaProxy, failures, lowContrastTextOnDark, lowContrastTextOnDarkRatio }
}

function evaluateRoute(spec) {
  const combined = spec.files.map(read).join('\n')

  // Score both themes and keep the worse reading for every metric, so a route
  // only passes when it is readable in light AND dark.
  const perTheme = { light: evaluateTheme(combined, 'light'), dark: evaluateTheme(combined, 'dark') }
  const worst = (pick, cmp) => cmp(pick(perTheme.light), pick(perTheme.dark))
  const bgLums = [...perTheme.light.bgLums, ...perTheme.dark.bgLums]
  const textLums = [...perTheme.light.textLums, ...perTheme.dark.textLums]

  const darkShare = worst(t => t.darkShare, Math.max)
  const bgLumP10 = worst(t => t.bgLumP10, Math.min)
  const textLumP90 = worst(t => t.textLumP90, Math.max)
  const estContrast = worst(t => t.estContrast, Math.min)
  const estApcaProxy = worst(t => t.estApcaProxy, Math.min)
  const lowContrastTextOnDark = worst(t => t.lowContrastTextOnDark, Math.max)
  const lowContrastTextOnDarkRatio = worst(t => t.lowContrastTextOnDarkRatio, Math.max)
  const pairFailures = [...new Set([...perTheme.light.failures, ...perTheme.dark.failures])]

  const checks = [
    {
      id: 'median-background-luminance',
      description: 'Median background luminance proxy stays above floor.',
      value: bgLumP10,
      threshold: THRESHOLDS.minBackgroundLuminanceP10,
      comparator: '>=',
      passed: bgLumP10 >= THRESHOLDS.minBackgroundLuminanceP10,
    },
    {
      id: 'dark-pixel-share-proxy',
      description: 'Dark pixel share proxy remains below cap.',
      value: darkShare,
      threshold: THRESHOLDS.maxDarkPixelShareProxy,
      comparator: '<=',
      passed: darkShare <= THRESHOLDS.maxDarkPixelShareProxy,
    },
    {
      id: 'estimated-contrast-ratio',
      description: 'Estimated text/background contrast ratio meets readability floor.',
      value: estContrast,
      threshold: THRESHOLDS.minEstimatedContrastRatio,
      comparator: '>=',
      passed: estContrast >= THRESHOLDS.minEstimatedContrastRatio,
    },
    {
      id: 'apca-proxy',
      description: 'APCA-style luminance delta proxy stays above readability floor.',
      value: estApcaProxy,
      threshold: THRESHOLDS.minApcaProxy,
      comparator: '>=',
      passed: estApcaProxy >= THRESHOLDS.minApcaProxy,
    },
    {
      id: 'low-contrast-on-dark-token-count',
      description: 'Token background/foreground pairs meet the readability floor in both themes.',
      value: lowContrastTextOnDarkRatio,
      threshold: THRESHOLDS.maxLowContrastTextOnDarkRatio,
      comparator: '<=',
      passed: lowContrastTextOnDarkRatio <= THRESHOLDS.maxLowContrastTextOnDarkRatio,
    },
  ]

  const passCount = checks.filter((check) => check.passed).length
  return {
    id: spec.id,
    route: spec.route,
    files: spec.files,
    metrics: {
      backgroundLuminanceP10: Number(bgLumP10.toFixed(3)),
      textLuminanceP90: Number(textLumP90.toFixed(3)),
      darkPixelShareProxy: Number(darkShare.toFixed(3)),
      estimatedContrastRatio: Number(estContrast.toFixed(2)),
      apcaProxy: Number(estApcaProxy.toFixed(1)),
      lowContrastTextOnDark,
      lowContrastTextOnDarkRatio: Number(lowContrastTextOnDarkRatio.toFixed(3)),
      pairFailures,
      backgroundTokenCount: bgLums.length,
      textTokenCount: textLums.length,
    },
    passCount,
    totalChecks: checks.length,
    passed: passCount === checks.length,
    checks,
  }
}

const routes = SPECS.map(evaluateRoute)
const failedRoutes = routes.filter((route) => !route.passed)
const summary = {
  totalRoutes: routes.length,
  passedRoutes: routes.length - failedRoutes.length,
  failedRoutes: failedRoutes.length,
  thresholds: THRESHOLDS,
}

if (asJson) {
  process.stdout.write(`${JSON.stringify({ summary, routes }, null, 2)}\n`)
} else {
  console.log('Key funnel visual darkness gate')
  console.log('------------------------------')
  console.log(`Routes: ${summary.passedRoutes}/${summary.totalRoutes} passing`)
  console.log('')

  for (const route of routes) {
    const status = route.passed ? 'PASS' : 'FAIL'
    const m = route.metrics
    console.log(`[${status}] ${route.route} (${route.passCount}/${route.totalChecks})`)
    console.log(
      `  - Metrics: bgP10 ${m.backgroundLuminanceP10}, textP90 ${m.textLuminanceP90}, darkShare ${m.darkPixelShareProxy}, contrast ${m.estimatedContrastRatio}, apcaProxy ${m.apcaProxy}, lowContrastRatio ${m.lowContrastTextOnDarkRatio}`
    )
    for (const check of route.checks) {
      const marker = check.passed ? 'OK' : 'FAIL'
      console.log(`  - ${marker}  ${check.description} (${check.value} ${check.comparator} ${check.threshold})`)
    }
    console.log('')
  }
}

if (failedRoutes.length > 0) {
  process.exitCode = 1
}
