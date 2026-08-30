import assert from 'node:assert/strict'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const guardPath = fileURLToPath(new URL('./check-runtime-trace-scope.mjs', import.meta.url))
const allowedTrace = '(dashboard)/dashboard/admin/guide/page.js.nft.json'

async function writeTrace(root, files) {
  const tracePath = path.join(root, '.next', 'server', 'app', ...allowedTrace.split('/'))
  await mkdir(path.dirname(tracePath), { recursive: true })
  await writeFile(tracePath, JSON.stringify({ files }), 'utf8')
  return tracePath
}

function runGuard(root) {
  return spawnSync(process.execPath, [guardPath], { cwd: root, encoding: 'utf8' })
}

test('allows optional runtime assets to be absent', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'runtime-trace-scope-'))
  try {
    await writeTrace(root, [])
    const result = runGuard(root)
    assert.equal(result.status, 0, result.stderr)
    assert.match(result.stdout, /Runtime trace scope guard passed/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('rejects unexpected docs assets on an allowed route', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'runtime-trace-scope-'))
  try {
    const tracePath = await writeTrace(root, [])
    const unexpectedPath = path.relative(
      path.dirname(tracePath),
      path.join(root, 'docs', 'unexpected.csv'),
    )
    await writeTrace(root, [unexpectedPath])

    const result = runGuard(root)
    assert.equal(result.status, 1)
    assert.match(result.stderr, /unexpectedly traces docs\/unexpected\.csv/)
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})