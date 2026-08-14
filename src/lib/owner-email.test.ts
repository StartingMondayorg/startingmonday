import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getNotifyEmails, getOwnerEmail } from './owner-email'

describe('owner email configuration', () => {
  beforeEach(() => {
    vi.unstubAllEnvs()
  })

  it('prefers a comma-separated notification list', () => {
    vi.stubEnv('NOTIFY_EMAILS', 'one@example.com, two@example.com')
    vi.stubEnv('OWNER_EMAIL', 'owner@example.com')
    expect(getOwnerEmail()).toBe('owner@example.com')
    expect(getNotifyEmails()).toEqual(['one@example.com', 'two@example.com'])
  })
})
