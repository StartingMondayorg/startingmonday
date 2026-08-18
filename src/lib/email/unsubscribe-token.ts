import { createHmac, timingSafeEqual } from 'crypto'
import { APP_URL } from '@/lib/config'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function sign(userId: string): string {
  const secret = process.env.UNSUBSCRIBE_SECRET
  if (!secret) throw new Error('UNSUBSCRIBE_SECRET env var is not set')
  return createHmac('sha256', secret).update(userId).digest('base64url')
}

export function unsubscribeUrl(userId: string): string {
  const uid = Buffer.from(userId).toString('base64url')
  const sig = sign(userId)
  return `${APP_URL}/api/drip/unsubscribe?uid=${uid}&sig=${sig}`
}

export function verifyUnsubscribeToken(uid: string | null, sig: string | null): string | null {
  if (!uid || !sig) return null

  let userId: string
  try {
    userId = Buffer.from(uid, 'base64url').toString()
  } catch {
    return null
  }

  if (!UUID_RE.test(userId)) return null

  let expected: Buffer
  try {
    expected = Buffer.from(sign(userId))
  } catch {
    return null
  }

  const actual = Buffer.from(sig)
  if (expected.length !== actual.length) return null
  return timingSafeEqual(expected, actual) ? userId : null
}
