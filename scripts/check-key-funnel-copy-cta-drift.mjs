#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const args = new Set(process.argv.slice(2))
const asJson = args.has('--json')

function read(relativePath) {
  const fullPath = path.join(ROOT, relativePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${relativePath}`)
  }
  return fs.readFileSync(fullPath, 'utf8')
}

function has(content, matcher) {
  if (matcher instanceof RegExp) return matcher.test(content)
  return content.includes(matcher)
}

function toRelative(p) {
  return p.replace(/\\/g, '/')
}

/** @typedef {{ id: string, description: string, matcher: string | RegExp, kind?: 'require' | 'forbid' }} Rule */
/** @typedef {{ id: string, route: string, files: string[], rules: Rule[] }} RouteSpec */

/** @type {RouteSpec[]} */
const SPECS = [
  {
    id: 'homepage-copy-cta',
    route: '/',
    files: ['src/app/(marketing)/page.tsx', 'src/components/LandingPage.tsx'],
    rules: [
      {
        id: 'home-hero-claim',
        description: 'Homepage hero keeps timing-and-outcomes claim.',
        matcher: 'Reputation opens doors. Timing decides outcomes.',
      },
      {
        id: 'home-method-section',
        description: 'Homepage includes unified method narrative heading.',
        matcher: 'How The Monday Engine Works',
      },
      {
        id: 'home-evidence-route',
        description: 'Homepage evidence CTA points to early-signals evidence anchor.',
        matcher: 'href="/evidence-hub#early-signals"',
      },
    ],
  },
  {
    id: 'pricing-copy-cta',
    route: '/pricing',
    files: ['src/app/(marketing)/pricing/pricing-cards.tsx'],
    rules: [
      {
        id: 'pricing-primary-cta',
        description: 'Pricing cards keep a primary signup CTA link.',
        matcher: /href="\/signup/,
      },
      {
        id: 'pricing-privacy-assurance',
        description: 'Pricing keeps employer-visibility privacy assurance near decision point.',
        matcher: 'Your employer cannot see your account or your search activity.',
      },
    ],
  },
  {
    id: 'demo-copy-cta',
    route: '/demo',
    files: ['src/app/(marketing)/demo/page.tsx'],
    rules: [
      {
        id: 'demo-run-anchor',
        description: 'Demo keeps run-action CTA anchor.',
        matcher: 'Generate the brief',
      },
      {
        id: 'demo-trial-cta',
        description: 'Demo keeps a signup CTA routed from demo.',
        matcher: /href="\/signup\?from=demo"/,
      },
    ],
  },
  {
    id: 'blog-copy-cta',
    route: '/blog',
    files: ['src/app/(marketing)/blog/page.tsx'],
    rules: [
      {
        id: 'blog-demo-cta',
        description: 'Blog index keeps demo CTA copy.',
        matcher: 'See a live prep brief',
      },
    ],
  },
  {
    id: 'method-evidence-copy-cta',
    route: '/method-and-evidence',
    files: ['src/app/(marketing)/method-and-evidence/page.tsx'],
    rules: [
      {
        id: 'method-dig-deeper',
        description: 'Method and evidence page keeps Dig deeper section label.',
        matcher: 'Dig deeper',
      },
      {
        id: 'method-dig-deeper-links',
        description: 'Method and evidence page keeps references/evidence/timing links.',
        matcher: /href="\/references"[\s\S]*href="\/evidence-hub"[\s\S]*href="\/blog\/how-we-estimate-early-role-signals"/,
      },
    ],
  },
  {
    id: 'signup-copy-cta',
    route: '/signup',
    files: ['src/app/(auth)/signup/page.tsx'],
    rules: [
      {
        id: 'signup-h1',
        description: 'Signup keeps Create your account heading.',
        matcher: 'Create your account',
      },
      {
        id: 'signup-trial-copy',
        description: 'Signup keeps no-credit-card assurance.',
        matcher: 'No credit card.',
      },
      {
        id: 'signup-no-jump-box',
        description: 'Signup does not reintroduce jump navigation copy.',
        matcher: /Jump to section/i,
        kind: 'forbid',
      },
    ],
  },
]

const routeResults = []

for (const spec of SPECS) {
  const files = spec.files.map((file) => ({ file, content: read(file) }))

  const checks = spec.rules.map((rule) => {
    const matchedIn = files.find((entry) => has(entry.content, rule.matcher))
    const passed = rule.kind === 'forbid' ? !matchedIn : Boolean(matchedIn)

    return {
      id: rule.id,
      description: rule.description,
      passed,
      observed: matchedIn ? toRelative(matchedIn.file) : null,
    }
  })

  const passCount = checks.filter((check) => check.passed).length
  routeResults.push({
    id: spec.id,
    route: spec.route,
    files: files.map((entry) => toRelative(entry.file)),
    passCount,
    totalChecks: checks.length,
    passed: passCount === checks.length,
    checks,
  })
}

const failedRoutes = routeResults.filter((result) => !result.passed)
const summary = {
  totalRoutes: routeResults.length,
  passedRoutes: routeResults.length - failedRoutes.length,
  failedRoutes: failedRoutes.length,
}

if (asJson) {
  process.stdout.write(
    JSON.stringify(
      {
        summary,
        routes: routeResults,
      },
      null,
      2
    ) + '\n'
  )
} else {
  console.log('Key funnel copy/CTA drift guard')
  console.log('------------------------------')
  console.log(`Routes: ${summary.passedRoutes}/${summary.totalRoutes} passing`)
  console.log('')

  for (const result of routeResults) {
    const status = result.passed ? 'PASS' : 'FAIL'
    console.log(`[${status}] ${result.route} (${result.passCount}/${result.totalChecks})`)
    for (const check of result.checks) {
      const mark = check.passed ? 'OK' : 'MISSING/DRIFT'
      const observed = check.observed ? ` [${check.observed}]` : ''
      console.log(`  - ${mark}  ${check.description}${observed}`)
    }
    console.log('')
  }
}

if (failedRoutes.length > 0) {
  process.exitCode = 1
}
