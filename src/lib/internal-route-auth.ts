import { timingSafeEqual } from 'crypto'
import { type NextRequest } from 'next/server'

function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip
}

function getRequestIp(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()
  const ip = request.headers.get('cf-connecting-ip')
    ?? request.headers.get('x-real-ip')
    ?? forwarded
    ?? null
  return ip ? normalizeIp(ip) : null
}

function hasValidInternalSecret(request: NextRequest): boolean {
  const provided = request.headers.get('x-internal-secret')
  const expected = process.env.INTERNAL_ROUTE_SECRET
  if (!provided || !expected) return false

  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function isIpAllowlisted(ip: string | null): boolean {
  if (!ip) return false
  const allowlist = (process.env.INTERNAL_IP_ALLOWLIST ?? '')
    .split(',')
    .map((v) => normalizeIp(v.trim()))
    .filter(Boolean)

  if (allowlist.length === 0) return false
  return allowlist.includes(ip)
}

export function validateInternalRouteRequest(request: NextRequest): boolean {
  if (!hasValidInternalSecret(request)) return false
  return isIpAllowlisted(getRequestIp(request))
}
