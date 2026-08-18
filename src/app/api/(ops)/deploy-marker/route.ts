import { type NextRequest, NextResponse } from 'next/server'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

export const dynamic = 'force-dynamic'

// Temporary release marker to verify production cutovers without ambiguity.
const RELEASE_MARKER = '2026-06-09-prod-marker-v1'

function resolveDeploySha(): string {
  return process.env.RAILWAY_GIT_COMMIT_SHA
    ?? process.env.VERCEL_GIT_COMMIT_SHA
    ?? process.env.GIT_COMMIT_SHA
    ?? 'unknown'
}

export async function GET(request: NextRequest) {
  const guard = await enforcePublicEndpointGuard({
    request,
    rateLimitKey: 'api:deploy-marker',
    maxPerMinute: 60,
  })
  if (guard) return guard

  return NextResponse.json(
    {
      kind: 'deploy-marker',
      release: RELEASE_MARKER,
      deploy_sha: resolveDeploySha(),
      app_version: process.env.npm_package_version ?? 'unknown',
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}