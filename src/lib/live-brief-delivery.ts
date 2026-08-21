import { createHash, randomBytes } from 'node:crypto'

export const LIVE_BRIEF_DELIVERY_TTL_SECONDS = 7 * 24 * 60 * 60

export function createLiveBriefDeliveryToken(): string {
  return randomBytes(32).toString('base64url')
}

export function hashLiveBriefDeliveryToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex')
}