import { describe, expect, it } from 'vitest'
import { isCorporateEmail } from './email-domains'

describe('isCorporateEmail', () => {
  it('treats consumer mailbox domains as personal', () => {
    for (const email of ['a@gmail.com', 'b@Outlook.com', 'c@proton.me', 'd@icloud.com']) {
      expect(isCorporateEmail(email)).toBe(false)
    }
  })

  it('treats any other domain as corporate', () => {
    expect(isCorporateEmail('cio@acme-industries.com')).toBe(true)
    expect(isCorporateEmail('x@startingmonday.app')).toBe(true)
  })

  it('returns false for missing or malformed addresses', () => {
    expect(isCorporateEmail(null)).toBe(false)
    expect(isCorporateEmail(undefined)).toBe(false)
    expect(isCorporateEmail('')).toBe(false)
    expect(isCorporateEmail('no-at-sign')).toBe(false)
    expect(isCorporateEmail('trailing@')).toBe(false)
  })
})
