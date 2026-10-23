import { describe, expect, it } from 'vitest'
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
