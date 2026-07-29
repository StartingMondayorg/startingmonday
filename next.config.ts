import type { NextConfig } from "next";
import { withSentryConfig } from '@sentry/nextjs'

// Derive Sentry's CSP security-report endpoint from the DSN.
// DSN format:  https://KEY@ORG.ingest.sentry.io/PROJECT_ID
// Report URI:  https://ORG.ingest.sentry.io/api/PROJECT_ID/security/?sentry_key=KEY
function sentryReportUri(): string | null {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) return null
  try {
    const url = new URL(dsn)
    const key = url.username
    const host = url.hostname
    const projectId = url.pathname.replace(/^\//, '')
    if (!key || !host || !projectId) return null
    return `https://${host}/api/${projectId}/security/?sentry_key=${key}`
  } catch {
    return null
  }
}

const SENTRY_REPORT_URI = sentryReportUri()
const RAILWAY_BUILD_CPUS = process.env.RAILWAY_ENVIRONMENT_NAME ? 4 : undefined

const CSP = [
  "default-src 'self'",
  // Next.js App Router requires unsafe-inline for hydration scripts.
  // unsafe-eval is required by some Next.js internals and Sentry.
  // static.cloudflareinsights.com: Cloudflare Web Analytics beacon, injected at the edge by Cloudflare.
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' js.stripe.com https://challenges.cloudflare.com https://us-assets.i.posthog.com https://static.cloudflareinsights.com",
  "script-src-elem 'self' 'unsafe-inline' https://challenges.cloudflare.com https://us-assets.i.posthog.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  // External services the browser connects to at runtime
  "connect-src 'self' *.supabase.co wss://*.supabase.co https://api.stripe.com https://us.i.posthog.com https://us-assets.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io https://challenges.cloudflare.com https://cloudflareinsights.com",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "worker-src 'self' blob:",
  "frame-src https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ...(SENTRY_REPORT_URI ? [`report-uri ${SENTRY_REPORT_URI}`, "report-to csp-endpoint"] : []),
].join('; ')

const securityHeaders = [
  { key: 'X-Frame-Options',           value: 'DENY' },
  { key: 'X-Content-Type-Options',    value: 'nosniff' },
  { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control',    value: 'on' },
  { key: 'Strict-Transport-Security',  value: 'max-age=31536000; includeSubDomains' },
  { key: 'Content-Security-Policy',    value: CSP },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
  ...(SENTRY_REPORT_URI ? [{
    key: 'Report-To',
    value: JSON.stringify({ group: 'csp-endpoint', max_age: 86400, endpoints: [{ url: SENTRY_REPORT_URI }] }),
  }] : []),
]

const nextConfig: NextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth'],
  outputFileTracingIncludes: {
    '/dashboard/outreach': ['./docs/outreach/**/*.csv'],
    '/mauricio-kickoff-execution/apollo-read-access': ['./docs/outreach/**/*.csv'],
  },
  experimental: {
    cpus: RAILWAY_BUILD_CPUS,
    inlineCss: true,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    qualities: [60, 75],
  },
  async redirects() {
    return [
      {
        source: '/auth/login',
        destination: '/login',
        permanent: true,
      },
      {
        source: '/auth/signup',
        destination: '/signup',
        permanent: true,
      },
      {
        source: '/methodology',
        destination: '/method-and-evidence',
        permanent: true,
      },
      {
        source: '/favicon.ico',
        destination: '/icon',
        permanent: false,
      },
      {
        source: '/icon:variant',
        destination: '/icon',
        permanent: false,
      },
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.startingmonday.app' }],
        destination: 'https://startingmonday.app/:path*',
        permanent: true,
      },
    ]
  },
  async headers() {
    return [
      {
        source: '/reports/:path*.pdf',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/opengraph-image',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/:path*/opengraph-image',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/_next/static/media/:path*',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/icon',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      { source: '/(.*)', headers: securityHeaders },
    ]
  },
}

export default withSentryConfig(nextConfig, {
  silent: true,
  // Source map upload requires SENTRY_AUTH_TOKEN — omitting it skips upload gracefully.
  // Set SENTRY_AUTH_TOKEN in Railway to enable source-mapped stack traces.
  widenClientFileUpload: true,
});
