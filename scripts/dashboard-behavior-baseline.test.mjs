// SMK-497: measurement semantics for streamed (Suspense) dashboard routes.
//
// /dashboard/briefing streams its AI-generated body through a Suspense
// boundary, so the HTML stream stays open until generation completes. A
// 'domcontentloaded' navigation wait only resolves when that stream closes,
// which booked the whole AI generation into loadMs (vs the 5000ms shell
// budget) while settledMs measured an already-settled page (~0ms) against its
// dedicated 18000ms budget. These tests pin the corrected semantics with a
// local server that streams a shell first and the briefing body later.
//
// Run: npm run test:dashboard-behavior-baseline
// (needs the Playwright chromium browser installed, same as the agent itself)
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { chromium } from 'playwright'
import { measureRoute } from './dashboard-behavior-baseline.mjs'

const STREAM_DELAY_MS = 3000
// Early padding so the browser starts progressive rendering on the first chunk.
const PAD = `<!-- ${'pad '.repeat(600)} -->`

let server
let browser
let page

before(async () => {
  server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
    const shell = `<!doctype html><html><head><title>fixture</title></head><body>${PAD}<header>chrome</header><main><p>Assembling your briefing...</p>`
    if (req.url.startsWith('/dashboard/briefing')) {
      // Streamed route: shell flushes immediately, body arrives later and
      // only then does the document stream close.
      res.write(shell)
      setTimeout(() => {
        res.end('<div id="tenet-find-roles">Find Roles First</div></main></body></html>')
      }, STREAM_DELAY_MS)
      return
    }
    res.end(`${shell}<p>plain route</p></main></body></html>`)
  })
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const baseURL = `http://127.0.0.1:${server.address().port}`
  browser = await chromium.launch({ headless: true })
  page = await browser.newPage({ baseURL })
})

after(async () => {
  await browser?.close()
  await new Promise((resolve) => server.close(resolve))
})

test('streamed briefing route: loadMs stops at the visible shell, settledMs owns the streamed body', async () => {
  const result = await measureRoute(page, '/dashboard/briefing', { streamed: true })
  assert.equal(result.status, 200)
  assert.ok(
    result.loadMs < STREAM_DELAY_MS - 500,
    `loadMs ${result.loadMs}ms must not include the ${STREAM_DELAY_MS}ms streamed body tail`,
  )
  assert.ok(
    typeof result.settledMs === 'number' && result.settledMs >= STREAM_DELAY_MS - result.loadMs - 500,
    `settledMs ${result.settledMs}ms must capture the streamed body tail`,
  )
})

test('non-streamed route keeps full-document load semantics', async () => {
  const result = await measureRoute(page, '/dashboard', {})
  assert.equal(result.status, 200)
  assert.ok(result.loadMs < STREAM_DELAY_MS, `plain route loadMs ${result.loadMs}ms should be fast`)
  assert.equal(result.settledMs, null)
})
