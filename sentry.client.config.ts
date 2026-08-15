import * as Sentry from '@sentry/nextjs'

const DEPLOY_RELEASE = process.env.RAILWAY_GIT_COMMIT_SHA
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.GIT_COMMIT_SHA

function eventContainsBlockedHostNoise(event: Sentry.Event): boolean {
  const message = (event.message ?? '').toLowerCase()
  const exceptionMessages = (event.exception?.values ?? [])
    .map((value) => `${value.type ?? ''} ${value.value ?? ''}`.toLowerCase())
  const extraValues = Object.values(event.extra ?? {})
    .map((value) => {
      if (typeof value === 'string') return value.toLowerCase()
      try {
        return JSON.stringify(value).toLowerCase()
      } catch {
        return ''
      }
    })
  const combined = [message, ...exceptionMessages].join(' ')
  const fullText = [combined, ...extraValues].join(' ')

  return (
    fullText.includes('perplexity.ai')
    && (
      fullText.includes('blocked-host')
      || fullText.includes('content security policy')
      || fullText.includes('csp')
      || fullText.includes('script-src')
      || fullText.includes('connect-src')
      || fullText.includes('font-src')
    )
  ) || (
    fullText.includes('font-src')
    && fullText.includes('perplexity.ai')
  )
}

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  release: DEPLOY_RELEASE,
  environment: process.env.NODE_ENV ?? 'production',
  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,
  // Only run in production; keeps local dev noise-free
  enabled: process.env.NODE_ENV === 'production',
  beforeSend(event) {
    if (eventContainsBlockedHostNoise(event)) {
      return null
    }
    return event
  },
})
