import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from './route'

describe('prep outreach route', () => {
  it('rejects invalid company id params', async () => {
    const req = new NextRequest('https://startingmonday.app/api/prep/not-a-uuid/outreach', {
      method: 'POST',
    })

    const res = await POST(req, { params: Promise.resolve({ id: 'not-a-uuid' }) })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid company id' })
  })
})
