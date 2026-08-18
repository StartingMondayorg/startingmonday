import { sendEmail } from '@/lib/email/email'
import {
  applyAcceptedOutreachSideEffectsEffect,
  insertFailedOutreachLogEffect,
} from '@/lib/outreach/send-queue.side-effects'

type QueueAdminClient = Parameters<typeof insertFailedOutreachLogEffect>[0]

type StructuredSendError = {
  code: string
  message: string
  transient: boolean
  raw: string | null
}

type OutreachSendMode = 'live' | 'test_to_self'
type OutreachDomainBucket = 'gmail' | 'microsoft' | 'corporate'

type OutreachSendJobPayload = {
  userId: string
  fullName: string
  company: string
  roleBucket: string
  emailTo: string
  providerRecipient: string
  finalSubject: string
  messageText: string
  finalMessageText: string
  finalHtml: string
  statusAfter: string
  mode: OutreachSendMode
  outreachChannel: 'executives' | 'search_firms' | 'coaches' | 'outplacement_firms'
  fitTier: string | null
  personaFocus: string | null
  campaignStep: string | null
  templateStep: string | null
  templateSource: 'latest_template_engine' | 'custom_input'
  idempotencyKey: string | null
  fromAddress: string
  replyTo: string
  bcc: string | null
  headers: Record<string, string>
}

type ClaimedOutreachSendJob = {
  id: string
  batch_id: string
  domain_bucket: OutreachDomainBucket | null
  attempt_count: number | null
  payload: OutreachSendJobPayload
  contact_id: string | null
}

export async function processClaimedOutreachSendJob(
  admin: QueueAdminClient,
  job: ClaimedOutreachSendJob,
  deps: {
    outreachReplyTo: string
    contactChannel: string
    maxAttempts: number
    normalizeSendError: (errorMessage: string | null | undefined) => StructuredSendError
    computeRetryDelayMs: (attemptCount: number, bucket: OutreachDomainBucket) => number
    summarizeBatch: (adminClient: unknown, batchId: string) => Promise<unknown>
  },
): Promise<
  | { ok: true; resendMessageId: string | null }
  | { ok: false; retried: boolean; error: StructuredSendError }
> {
  const payload = job.payload
  const sendResult = await sendEmail({
    to: payload.providerRecipient,
    subject: payload.finalSubject,
    html: payload.finalHtml,
    channel: payload.outreachChannel,
    from: payload.fromAddress,
    replyTo: payload.replyTo,
    bcc: payload.bcc ?? undefined,
    headers: payload.headers,
  })

  if ((sendResult as { error?: { message?: string } } | null)?.error) {
    const normalized = deps.normalizeSendError((sendResult as { error?: { message?: string } }).error?.message)
    const canRetry = normalized.transient && Number(job.attempt_count ?? 0) < deps.maxAttempts
    const bucket = (job.domain_bucket ?? 'corporate') as OutreachDomainBucket
    const nextAttemptAt = canRetry
      ? new Date(Date.now() + deps.computeRetryDelayMs(Number(job.attempt_count ?? 0), bucket)).toISOString()
      : null

    await admin
      .from('outreach_send_jobs')
      .update({
        state: canRetry ? 'queued' : 'failed',
        next_attempt_at: nextAttemptAt,
        locked_at: null,
        locked_by: null,
        completed_at: canRetry ? null : new Date().toISOString(),
        last_error: normalized,
      })
      .eq('id', job.id)

    if (!canRetry) {
      await insertFailedOutreachLogEffect(admin, {
        jobId: job.id,
        batchId: job.batch_id,
        contactId: job.contact_id,
        outreachReplyTo: deps.outreachReplyTo,
        payload,
        error: normalized,
      })
    }

    await deps.summarizeBatch(admin as unknown, job.batch_id)
    return { ok: false, retried: canRetry, error: normalized }
  }

  const resendMessageId = ((sendResult as { data?: { id?: string } | null } | null)?.data?.id ?? null) as string | null
  const sideEffects = await applyAcceptedOutreachSideEffectsEffect(admin, {
    jobId: job.id,
    batchId: job.batch_id,
    initialContactId: job.contact_id,
    resendMessageId,
    outreachReplyTo: deps.outreachReplyTo,
    contactChannel: deps.contactChannel,
    payload,
  })

  await admin
    .from('outreach_send_jobs')
    .update({
      state: 'accepted',
      contact_id: sideEffects.contactId,
      provider_message_id: resendMessageId,
      accepted_at: new Date().toISOString(),
      locked_at: null,
      locked_by: null,
      last_error: sideEffects.warnings.length > 0 ? { code: 'side_effect_warning', message: sideEffects.warnings.join(' | ') } : null,
    })
    .eq('id', job.id)

  await deps.summarizeBatch(admin as unknown, job.batch_id)
  return { ok: true, resendMessageId }
}
