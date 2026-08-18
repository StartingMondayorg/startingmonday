import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// Guards for the signal source catalog (T0.4):
// 1. Catalog entries must declare implemented + freshnessSloHours.
// 2. "active" status requires implemented === true (catalog matches code).
// 3. implemented sources must map to fetcher modules that actually exist.
// 4. No hardcoded Anthropic model strings in worker code outside lib/models.js.

const ROOT = process.cwd()
const catalogPath = path.join(ROOT, 'config', 'signal-source-catalog.json')
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8')) as {
  version: number
  sources: Array<{
    key: string
    status: string
    implemented: boolean
    freshnessSloHours: number
  }>
}

// Maps implemented catalog keys to the worker modules that ship them.
const FETCHER_MODULES: Record<string, string[]> = {
  company_press_releases: ['worker/signals/fetch-press-room.js'],
  sec_filings_8k_10k_10q: [
    'worker/signals/fetch-sec-filings.js',
    'worker/signals/detect-sec-trends.js',
    'worker/signals/fetch-sec-proxy.js',
    'worker/signals/fetch-sec-activist.js',
    'worker/signals/fetch-sec-insider.js',
  ],
  google_news: ['worker/signals/fetch-company-news.js'],
  pr_wire: ['worker/signals/fetch-pr-wire.js'],
  business_journals: ['worker/signals/fetch-bizjournal.js'],
  trade_press: ['worker/signals/fetch-trade-press.js'],
  regulatory_calendar: ['worker/signals/check-regulatory-calendar.js'],
  crunchbase_funding: ['worker/signals/fetch-crunchbase-funding.js'],
  predictleads_events: ['worker/signals/fetch-predictleads.js'],
  leadership_changes: [
    'worker/signals/fetch-pdl-execs.js',
    'worker/signals/diff-exec-snapshot.js',
  ],
  pdl_executive_snapshot: [
    'worker/signals/fetch-pdl-execs.js',
    'worker/signals/diff-exec-snapshot.js',
  ],
}

describe('signal source catalog', () => {
  it('has required fields on every source', () => {
    for (const source of catalog.sources) {
      expect(source.key, 'source key').toBeTruthy()
      expect(typeof source.implemented, `${source.key} implemented`).toBe('boolean')
      expect(source.freshnessSloHours, `${source.key} freshnessSloHours`).toBeGreaterThan(0)
    }
  })

  it('only marks sources active when they are implemented in code', () => {
    for (const source of catalog.sources) {
      if (source.status === 'active') {
        expect(source.implemented, `${source.key} is active but not implemented`).toBe(true)
      }
    }
  })

  it('maps every implemented source to an existing fetcher module', () => {
    for (const source of catalog.sources) {
      if (!source.implemented) continue
      const modules = FETCHER_MODULES[source.key]
      expect(modules, `${source.key} missing FETCHER_MODULES mapping`).toBeTruthy()
      for (const modulePath of modules ?? []) {
        expect(
          fs.existsSync(path.join(ROOT, modulePath)),
          `${source.key} maps to missing module ${modulePath}`
        ).toBe(true)
      }
    }
  })

  it('has no unmapped implemented keys drifting from the module map', () => {
    const implementedKeys = catalog.sources.filter(s => s.implemented).map(s => s.key)
    for (const key of Object.keys(FETCHER_MODULES)) {
      expect(implementedKeys, `FETCHER_MODULES has stale key ${key}`).toContain(key)
    }
  })
})

describe('worker model registry discipline', () => {
  function walkJsFiles(dir: string): string[] {
    const out: string[] = []
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'node_modules') continue
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) out.push(...walkJsFiles(full))
      else if (entry.name.endsWith('.js')) out.push(full)
    }
    return out
  }

  it('has no hardcoded Anthropic model strings outside worker/lib/models.js', () => {
    const workerDir = path.join(ROOT, 'worker')
    const modelsFile = path.join(workerDir, 'lib', 'models.js')
    const offenders: string[] = []
    for (const file of walkJsFiles(workerDir)) {
      if (file === modelsFile) continue
      const content = fs.readFileSync(file, 'utf8')
      if (/['"]claude-[a-z0-9.-]+['"]/i.test(content)) {
        offenders.push(path.relative(ROOT, file))
      }
    }
    expect(offenders, `hardcoded model strings in: ${offenders.join(', ')}`).toEqual([])
  })
})
