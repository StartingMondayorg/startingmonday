import { logger } from '../lib/logger.js'
import { reviewEmail } from '../lib/email-quality.js'
import { shouldSuppressAutomatedEmail } from '../lib/automated-email-policy.js'

export const RESEND_TIMEOUT_MS = 20_000

// Thrown for non-2xx Resend responses. The message carries the HTTP status and
// Resend's error name only: Resend echoes recipient addresses in some error
// bodies, and this message ends up in logs and Sentry.
export class ResendError extends Error {
  constructor(status, code) {
    super(`Resend ${status}${code ? ` ${code}` : ''}`)
    this.name = 'ResendError'
    this.status = status
    this.code = code ?? null
  }
}

// Logs carry userId rather than the recipient address (code review 2026-10-22, P2-5).
export async function sendBriefing({ to, subject, html, idempotencyKey, userId = null }) {
  const policy = shouldSuppressAutomatedEmail({ to, category: 'briefing' })
  if (policy.suppress) {
    logger.info('send-briefing: suppressed by automated email policy', { userId, subject })
    return { suppressed: true, reason: policy.reason, id: null }
  }

  const issues = reviewEmail(subject, html)
  if (issues.length) {
    logger.warn('send-briefing: quality warning', { event: 'email_quality_warning', userId, subject, issues })
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    signal: AbortSignal.timeout(RESEND_TIMEOUT_MS),
    headers: {
      ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_ADDRESS,
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const code = typeof body?.name === 'string' ? body.name.slice(0, 80) : null
    throw new ResendError(res.status, code)
  }

  const data = await res.json()
  logger.info('send-briefing: delivered', { userId, messageId: data?.id ?? null })
  return { ...data, id: data?.id ?? null }
}
