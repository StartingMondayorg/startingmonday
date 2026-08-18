import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

function timeoutPromise<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    ),
  ])
}

export const runtime = 'nodejs'

const EMI_SMOKE_TOKEN_HEADER = 'x-emi-smoke-token'
const EMI_SMOKE_RATE_LIMIT = 20
const EMI_SMOKE_WINDOW_MS = 60_000

type EmiSmokeBody = {
  referenceDate?: string
  tolerancePoints?: number
}

function trimSlash(url: string): string {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function internalBaseUrl(request: NextRequest): string {
  const explicit = process.env.INTERNAL_API_BASE_URL?.trim()
  if (explicit) return trimSlash(explicit)

  const port = process.env.PORT?.trim() || '3000'
  return `http://127.0.0.1:${port}`
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',').at(-1)?.trim() || 'unknown'
  return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

function extractToken(request: NextRequest): string {
  const explicit = request.headers.get(EMI_SMOKE_TOKEN_HEADER)?.trim() ?? ''
  if (explicit) return explicit

  const authorization = request.headers.get('authorization') ?? ''
  const [scheme, value] = authorization.split(' ')
  if (scheme?.toLowerCase() !== 'bearer') return ''
  return value?.trim() ?? ''
}

function tokensMatch(actual: string, expected: string): boolean {
  if (!actual || !expected) return false

  try {
    const left = Buffer.from(actual)
    const right = Buffer.from(expected)
    if (left.length !== right.length) return false
    return timingSafeEqual(left, right)
  } catch {
    return false
  }
}

type AutomationRouteModule = {
  POST: (request: NextRequest) => Promise<Response>
}

const routeImporters: Record<string, () => Promise<AutomationRouteModule>> = {
  '/api/admin/automation/reporting/weekly-kpi-summaries': () => import('@/app/api/(ops)/admin/automation/reporting/weekly-kpi-summaries/route'),
  '/api/admin/automation/reporting/emi-validation-reruns': () => import('@/app/api/(ops)/admin/automation/reporting/emi-validation-reruns/route'),
  '/api/admin/automation/reporting/proof-asset-publisher': () => import('@/app/api/(ops)/admin/automation/reporting/proof-asset-publisher/route'),
  '/api/admin/automation/reporting/tier1-claim-compliance-audit': () => import('@/app/api/(ops)/admin/automation/reporting/tier1-claim-compliance-audit/route'),
  '/api/admin/automation/reporting/sprint-5-exit-metrics': () => import('@/app/api/(ops)/admin/automation/reporting/sprint-5-exit-metrics/route'),
  '/api/admin/automation/reporting/gtm-proof-sequence': () => import('@/app/api/(ops)/admin/automation/reporting/gtm-proof-sequence/route'),
  '/api/admin/automation/reporting/q4-cadence-automation': () => import('@/app/api/(ops)/admin/automation/reporting/q4-cadence-automation/route'),
  '/api/admin/automation/reporting/capstone-report-generation': () => import('@/app/api/(ops)/admin/automation/reporting/capstone-report-generation/route'),
  '/api/admin/automation/reporting/success-criteria-audit-automation': () => import('@/app/api/(ops)/admin/automation/reporting/success-criteria-audit-automation/route'),
  '/api/admin/automation/reporting/top10-objection-kpi-dashboard': () => import('@/app/api/(ops)/admin/automation/reporting/top10-objection-kpi-dashboard/route'),
  '/api/admin/automation/reporting/emi-slo-monitoring-alerts': () => import('@/app/api/(ops)/admin/automation/reporting/emi-slo-monitoring-alerts/route'),
}

function buildAutomationHeaders(automationToken: string, automationUserId: string): HeadersInit {
  return {
    'content-type': 'application/json',
    authorization: `Bearer ${automationToken}`,
    'x-automation-service-token': automationToken,
    'x-automation-user-id': automationUserId,
  }
}

async function parseRouteResponse(response: Response): Promise<{ status: number; body: any; rawBody: string }> {
  const rawBody = await response.text()
  let parsed: any = null
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    parsed = null
  }
  return {
    status: response.status,
    body: parsed,
    rawBody: rawBody.slice(0, 500),
  }
}

