import { afterEach, describe, expect, it, vi } from 'vitest'
import { recipientDomains } from './email'

describe('recipientDomains', () => {
  it('keeps only the domain of a single address', () => {
    expect(recipientDomains('Jane.Doe@Example.COM')).toBe('example.com')
  })

  it('handles display-name addresses and lists', () => {
    expect(recipientDomains(['Jane <jane@acme.io>', 'bob@corp.example'])).toBe('acme.io, corp.example')
  })

  it('never echoes a value without a domain', () => {
    expect(recipientDomains('not-an-address')).toBe('unknown')
  })
})

describe('sendEmail suppression logging', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('logs no part of the local address when the policy suppresses a send', async () => {
    vi.resetModules()
    vi.stubEnv('BRIEFING_ONLY_RECIPIENTS', 'owner.only@example.com')
    const spies = (['log', 'info', 'warn', 'error'] as const).map((level) =>
      vi.spyOn(console, level).mockImplementation(() => {}),
    )
    const { sendEmail } = await import('./email')

    const result = await sendEmail({ to: 'Owner.Only@example.com', subject: 'Hello', html: '<p>Hi</p>' })

    expect(result).toMatchObject({ suppressed: true })
    const logged = JSON.stringify(spies.map((spy) => spy.mock.calls))
    expect(logged).toContain('email_send_suppressed_by_policy')
    expect(logged.toLowerCase()).not.toContain('owner.only')
  })
})
