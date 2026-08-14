import { describe, expect, it } from 'vitest'
import { APP_URL, MAX_UPLOAD_BYTES, PIPELINE_PAGE_SIZE } from './config'

describe('application configuration', () => {
  it('exposes safe defaults', () => {
    expect(APP_URL).toMatch(/^https:\/\//)
    expect(MAX_UPLOAD_BYTES).toBe(5 * 1024 * 1024)
    expect(PIPELINE_PAGE_SIZE).toBe(50)
  })
})
