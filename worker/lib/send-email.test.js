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
    vi.unstubAllEnvs()
    vi.resetModules()
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

  it('logs no part of the local address when the policy suppresses a send', async () => {
    vi.resetModules()
    vi.stubEnv('BRIEFING_ONLY_RECIPIENTS', 'owner.only@example.com')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { logger: freshLogger } = await import('./logger.js')
    const spies = ['info', 'warn', 'error'].map(level => vi.spyOn(freshLogger, level).mockImplementation(() => {}))
    const { sendEmail: freshSend } = await import('./send-email.js')

    const result = await freshSend({ to: 'Owner.Only@example.com', subject: 'Hello', html: '<p>Hi</p>' })

    expect(result.suppressed).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()
    const logged = JSON.stringify(spies.map(spy => spy.mock.calls))
    expect(logged).toContain('suppressed')
    expect(logged.toLowerCase()).not.toContain('owner.only')
  })
})