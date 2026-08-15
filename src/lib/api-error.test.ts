import { describe, expect, it } from 'vitest'
import { apiError } from './api-error'

describe('apiError', () => {
  it('returns the supplied message and status', async () => {
    const response = apiError('Bad input', 422)
    expect(response.status).toBe(422)
    await expect(response.json()).resolves.toEqual({ error: 'Bad input' })
  })
})