async function postInternal(
  request: NextRequest,
  path: string,
  payload: Record<string, unknown>,
  diagnostics?: {
    subcallAttempts: Array<{ path: string; url?: string; status?: number; error?: string; durationMs?: number }>
  },
): Promise<{ status: number; body: any; rawBody: string }> {
  const automationToken = process.env.AUTOMATION_SERVICE_TOKEN ?? ''
  const automationUserId = process.env.AUTOMATION_SERVICE_USER_ID ?? ''
  if (!automationToken || !automationUserId) {
    throw new Error('Automation service identity is not configured')
  }

  const startMs = Date.now()
  const attempt: { path: string; url?: string; status?: number; error?: string; durationMs?: number } = { path }
  const useInProcess = process.env.EMI_SMOKE_USE_IN_PROCESS === '1'

  try {
    const importer = useInProcess ? routeImporters[path] : undefined
    if (importer) {
      const mod = await importer()
      const syntheticRequest = new NextRequest(new URL(path, request.url), {
        method: 'POST',
        headers: buildAutomationHeaders(automationToken, automationUserId),
        body: JSON.stringify(payload),
      })
      const response = await mod.POST(syntheticRequest)
      const result = await parseRouteResponse(response)
      attempt.status = result.status
      attempt.durationMs = Date.now() - startMs
      if (diagnostics) diagnostics.subcallAttempts.push(attempt)
      return result
    }

    const baseUrl = internalBaseUrl(request)
    const url = `${baseUrl}${path}`
    attempt.url = url
    const res = await fetch(url, {
      method: 'POST',
      headers: buildAutomationHeaders(automationToken, automationUserId),
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    const result = await parseRouteResponse(res)
    attempt.status = result.status
    attempt.durationMs = Date.now() - startMs
    if (diagnostics) diagnostics.subcallAttempts.push(attempt)
    return result
  } catch (error) {
    attempt.error = error instanceof Error ? error.message : String(error)
    attempt.durationMs = Date.now() - startMs
    if (diagnostics) diagnostics.subcallAttempts.push(attempt)
    throw error
  }
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export async function POST(request: NextRequest) {
  const diagnostics = {
    requestHeaders: {
      'x-forwarded-host': request.headers.get('x-forwarded-host'),
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'host': request.headers.get('host'),
    },
    resolvedBaseUrl: '',
    subcallAttempts: [] as Array<{
      path: string
      url?: string
      status?: number
      error?: string
      durationMs?: number
    }>,
  }

  const ip = getClientIp(request)
  const rateKey = `emi_smoke_token:${ip}`
    let rate: Awaited<ReturnType<typeof checkRateLimit>>
    try {
      rate = await timeoutPromise(
        checkRateLimit(rateKey, EMI_SMOKE_RATE_LIMIT, EMI_SMOKE_WINDOW_MS),
        5000
      )
    } catch (error) {
      console.warn('[emi-smoke] rate limit check timeout, allowing request', error)
      rate = { allowed: true }
    }
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', diagnostics },
      {
        status: 429,
        headers: rate.retryAfter ? { 'Retry-After': String(rate.retryAfter) } : undefined,
      },
    )
  }

  const providedToken = extractToken(request)
  const expectedToken = process.env.EMI_SMOKE_TOKEN ?? ''
  if (!tokensMatch(providedToken, expectedToken)) {
    return unauthorizedResponse()
  }

  diagnostics.resolvedBaseUrl = internalBaseUrl(request)


  const body = await request.json().catch(() => ({})) as EmiSmokeBody
  const sharedPayload: Record<string, unknown> = {}
  if (typeof body.referenceDate === 'string' && body.referenceDate.trim()) {
    sharedPayload.referenceDate = body.referenceDate.trim()
  }
  if (typeof body.tolerancePoints === 'number' && Number.isFinite(body.tolerancePoints)) {
    sharedPayload.tolerancePoints = body.tolerancePoints
  }

  try {
    const weekly = await postInternal(
      request,
      '/api/admin/automation/reporting/weekly-kpi-summaries',
      sharedPayload,
      diagnostics,
    )
    const validation = await postInternal(
      request,
      '/api/admin/automation/reporting/emi-validation-reruns',
      sharedPayload,
      diagnostics,
    )
    const proofPublisher = await postInternal(
      request,
      '/api/admin/automation/reporting/proof-asset-publisher',
      {},
      diagnostics,
    )
    const claimAudit = await postInternal(
      request,
      '/api/admin/automation/reporting/tier1-claim-compliance-audit',
      {},
      diagnostics,
    )
    const sprint5Exit = await postInternal(
      request,
      '/api/admin/automation/reporting/sprint-5-exit-metrics',
      sharedPayload,
      diagnostics,
    )
    const gtmProofSequence = await postInternal(
      request,
      '/api/admin/automation/reporting/gtm-proof-sequence',
      sharedPayload,
      diagnostics,
    )
    const q4Cadence = await postInternal(
      request,
      '/api/admin/automation/reporting/q4-cadence-automation',
      {},
      diagnostics,
    )
    const capstoneReport = await postInternal(
      request,
      '/api/admin/automation/reporting/capstone-report-generation',
      sharedPayload,
      diagnostics,
    )
    const successCriteriaAudit = await postInternal(
      request,
      '/api/admin/automation/reporting/success-criteria-audit-automation',
      sharedPayload,
      diagnostics,
    )
    const objectionDashboard = await postInternal(
      request,
      '/api/admin/automation/reporting/top10-objection-kpi-dashboard',
      sharedPayload,
      diagnostics,
    )
    const sloMonitoring = await postInternal(
      request,
      '/api/admin/automation/reporting/emi-slo-monitoring-alerts',
      sharedPayload,
      diagnostics,
    )

    // Tier A (blocking): pipeline health. These are the only conditions a deploy
    // can actually cause, so they are the only ones allowed to fail the gate.
    const failures: string[] = []
    // Tier B/C (advisory): instrumentation staleness and business-criteria
    // results. Reported to CI summaries and Slack, never blocking. See SMK-444.
    const warnings: string[] = []

    // Routes whose `ok` flag reflects pipeline health: a false value means the
    // job itself did not complete.
    const operationalChecks: Array<[string, typeof weekly]> = [
      ['weekly-kpi-summaries', weekly],
      ['emi-validation-reruns', validation],
      ['proof-asset-publisher', proofPublisher],
      ['tier1-claim-compliance-audit', claimAudit],
      ['sprint-5-exit-metrics', sprint5Exit],
      ['capstone-report-generation', capstoneReport],
      ['top10-objection-kpi-dashboard', objectionDashboard],
      ['emi-slo-monitoring-alerts', sloMonitoring],
    ]

    // Routes whose `ok` flag reflects business or content state rather than
    // pipeline health. A deploy cannot move these, so they only ever warn:
    //   success-criteria-audit  -> 4 of 5 business targets met
    //   gtm-proof-sequence      -> published proof assets exist
    //   q4-cadence-automation   -> every ritual has a named owner
    const businessChecks: Array<[string, typeof weekly]> = [
      ['success-criteria-audit-automation', successCriteriaAudit],
      ['gtm-proof-sequence', gtmProofSequence],
      ['q4-cadence-automation', q4Cadence],
    ]

    for (const [name, check] of operationalChecks) {
      if (check.status !== 200 || check.body?.ok !== true) {
        failures.push(`${name} failed status=${check.status} body=${check.rawBody}`)
      }
    }

    for (const [name, check] of businessChecks) {
      if (check.status !== 200) {
        failures.push(`${name} failed status=${check.status} body=${check.rawBody}`)
      } else if (check.body?.ok !== true) {
        warnings.push(`${name} reports status=${String(check.body?.status ?? 'unknown')} (business criteria, non-blocking)`)
      }
    }

    // Blocking: the weekly job returned 200 but produced no usable KPI rows.
    // Previously invisible to the gate, because weekly-kpi-summaries returns
    // ok:true even when every individual metric query threw. See SMK-444.
    const weeklySnapshots: Array<{ metric_name?: string; metric_status?: string }> =
      Array.isArray(weekly.body?.snapshots) ? weekly.body.snapshots : []

    if (weekly.status === 200 && weeklySnapshots.length === 0) {
      failures.push('weekly-kpi-summaries returned no KPI snapshots for the current week')
    }

    const queryErrorMetrics = weeklySnapshots
      .filter((snapshot) => snapshot?.metric_status === 'query_error')
      .map((snapshot) => String(snapshot?.metric_name ?? 'unknown'))

    if (queryErrorMetrics.length > 0) {
      failures.push(`KPI query failures: ${queryErrorMetrics.join(', ')}`)
    }

    // Advisory: metrics that ran cleanly but had nothing to measure.
    const noDataMetrics = weeklySnapshots
      .filter((snapshot) => snapshot?.metric_status === 'no_data')
      .map((snapshot) => String(snapshot?.metric_name ?? 'unknown'))

    if (noDataMetrics.length > 0) {
      warnings.push(`KPI metrics with no data this week: ${noDataMetrics.join(', ')}`)
    }

    // Advisory: instrumentation that has reported nothing for two weeks running.
    if (validation.status === 200 && validation.body?.ok === true) {
      const nullStreakCount = Number(validation.body.nullStreakCount ?? 0)
      if (nullStreakCount > 0) {
        const stale = Array.isArray(validation.body.staleMetrics) ? validation.body.staleMetrics.join(', ') : 'unknown'
        warnings.push(`${nullStreakCount} metric(s) stale for 2+ weeks: ${stale}`)
      }
    }

    const result = {
      ok: failures.length === 0,
      weeklyRunId: weekly.body?.runId ?? null,
      validationRunId: validation.body?.runId ?? null,
      proofPublisherRunId: proofPublisher.body?.runId ?? null,
      claimAuditRunId: claimAudit.body?.runId ?? null,
      sprint5ExitRunId: sprint5Exit.body?.runId ?? null,
      gtmProofSequenceRunId: gtmProofSequence.body?.runId ?? null,
      q4CadenceRunId: q4Cadence.body?.runId ?? null,
      capstoneReportRunId: capstoneReport.body?.runId ?? null,
      successCriteriaAuditRunId: successCriteriaAudit.body?.runId ?? null,
      objectionDashboardRunId: objectionDashboard.body?.runId ?? null,
      sloMonitoringRunId: sloMonitoring.body?.runId ?? null,
      validationStatus: validation.body?.status ?? null,
      nullStreakCount: validation.body?.nullStreakCount ?? null,
      staleMetrics: validation.body?.staleMetrics ?? [],
      queryErrorMetrics,
      noDataMetrics,
      successCriteriaStatus: successCriteriaAudit.body?.status ?? null,
      successCriteriaPayload: successCriteriaAudit.body?.payload ?? null,
      failures,
      warnings,
      diagnostics,
      checks: {
        weekly,
        validation,
        proofPublisher,
        claimAudit,
        sprint5Exit,
        gtmProofSequence,
        q4Cadence,
        capstoneReport,
        successCriteriaAudit,
        objectionDashboard,
        sloMonitoring,
      },
    }

    if (warnings.length > 0) {
      console.info('[internal.automation.emi-smoke] advisory warnings', {
        warningCount: warnings.length,
        warnings,
      })
    }

    if (result.ok) {
      return NextResponse.json(result, { status: 200 })
    }

    console.warn('[internal.automation.emi-smoke] pipeline health check failed', {
      failureCount: failures.length,
      failures,
    })

    // Keep response JSON parseable through edge/CDN layers so CI can report exact failing checks.
    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error('[internal.automation.emi-smoke] request failed', error)
    return NextResponse.json({ error: 'Internal server error', diagnostics }, { status: 500 })
  }
}