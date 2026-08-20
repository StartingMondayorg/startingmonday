import { type NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { enforcePublicEndpointGuard } from '@/lib/public-endpoint-guard'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const guardResponse = await enforcePublicEndpointGuard({
      request,
      rateLimitKey: 'magic-link',
      maxPerMinute: 5,
      requireCaptcha: true,
    })
    if (guardResponse) return guardResponse

    return NextResponse.json(
      {
        ok: false,
        error: 'Magic link sign-in is disabled. Use password or social sign-in.',
        code: 'MAGIC_LINK_DISABLED',
      },
      { status: 410 },
    )
  } catch (error) {
    Sentry.captureException(error, { extra: { route: 'auth/verify-and-magic-link' } })
    return NextResponse.json({ ok: false, error: 'Request failed.' }, { status: 500 })
  }
}