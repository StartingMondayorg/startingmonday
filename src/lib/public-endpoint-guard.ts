import { type NextRequest, NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

type GuardOptions = {
  request: NextRequest
  rateLimitKey: string
  maxPerMinute: number
  requireCaptcha?: boolean
}

type TurnstileVerificationResponse = {
  success?: boolean
  'error-codes'?: string[]
}

function logTurnstileGuard(
  level: 'warn' | 'error',
  event: string,
  metadata: Record<string, unknown>,
) {
  const logger = level === 'error' ? console.error : console.warn
  logger('[turnstile_guard]', JSON.stringify({ event, ...metadata }))
}

function isTurnstileEnforced(): boolean {
  const configured = process.env.TURNSTILE_ENFORCED?.trim()
  if (configured === '1') return true
  if (configured === '0') return false
  return process.env.NODE_ENV === 'production'
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
    ?? 'unknown'
  )
}

export async function enforcePublicEndpointGuard(
  options: GuardOptions,
): Promise<NextResponse | null> {
  const {
    request,
    rateLimitKey,
    maxPerMinute,
    requireCaptcha = false,
  } = options
  const ip = getClientIp(request)

  const { allowed, retryAfter } = await checkRateLimit(`${rateLimitKey}:${ip}`, maxPerMinute)
  if (!allowed) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests' },
      { status: 429, headers: retryAfter ? { 'Retry-After': String(retryAfter) } : {} },
    )
  }

  if (requireCaptcha && isTurnstileEnforced()) {
    const secret = process.env.TURNSTILE_SECRET_KEY?.trim()
    if (!secret) {
      logTurnstileGuard('error', 'missing_secret', {
        path: request.nextUrl.pathname,
        ip,
      })
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { ok: false, error: 'Captcha is currently unavailable', code: 'CAPTCHA_UNAVAILABLE' },
          { status: 503 },
        )
      }
      return null
    }

    const token = request.headers.get('x-captcha-token')?.trim() ?? ''
    if (!token) {
      logTurnstileGuard('warn', 'missing_token', {
        path: request.nextUrl.pathname,
        ip,
      })
      return NextResponse.json(
        { ok: false, error: 'Captcha token is required', code: 'CAPTCHA_REQUIRED' },
        { status: 400 },
      )
    }

    const payload = new URLSearchParams({
      secret,
      response: token,
      remoteip: ip,
    })

    let verified = false
    try {
      const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: payload.toString(),
      })

      if (response.ok) {
        const data = await response.json() as TurnstileVerificationResponse
        verified = data.success === true
        if (!verified) {
          logTurnstileGuard('warn', 'verification_failed', {
            path: request.nextUrl.pathname,
            ip,
            errorCodes: data['error-codes'] ?? [],
          })
        }
      } else {
        logTurnstileGuard('error', 'siteverify_http_error', {
          path: request.nextUrl.pathname,
          ip,
          status: response.status,
        })
      }
    } catch {
      logTurnstileGuard('error', 'siteverify_fetch_error', {
        path: request.nextUrl.pathname,
        ip,
      })
      verified = false
    }

    if (!verified) {
      return NextResponse.json(
        { ok: false, error: 'Captcha verification failed', code: 'CAPTCHA_FAILED' },
        { status: 403 },
      )
    }
  }

  return null
}
