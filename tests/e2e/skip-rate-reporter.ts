import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter'

// A test suite that treats live-backend/auth failures (429, 500, 401, 403,
// "session unavailable") as test.skip() rather than a failure means a real
// production outage degrades into "tests skipped," not red CI — the outage
// disappears instead of paging anyone. This reporter doesn't remove those
// skips (many are legitimate under normal shared-environment flakiness), but
// it makes a *mass* skip loud: if enough tests skip for this specific reason
// in one run, that's very unlikely to be isolated flakiness and much more
// likely to be a real outage, so the run fails instead of going quietly green.
const BACKEND_HEALTH_SKIP_PATTERN =
  /session unavailable|rate.?limit|returned 500|rejected \(401\)|blocked request by policy \(403\)|runtime API error|auth\/session status|rate limited or auth issue/i

function isBackendHealthSkip(test: TestCase, result: TestResult): string | null {
  if (result.status !== 'skipped') return null
  const annotations = [...test.annotations, ...result.annotations]
  const hit = annotations.find(
    (a) => a.type === 'skip' && a.description && BACKEND_HEALTH_SKIP_PATTERN.test(a.description),
  )
  return hit?.description ?? null
}

export default class SkipRateReporter implements Reporter {
  private matches: string[] = []

  onTestEnd(test: TestCase, result: TestResult) {
    const reason = isBackendHealthSkip(test, result)
    if (reason) {
      const file = test.location?.file?.split('/').pop() ?? 'unknown file'
      this.matches.push(`${file} > ${test.title}: ${reason}`)
    }
  }

  async onEnd() {
    if (this.matches.length === 0) return

    const threshold = Number(process.env.LIVE_BACKEND_SKIP_COUNT_THRESHOLD ?? '8')

    console.log(
      `[skip-rate-reporter] ${this.matches.length} test(s) skipped due to a live-backend/auth-availability condition:`,
    )
    for (const line of this.matches) console.log(`  - ${line}`)

    if (this.matches.length > threshold) {
      console.error(
        `[skip-rate-reporter] ${this.matches.length} backend-health skips exceeds threshold of ${threshold} in a single run. ` +
          'This looks like a systemic outage or shared-environment problem masquerading as "skipped," not isolated flakiness. Failing the run.',
      )
      return { status: 'failed' as const }
    }
  }
}
