import * as Sentry from '@sentry/nextjs'

const DEPLOY_RELEASE = process.env.RAILWAY_GIT_COMMIT_SHA
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.GIT_COMMIT_SHA

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: DEPLOY_RELEASE,
  environment: process.env.NODE_ENV ?? 'production',
  tracesSampleRate: 0,
  enabled: process.env.NODE_ENV === 'production',
})
