import { describe, expect, it } from 'vitest'
import { GET } from './route'

describe('security.txt', () => {
  it('publishes a standards-shaped disclosure document', async () => {
    const response = GET()
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/plain')
    const body = await response.text()
    expect(body).toContain('Contact: mailto:security@startingmonday.com')
    expect(body).toContain('Canonical: https://www.startingmonday.com/.well-known/security.txt')
  })
})