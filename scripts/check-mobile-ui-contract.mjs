#!/usr/bin/env node
import fs from 'fs'

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8')
}

function assertContains(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    throw new Error(message)
  }
}

const dashboardPath = 'src/app/(dashboard)/dashboard/page.tsx'
const cssPath = 'src/app/globals.css'
const navPath = 'src/app/(dashboard)/_components/PrimaryNav.tsx'
const homePath = 'src/app/(marketing)/page.tsx'
const landingPath = 'src/app/components/LandingPage.tsx'

const dashboard = read(dashboardPath)
const css = read(cssPath)
const bottomNav = read(navPath)
const home = read(homePath)
const landing = read(landingPath)

// Three-zone layout contracts (legacy quick-actions grid retired 2026-10-20, R-2):
// Zone 3 stacks on mobile and becomes a three-column strip from the sm breakpoint;
// the single primary action keeps a 44px minimum tap target.
assertContains(
  dashboard,
  'grid gap-3 sm:grid-cols-3',
  'Zone 3 layout contract missing: expected stacked mobile and 3-column desktop strip',
)
assertContains(
  dashboard,
  'className="min-h-[44px] px-5 text-[13px] font-semibold" render={<Link href={threeZoneNextMove.href} data-dashboard-action="next_move" />}',
  'Next-move tap target contract missing: expected 44px minimum height on the primary action',
)

// Outreach gating contract: only owner/admin can see outreach hub entry points.
assertContains(
  dashboard,
  'canUseOutreachHub',
  'Outreach visibility contract missing: expected canUseOutreachHub definition',
)
assertContains(
  dashboard,
  "staffMember?.role === \"owner\" || staffMember?.role === \"admin\"",
  'Outreach visibility contract missing: expected owner/admin role gate',
)

// Bottom spacer contract: keep post-content blank area constrained.
assertContains(
  css,
  'padding-bottom: calc(0.75rem + env(safe-area-inset-bottom, 0px));',
  'Bottom spacer contract missing: expected reduced nav-content-spacer padding',
)

// Bottom nav tap target contract.
assertContains(
  bottomNav,
  'min-h-[56px]',
  'Bottom nav contract missing: expected 56px mobile tab minimum height',
)

// Homepage should not render helper utilities above the main hero.
if (home.includes('Quick navigation') || home.includes('TL;DR')) {
  throw new Error('Homepage helper block contract failed: Quick navigation / TL;DR content must not render above main hero')
}

// Landing hero and final CTA copy should use anti-orphan text wrapping controls.
assertContains(
  landing,
  '[text-wrap:balance]',
  'Text wrapping contract missing: expected [text-wrap:balance] on hero/final headlines',
)

assertContains(
  landing,
  '[text-wrap:pretty]',
  'Text wrapping contract missing: expected [text-wrap:pretty] on long body copy',
)

if (landing.includes('The signal comes before<br />')) {
  throw new Error('Final CTA heading contract failed: remove manual line breaks that create mobile orphan lines')
}

console.log('mobile-ui contract checks passed')
