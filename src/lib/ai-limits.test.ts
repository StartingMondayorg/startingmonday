import { describe, expect, it } from 'vitest'
import { DOC_CHARS, PREVIEW_CHARS, RESUME_CHARS } from './ai-limits'

describe('AI prompt limits', () => {
  it('keeps document budgets below resume and preview budgets', () => {
    expect(DOC_CHARS).toBe(4000)
    expect(PREVIEW_CHARS).toBe(220)
    expect(RESUME_CHARS).toBeGreaterThan(DOC_CHARS)
  })
})
