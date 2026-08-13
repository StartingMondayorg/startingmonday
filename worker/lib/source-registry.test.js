import { describe, expect, it, vi } from 'vitest'
import { resolveSourceDecision } from './source-registry.js'

function client(result) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(async () => result),
        })),
      })),
    })),
  }
}

describe('source registry decisions', () => {
  it('fails closed when the registry read fails', async () => {
    await expect(resolveSourceDecision(client({ data: null, error: { message: 'missing' } }), 'pdl'))
      .resolves.toMatchObject({ allowed: false, reason: 'registry_read_failed_fail_closed' })
  })

  it('fails closed when the source is missing', async () => {
    await expect(resolveSourceDecision(client({ data: null, error: null }), 'pdl'))
      .resolves.toMatchObject({ allowed: false, reason: 'registry_miss_fail_closed' })
  })

  it('requires an explicit allowed or approved rights status', async () => {
    await expect(resolveSourceDecision(client({
      data: { source_key: 'pdl', source_status: 'active', rights_status: 'licensed' },
      error: null,
    }), 'pdl')).resolves.toMatchObject({
      allowed: false,
      reason: 'not_explicitly_allowed_by_registry',
    })
  })

  it('allows an active source with explicitly approved rights', async () => {
    await expect(resolveSourceDecision(client({
      data: { source_key: 'pdl', source_status: 'active', rights_status: 'approved' },
      error: null,
    }), 'pdl')).resolves.toMatchObject({
      allowed: true,
      reason: 'explicitly_allowed_by_registry',
    })
  })
})