import { describe, expect, it } from 'vitest'
import { trimMessages } from './api-usage'

describe('API usage helpers', () => {
  it('retains the newest exchange when trimming history', () => {
    const messages = Array.from({ length: 5 }, (_, index) => ({ content: String(index).repeat(10) }))
    expect(trimMessages(messages, 25)).toEqual(messages.slice(-2))
  })
})
