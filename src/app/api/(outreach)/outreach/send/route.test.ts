import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest, NextResponse } from 'next/server'

const state = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  logEvent: vi.fn(async () => undefined),
  getStaffMember: vi.fn(),
  reviewEmail: vi.fn(() => []),
  autoRefineEmailDraft: vi.fn(),
  maybeSingle: vi.fn(async () => ({ data: null as unknown })),
  insert: vi.fn(async () => ({ error: null })),
  createAdminClient: vi.fn(() => ({})),
  ensureOutreachSendBatch: vi.fn(async () => 'batch_1'),
  enqueueOutreachSendJob: vi.fn(async () => ({ jobId: 'job_1', batchId: 'batch_1', domainBucket: 'corporate' })),
  findDuplicateOutreachSend: vi.fn(async () => ({ duplicate: false, deliveryStatus: null, jobId: null } as { duplicate: boolean; deliveryStatus: string | null; jobId: string | null })),
  hasPriorLiveOutreach: vi.fn(async () => ({ hasPriorLiveOutreach: false, deliveryStatus: null } as { hasPriorLiveOutreach: boolean; deliveryStatus: string | null })),
  kickOutreachSendWorker: vi.fn(async () => undefined),
}))

vi.mock('@/lib/require-auth', () => ({ requireAuth: state.requireAuth }))
vi.mock('@/lib/events', () => ({ logEvent: state.logEvent }))
vi.mock('@/lib/staff', () => ({ getStaffMember: state.getStaffMember }))
vi.mock('@/lib/email-quality', () => ({ reviewEmail: state.reviewEmail }))
vi.mock('@/lib/email-council', () => ({ autoRefineEmailDraft: state.autoRefineEmailDraft }))
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: state.createAdminClient }))
vi.mock('@/lib/outreach/template-engine.cjs', () => ({
  default: {
    buildLatestTemplateDraft: vi.fn(() => ({
      subject: 'Generated follow-up subject',
      body: 'Generated follow-up body with enough length and context to pass route guardrails and quality checks.',
    })),
  },
}))
vi.mock('@/lib/outreach/template-draft', () => ({
  buildOutreachTemplateDraft: vi.fn(() => ({
    subject: 'Generated follow-up subject',
    body: 'Generated follow-up body with enough length and context to pass route guardrails and quality checks.',
    templateSource: 'latest_template_engine',
  })),
}))
vi.mock('@/lib/outreach/send-queue', () => ({
  OUTREACH_REPLY_TO: 'richard@startingmonday.app',
  DEFAULT_OUTREACH_FROM: 'Richard Rothschild <richard@startingmonday.app>',
  ensureOutreachSendBatch: state.ensureOutreachSendBatch,
  enqueueOutreachSendJob: state.enqueueOutreachSendJob,
  findDuplicateOutreachSend: state.findDuplicateOutreachSend,
  hasPriorLiveOutreach: state.hasPriorLiveOutreach,
  kickOutreachSendWorker: state.kickOutreachSendWorker,
}))
vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: { email: 'sender@example.com' } } })) },
    from: () => {
      const query = {
        select: vi.fn(() => query),
        eq: vi.fn(() => query),
        ilike: vi.fn(() => query),
        limit: vi.fn(() => query),
        maybeSingle: state.maybeSingle,
        insert: state.insert,
      }
      return query
    },
  }),
}))

import { POST } from './route'

