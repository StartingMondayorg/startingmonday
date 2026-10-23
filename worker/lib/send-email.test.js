import { afterEach, describe, expect, it, vi } from 'vitest'
import { logger } from './logger.js'
import { recipientDomains, sendEmail } from './send-email.js'

describe('recipientDomains', () => {
  it('keeps only recipient domains', () => {
    expect(recipientDomains('Jane.Doe@Example.COM')).toBe('example.com')
    expect(recipientDomains(['Jane <jane@acme.io>', 'bob@corp.example'])).toBe('acme.io, corp.example')
    expect(recipientDomains('not-an-address')).toBe('unknown')
  })
})

describe('sendEmail logging', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('logs the recipient domain, not the address, on delivery', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ id: 'msg_1' }) })))
    const info = vi.spyOn(logger, 'info').mockImplementation(() => {})
    vi.spyOn(logger, 'warn').mockImplementation(() => {})

    await sendEmail({ to: 'jane.doe@example.com', subject: 'Hello', html: '<p>Hi Jane</p>' })

    const logged = JSON.stringify(info.mock.calls)
    expect(logged).not.toContain('jane.doe@example.com')
    expect(logged).toContain('example.com')
  })
})
