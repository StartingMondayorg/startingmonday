import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

const workflowPath = new URL('../../.github/workflows/ci.yml', import.meta.url)
const startLocalAppActionPath = new URL('../../.github/actions/start-local-app/action.yml', import.meta.url)
const packageLockPath = new URL('../../package-lock.json', import.meta.url)
const waitScriptPath = new URL('../../scripts/wait-for-deployed-commit.sh', import.meta.url)
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
  it('runs every browser consumer in the lockfile-matched official image', async () => {
    const workflow = await workflowSource()
    const startLocalAppAction = (await readFile(startLocalAppActionPath, 'utf8')).replaceAll('\r\n', '\n')
    const packageLock = JSON.parse(await readFile(packageLockPath, 'utf8'))
    const playwrightVersion = packageLock.packages['node_modules/playwright'].version
    const expectedImage = `container: mcr.microsoft.com/playwright:v${playwrightVersion}-noble`
    const containerizedJobs = jobBlocks(workflow)
      .filter(({ block }) => block.includes('container: mcr.microsoft.com/playwright:'))
      .map(({ jobName }) => jobName)
      .sort()

    expect(containerizedJobs).toEqual([...consumerJobs].sort())
    expect(workflow).not.toMatch(/playwright install(?:-deps|\s)/)
    expect(workflow).not.toContain('playwright-browser-cache')
    expect(workflow).not.toMatch(/for i in \{1\.\.60\}/)
    expect(workflow).not.toContain('seq 1 60')
    expect(workflow.match(/uses: \.\/\.github\/actions\/start-local-app/g)).toHaveLength(5)
    expect(startLocalAppAction).toContain("default: '60'")
    expect(startLocalAppAction).toContain('while [ "$attempts" -lt "${{ inputs.max-attempts }}" ]; do')
    for (const jobName of consumerJobs) {
      const consumer = jobBlock(workflow, jobName)
      expect(consumer).toContain(expectedImage)
      expect(consumer).toContain('PLAYWRIGHT_BROWSERS_PATH: /ms-playwright')
    }
  })

  // The deploy wait used to be five open-coded `while [ "$attempts" -lt 60 ]`
  // loops, one per job. They were consolidated into a shared deploy-ready job
  // backed by scripts/wait-for-deployed-commit.sh. The guard that mattered was
  // never the loop's shape -- it was that CI can never poll unbounded -- so it
  // is asserted here against the design that actually exists now.
  it('bounds the deploy wait and keeps it out of the workflow', async () => {
    const workflow = await workflowSource()
    const waitScript = (await readFile(waitScriptPath, 'utf8')).replaceAll('\r\n', '\n')

    // No open-coded polling in the workflow, in any of its historical shapes.
    expect(workflow).not.toMatch(/for i in \{1\.\.\d+\}/)
    expect(workflow).not.toMatch(/seq 1 \d+/)
    expect(workflow).not.toMatch(/while \[ "\$attempts"/)

    // One shared waiter that every deployment-dependent job funnels through.
    expect(workflow).toContain('  deploy-ready:\n')
    expect(jobBlock(workflow, 'deploy-ready')).toContain('scripts/wait-for-deployed-commit.sh')
    expect(workflow).toMatch(/needs: \[deploy-ready\]/)

    // The wait itself terminates: a deadline the loop cannot outlive, and a
    // sleep between polls so it does not spin.
    expect(waitScript).toMatch(/while \[ "\$\(date \+%s\)" -lt "\$deadline" \]/)
    expect(waitScript).toMatch(/sleep "\$POLL_SECS"/)
  })

  it('runs accessibility under the repository Node version', async () => {
    const workflow = await workflowSource()
    const accessibility = jobBlock(workflow, 'accessibility-tier0')

    expect(accessibility).toContain("node-version: '22'")
    expect(accessibility).not.toContain("node-version: '20'")
  })
})