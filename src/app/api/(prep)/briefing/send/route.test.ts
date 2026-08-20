import { describe, expect, it } from 'vitest'
import { POST } from './route'

describe('briefing send route', () => {
  it('returns 410 gone with retired endpoint message', async () => {
    const res = await POST()
    expect(res.status).toBe(410)
    await expect(res.json()).resolves.toMatchObject({
      error: expect.stringContaining('retired'),
    })
  })
})