describe('outreach send route (queue mode)', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    state.requireAuth.mockResolvedValue({ ok: true, userId: 'u_1' })
    state.getStaffMember.mockResolvedValue({ id: 'staff_1' })
    state.maybeSingle.mockResolvedValue({ data: null })
    state.autoRefineEmailDraft.mockReturnValue({
      evaluation: {
        scores: { open: 0.9, understand: 0.9, reply: 0.9, productLift: 0.9, ejes: 92 },
        blockers: [],
        warnings: [],
      },
      rewritesApplied: [],
      passesAfterRefine: true,
    })
  })

  it('passes through auth failure', async () => {
    state.requireAuth.mockResolvedValue({ ok: false, response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) })
    const req = new NextRequest('https://startingmonday.app/api/outreach/send', { method: 'POST', body: '{}' })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('rejects invalid send mode', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex',
        emailTo: 'alex@example.com',
        subject: 'Hello there',
        messageText: 'This is a valid message body with enough length to pass minimum guardrails and include context.',
        mode: 'invalid_mode',
      }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid mode.' })
  })

  it('returns council details for dry runs and does not enqueue', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        emailTo: 'alex@example.com',
        subject: 'A clearer CFO story for recruiter and board calls',
        messageText: 'Hi Alex, Starting Monday helps transition programs keep prep, positioning, and next actions in one place so recruiter and board conversations stay consistent. Reply yes and I will send the one-page CFO call brief. Reply pass and I will close the loop.',
        mode: 'dry_run',
        outreachChannel: 'executives',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      mode: 'dry_run',
      council: {
        minScore: 80,
        scores: { ejes: 92 },
      },
    })
    expect(state.enqueueOutreachSendJob).not.toHaveBeenCalled()
  })

  it('queues a live send job', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        emailTo: 'alex@example.com',
        subject: 'Quick intro for Acme role context',
        messageText: 'Hi Alex, I noticed recent leadership movement at Acme and wanted to share a concise perspective on likely search timing and what candidates are missing right now. Reply yes and I will send the one-page CFO call brief. Reply pass and I will close the loop.',
        mode: 'live',
        reviewedForSend: true,
        reviewedAt: '2026-06-13T10:00:00.000Z',
        reviewedBy: 'reviewer@startingmonday.app',
        outreachChannel: 'executives',
        templateStep: 'followup_1',
        campaignStep: 'followup_bulk_v1',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      queued: true,
      mode: 'live',
      batchId: 'batch_1',
      jobId: 'job_1',
    })
    expect(state.enqueueOutreachSendJob).toHaveBeenCalledTimes(1)
    expect(state.kickOutreachSendWorker).toHaveBeenCalledTimes(1)
    expect(state.logEvent).toHaveBeenCalledWith('u_1', 'outreach_review_confirmed', expect.objectContaining({
      company: 'Acme',
      outreach_channel: 'executives',
      reviewed_by: 'reviewer@startingmonday.app',
    }))
  })

  it('blocks live send without explicit review confirmation', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        emailTo: 'alex@example.com',
        subject: 'Quick intro for Acme role context',
        messageText: 'Hi Alex, I noticed recent leadership movement at Acme and wanted to share a concise perspective on likely search timing and what candidates are missing right now. Reply yes and I will send the one-page CFO call brief. Reply pass and I will close the loop.',
        mode: 'live',
        outreachChannel: 'executives',
        templateStep: 'followup_1',
        campaignStep: 'followup_bulk_v1',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({
      error: 'Live outreach requires explicit human review confirmation before queueing.',
      checkpoint: 'review_required',
    })
    expect(state.enqueueOutreachSendJob).not.toHaveBeenCalled()
    expect(state.logEvent).toHaveBeenCalledWith('u_1', 'outreach_review_required', expect.objectContaining({
      company: 'Acme',
      outreach_channel: 'executives',
    }))
  })

  it('skips duplicate non-dry-run sends when idempotency key exists', async () => {
    state.findDuplicateOutreachSend.mockResolvedValue({
      duplicate: true,
      deliveryStatus: 'accepted',
      jobId: 'job_dup',
    })

    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        emailTo: 'alex@example.com',
        subject: 'A clearer CFO story for recruiter and board calls',
        messageText: 'Hi Alex, Starting Monday helps transition programs keep prep, positioning, and next actions in one place so recruiter and board conversations stay consistent. Reply yes and I will send the one-page CFO call brief. Reply pass and I will close the loop.',
        mode: 'live',
        reviewedForSend: true,
        outreachChannel: 'executives',
        templateStep: 'followup_1',
        campaignStep: 'followup_bulk_v1',
        idempotencyKey: 'followup_bulk_v1:alex@example.com',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      duplicate: true,
      idempotencyKey: 'followup_bulk_v1:alex@example.com',
      deliveryStatus: 'accepted',
    })
    expect(state.enqueueOutreachSendJob).not.toHaveBeenCalled()
  })

  it('blocks duplicate live initial sends when the recipient already has prior outreach history', async () => {
    state.hasPriorLiveOutreach.mockResolvedValue({ hasPriorLiveOutreach: true, deliveryStatus: 'accepted' })

    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        emailTo: 'alex@example.com',
        subject: 'A clearer CFO story for recruiter and board calls',
        messageText: 'Hi Alex, Starting Monday helps transition programs keep prep, positioning, and next actions in one place so recruiter and board conversations stay consistent. Reply yes and I will send the one-page CFO call brief. Reply pass and I will close the loop.',
        mode: 'live',
        reviewedForSend: true,
        outreachChannel: 'executives',
        templateStep: 'first_touch',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(409)
    await expect(res.json()).resolves.toMatchObject({
      error: 'Recipient already received an initial outreach email.',
      deliveryStatus: 'accepted',
    })
    expect(state.enqueueOutreachSendJob).not.toHaveBeenCalled()
  })

  it('builds latest template draft and queues test send', async () => {
    const req = new NextRequest('https://startingmonday.app/api/outreach/send', {
      method: 'POST',
      body: JSON.stringify({
        fullName: 'Alex Morgan',
        company: 'Acme',
        roleBucket: 'CFO',
        emailTo: 'alex@example.com',
        mode: 'test_to_self',
        outreachChannel: 'executives',
        useLatestTemplateDraft: true,
        templateStep: 'followup_1',
        campaignStep: 'followup_bulk_v1',
        idempotencyKey: 'followup_bulk_v1:alex@example.com',
      }),
    })

    const res = await POST(req)
    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({
      ok: true,
      queued: true,
      mode: 'test_to_self',
      templateSource: 'latest_template_engine',
    })
    expect(state.enqueueOutreachSendJob).toHaveBeenCalledTimes(1)
  })
})
