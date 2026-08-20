import { describe, expect, it } from 'vitest'

import { GET } from './route'

describe('partners report route', () => {
  it('returns a retired endpoint response', async () => {
    const response = await GET()

    expect(response.status).toBe(410)
    expect(await response.json()).toEqual({ error: 'This endpoint has been retired.' })
  })
})
