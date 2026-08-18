import { Resend } from 'resend'
import { reviewEmail } from './email-quality'
import { autoRefineEmailDraft, logEmailCouncilScore, type EmailCouncilChannel } from './email-council'
import { shouldSuppressAutomatedEmail } from './automated-email-policy'

const FROM = process.env.RESEND_FROM_ADDRESS ?? 'briefing@startingmonday.app'

export async function sendEmail({
  to,
  subject,
  html,
  channel,
  from,
  replyTo,
  bcc,
  headers,
  bypassCouncil,
  category,
}: {
  to: string | string[]
  subject: string
  html: string
  channel?: EmailCouncilChannel
  from?: string
  replyTo?: string
  bcc?: string
  headers?: Record<string, string>
  bypassCouncil?: boolean
  category?: string
}) {
  const policy = shouldSuppressAutomatedEmail({ to, category: category ?? 'general' })
  if (policy.suppress) {
    console.warn(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'email_send_suppressed_by_policy',
      to,
      subject,
      category: category ?? 'general',
      reason: policy.reason,
    }))
    return {
      data: null,
      error: null,
      suppressed: true,
    }
  }

  const toLog = Array.isArray(to) ? to.join(', ') : to
  const issues = reviewEmail(subject, html)
  if (issues.length) {
    console.warn(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'email_quality_warning',
      to,
      subject,
      issues,
    }))
  }

  // Internal admin notifications bypass the council gate -- they are not
  // user-facing marketing emails and will always score below EJES threshold.
  if (!bypassCouncil) {
    const minCouncilScore = Number(process.env.EMAIL_COUNCIL_MIN_SCORE ?? '80')
    const refined = autoRefineEmailDraft({
      channel: channel ?? 'general',
      subject,
      html,
      minEjes: Number.isFinite(minCouncilScore) ? minCouncilScore : 80,
      maxPasses: 2,
    })

    if (!refined.passesAfterRefine) {
      await logEmailCouncilScore({
        to: toLog,
        channel: channel ?? 'general',
        subject: refined.refinedSubject,
        scores: refined.evaluation.scores,
        blocked: true,
        blockers: refined.evaluation.blockers,
        warnings: refined.evaluation.warnings,
      })

      const message = `Blocked by email council gate: EJES ${refined.evaluation.scores.ejes} < ${minCouncilScore}`
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        event: 'email_send_blocked_by_council',
        to: toLog,
        channel: channel ?? 'general',
        subject,
        message,
        blockers: refined.evaluation.blockers,
      }))

      return {
        data: null,
        error: { message },
      }
    }

    await logEmailCouncilScore({
      to: toLog,
      channel: channel ?? 'general',
      subject: refined.refinedSubject,
      scores: refined.evaluation.scores,
      blocked: false,
      blockers: [],
      warnings: refined.evaluation.warnings,
    })
  }

  const finalSubject = subject
  const finalHtml = html

  try {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      const message = 'RESEND_API_KEY is not configured'
      console.error(JSON.stringify({
        ts: new Date().toISOString(),
        event: 'email_send_exception',
        to,
        subject,
        from: from ?? FROM,
        message,
      }))
      return {
        data: null,
        error: { message },
      }
    }

    const resend = new Resend(apiKey)
    return await resend.emails.send({ from: from ?? FROM, to, bcc, subject: finalSubject, html: finalHtml, replyTo, headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'send failed'
    console.error(JSON.stringify({
      ts: new Date().toISOString(),
      event: 'email_send_exception',
      to,
      subject,
      from: from ?? FROM,
      message,
    }))
    return {
      data: null,
      error: { message },
    }
  }
}
