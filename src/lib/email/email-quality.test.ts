import { describe, expect, it } from 'vitest'
import { reviewEmail } from './email-quality'

describe('reviewEmail', () => {
  it('flags overlong subject', () => {
    const issues = reviewEmail('A'.repeat(71), '<p>Hello there.</p>')
    expect(issues.some((i) => i.includes('Subject is'))).toBe(true)
  })

  it('flags em-dash entity in html', () => {
    const issues = reviewEmail('Short subject', '<p>Intro &mdash; body text.</p>')
    expect(issues.some((i) => i.includes('&mdash;'))).toBe(true)
  })

  it('flags long sentence readability issues', () => {
    const longSentence = 'word '.repeat(45)
    const issues = reviewEmail('Short subject', `<p>${longSentence}.</p>`)
    expect(issues.some((i) => i.includes('sentence(s) over'))).toBe(true)
  })

  it('returns empty issues for concise message', () => {
    const issues = reviewEmail('Quick intro', '<p>Hi Alex. We improved response quality by 12% in week one. Open to a quick look?</p>')
    expect(Array.isArray(issues)).toBe(true)
  })
})
