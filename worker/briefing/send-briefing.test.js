import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { logger } = vi.hoisted(() => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))
vi.mock('../lib/logger.js', () => ({ logger }))

import { RESEND_TIMEOUT_MS, ResendError, sendBriefing } from './send-briefing.js'

const EMAIL = 'person@example.com'

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  }
}

describe('sendBriefing', () => {
  let fetchMock

  beforeEach(() => {
    logger.info.mockReset(); logger.warn.mockReset(); logger.error.mockReset()
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => { vi.unstubAllGlobals() })

  it('sends the Idempotency-Key header and a timeout signal, and returns the provider id', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'msg_123' }))
    const timeoutSpy = vi.spyOn(AbortSignal, 'timeout')

    const result = await sendBriefing({
      to: EMAIL, subject: 'Your briefing', html: '<p>Hello.</p>',
      idempotencyKey: 'briefing-user-1-2026-10-19', userId: 'user-1',
    })

    expect(result.id).toBe('msg_123')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.headers['Idempotency-Key']).toBe('briefing-user-1-2026-10-19')
    expect(init.signal).toBeInstanceOf(AbortSignal)
    expect(timeoutSpy).toHaveBeenCalledWith(RESEND_TIMEOUT_MS)
    timeoutSpy.mockRestore()
  })

  it('throws a ResendError with status and code but never the response body or address', async () => {
    fetchMock.mockResolvedValue(jsonResponse(422, {
      statusCode: 422, name: 'validation_error', message: `Invalid \`to\` field: ${EMAIL}`,
    }))

    const err = await sendBriefing({ to: EMAIL, subject: 's', html: '<p>x</p>', idempotencyKey: 'k', userId: 'u' })
      .catch(e => e)

    expect(err).toBeInstanceOf(ResendError)
    expect(err.status).toBe(422)
    expect(err.code).toBe('validation_error')
    expect(err.message).toBe('Resend 422 validation_error')
    expect(err.message).not.toContain(EMAIL)
  })

  it('surfaces the idempotency conflict code so the job can recognise an earlier delivery', async () => {
    fetchMock.mockResolvedValue(jsonResponse(409, { statusCode: 409, name: 'invalid_idempotent_request' }))
    const err = await sendBriefing({ to: EMAIL, subject: 's', html: '<p>x</p>', idempotencyKey: 'k' }).catch(e => e)
    expect(err.code).toBe('invalid_idempotent_request')
    expect(err.status).toBe(409)
  })

  it('does not log the recipient address', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'msg_1' }))
    await sendBriefing({ to: EMAIL, subject: 'x', html: '<p>Short.</p>', idempotencyKey: 'k', userId: 'user-1' })
    const logged = JSON.stringify([...logger.info.mock.calls, ...logger.warn.mock.calls, ...logger.error.mock.calls])
    expect(logged).not.toContain(EMAIL)
    expect(logged).toContain('user-1')
  })
})
