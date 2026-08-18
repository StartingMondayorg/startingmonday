import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from './route'

describe('prep competitive route', () => {
  it('rejects invalid company id params', async () => {
    const req = new NextRequest('https://startingmonday.app/api/prep/not-a-uuid/competitive')
    const res = await GET(req, { params: Promise.resolve({ id: 'not-a-uuid' }) })
    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: 'Invalid company id' })
  })
})
