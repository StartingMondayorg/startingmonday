import { NextResponse } from 'next/server'

const START_TIME = Date.now()

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      kind: 'liveness',
      status: 'ok',
      live: true,
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? 'unknown',
      commit: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
    },
    {
      // Liveness should remain stable even when dependencies are degraded.
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    },
  )
}
