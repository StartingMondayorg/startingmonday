#!/usr/bin/env node

const BASE_URL = process.env.EMI_SMOKE_BASE_URL ?? 'https://startingmonday.app'
const SMOKE_TOKEN = process.env.EMI_SMOKE_TOKEN ?? ''
const OUTPUT_JSON = process.env.EMI_SMOKE_OUTPUT_JSON === '1' || process.argv.includes('--json')
const TIMEOUT_MS = 20000
const MAX_RETRIES = Number(process.env.EMI_SMOKE_RETRIES ?? '2')

function trimSlash(url) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

async function postJson(path, body, token) {
  const url = `${trimSlash(BASE_URL)}${path}`
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const started = Date.now()

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${token}`,
        'x-emi-smoke-token': token,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    const text = await res.text()
    return {
      path,
      status: res.status,
      durationMs: Date.now() - started,
      body: safeJsonParse(text),
      rawBody: text.slice(0, 500),
    }
  } catch (error) {
    return {
      path,
      status: 0,
      durationMs: Date.now() - started,
      body: null,
      rawBody: error instanceof Error ? error.message : 'request failed',
    }
  } finally {
    clearTimeout(timeout)
  }
}

function shouldRetry(result) {
  if (!result) return true
  if (result.status === 0) return true
  return result.status >= 500 && result.status <= 504
}

async function postJsonWithRetry(path, body, token) {
  let lastResult = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
     
    lastResult = await postJson(path, body, token)
    if (!shouldRetry(lastResult) || attempt === MAX_RETRIES) {
      return lastResult
    }
  }

  return lastResult
}

function emitSummary(summary) {
  if (OUTPUT_JSON) {
    console.log(JSON.stringify(summary, null, 2))
    return
  }

  console.log(`EMI postdeploy smoke: ${summary.passed ? 'PASS' : 'FAIL'}`)
  console.log(`weekly run: ${summary.weeklyRunId ?? 'n/a'} (${summary.checks?.weekly?.status ?? 'n/a'})`)
  console.log(`validation run: ${summary.validationRunId ?? 'n/a'} (${summary.checks?.validation?.status ?? 'n/a'})`)
  console.log(`proof publisher run: ${summary.proofPublisherRunId ?? 'n/a'}`)
  console.log(`claim audit run: ${summary.claimAuditRunId ?? 'n/a'}`)
  console.log(`sprint5 exit run: ${summary.sprint5ExitRunId ?? 'n/a'}`)
  console.log(`gtm proof sequence run: ${summary.gtmProofSequenceRunId ?? 'n/a'}`)
  console.log(`q4 cadence run: ${summary.q4CadenceRunId ?? 'n/a'}`)
  console.log(`capstone report run: ${summary.capstoneReportRunId ?? 'n/a'}`)
  console.log(`success criteria audit run: ${summary.successCriteriaAuditRunId ?? 'n/a'}`)
  console.log(`objection dashboard run: ${summary.objectionDashboardRunId ?? 'n/a'}`)
  console.log(`slo monitoring run: ${summary.sloMonitoringRunId ?? 'n/a'}`)
  console.log(`validation status=${summary.validationStatus ?? 'n/a'} nullStreakCount=${String(summary.nullStreakCount)}`)
  console.log(`success criteria: ${summary.successCriteriaStatus ?? 'n/a'} (advisory)`)
  if (summary.failures?.length) {
    console.log('blocking failures:')
    for (const reason of summary.failures) {
      console.log(`- ${reason}`)
    }
  }
  if (summary.warnings?.length) {
    console.log('advisory warnings (non-blocking):')
    for (const reason of summary.warnings) {
      console.log(`- ${reason}`)
    }
  }
}

async function main() {
  if (!SMOKE_TOKEN) {
    emitSummary({
      ts: new Date().toISOString(),
      baseUrl: BASE_URL,
      weeklyRunId: null,
      validationRunId: null,
      validationStatus: null,
      nullStreakCount: null,
      passed: false,
      failures: ['Missing EMI_SMOKE_TOKEN for token-auth smoke validation.'],
      warnings: [],
      checks: {
        emiSmoke: { status: 0 },
      },
    })
    process.exitCode = 1
    return
  }

  const emiSmoke = await postJsonWithRetry('/api/internal/automation/emi-smoke', {}, SMOKE_TOKEN)
  const responseBody = emiSmoke.body ?? {}
  const failures = Array.isArray(responseBody.failures)
    ? responseBody.failures.map((item) => String(item))
    : [`emi-smoke endpoint failed status=${emiSmoke.status} body=${emiSmoke.rawBody}`]
  const warnings = Array.isArray(responseBody.warnings)
    ? responseBody.warnings.map((item) => String(item))
    : []

  const passed = emiSmoke.status === 200 && responseBody.ok === true && failures.length === 0

  const summary = {
    ts: new Date().toISOString(),
    baseUrl: BASE_URL,
    weeklyRunId: responseBody.weeklyRunId ?? null,
    validationRunId: responseBody.validationRunId ?? null,
    proofPublisherRunId: responseBody.proofPublisherRunId ?? null,
    claimAuditRunId: responseBody.claimAuditRunId ?? null,
    sprint5ExitRunId: responseBody.sprint5ExitRunId ?? null,
    gtmProofSequenceRunId: responseBody.gtmProofSequenceRunId ?? null,
    q4CadenceRunId: responseBody.q4CadenceRunId ?? null,
    capstoneReportRunId: responseBody.capstoneReportRunId ?? null,
    successCriteriaAuditRunId: responseBody.successCriteriaAuditRunId ?? null,
    objectionDashboardRunId: responseBody.objectionDashboardRunId ?? null,
    sloMonitoringRunId: responseBody.sloMonitoringRunId ?? null,
    validationStatus: responseBody.validationStatus ?? null,
    nullStreakCount: responseBody.nullStreakCount ?? null,
    staleMetrics: responseBody.staleMetrics ?? [],
    queryErrorMetrics: responseBody.queryErrorMetrics ?? [],
    noDataMetrics: responseBody.noDataMetrics ?? [],
    successCriteriaStatus: responseBody.successCriteriaStatus ?? null,
    successCriteriaPayload: responseBody.successCriteriaPayload ?? null,
    diagnostics: responseBody.diagnostics ?? null,
    passed,
    failures: passed ? [] : failures,
    warnings,
    checks: {
      emiSmoke,
      weekly: responseBody.checks?.weekly ?? null,
      validation: responseBody.checks?.validation ?? null,
      proofPublisher: responseBody.checks?.proofPublisher ?? null,
      claimAudit: responseBody.checks?.claimAudit ?? null,
      sprint5Exit: responseBody.checks?.sprint5Exit ?? null,
      gtmProofSequence: responseBody.checks?.gtmProofSequence ?? null,
      q4Cadence: responseBody.checks?.q4Cadence ?? null,
      capstoneReport: responseBody.checks?.capstoneReport ?? null,
      successCriteriaAudit: responseBody.checks?.successCriteriaAudit ?? null,
      objectionDashboard: responseBody.checks?.objectionDashboard ?? null,
      sloMonitoring: responseBody.checks?.sloMonitoring ?? null,
    },
  }

  emitSummary(summary)

  if (!passed) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'emi smoke check failed'
  emitSummary({
    ts: new Date().toISOString(),
    baseUrl: BASE_URL,
    weeklyRunId: null,
    validationRunId: null,
    validationStatus: null,
    nullStreakCount: null,
    passed: false,
    failures: [message],
    warnings: [],
    checks: {
      weekly: { status: 0 },
      validation: { status: 0 },
    },
  })
  process.exitCode = 1
})
