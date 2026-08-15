import * as Sentry from '@sentry/nextjs'

const DEPLOY_RELEASE = process.env.RAILWAY_GIT_COMMIT_SHA
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.GIT_COMMIT_SHA

function isTransientUndiciAbort(event: Sentry.Event): boolean {
  const message = (event.message ?? '').toLowerCase()
  const exceptionText = (event.exception?.values ?? [])
    .map((value) => `${value.type ?? ''} ${value.value ?? ''}`.toLowerCase())
    .join(' ')

  const stackText = (event.exception?.values ?? [])
    .map((value) => value.stacktrace?.frames?.map((frame) => `${frame.module ?? ''} ${frame.function ?? ''}`).join(' ') ?? '')
    .join(' ')
    .toLowerCase()

  const combined = `${message} ${exceptionText} ${stackText}`

  const hasUndiciMarker = combined.includes('undici') || combined.includes('fetch.onaborted')
  const hasAbortMarker =
    combined.includes(' terminated')
    || combined.includes('fetch failed')
    || combined.includes('body timeout')
    || combined.includes('headers timeout')
    || combined.includes('socket error')

  return hasUndiciMarker && hasAbortMarker
}

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: DEPLOY_RELEASE,
  environment: process.env.NODE_ENV ?? 'production',
  // Sample P0 routes at 10%, P1 at 2%, everything else at 0.
  // Keeps trace volume low while ensuring P0 coverage for SLO latency signals.
  tracesSampler(samplingContext) {
    const url: string = (samplingContext.request as { url?: string } | undefined)?.url ?? ''
    if (
      url.includes('/api/auth/') ||
      url.includes('/api/feedback/') ||
      url.includes('/api/contacts') ||
      url.includes('/api/follow-ups') ||
      url.includes('/api/optimize') ||
      url.includes('/api/billing/') ||
      url.includes('/api/webhooks/stripe') ||
      url.includes('/api/briefing') ||
      url.includes('/api/outreach')
    ) {
      return 0.1  // P0: 10%
    }
    if (
      url.includes('/api/intelligence/') ||
      url.includes('/api/companies') ||
      url.includes('/api/settings') ||
      url.includes('/api/prep')
    ) {
      return 0.02  // P1: 2%
    }
    return 0  // P2: no traces
  },
  beforeSend(event) {
    // Suppress transient upstream disconnect noise from Undici so paging remains actionable.
    if (isTransientUndiciAbort(event)) {
      return null
    }
    return event
  },
  enabled: process.env.NODE_ENV === 'production',
})
