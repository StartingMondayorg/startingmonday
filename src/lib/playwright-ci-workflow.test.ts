import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const workflowPath = new URL('../../.github/workflows/ci.yml', import.meta.url)
const osDependencyInstallerPath = new URL('../../scripts/install-playwright-os-deps.sh', import.meta.url)
const consumerJobs = [
  'playwright',
  'playwright-merge-queue-full',
  'playwright-pr',
  'first-value-synthetic-gate',
  'mobile-visual-smoke',
  'auth-ux-guard',
  'accessibility-tier0',
]

async function workflowSource() {
  return (await readFile(workflowPath, 'utf8')).replaceAll('\r\n', '\n')
}

function jobBlock(workflow: string, jobName: string) {
  const start = workflow.indexOf(`  ${jobName}:\n`)
  if (start < 0) throw new Error(`Missing CI job: ${jobName}`)
  const nextJob = workflow.slice(start + 1).search(/\n  [a-z0-9][a-z0-9-]*:\n/)
  return nextJob < 0 ? workflow.slice(start) : workflow.slice(start, start + 1 + nextJob)
}

function jobBlocks(workflow: string) {
  const jobNames = [...workflow.matchAll(/^  ([a-z0-9][a-z0-9-]*):$/gm)].map((match) => match[1])
  return jobNames.map((jobName) => ({ jobName, block: jobBlock(workflow, jobName) }))
}

describe('Playwright CI browser installation', () => {
  it('downloads Chromium once with a lockfile-keyed cache and bounded retries', async () => {
    const workflow = await workflowSource()
    const producer = jobBlock(workflow, 'playwright-browser-cache')

    expect(producer).toContain('packages["node_modules/playwright"].version')
    expect(producer).toContain("key: ${{ runner.os }}-playwright-${{ hashFiles('package-lock.json') }}")
    expect(producer).toContain('timeout --kill-after=15s 300s npx --yes "playwright@${PLAYWRIGHT_VERSION}" install chromium')
    expect(workflow.match(/install chromium/g)).toHaveLength(1)
    expect(workflow).not.toContain('playwright install chromium --with-deps')
  })

  it('keeps the cache-restoring consumer inventory explicit and complete', async () => {
    const workflow = await workflowSource()
    const restoringJobs = jobBlocks(workflow)
      .filter(({ block }) => block.includes('uses: actions/cache/restore@v5'))
      .map(({ jobName }) => jobName)
      .sort()

    expect(restoringJobs).toEqual([...consumerJobs].sort())
  })

  it.each(consumerJobs)('%s restores the browser and installs only OS dependencies', async (jobName) => {
    const workflow = await workflowSource()
    const consumer = jobBlock(workflow, jobName)

    expect(consumer).toContain('playwright-browser-cache')
    expect(consumer).toContain('if: always() &&')
    expect(consumer).toContain('uses: actions/cache/restore@v5')
    expect(consumer).toContain('fail-on-cache-miss: true')
    expect(consumer).toContain('run: bash scripts/install-playwright-os-deps.sh')
  })

  it('bounds and retries Ubuntu mirror stalls during OS dependency setup', async () => {
    const installer = (await readFile(osDependencyInstallerPath, 'utf8')).replaceAll('\r\n', '\n')

    expect(installer).toContain('for attempt in 1 2 3')
    expect(installer).toContain('timeout --kill-after=15s 240s npx playwright install-deps chromium')
    expect(installer).toContain('::error::Playwright OS dependency installation failed')
  })

  it('runs accessibility under the repository Node version', async () => {
    const workflow = await workflowSource()
    const accessibility = jobBlock(workflow, 'accessibility-tier0')

    expect(accessibility).toContain("node-version: '22'")
    expect(accessibility).not.toContain("node-version: '20'")
  })
})